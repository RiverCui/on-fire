import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from 'ai';
import { auth } from '@/auth';
import { getModel, isAIProvider } from '@/lib/ai/provider';
import { buildTools } from '@/lib/ai/tools';
import { generateConversationTitle } from '@/lib/ai/title';
import { SYSTEM_PROMPT, truncateContext } from '@/lib/ai/prompt';
import { checkChatLimit } from '@/lib/ai/ratelimit';
import { redis } from '@/lib/redis';
import { ctxKey } from '@/lib/redis/cache';
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

  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return new Response('invalid json', { status: 400 });
  }
  const { messages, conversationId } = body;

  // 3. Ownership check — conversation must belong to current user.
  //    Also pull provider + title so we can route to the user-selected model
  //    and decide whether to auto-name the conversation later.
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true, provider: true, title: true },
  });
  if (!conv) return new Response('not found', { status: 404 });
  const providerOverride = isAIProvider(conv.provider) ? conv.provider : undefined;
  const needsAutoTitle = conv.title === '新对话';

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

  // Future: response cache (semantic / Anthropic prompt cache) — see interview-notes.

  // 5. Stream from the LLM with tools wired in.
  // `convertToModelMessages` is async in AI SDK v6.
  const modelMessages = await convertToModelMessages(windowed);
  const result = streamText({
    model: getModel(providerOverride),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: buildTools(userId),
    stopWhen: stepCountIs(5),
    onFinish: async ({ text: assistantText, usage, toolCalls }) => {
      try {
        await persistAssistantMessage({
          conversationId,
          userId,
          userText,
          assistantText,
          toolCalls: (toolCalls as unknown) as Prisma.InputJsonValue | null,
          tokensIn: usage?.inputTokens,
          tokensOut: usage?.outputTokens,
        });
      } catch (err) {
        console.error('[chat] persist failed', { conversationId, err });
      }

      // Auto-name the conversation on its first exchange. Best-effort:
      // generation runs synchronously here so the client `router.refresh()`
      // after stream-end will see the new title; failures fall back silently.
      if (needsAutoTitle && userText && assistantText) {
        try {
          const title = await generateConversationTitle(
            userText,
            assistantText,
            providerOverride,
          );
          if (title && title !== '新对话') {
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { title },
            });
          }
        } catch (err) {
          console.warn('[chat] auto-title failed', { conversationId, err });
        }
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
