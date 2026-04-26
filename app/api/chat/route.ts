import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from 'ai';
import { auth } from '@/auth';
import { getModel, getProviderName } from '@/lib/ai/provider';
import { buildTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPT, truncateContext } from '@/lib/ai/prompt';
import { checkChatLimit } from '@/lib/ai/ratelimit';
import { redis } from '@/lib/redis';
import { ctxKey, respKey, hashMessages, jitterSeconds } from '@/lib/redis/cache';
import { persistAssistantMessage } from '@/lib/ai/persist';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

type IncomingBody = {
  messages: UIMessage[];
  conversationId: string;
};

export async function POST(req: Request) {
  // 1. Auth — must come before any DB/Redis access.
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('unauthorized', { status: 401 });
  }
  const userId = session.user.id;

  // 2. Rate limit (per-user, sliding-window). Fail-closed on Redis error.
  const limit = await checkChatLimit(userId);
  if (!limit.ok) {
    return new Response(`rate limited (${limit.which})`, {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((limit.reset - Date.now()) / 1000)),
      },
    });
  }

  const { messages, conversationId } = (await req.json()) as IncomingBody;

  // 3. Ownership check — conversation must belong to current user.
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!conv) return new Response('not found', { status: 404 });

  // 4. Truncate to last 10 messages for context window control.
  const windowed = truncateContext(messages, 10);

  // Extract latest user text for persistence (UIMessage is parts-based).
  const lastUser = [...windowed].reverse().find((m) => m.role === 'user');
  const userText =
    lastUser?.parts
      ?.map((p: { type: string; text?: string }) =>
        p.type === 'text' ? p.text ?? '' : '',
      )
      .join('') ?? '';

  // NOTE: Cache READ path is intentionally skipped for now.
  // The plan returns cached text as `text/plain`, but `useChat` +
  // `DefaultChatTransport` expect an AI SDK v6 UI-message stream (SSE).
  // TODO(Task 20): replay cache hits in UI-message-stream format so they
  // are compatible with `useChat`. For now we keep the cache WRITE in
  // `onFinish` to preserve the jitter-TTL educational example.

  // 5. Stream from the LLM with tools wired in.
  // `convertToModelMessages` is async in AI SDK v6.
  const modelMessages = await convertToModelMessages(windowed);
  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: buildTools(userId),
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, usage, toolCalls }) => {
      try {
        await persistAssistantMessage({
          conversationId,
          userId,
          userText,
          assistantText: text,
          toolCalls: (toolCalls as unknown) as Prisma.InputJsonValue | null,
          tokensIn: usage?.inputTokens,
          tokensOut: usage?.outputTokens,
        });
      } catch (err) {
        console.error('[chat] persist failed', { conversationId, err });
      }

      // Educational: write LLM response cache with jitter TTL.
      // TODO(Task 20): cache READ path needs UI-message-stream replay format.
      try {
        const flatForHash = windowed.map((m) => ({
          role: m.role,
          content: m.parts?.map((p: { type: string; text?: string }) =>
            p.type === 'text' ? p.text ?? '' : '').join('') ?? '',
        }));
        const cacheKey = respKey(
          hashMessages([{ role: 'system', content: getProviderName() }, ...flatForHash]),
        );
        await redis.set(cacheKey, text, { ex: jitterSeconds(3600) });
      } catch (err) {
        console.warn('[chat] response cache write failed', err);
      }

      try {
        await redis.del(ctxKey(conversationId));
      } catch (err) {
        console.warn('[chat] ctx cache invalidate failed', err);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
