# 🔥 FIRE Master

> 你的财务自由仪表盘 — 把通往 FIRE 的每一步量化出来。

**Demo**: <https://fire-master.vercel.app>

## 什么是 FIRE？

FIRE = **Financial Independence, Retire Early**（财务独立、提前退休）。

核心思路：通过高储蓄率 + 长期投资，让被动收入覆盖生活开支，从而摆脱"必须工作才能活着"的状态，提前实现自由。常见的衡量标准是 [4% 法则](https://en.wikipedia.org/wiki/Trinity_study)：当你的投资资产 ≥ 年支出 × 25 时，理论上可以靠资产收益终身覆盖支出。

但通往 FIRE 的路径会被很多变量左右：储蓄率、投资回报、通胀、退休年龄、生活方式调整等。**FIRE Master 就是把这些变量装进一个仪表盘，让你随时看见进度、模拟未来、调整策略**。

## 核心功能

### 📊 仪表盘
- 净资产、资产分布饼图、净资产趋势曲线
- 当月现金流摘要（收入/支出/储蓄率）
- FIRE 进度条 + 距离目标的剩余年数估算

### 💰 资产账户
- 多账户管理（现金、储蓄、股票、基金、房产、加密、负债…）
- 每次更新自动写入历史快照，构建资产时间线
- 多币种支持

### 💸 现金流
- 收支记录 + 自定义分类
- 月度/年度趋势可视化
- 按分类分布（饼图 + 排行）

### 🎯 FIRE 模拟器
- 输入当前资产、年收支、投资回报率、通胀率、目标退休年龄
- 输出：达成 FIRE 所需金额、积累期/提款期模拟、隐含提款率
- 实时滑块调参，立即看见结果变化

### 🤖 AI 财务助手
- 流式对话，理解你的真实数据（不是泛泛建议）
- 内置 7 个只读查询工具（净资产、资产明细、现金流、FIRE 进度等），AI 通过 Tool Calling 精确回答
- 多轮对话上下文，支持 Markdown 流式渲染
- Provider 可热切换：DeepSeek / Anthropic Claude / OpenAI

### 🔐 隐私与安全
- 数据加密存储，仅本人可见
- AI 工具层用闭包捕获 userId，杜绝跨用户查询
- 速率限制（分钟 + 日双窗口）防滥用

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 16 App Router · React 19 · Turbopack |
| 语言 | TypeScript 5.7 |
| 数据库 | Postgres + Prisma 7 |
| 认证 | NextAuth 5 (beta) · JWT session |
| AI | Vercel AI SDK v6 · DeepSeek / Anthropic / OpenAI |
| 缓存 / 限流 | Upstash Redis · `@upstash/ratelimit`（滑动窗口） |
| 国际化 | next-intl（中 / 英） |
| UI | Tailwind v3 · shadcn/ui · Radix · Recharts · Streamdown |
| 测试 | Vitest |
| 部署 | Vercel (Fluid Compute) |

## 快速开始

```bash
pnpm install
cp .env.example .env   # 配置 DATABASE_URL、AUTH_SECRET、AI_API_KEY、UPSTASH_REDIS_* 等
pnpm prisma migrate dev
pnpm prisma db seed    # 可选：种子数据
pnpm dev
```

## 项目结构

```
app/[locale]/
  (auth)/           # 登录 / 注册
  (dashboard)/      # 主应用：overview · account · cashflow · chat · settings
  api/chat/         # AI 流式接口（SSE）
actions/            # Server Actions（CRUD + AI 查询包装）
lib/ai/             # 工具定义、限流、缓存、provider 抽象、system prompt
components/         # 业务 + UI 组件
prisma/             # schema + migrations + seed
messages/           # i18n 文案（zh / en）
```

## 架构亮点

- **AI 安全纵深防御**：session 鉴权 → 工具 schema 不暴露 userId → execute 闭包捕获 → DB 层 `WHERE userId` 过滤 → `server-only` 标记防泄漏到客户端
- **三层 Redis 策略**：滑动窗口限流 / Cache-Aside 会话上下文 / LLM 响应缓存（带随机抖动 TTL，防雪崩）
- **Route Handler vs Server Action 精细分工**：流式响应走 `/api/chat`（SSE），普通 CRUD 走 Server Action
- **资产历史快照**：资产更新自动落库 `AssetRecord`，复用为净资产趋势图

## License

MIT
