import { deepseek } from '@ai-sdk/deepseek';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export type AIProvider = 'deepseek' | 'anthropic' | 'openai';

const DEFAULT_PROVIDER: AIProvider = 'deepseek';
export const VALID_PROVIDERS: readonly AIProvider[] = ['deepseek', 'anthropic', 'openai'];

export function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && (VALID_PROVIDERS as readonly string[]).includes(value);
}

function resolveProvider(override?: AIProvider): AIProvider {
  const raw = override ?? process.env.AI_PROVIDER ?? DEFAULT_PROVIDER;
  if (!VALID_PROVIDERS.includes(raw as AIProvider)) {
    throw new Error(`Unknown AI_PROVIDER: ${raw}`);
  }
  return raw as AIProvider;
}

/**
 * Returns an AI SDK language model based on AI_PROVIDER env
 * (or explicit override). Reads env at call time.
 */
export function getModel(override?: AIProvider): LanguageModel {
  const provider = resolveProvider(override);
  switch (provider) {
    case 'deepseek':
      return deepseek('deepseek-chat');
    case 'anthropic':
      return anthropic('claude-sonnet-4-6');
    case 'openai':
      return openai('gpt-4o-mini');
  }
}

export function getProviderName(): AIProvider {
  return resolveProvider();
}
