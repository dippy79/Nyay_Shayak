import type { Content } from '@google/generative-ai';

export interface ChatHistoryItem {
  role?: string;
  text?: string;
  content?: string;
  parts?: Array<{ text: string }>;
}

/** Normalize client history and ensure Gemini's first turn is always role=user. */
export function sanitizeGeminiHistory(raw: ChatHistoryItem[] = []): Content[] {
  const converted: Content[] = raw
    .filter((m) => m && (m.text || m.content || m.parts?.length))
    .map((m) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: m.parts ?? [{ text: String(m.text ?? m.content ?? '') }],
    }));

  while (converted.length > 0 && converted[0].role === 'model') {
    converted.shift();
  }

  return converted;
}
