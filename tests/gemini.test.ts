import { sanitizeGeminiHistory } from '../apps/backend/src/lib/gemini';

describe('sanitizeGeminiHistory', () => {
  test('strips leading model messages', () => {
    const result = sanitizeGeminiHistory([
      { role: 'model', text: 'Welcome!' },
      { role: 'user', text: 'Hello' },
      { role: 'model', text: 'Hi there' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('user');
    expect(result[1].role).toBe('model');
  });

  test('returns empty when only model messages', () => {
    const result = sanitizeGeminiHistory([{ role: 'model', text: 'Welcome!' }]);
    expect(result).toHaveLength(0);
  });

  test('converts text field to parts', () => {
    const result = sanitizeGeminiHistory([{ role: 'user', text: 'What is bail?' }]);
    expect(result[0].parts).toEqual([{ text: 'What is bail?' }]);
  });
});

describe('CNR validation', () => {
  test('validates CNR format', async () => {
    const { isValidCNR } = await import('../apps/backend/src/lib/validation');
    expect(isValidCNR('DLSC01-002315-2024')).toBe(true);
    expect(isValidCNR('INVALID')).toBe(false);
  });
});
