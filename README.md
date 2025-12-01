# 🔥 FIRE Master

FIRE Master 是一个面向 FIRE（Financial Independence, Retire Early）人群的个人财富仪表盘，聚焦净资产、现金流和退休进度。它使用 Next.js 16 + Prisma + Shadcn UI 构建，支持 Dashboard、资产账户、现金流记录等模块，方便你在一个地方管理所有 FIRE 相关数据。

## 功能亮点

- 可视化仪表盘：展示净资产、资产分布、收支趋势等关键指标。
- 资产与现金流管理：支持多种账户类型、历史快照与收支分类。
- 退休进度：根据 4% 法则估算目标和达成率。

## 快速开始

```bash
pnpm install
pnpm dev
```

在 `.env` 中配置 `DATABASE_URL` 后，再运行 `pnpm prisma migrate dev` 与 `pnpm prisma db seed` 即可体验完整数据。 MIT License.
