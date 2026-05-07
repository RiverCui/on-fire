import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import { auth } from '@/auth';
import { getModel, isAIProvider, VALID_PROVIDERS, type AIProvider } from '@/lib/ai/provider';
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

// Lightweight runtime validation for the chat endpoint. We don't try to
// fully describe AI SDK's UIMessage shape here — just enough to reject
// obviously malformed bodies and bound payload size so a single request
// can't drain the per-day token budget.
const messagePartSchema = z
  .object({
    type: z.string(),
    text: z.string().max(4000).optional(),
  })
  .passthrough();

const bodySchema = z.object({
  // Optional: when omitted, the conversation is created lazily on first message
  // so navigating to /chat doesn't pile up empty rows.
  conversationId: z.string().min(1).max(50).optional(),
  // Only honored on lazy creation — provider for an existing conversation is
  // immutable once messages exist (enforced elsewhere).
  provider: z.enum([...VALID_PROVIDERS] as [AIProvider, ...AIProvider[]]).optional(),
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        parts: z.array(messagePartSchema).max(20),
      }),
    )
    .min(1)
    .max(50),
});

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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response('invalid body', { status: 400 });
  }
  const { conversationId: incomingId, provider: draftProvider } = parsed.data;
  // Cast to UIMessage[]: schema verified the structural shape (id / role /
  // parts), passthrough preserves any extra fields AI SDK emits.
  const messages = parsed.data.messages as unknown as UIMessage[];

  // 3. Resolve conversation:
  //    - With incoming id: ownership check.
  //    - Without id: lazy-create (first message of a draft session). The draft
  //      provider — if any — is locked in at creation time. The new id is
  //      streamed back to the client via messageMetadata so the URL can sync.
  let conversationId: string;
  let providerOverride: AIProvider | undefined;
  let needsAutoTitle: boolean;

  if (incomingId) {
    const conv = await prisma.conversation.findFirst({
      where: { id: incomingId, userId },
      select: { id: true, provider: true, title: true },
    });
    if (!conv) return new Response('not found', { status: 404 });
    conversationId = conv.id;
    providerOverride = isAIProvider(conv.provider) ? conv.provider : undefined;
    needsAutoTitle = conv.title === '新对话';
  } else {
    const created = await prisma.conversation.create({
      data: { userId, ...(draftProvider ? { provider: draftProvider } : {}) },
      select: { id: true, provider: true },
    });
    conversationId = created.id;
    providerOverride = isAIProvider(created.provider) ? created.provider : undefined;
    needsAutoTitle = true;
  }
  // Non-null only when we just lazy-created — used to push id back to client.
  const newlyCreatedId = incomingId ? null : conversationId;

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

  return result.toUIMessageStreamResponse({
    // On lazy creation, push the new id to the client on stream-start so it
    // can swap the URL from /chat to /chat/[newId] without a navigation.
    messageMetadata: ({ part }) => {
      if (newlyCreatedId && part.type === 'start') {
        return { conversationId: newlyCreatedId };
      }
    },
  });
}
