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
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Keep only the last `size` messages. Generic over any message-like array
 * so it works for both `ChatMessage` (server-side legacy) and `UIMessage`
 * (AI SDK v6 UI-message format from `useChat`).
 */
export function truncateContext<T extends { role: string }>(messages: T[], size = 10): T[] {
  if (messages.length <= size) return messages;
  return messages.slice(messages.length - size);
}
