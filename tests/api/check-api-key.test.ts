import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/check-api-key/route';

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('/api/check-api-key', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success for valid API key', async () => {
    // Mock successful Anthropic API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ model: 'claude-3-sonnet-20240229' }),
    } as Response);

    const request = new NextRequest('http://localhost:3000/api/check-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'valid-key' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ valid: true });
  });

  it('should return error for invalid API key', async () => {
    // Mock failed Anthropic API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    const request = new NextRequest('http://localhost:3000/api/check-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'invalid-key' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ 
      valid: false, 
      error: 'Invalid API key or request failed' 
    });
  });

  it('should handle missing API key', async () => {
    const request = new NextRequest('http://localhost:3000/api/check-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ 
      valid: false, 
      error: 'Invalid API key or request failed' 
    });
  });

  it('should handle network errors', async () => {
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/check-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'test-key' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ 
      valid: false, 
      error: 'Invalid API key or request failed' 
    });
  });
});