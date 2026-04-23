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
