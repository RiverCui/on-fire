# AI Chat Assistant — Design Doc

- **Status**: Approved (2026-04-22)
- **Author**: river
- **Scope**: 为 FIRE Master 增加 AI 财务对话助手（多轮对话 + Tool Calling + Redis 缓存/限流）

## 0 · 目标

1. 用户能在 `/[locale]/chat` 页面与 AI 多轮对话，提问自己的财务状况（净资产、收支、FIRE 进度等），AI 通过 Tool Calling 查询数据库并返回分析与建议。
2. 端到端覆盖 **AI SDK v6 + Upstash Redis（限流/缓存）+ Next.js App Router 流式** 的生产级最佳实践。
3. 通过架构决策记录（本 doc）与后续的实现计划（`docs/superpowers/plans/`）沉淀工程过程。

**非目标**（YAGNI）：
- AI 不做写操作（记账、改配置等）——只读；写能力留作 backlog。
- 不做月度复盘报告（Task #4 backlog）。
- 不做流式中断续传、不做移动端 H5 适配深度优化。
- 不做 E2E 测试，仅关键路径单元测试。

## 1 · 架构总览

```
浏览器 (/chat)
   │  POST /api/chat  (SSE 流式)
   ▼
Next.js Route Handler (Node runtime, Fluid Compute, maxDuration=60)
   ├─ 1) NextAuth 校验用户
   ├─ 2) Upstash 限流 (10/min + 100/day, 滑动窗口)
   ├─ 3) 读 Redis 会话上下文 (miss → Postgres 回填 → 写回缓存)
   ├─ 4) LLM 响应缓存 probe (命中 → SSE 回放)
   ├─ 5) AI SDK v6 streamText()
   │     ├─ provider 抽象: env.AI_PROVIDER = deepseek | anthropic | openai
   │     └─ tools: 7 个只读查询 (包装 actions/)
   ├─ 6) onFinish 回调:
   │     - 写 Postgres (消息落库, token 计数)
   │     - 写 Redis (响应缓存)
   │     - 失效会话上下文缓存
   └─ 7) 返回 toUIMessageStreamResponse()
```

**选型说明**：
- **Node runtime**（非 Edge）：Prisma 7 + `pg` 长连接在 Edge 兼容差；Fluid Compute 在 Node runtime 下仍复用实例，降冷启动。
- **SSE 而非 WebSocket**：单向流式足够，HTTP 协议天然无状态管理负担。
- **Tool Calling 在服务端执行**：`userId` 由服务端 session 注入工具闭包，不进 LLM context，LLM 无法跨用户查询。
- **Provider 抽象 vs AI Gateway**：本方案直连各 provider（`@ai-sdk/deepseek` / `@ai-sdk/anthropic` 等），通过 `lib/ai/provider.ts#getModel()` 封装一层。**未来若团队化/规模化，可替换为 Vercel AI Gateway（`gateway('deepseek/deepseek-chat')`），业务代码零改动**，同时获得统一观测、provider fallback、零数据保留。选择直连的理由：个人项目体量下 3 个 provider 手动管理成本低，抽象层代码可控度更高；Gateway 是黑盒，迁移放到项目规模化后再做。

## 2 · 数据模型

### 2.1 新增表

```prisma
model Conversation {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title     String   @default("新对话")  // 首条消息后由一次 LLM 异步生成 ≤10 字摘要
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages  Message[]

  @@index([userId, updatedAt])
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  role       MessageRole
  content    String        @db.Text
  toolCalls  Json?         // [{ name, args, result }]，debug/UI 展示用

  tokensIn   Int?
  tokensOut  Int?
  createdAt  DateTime @default(now())

  @@index([conversationId, createdAt])
}

enum MessageRole {
  USER
  ASSISTANT
}
```

### 2.2 User 关系字段追加

```prisma
model User {
  // ...
  conversations Conversation[]
}
```

### 2.3 取舍

- **不单独建 ToolCall 表**：用 JSON 字段 `toolCalls`，不存在按工具维度的关系查询需求（YAGNI）。
- **tokensIn/Out 落库**：为后续成本追踪、用户配额、按 provider 成本对比留扩展点。

## 3 · Tool Calling

### 3.1 工具清单

| Tool | 输入 | 语义 |
|---|---|---|
| `getNetWorth` | `{ date? }` | 指定日期的总净资产 |
| `getAssetBreakdown` | `{}` | 按类型 / 账户分布 |
| `getCashFlowSummary` | `{ startDate, endDate, type? }` | 区间收支汇总 |
| `getCashFlowByCategory` | `{ startDate, endDate }` | 按分类聚合（餐饮/交通/...） |
| `getFirePlanProgress` | `{}` | FIRE 达成率、剩余年数、缺口 |
| `getAssetTrend` | `{ accountId?, range: '1M'\|'3M'\|'6M'\|'1Y'\|'ALL' }` | 资产时间序列 |
| `getRecentTransactions` | `{ limit: 1-50, default 10 }` | 最近流水 |

### 3.2 实现

```ts
// lib/ai/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export const buildTools = (userId: string) => ({
  getNetWorth: tool({
    description: '查询用户在指定日期（默认今天）的总净资产',
    inputSchema: z.object({ date: z.string().date().optional() }),
    execute: async ({ date }) => netWorthAction(userId, date),
  }),
  // ... 其余 6 个同构
});
```

### 3.3 安全 / 鲁棒

- `userId` **只从 session 取**，不出现在 LLM context 或工具参数中。
- Zod `inputSchema` 双校验：AI SDK 会对 LLM 产出参数做 schema 校验，失败自动让模型重试。
- 每个 action 返回值限定条数（transactions ≤ 50），防止 LLM context 爆炸。
- `streamText({ stopWhen: stepCountIs(5) })`：防止工具调用死循环。

## 4 · Redis 三大用途 + Key 命名规范

基础：Upstash Redis（Vercel Marketplace 接入），`@upstash/redis` + `@upstash/ratelimit`。

### 4.1 限流（Rate Limiting）

```ts
export const perMinuteLimiter = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'rl:chat:min',
});
export const perDayLimiter = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(100, '1 d'), prefix: 'rl:chat:day',
});
```

Route handler 里串行校验 min 后 day（短路节约配额）。失败返回 429 + `Retry-After`。

### 4.2 会话上下文缓存（Cache-Aside）

```
key : chat:ctx:{conversationId}
val : 最近 10 条 message 的 JSON
TTL : 30 分钟（写消息后 del，保证一致性）
```

读路径：Redis miss → Postgres `findMany(..., take: 10)` → 回填。
写路径：`onFinish` 回调里消息落库 → `redis.del` 上下文 key。

### 4.3 LLM 响应缓存

```
key : chat:resp:{sha256(provider + model + systemPrompt + messages)}
val : { text, toolCalls }
TTL : 1 小时 + 随机抖动（±10%，防雪崩）
```

命中条件严苛（几乎只命中相同输入的完全重放），作用：
- 演示场景省 token
- 承载缓存穿透（缓存空值短 TTL）、击穿（分布式锁 `SET NX EX`）、雪崩（TTL 随机抖动）三类防御模式

### 4.4 Key 命名规范（全项目统一）

```
{domain}:{purpose}:{id...}
rl:chat:min:{userId}
chat:ctx:{conversationId}
chat:resp:{hash}
```

冒号分层 / domain 前缀 / 便于 SCAN 与监控聚合。

## 5 · API 路由 & 数据访问分工

**只有流式端点是 Route Handler，其他全部 Server Action，与项目现有 `actions/` 风格一致。**

| 操作 | 实现位置 | 说明 |
|---|---|---|
| 发消息 + 流式 | `app/api/chat/route.ts` | Server Action 不支持返回 `ReadableStream` |
| 列出会话 | `actions/conversation.ts#listConversations` | RSC/客户端通用 |
| 新建会话 | `actions/conversation.ts#createConversation` | 首条消息时自动创建 |
| 拉消息历史 | `actions/conversation.ts#getMessages` | RSC 初始渲染用 |
| 删除会话 | `actions/conversation.ts#deleteConversation` | 带 `revalidatePath` |

### 5.1 `/api/chat` 核心骨架

```ts
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response('unauthorized', { status: 401 });
  const userId = session.user.id;

  // 串行：min 挂掉就不消耗 day 配额
  const min = await perMinuteLimiter.limit(userId);
  if (!min.success) return new Response('rate limited', { status: 429 });
  const day = await perDayLimiter.limit(userId);
  if (!day.success) return new Response('rate limited', { status: 429 });

  const { messages, conversationId } = await req.json();

  const cacheKey = `chat:resp:${await hashInput(messages)}`;
  const cached = await redis.get<string>(cacheKey);
  if (cached) return replayAsStream(cached);

  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools: buildTools(userId),
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, usage, toolCalls }) => {
      await persistMessages(conversationId, userId, messages, text, toolCalls, usage);
      await redis.set(cacheKey, text, { ex: 3600 + jitter() });
      await redis.del(`chat:ctx:${conversationId}`);
    },
  });

  return result.toUIMessageStreamResponse();
}
```

## 6 · 前端

### 6.1 路由结构

```
app/[locale]/chat/
├── layout.tsx                        # 左会话列表 + 右聊天区
├── page.tsx                          # 重定向到最新会话或创建新会话
└── [conversationId]/
    └── page.tsx                      # 主聊天页（RSC 预取历史消息）
```

### 6.2 组件

```
components/chat/
├── conversation-list.tsx     # Server
├── conversation-item.tsx     # Client（hover / 删除）
├── chat-window.tsx           # Client，useChat 宿主
├── message-list.tsx
├── message-bubble.tsx
├── tool-call-display.tsx     # 折叠展示工具调用（参数 + 返回）
├── chat-input.tsx            # 输入 + 发送 + 停止
└── empty-state.tsx           # 推荐 prompt 引导
```

### 6.3 技术要点

- `@ai-sdk/react` 的 `useChat` + `DefaultChatTransport` 对接 `/api/chat`。
- RSC 在 `[conversationId]/page.tsx` `await getMessages()`，作为 `initialMessages` 传入，避免首屏 loading 闪烁。
- 流式状态由 `status` (`ready | submitted | streaming | error`) 驱动 UI。
- 移动端：列表收进 Shadcn `Sheet`。

## 7 · 测试策略

**方案 B**：关键路径单元测试，不做 E2E。

```
tests/
├── lib/ai/tools.test.ts         # Zod 校验、execute 包装正确性
├── lib/ai/prompt.test.ts        # system prompt 构造、上下文截断
├── lib/redis/ratelimit.test.ts  # 边界 (窗口突刺、多 key 短路)
└── lib/redis/cache.test.ts      # key 生成、TTL、命中/miss/del
```

- 运行器：**Vitest**（ESM 原生，无需 babel）
- Redis：本地 docker 或 `@upstash/redis` 的 mock
- LLM：**不测**（provider 已由 AI SDK 覆盖；测它等于测 mock）

## 8 · 架构决策记录（ADR）策略

本 spec 聚焦"做什么"与"为什么这么做"。个人私有的技术笔记（源码位置索引、追问记录、替代方案权衡详情）**不纳入仓库**，按本地约定维护，避免污染设计文档本身。

维护节奏：
- 每完成一个代码任务 → commit message 遵循 Conventional Commits（`feat(chat): ...`）。
- 实现计划（`docs/superpowers/plans/`）中记录每步的决策与验证结果。
- 本 spec 的 §10 Backlog 持续反映未做决定与演进方向。

## 9 · 关键配置项

```
# .env
AI_PROVIDER=deepseek            # deepseek | anthropic | openai
DEEPSEEK_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## 10 · Backlog（本 spec 不做）

- AI 写操作（记账、修改 FIRE 参数）
- 月度/年度 AI 复盘报告（Task #4）
- 流式中断续传
- Playwright E2E
- 全局悬浮聊天抽屉
- 会话上下文长度超过 10 条时的 summary 压缩
- 迁移 `getModel()` 到 Vercel AI Gateway（统一观测 / provider fallback / OIDC 鉴权替代直连 API key）
