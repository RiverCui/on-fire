import { generateText } from 'ai';
import { getModel, type AIProvider } from './provider';

const TITLE_SYSTEM = `你是对话命名助手。基于一组用户问题与助手回答，输出一个 3-8 字的中文短标题，
准确概括对话主题。要求：
- 只输出标题本身，不要引号、标点、前后缀
- 不要输出 "对话"、"问答"、"标题" 等冗余词
- 优先使用名词短语，不要动词开头`;

const FALLBACK_TITLE = '新对话';
const MAX_LEN = 16;

/**
 * Generate a short Chinese title for a conversation based on its first
 * user/assistant exchange. Best-effort: any error returns FALLBACK_TITLE
 * so the caller never has to handle exceptions.
 */
export async function generateConversationTitle(
  userText: string,
  assistantText: string,
  provider?: AIProvider,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: getModel(provider),
      system: TITLE_SYSTEM,
      prompt: `用户：${userText}\n\n助手：${assistantText}`,
      maxOutputTokens: 24,
    });
    const cleaned = text
      .replace(/[「」『』""''《》<>"'\s]+/g, '')
      .replace(/[。，、；：！？.,;:!?]+$/g, '')
      .slice(0, MAX_LEN)
      .trim();
    return cleaned || FALLBACK_TITLE;
  } catch (err) {
    console.warn('[title] generation failed', err);
    return FALLBACK_TITLE;
  }
}
