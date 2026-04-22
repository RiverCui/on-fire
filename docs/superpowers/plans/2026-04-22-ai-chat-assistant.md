# AI Chat Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 FIRE Master 项目里交付一个带 Tool Calling 的 AI 财务对话助手（`/[locale]/chat`），支持多轮对话、7 个只读查询工具、流式 SSE 响应、Upstash Redis 限流与两层缓存。

**Architecture:** Route Handler `/api/chat` 使用 AI SDK v6 `streamText` + 抽象 provider；其余 CRUD 走 Server Actions。Redis 承担滑动窗口限流（min + day 串行校验）、会话上下文 Cache-Aside 缓存、LLM 响应缓存（TTL 随机抖动）。前端独立 `/chat` 路由 + Shadcn 组件。

**Tech Stack:** Next.js 16 (App Router) / Prisma 7 / NextAuth 5 / AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/deepseek`, `@ai-sdk/anthropic`, `@ai-sdk/openai`) / `@upstash/redis` + `@upstash/ratelimit` / Vitest / Shadcn UI / Tailwind 3.

**Spec reference:** `docs/superpowers/specs/2026-04-22-ai-chat-assistant-design.md`

---

## Task 1: Install dependencies and scaffold Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Install runtime deps**

```bash
pnpm add ai @ai-sdk/react @ai-sdk/deepseek @ai-sdk/anthropic @ai-sdk/openai @upstash/redis @upstash/ratelimit
```

- [ ] **Step 2: Install dev deps**

```bash
pnpm add -D vitest @vitest/ui
```

- [ ] **Step 3: Add test scripts to package.json**

Modify `package.json` scripts:

```json
"scripts": {
  "build": "prisma generate && next build",
  "dev": "prisma generate && next dev --turbopack",
  "start": "next start",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui"
}
```

- [ ] **Step 4: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Add smoke test**

Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run smoke test**

Run: `pnpm test`
Expected: `1 passed`.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts tests/smoke.test.ts
git commit -m "chore(test): add vitest and AI/Redis dependencies"
```

---

## Task 2: Prisma schema — Conversation & Message

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add MessageRole enum**

Append to `prisma/schema.prisma` (after existing enums):

```prisma
enum MessageRole {
  USER
  ASSISTANT
}
```

- [ ] **Step 2: Add Conversation and Message models**

Append:

```prisma
model Conversation {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title     String   @default("新对话")
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
  content    String       @db.Text
  toolCalls  Json?

  tokensIn   Int?
  tokensOut  Int?
  createdAt  DateTime @default(now())

  @@index([conversationId, createdAt])
}
```

- [ ] **Step 3: Add relation on User model**

In the `User` model, add after existing relations:

```prisma
conversations Conversation[]
```

- [ ] **Step 4: Run migration**

```bash
pnpm prisma migrate dev --name add_conversation_message
```

Expected: migration file created under `prisma/migrations/`, Prisma client regenerated.

- [ ] **Step 5: Verify client types**

Run: `pnpm exec tsc --noEmit`
Expected: no errors (`generated/prisma/client` now exports `Conversation`, `Message`, `MessageRole`).

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add Conversation and Message models"
```

---

## Task 3: Environment variables scaffolding

**Files:**
- Create: `.env.example`
- Modify: `.env` (local only, not committed)

- [ ] **Step 1: Create or update .env.example**

Create/merge `.env.example`:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/on_fire
AUTH_SECRET=replace-me

# AI provider switch: deepseek | anthropic | openai
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Upstash Redis (https://console.upstash.com/)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 2: Document required local .env values**

Verify local `.env` contains `AI_PROVIDER`, the active provider's key, and both `UPSTASH_*` values. (Do not commit `.env`.)

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore(env): document AI and Redis environment variables"
```

---

## Task 4: Redis client singleton

**Files:**
- Create: `lib/redis.ts`

- [ ] **Step 1: Write singleton**

```ts
// lib/redis.ts
import { Redis } from '@upstash/redis';

declare global {
  // eslint-disable-next-line no-var
  var __upstashRedis: Redis | undefined;
}

export const redis =
  globalThis.__upstashRedis ??
  Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN

if (process.env.NODE_ENV !== 'production') {
  globalThis.__upstashRedis = redis;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/redis.ts
git commit -m "feat(redis): add Upstash client singleton"
```

---

## Task 5: Cache utilities + tests

**Files:**
- Create: `lib/redis/cache.ts`
- Create: `tests/lib/redis/cache.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/redis/cache.test.ts
import { describe, it, expect } from 'vitest';
import { ctxKey, respKey, jitterSeconds, hashMessages } from '@/lib/redis/cache';

describe('ctxKey', () => {
  it('formats conversation context key', () => {
    expect(ctxKey('c_123')).toBe('chat:ctx:c_123');
  });
});

describe('respKey', () => {
  it('prefixes hashed input with chat:resp', () => {
    const key = respKey('abc123');
    expect(key).toBe('chat:resp:abc123');
  });
});

describe('jitterSeconds', () => {
  it('stays within +/- 10% of base', () => {
    for (let i = 0; i < 100; i++) {
      const v = jitterSeconds(3600);
      expect(v).toBeGreaterThanOrEqual(3240);
      expect(v).toBeLessThanOrEqual(3960);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('hashMessages', () => {
  it('produces stable sha256 hex for identical input', async () => {
    const a = await hashMessages([{ role: 'user', content: 'hi' }]);
    const b = await hashMessages([{ role: 'user', content: 'hi' }]);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when content changes', async () => {
    const a = await hashMessages([{ role: 'user', content: 'hi' }]);
    const b = await hashMessages([{ role: 'user', content: 'bye' }]);
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run tests and see them fail**

Run: `pnpm test tests/lib/redis/cache.test.ts`
Expected: FAIL (`Cannot find module '@/lib/redis/cache'`).

- [ ] **Step 3: Implement cache utilities**

```ts
// lib/redis/cache.ts
import { createHash } from 'node:crypto';

export const ctxKey = (conversationId: string) => `chat:ctx:${conversationId}`;
export const respKey = (hash: string) => `chat:resp:${hash}`;

/** +/- 10% jitter on TTL to smear cache expirations. */
export function jitterSeconds(baseSeconds: number): number {
  const range = baseSeconds * 0.1;
  const delta = Math.floor(Math.random() * range * 2) - Math.floor(range);
  return baseSeconds + delta;
}

export async function hashMessages(
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const json = JSON.stringify(messages);
  return createHash('sha256').update(json).digest('hex');
}
```

- [ ] **Step 4: Run tests, should pass**

Run: `pnpm test tests/lib/redis/cache.test.ts`
Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/redis/cache.ts tests/lib/redis/cache.test.ts
git commit -m "feat(redis): add cache key helpers, jitter, hashMessages"
```

---

## Task 6: Rate limiter + test

**Files:**
- Create: `lib/ai/ratelimit.ts`
- Create: `tests/lib/ai/ratelimit.test.ts`

- [ ] **Step 1: Write module first (Upstash mock makes full TDD cumbersome)**

```ts
// lib/ai/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

export const perMinuteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'rl:chat:min',
  analytics: false,
});

export const perDayLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 d'),
  prefix: 'rl:chat:day',
  analytics: false,
});

/**
 * Serial: min fails short-circuits day so day quota is not consumed.
 */
export async function checkChatLimit(userId: string): Promise<
  | { ok: true }
  | { ok: false; which: 'min' | 'day'; reset: number }
> {
  const min = await perMinuteLimiter.limit(userId);
  if (!min.success) return { ok: false, which: 'min', reset: min.reset };
  const day = await perDayLimiter.limit(userId);
  if (!day.success) return { ok: false, which: 'day', reset: day.reset };
  return { ok: true };
}
```

- [ ] **Step 2: Write a shape test with mocked limiters**

```ts
// tests/lib/ai/ratelimit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/redis', () => ({ redis: {} }));

const limitMinMock = vi.fn();
const limitDayMock = vi.fn();

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    limit: (id: string) => Promise<{ success: boolean; reset: number }>;
    static slidingWindow() { return {}; }
    constructor(opts: { prefix: string }) {
      this.limit = opts.prefix.includes('min') ? limitMinMock : limitDayMock;
    }
  },
}));

beforeEach(() => {
  limitMinMock.mockReset();
  limitDayMock.mockReset();
});

describe('checkChatLimit', () => {
  it('returns ok when both pass', async () => {
    limitMinMock.mockResolvedValue({ success: true, reset: 0 });
    limitDayMock.mockResolvedValue({ success: true, reset: 0 });
    const { checkChatLimit } = await import('@/lib/ai/ratelimit');
    expect(await checkChatLimit('u1')).toEqual({ ok: true });
  });

  it('short-circuits on min failure without calling day', async () => {
    limitMinMock.mockResolvedValue({ success: false, reset: 42 });
    const { checkChatLimit } = await import('@/lib/ai/ratelimit');
    const res = await checkChatLimit('u1');
    expect(res).toEqual({ ok: false, which: 'min', reset: 42 });
    expect(limitDayMock).not.toHaveBeenCalled();
  });

  it('returns day failure when min passes but day fails', async () => {
    limitMinMock.mockResolvedValue({ success: true, reset: 0 });
    limitDayMock.mockResolvedValue({ success: false, reset: 99 });
    const { checkChatLimit } = await import('@/lib/ai/ratelimit');
    expect(await checkChatLimit('u1')).toEqual({ ok: false, which: 'day', reset: 99 });
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm test tests/lib/ai/ratelimit.test.ts`
Expected: `3 passed`.

- [ ] **Step 4: Commit**

```bash
git add lib/ai/ratelimit.ts tests/lib/ai/ratelimit.test.ts
git commit -m "feat(ai): add per-user min+day sliding window rate limiter"
```

---

## Task 7: Provider abstraction

**Files:**
- Create: `lib/ai/provider.ts`

- [ ] **Step 1: Implement getModel()**

```ts
// lib/ai/provider.ts
import { deepseek } from '@ai-sdk/deepseek';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export type AIProvider = 'deepseek' | 'anthropic' | 'openai';

export function getModel(override?: AIProvider): LanguageModel {
  const provider = (override ?? process.env.AI_PROVIDER ?? 'deepseek') as AIProvider;
  switch (provider) {
    case 'deepseek':
      return deepseek('deepseek-chat');
    case 'anthropic':
      return anthropic('claude-sonnet-4-6');
    case 'openai':
      return openai('gpt-4o-mini');
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}`);
  }
}

export function getProviderName(): AIProvider {
  return (process.env.AI_PROVIDER ?? 'deepseek') as AIProvider;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/ai/provider.ts
git commit -m "feat(ai): add provider abstraction for DeepSeek/Anthropic/OpenAI"
```

---

## Task 8: System prompt + context truncation + tests

**Files:**
- Create: `lib/ai/prompt.ts`
- Create: `tests/lib/ai/prompt.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/ai/prompt.test.ts
import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT, truncateContext } from '@/lib/ai/prompt';

describe('SYSTEM_PROMPT', () => {
  it('mentions tool usage and CNY default', () => {
    expect(SYSTEM_PROMPT).toMatch(/工具|tool/i);
    expect(SYSTEM_PROMPT).toMatch(/CNY|¥/);
  });
});

describe('truncateContext', () => {
  const mk = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as const,
      content: `m${i}`,
    }));

  it('keeps all messages when under limit', () => {
    const msgs = mk(5);
    expect(truncateContext(msgs, 10)).toEqual(msgs);
  });

  it('keeps last N when over limit', () => {
    const msgs = mk(12);
    const kept = truncateContext(msgs, 10);
    expect(kept).toHaveLength(10);
    expect(kept[0].content).toBe('m2');
    expect(kept[9].content).toBe('m11');
  });

  it('default window is 10', () => {
    const msgs = mk(15);
    expect(truncateContext(msgs)).toHaveLength(10);
  });
});
```

- [ ] **Step 2: Run, should fail**

Run: `pnpm test tests/lib/ai/prompt.test.ts`
Expected: FAIL (`Cannot find module '@/lib/ai/prompt'`).

- [ ] **Step 3: Implement**

```ts
// lib/ai/prompt.ts
export const SYSTEM_PROMPT = `你是一个个人财务 FIRE 助手。

能力：
- 通过工具查询用户的资产、现金流、FIRE 进度
- 基于查询结果给出简洁分析和建议

约束：
- 只能查询当前登录用户的数据；userId 已由工具内部注入，不要尝试伪造或询问
- 金额单位默认 CNY（¥），时间按用户本地时区
- 不确定时主动调用工具取数，不要凭空猜测数字
- 建议给 1-2 条可执行项，避免大段废话

格式：
- 回复使用中文，结构化分点
- 数据优先用 Markdown 表格
- 金额格式化：¥12,345.67`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function truncateContext<T extends ChatMessage>(messages: T[], window = 10): T[] {
  if (messages.length <= window) return messages;
  return messages.slice(messages.length - window);
}
```

- [ ] **Step 4: Run tests, should pass**

Run: `pnpm test tests/lib/ai/prompt.test.ts`
Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/prompt.ts tests/lib/ai/prompt.test.ts
git commit -m "feat(ai): add system prompt and sliding window context truncation"
```

---

## Task 9: Query action wrappers for tools

**Files:**
- Create: `actions/ai-query.ts`

These are thin `'use server'` (but not form) functions that the tools will call. They encapsulate all DB logic so tools stay small.

- [ ] **Step 1: Implement wrapper**

```ts
// actions/ai-query.ts
import 'server-only';
import prisma from '@/lib/prisma';
import { FlowType, AssetType } from '@/generated/prisma/client';

export async function queryNetWorth(userId: string, _date?: string) {
  // Current balance sum; date parameter reserved for future historical lookup.
  const accounts = await prisma.assetAccount.findMany({
    where: { userId },
    select: { currentBalance: true },
  });
  const total = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);
  return { total, currency: 'CNY' };
}

export async function queryAssetBreakdown(userId: string) {
  const accounts = await prisma.assetAccount.findMany({
    where: { userId },
    select: { name: true, type: true, currentBalance: true },
  });
  const byType: Record<AssetType, number> = {
    CASH: 0, STOCK: 0, BOND: 0, REAL_ESTATE: 0, CRYPTO: 0, DEBT: 0, OTHER: 0,
  };
  for (const a of accounts) byType[a.type] += Number(a.currentBalance);
  return {
    accounts: accounts.map(a => ({ name: a.name, type: a.type, balance: Number(a.currentBalance) })),
    byType,
  };
}

export async function queryCashFlowSummary(
  userId: string,
  args: { startDate: string; endDate: string; type?: 'INCOME' | 'EXPENSE' },
) {
  const where = {
    userId,
    recordDate: { gte: new Date(args.startDate), lte: new Date(args.endDate) },
    ...(args.type ? { type: args.type as FlowType } : {}),
  };
  const rows = await prisma.cashFlowRecord.findMany({ where, select: { type: true, amount: true } });
  let income = 0, expense = 0;
  for (const r of rows) {
    if (r.type === 'INCOME') income += Number(r.amount);
    else expense += Number(r.amount);
  }
  return { income, expense, net: income - expense, currency: 'CNY' };
}

export async function queryCashFlowByCategory(
  userId: string,
  args: { startDate: string; endDate: string },
) {
  const rows = await prisma.cashFlowRecord.groupBy({
    by: ['type', 'category'],
    where: {
      userId,
      recordDate: { gte: new Date(args.startDate), lte: new Date(args.endDate) },
    },
    _sum: { amount: true },
  });
  return rows.map(r => ({
    type: r.type,
    category: r.category ?? '未分类',
    amount: Number(r._sum.amount ?? 0),
  }));
}

export async function queryFirePlanProgress(userId: string) {
  const plan = await prisma.firePlan.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
  if (!plan) return { hasPlan: false };

  const { total: netWorth } = await queryNetWorth(userId);
  const annualExpense = Number(plan.annualExpense);
  const target = plan.customTarget ? Number(plan.customTarget) : annualExpense * 25; // 4% rule
  const progress = target > 0 ? netWorth / target : 0;
  const yearsToTarget =
    plan.retirementAge - plan.currentAge; // simplified; full calc in lib/fire-calc.ts

  return {
    hasPlan: true,
    planName: plan.name,
    netWorth,
    target,
    progress,
    yearsToTarget,
    currency: 'CNY',
  };
}

export async function queryAssetTrend(
  userId: string,
  args: { accountId?: string; range: '1M' | '3M' | '6M' | '1Y' | 'ALL' },
) {
  const monthsMap = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, ALL: 120 } as const;
  const months = monthsMap[args.range];
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const where = {
    recordDate: { gte: since },
    assetAccount: { userId, ...(args.accountId ? { id: args.accountId } : {}) },
  };
  const records = await prisma.assetRecord.findMany({
    where,
    select: { recordDate: true, amount: true, assetAccountId: true },
    orderBy: { recordDate: 'asc' },
  });
  return records.map(r => ({
    date: r.recordDate.toISOString().slice(0, 10),
    amount: Number(r.amount),
    accountId: r.assetAccountId,
  }));
}

export async function queryRecentTransactions(userId: string, args: { limit: number }) {
  const rows = await prisma.cashFlowRecord.findMany({
    where: { userId },
    orderBy: { recordDate: 'desc' },
    take: Math.min(args.limit, 50),
    select: {
      recordDate: true, type: true, amount: true, category: true, note: true,
    },
  });
  return rows.map(r => ({
    date: r.recordDate.toISOString().slice(0, 10),
    type: r.type,
    amount: Number(r.amount),
    category: r.category ?? null,
    note: r.note ?? null,
  }));
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add actions/ai-query.ts
git commit -m "feat(ai): add server-only query wrappers for AI tools"
```

---

## Task 10: Tool definitions + tests

**Files:**
- Create: `lib/ai/tools.ts`
- Create: `tests/lib/ai/tools.test.ts`

- [ ] **Step 1: Write failing tests (schema-level)**

```ts
// tests/lib/ai/tools.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/actions/ai-query', () => ({
  queryNetWorth: vi.fn(async () => ({ total: 100, currency: 'CNY' })),
  queryAssetBreakdown: vi.fn(async () => ({ accounts: [], byType: {} })),
  queryCashFlowSummary: vi.fn(async () => ({ income: 0, expense: 0, net: 0, currency: 'CNY' })),
  queryCashFlowByCategory: vi.fn(async () => []),
  queryFirePlanProgress: vi.fn(async () => ({ hasPlan: false })),
  queryAssetTrend: vi.fn(async () => []),
  queryRecentTransactions: vi.fn(async () => []),
}));

import { buildTools } from '@/lib/ai/tools';

describe('buildTools', () => {
  it('returns the 7 expected tools', () => {
    const tools = buildTools('user-1');
    expect(Object.keys(tools).sort()).toEqual([
      'getAssetBreakdown',
      'getAssetTrend',
      'getCashFlowByCategory',
      'getCashFlowSummary',
      'getFirePlanProgress',
      'getNetWorth',
      'getRecentTransactions',
    ]);
  });

  it('rejects invalid date on getCashFlowSummary', async () => {
    const tools = buildTools('user-1');
    const schema = tools.getCashFlowSummary.inputSchema;
    const parsed = schema.safeParse({ startDate: 'bad', endDate: '2026-01-01' });
    expect(parsed.success).toBe(false);
  });

  it('injects userId into execute via closure', async () => {
    const mod = await import('@/actions/ai-query');
    const tools = buildTools('user-42');
    await tools.getNetWorth.execute!({}, { toolCallId: 't1', messages: [] });
    expect(mod.queryNetWorth).toHaveBeenCalledWith('user-42', undefined);
  });
});
```

- [ ] **Step 2: Run, should fail**

Run: `pnpm test tests/lib/ai/tools.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement tools**

```ts
// lib/ai/tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import {
  queryNetWorth,
  queryAssetBreakdown,
  queryCashFlowSummary,
  queryCashFlowByCategory,
  queryFirePlanProgress,
  queryAssetTrend,
  queryRecentTransactions,
} from '@/actions/ai-query';

export function buildTools(userId: string) {
  return {
    getNetWorth: tool({
      description: '查询用户在指定日期（默认今天）的总净资产',
      inputSchema: z.object({ date: z.string().date().optional() }),
      execute: async ({ date }) => queryNetWorth(userId, date),
    }),
    getAssetBreakdown: tool({
      description: '按资产类型（现金/股票/房产等）和账户返回当前分布',
      inputSchema: z.object({}),
      execute: async () => queryAssetBreakdown(userId),
    }),
    getCashFlowSummary: tool({
      description:
        '指定区间收支汇总。type 可选 INCOME / EXPENSE，不传则返回双向 + net',
      inputSchema: z.object({
        startDate: z.string().date(),
        endDate: z.string().date(),
        type: z.enum(['INCOME', 'EXPENSE']).optional(),
      }),
      execute: async (args) => queryCashFlowSummary(userId, args),
    }),
    getCashFlowByCategory: tool({
      description: '按分类聚合收支（餐饮/交通/工资等），区间内每个 type+category 的小计',
      inputSchema: z.object({
        startDate: z.string().date(),
        endDate: z.string().date(),
      }),
      execute: async (args) => queryCashFlowByCategory(userId, args),
    }),
    getFirePlanProgress: tool({
      description: 'FIRE 目标达成率、剩余年数、当前缺口',
      inputSchema: z.object({}),
      execute: async () => queryFirePlanProgress(userId),
    }),
    getAssetTrend: tool({
      description:
        '资产时间序列。不传 accountId 返回全部账户的记录；range 控制回看范围',
      inputSchema: z.object({
        accountId: z.string().optional(),
        range: z.enum(['1M', '3M', '6M', '1Y', 'ALL']).default('3M'),
      }),
      execute: async (args) => queryAssetTrend(userId, args),
    }),
    getRecentTransactions: tool({
      description: '最近 N 笔现金流流水，按日期倒序',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).default(10),
      }),
      execute: async (args) => queryRecentTransactions(userId, args),
    }),
  };
}
```

- [ ] **Step 4: Run tests, should pass**

Run: `pnpm test tests/lib/ai/tools.test.ts`
Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/tools.ts tests/lib/ai/tools.test.ts
git commit -m "feat(ai): define 7 read-only tools with Zod schemas and userId closure"
```

---

## Task 11: Conversation Server Actions

**Files:**
- Create: `actions/conversation.ts`

- [ ] **Step 1: Implement**

```ts
// actions/conversation.ts
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { ctxKey } from '@/lib/redis/cache';
import type { MessageRole } from '@/generated/prisma/client';

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

export async function listConversations() {
  const userId = await requireUserId();
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function createConversation(title?: string) {
  const userId = await requireUserId();
  const conv = await prisma.conversation.create({
    data: { userId, ...(title ? { title } : {}) },
    select: { id: true },
  });
  revalidatePath('/chat');
  return conv;
}

export async function getMessages(conversationId: string) {
  const userId = await requireUserId();
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!conv) throw new Error('Not found');

  // Cache-Aside read: Redis hit returns last 10; miss falls back to DB + backfill.
  const cached = await redis.get<MessageRecord[]>(ctxKey(conversationId));
  if (cached) return cached;

  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 10,
    select: {
      id: true, role: true, content: true, toolCalls: true, createdAt: true,
    },
  });
  // TTL 30 min (1800s); write path in /api/chat deletes this key after persisting.
  await redis.set(ctxKey(conversationId), rows, { ex: 1800 });
  return rows;
}

export async function deleteConversation(conversationId: string) {
  const userId = await requireUserId();
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!conv) throw new Error('Not found');
  await prisma.conversation.delete({ where: { id: conversationId } });
  await redis.del(ctxKey(conversationId));
  revalidatePath('/chat');
}

export type MessageRecord = {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls: unknown;
  createdAt: Date;
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add actions/conversation.ts
git commit -m "feat(chat): add conversation CRUD server actions"
```

---

## Task 12: /api/chat route handler

**Files:**
- Create: `app/api/chat/route.ts`
- Create: `lib/ai/persist.ts`

- [ ] **Step 1: Implement persistence helper**

```ts
// lib/ai/persist.ts
import 'server-only';
import prisma from '@/lib/prisma';

export async function persistAssistantMessage(params: {
  conversationId: string;
  userText: string;
  assistantText: string;
  toolCalls: unknown;
  tokensIn?: number;
  tokensOut?: number;
}) {
  const { conversationId, userText, assistantText, toolCalls, tokensIn, tokensOut } = params;
  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, role: 'USER', content: userText },
    }),
    prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: assistantText,
        toolCalls: toolCalls as never,
        tokensIn,
        tokensOut,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
}
```

- [ ] **Step 2: Implement route handler**

```ts
// app/api/chat/route.ts
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { auth } from '@/auth';
import { getModel, getProviderName } from '@/lib/ai/provider';
import { buildTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPT, truncateContext } from '@/lib/ai/prompt';
import { checkChatLimit } from '@/lib/ai/ratelimit';
import { redis } from '@/lib/redis';
import { ctxKey, respKey, hashMessages, jitterSeconds } from '@/lib/redis/cache';
import { persistAssistantMessage } from '@/lib/ai/persist';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60;

type IncomingBody = {
  messages: UIMessage[];
  conversationId: string;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('unauthorized', { status: 401 });
  }
  const userId = session.user.id;

  const limit = await checkChatLimit(userId);
  if (!limit.ok) {
    return new Response(`rate limited (${limit.which})`, {
      status: 429,
      headers: { 'Retry-After': String(limit.reset) },
    });
  }

  const { messages, conversationId } = (await req.json()) as IncomingBody;

  // Verify conversation ownership
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!conv) return new Response('not found', { status: 404 });

  // Keep last 10 messages in context
  const windowed = truncateContext(messages, 10);

  // Response-cache probe
  const flatForHash = windowed.map(m => ({
    role: m.role,
    content: m.parts?.map((p: { type: string; text?: string }) =>
      p.type === 'text' ? p.text ?? '' : '').join('') ?? '',
  }));
  const cacheKey = respKey(
    await hashMessages([{ role: 'system', content: getProviderName() }, ...flatForHash]),
  );
  const cached = await redis.get<string>(cacheKey);
  if (cached) {
    // Simple non-stream replay: browser still sees a final text, just no token-by-token effect.
    return new Response(cached, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  // Extract the latest user message (last user part) for persistence
  const lastUser = [...windowed].reverse().find(m => m.role === 'user');
  const userText =
    lastUser?.parts?.map((p: { type: string; text?: string }) =>
      p.type === 'text' ? p.text ?? '' : '').join('') ?? '';

  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(windowed),
    tools: buildTools(userId),
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, usage, toolCalls }) => {
      await persistAssistantMessage({
        conversationId,
        userText,
        assistantText: text,
        toolCalls: toolCalls ?? null,
        tokensIn: usage?.inputTokens,
        tokensOut: usage?.outputTokens,
      });
      await redis.set(cacheKey, text, { ex: jitterSeconds(3600) });
      await redis.del(ctxKey(conversationId));
    },
  });

  return result.toUIMessageStreamResponse();
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/route.ts lib/ai/persist.ts
git commit -m "feat(chat): add /api/chat route handler with auth, ratelimit, streaming"
```

---

## Task 13: i18n strings for chat module

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh.json`

- [ ] **Step 1: Add chat namespace to zh.json**

Inside the top-level JSON object, merge:

```json
"Chat": {
  "title": "AI 助手",
  "newConversation": "新对话",
  "placeholderInput": "问我任何关于你财务状况的问题...",
  "send": "发送",
  "stop": "停止",
  "thinking": "思考中...",
  "empty": "开始一个新对话",
  "promptSuggestions": {
    "thisMonthExpense": "我这个月花了多少？",
    "netWorth": "我现在总净资产是多少？",
    "fireProgress": "我离 FIRE 还有多远？",
    "topCategories": "过去 3 个月我花钱最多的是哪些类别？"
  },
  "toolCallLabel": "调用工具",
  "deleteConfirm": "确定要删除这个对话吗？",
  "rateLimited": "请求过于频繁，请稍后再试"
}
```

- [ ] **Step 2: Add mirror keys to en.json**

```json
"Chat": {
  "title": "AI Assistant",
  "newConversation": "New conversation",
  "placeholderInput": "Ask anything about your finances...",
  "send": "Send",
  "stop": "Stop",
  "thinking": "Thinking...",
  "empty": "Start a new conversation",
  "promptSuggestions": {
    "thisMonthExpense": "How much have I spent this month?",
    "netWorth": "What is my total net worth?",
    "fireProgress": "How far am I from FIRE?",
    "topCategories": "What are my top spending categories in the last 3 months?"
  },
  "toolCallLabel": "Tool call",
  "deleteConfirm": "Delete this conversation?",
  "rateLimited": "Too many requests. Please try again later."
}
```

- [ ] **Step 3: Commit**

```bash
git add messages/en.json messages/zh.json
git commit -m "feat(i18n): add chat module translations"
```

---

## Task 14: Chat layout + page routing

**Files:**
- Create: `app/[locale]/chat/layout.tsx`
- Create: `app/[locale]/chat/page.tsx`
- Create: `app/[locale]/chat/[conversationId]/page.tsx`

- [ ] **Step 1: Layout with server-fetched conversation list**

```tsx
// app/[locale]/chat/layout.tsx
import type { ReactNode } from 'react';
import { listConversations } from '@/actions/conversation';
import { ConversationList } from '@/components/chat/conversation-list';

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const conversations = await listConversations();
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      <aside className="w-64 shrink-0 border-r bg-muted/20 overflow-y-auto">
        <ConversationList conversations={conversations} />
      </aside>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Index page — redirect to latest or create new**

```tsx
// app/[locale]/chat/page.tsx
import { redirect } from 'next/navigation';
import { listConversations, createConversation } from '@/actions/conversation';

export default async function ChatIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const convs = await listConversations();
  const target =
    convs[0]?.id ?? (await createConversation()).id;
  redirect(`/${locale}/chat/${target}`);
}
```

- [ ] **Step 3: Conversation page**

```tsx
// app/[locale]/chat/[conversationId]/page.tsx
import { getMessages } from '@/actions/conversation';
import { ChatWindow } from '@/components/chat/chat-window';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const initialMessages = await getMessages(conversationId);
  return (
    <ChatWindow
      conversationId={conversationId}
      initialMessages={initialMessages.map(m => ({
        id: m.id,
        role: m.role === 'USER' ? 'user' : 'assistant',
        parts: [{ type: 'text', text: m.content }],
      }))}
    />
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/chat/layout.tsx app/[locale]/chat/page.tsx "app/[locale]/chat/[conversationId]/page.tsx"
git commit -m "feat(chat): add chat routes and RSC layout"
```

---

## Task 15: Conversation list components

**Files:**
- Create: `components/chat/conversation-list.tsx`
- Create: `components/chat/conversation-item.tsx`

- [ ] **Step 1: List (Server Component)**

```tsx
// components/chat/conversation-list.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ConversationItem } from './conversation-item';

type Conv = { id: string; title: string; updatedAt: Date };

export async function ConversationList({ conversations }: { conversations: Conv[] }) {
  const t = await getTranslations('Chat');
  return (
    <div className="flex flex-col gap-1 p-2">
      <Link
        href="/chat"
        className="rounded-md px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
      >
        + {t('newConversation')}
      </Link>
      <div className="mt-2 flex flex-col gap-0.5">
        {conversations.map((c) => (
          <ConversationItem key={c.id} id={c.id} title={c.title} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Item (Client Component, for hover / delete)**

```tsx
// components/chat/conversation-item.tsx
'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { deleteConversation } from '@/actions/conversation';
import { cn } from '@/lib/utils';

export function ConversationItem({ id, title }: { id: string; title: string }) {
  const t = useTranslations('Chat');
  const params = useParams<{ locale: string; conversationId?: string }>();
  const router = useRouter();
  const [pending, start] = useTransition();
  const active = params.conversationId === id;

  const handleDelete = () => {
    if (!confirm(t('deleteConfirm'))) return;
    start(async () => {
      await deleteConversation(id);
      router.push(`/${params.locale}/chat`);
    });
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-md px-3 py-2 text-sm',
        active ? 'bg-accent' : 'hover:bg-accent/50',
      )}
    >
      <Link href={`/${params.locale}/chat/${id}`} className="truncate flex-1">
        {title}
      </Link>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="ml-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        aria-label="delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/chat/conversation-list.tsx components/chat/conversation-item.tsx
git commit -m "feat(chat): add conversation list and item components"
```

---

## Task 16: Chat window + useChat wiring

**Files:**
- Create: `components/chat/chat-window.tsx`
- Create: `components/chat/chat-input.tsx`

- [ ] **Step 1: Input**

```tsx
// components/chat/chat-input.tsx
'use client';

import { useState } from 'react';
import { SendHorizontal, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type Props = {
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
};

export function ChatInput({ onSend, onStop, streaming, disabled }: Props) {
  const t = useTranslations('Chat');
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || streaming || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div className="flex items-end gap-2 border-t p-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={t('placeholderInput')}
        rows={2}
        disabled={disabled}
        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {streaming ? (
        <Button type="button" variant="outline" onClick={onStop}>
          <Square className="mr-1 h-4 w-4" /> {t('stop')}
        </Button>
      ) : (
        <Button type="button" onClick={submit} disabled={!value.trim() || disabled}>
          <SendHorizontal className="mr-1 h-4 w-4" /> {t('send')}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Chat window (useChat host)**

```tsx
// components/chat/chat-window.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { EmptyState } from './empty-state';

type Props = {
  conversationId: string;
  initialMessages: UIMessage[];
};

export function ChatWindow({ conversationId, initialMessages }: Props) {
  const { messages, sendMessage, stop, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId },
    }),
    messages: initialMessages,
  });

  const streaming = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onPick={(text) => sendMessage({ text })} />
        ) : (
          <MessageList messages={messages} streaming={streaming} />
        )}
      </div>
      <ChatInput
        onSend={(text) => sendMessage({ text })}
        onStop={stop}
        streaming={streaming}
      />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors (MessageList / EmptyState placeholders created in next tasks).

- [ ] **Step 4: Commit**

```bash
git add components/chat/chat-window.tsx components/chat/chat-input.tsx
git commit -m "feat(chat): add chat window and input with useChat"
```

---

## Task 17: Message rendering + tool call display

**Files:**
- Create: `components/chat/message-list.tsx`
- Create: `components/chat/message-bubble.tsx`
- Create: `components/chat/tool-call-display.tsx`

- [ ] **Step 1: Message bubble**

```tsx
// components/chat/message-bubble.tsx
'use client';

import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { ToolCallDisplay } from './tool-call-display';

export function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {message.parts?.map((part, i) => {
          if (part.type === 'text') return <span key={i}>{part.text}</span>;
          if (part.type.startsWith('tool-')) {
            return <ToolCallDisplay key={i} part={part} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tool call display**

```tsx
// components/chat/tool-call-display.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ToolCallDisplay({ part }: { part: Record<string, unknown> }) {
  const t = useTranslations('Chat');
  const [open, setOpen] = useState(false);

  const type = String(part.type ?? '');
  const toolName = type.replace(/^tool-/, '');
  const input = part.input ?? part.args;
  const output = part.output ?? part.result;

  return (
    <div className="my-1 rounded-md border bg-background px-2 py-1 text-xs">
      <button
        className="flex items-center gap-1 text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Wrench className="h-3 w-3" />
        <span>{t('toolCallLabel')}:</span>
        <code>{toolName}</code>
      </button>
      {open && (
        <pre className="mt-1 overflow-x-auto rounded bg-muted/50 p-2 text-[11px]">
          {JSON.stringify({ input, output }, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Message list**

```tsx
// components/chat/message-list.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { useTranslations } from 'next-intl';
import { MessageBubble } from './message-bubble';

export function MessageList({
  messages,
  streaming,
}: {
  messages: UIMessage[];
  streaming: boolean;
}) {
  const t = useTranslations('Chat');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {streaming && (
        <div className="text-xs text-muted-foreground">{t('thinking')}</div>
      )}
      <div ref={endRef} />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/chat/message-list.tsx components/chat/message-bubble.tsx components/chat/tool-call-display.tsx
git commit -m "feat(chat): render messages, bubbles, and collapsible tool calls"
```

---

## Task 18: Empty state with suggested prompts

**Files:**
- Create: `components/chat/empty-state.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/chat/empty-state.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  const t = useTranslations('Chat.promptSuggestions');
  const tChat = useTranslations('Chat');
  const suggestions: { key: string; text: string }[] = [
    { key: 'thisMonthExpense', text: t('thisMonthExpense') },
    { key: 'netWorth', text: t('netWorth') },
    { key: 'fireProgress', text: t('fireProgress') },
    { key: 'topCategories', text: t('topCategories') },
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <Sparkles className="h-5 w-5" />
        {tChat('empty')}
      </div>
      <div className="grid max-w-xl gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s.key}
            onClick={() => onPick(s.text)}
            className="rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
          >
            {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck & dev smoke**

```bash
pnpm exec tsc --noEmit
pnpm dev
```

Expected: `/zh/chat` (or `/en/chat`) renders, redirects to a conversation, suggestion chips visible.

- [ ] **Step 3: Commit**

```bash
git add components/chat/empty-state.tsx
git commit -m "feat(chat): add empty state with prompt suggestions"
```

---

## Task 19: Navigation entry in main layout

**Files:**
- Modify: existing header / nav component (inspect `components/` and `app/[locale]/layout.tsx` first)

- [ ] **Step 1: Locate nav**

```bash
grep -R "Dashboard" app components --include="*.tsx" -l
```

Identify the component rendering the top nav menu. Check for an existing links array.

- [ ] **Step 2: Add Chat link**

Add a link entry pointing to `/[locale]/chat` labeled with `Chat.title` translation. The exact edit depends on the existing nav pattern — follow the existing array-of-links shape already used for Dashboard / Assets / CashFlow.

- [ ] **Step 3: Verify in browser**

Run `pnpm dev`, visit root, click new Chat entry, confirm navigation to `/zh/chat` works.

- [ ] **Step 4: Commit**

```bash
git add <nav component path>
git commit -m "feat(nav): add chat entry to main navigation"
```

---

## Task 20: End-to-end manual verification & guard rails

**Files:**
- Modify (optional fixes): any file surfaced by manual testing

- [ ] **Step 1: Seed a test conversation**

In the app, log in, open `/zh/chat`. Verify `/chat` redirects, new conversation auto-created.

- [ ] **Step 2: Happy path — query**

Send: "我这个月花了多少？"
Expected:
- Stream starts within ~2s
- At least one tool-call block shows `getCashFlowSummary`
- Final answer references seed data amounts

- [ ] **Step 3: Conversation isolation**

Log in as another seeded user (via seed script), open same URL as step 1's conversation id. Expected: 404 from `/api/chat` (ownership check), and `getMessages` throws "Not found".

- [ ] **Step 4: Rate limit**

Send 11 messages in under a minute. Expected: 11th returns `429` with `Retry-After`.

- [ ] **Step 5: Context cache check**

Observe that after the first message in a conversation, subsequent messages trigger `redis.del(ctxKey)` then re-populate (via `persistAssistantMessage` path). Use Upstash console or `@upstash/redis`'s CLI if available.

- [ ] **Step 6: Run full test suite**

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: all pass.

- [ ] **Step 7: Commit any manual fixes**

For each issue found, create a focused commit:

```bash
git commit -m "fix(chat): <specific issue>"
```

---

## Spec coverage cross-check

| Spec section | Task(s) |
|---|---|
| §1 架构总览 | Task 12 |
| §2.1 Conversation / Message schema | Task 2 |
| §2.2 User 关系字段 | Task 2 |
| §3 Tool Calling | Task 9 + Task 10 |
| §4.1 限流（滑动窗口 + 串行） | Task 6 + Task 12 |
| §4.2 会话上下文缓存（Cache-Aside） | Task 11（del 路径）+ Task 12（del 路径） |
| §4.3 LLM 响应缓存（抖动 TTL） | Task 5（jitter）+ Task 12 |
| §4.4 Key 命名规范 | Task 5 |
| §5 API 路由 & Server Action 分工 | Task 11（actions）+ Task 12（route） |
| §6 前端 | Task 13–18 |
| §7 测试策略（B：Vitest 关键路径） | Task 1 / 5 / 6 / 8 / 10 |
| §9 关键配置项 | Task 3 |
| §10 Backlog | 不在本 plan 实现 |
