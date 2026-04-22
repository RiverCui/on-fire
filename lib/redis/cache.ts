import { createHash } from 'node:crypto';

export const ctxKey = (conversationId: string) => `chat:ctx:${conversationId}`;
export const respKey = (hash: string) => `chat:resp:${hash}`;

/** +/- 10% jitter on TTL to smear cache expirations. */
export function jitterSeconds(baseSeconds: number): number {
  const range = baseSeconds * 0.1;
  const delta = Math.floor(Math.random() * range * 2) - Math.floor(range);
  return baseSeconds + delta;
}

/**
 * Stable SHA-256 of messages for response-cache keys.
 * NOTE: callers must pass objects with `{ role, content }` in that property
 * order — JSON.stringify preserves insertion order, and the hash depends on it.
 */
export function hashMessages(
  messages: Array<{ role: string; content: string }>,
): string {
  const json = JSON.stringify(messages);
  return createHash('sha256').update(json).digest('hex');
}
