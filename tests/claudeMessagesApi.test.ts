import { callClaudeMessagesApi } from '@/lib/claudeApiHelper';

describe('callClaudeMessagesApi()', () => {
  const OLD_FETCH = global.fetch;
  afterEach(() => { global.fetch = OLD_FETCH; jest.resetAllMocks(); });

  it('parses valid JSON from Claude', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: '{"foo":"bar"}' }] })
    } as any);
    await expect(callClaudeMessagesApi('sys','user')).resolves.toEqual({ foo: 'bar' });
  });

  it('throws on HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false, status: 502, statusText: 'Bad Gateway', text: async () => 'err'
    } as any);
    await expect(callClaudeMessagesApi('sys','user'))
      .rejects.toThrow(/API request failed: 502 Bad Gateway/);
  });

  it('throws on invalid JSON', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'not-json' }] })
    } as any);
    await expect(callClaudeMessagesApi('sys','user'))
      .rejects.toThrow(/Failed to parse Claude's text response/);
  });
});