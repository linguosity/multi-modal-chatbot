import { NextRequest } from 'next/server';
import { GET } from '../../src/app/api/stories/get/route';
import { POST as CreateStory } from '../../src/app/api/stories/create/route';
import { PUT as UpdateStory } from '../../src/app/api/stories/update/route';
import { DELETE as DeleteStory } from '../../src/app/api/stories/delete/route';

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  })),
}));

describe('/api/stories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stories/get', () => {
    it('should return stories for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/stories/get');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/stories/create', () => {
    it('should create a new story with valid data', async () => {
      const storyData = {
        title: 'Test Story',
        content: 'This is a test story content',
        category: 'adventure',
      };

      const request = new NextRequest('http://localhost:3000/api/stories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyData),
      });

      const response = await CreateStory(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.title).toBe(storyData.title);
      expect(data.content).toBe(storyData.content);
    });

    it('should reject invalid story data', async () => {
      const invalidData = {
        title: '', // Empty title should be invalid
        content: 'Content without title',
      };

      const request = new NextRequest('http://localhost:3000/api/stories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await CreateStory(request);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/stories/update', () => {
    it('should update existing story', async () => {
      const updateData = {
        id: 'test-story-id',
        title: 'Updated Title',
        content: 'Updated content',
      };

      const request = new NextRequest('http://localhost:3000/api/stories/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await UpdateStory(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe(updateData.title);
    });

    it('should return 404 for non-existent story', async () => {
      const updateData = {
        id: 'non-existent-id',
        title: 'Updated Title',
      };

      const request = new NextRequest('http://localhost:3000/api/stories/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await UpdateStory(request);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/stories/delete', () => {
    it('should delete existing story', async () => {
      const request = new NextRequest('http://localhost:3000/api/stories/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'test-story-id' }),
      });

      const response = await DeleteStory(request);

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent story', async () => {
      const request = new NextRequest('http://localhost:3000/api/stories/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'non-existent-id' }),
      });

      const response = await DeleteStory(request);

      expect(response.status).toBe(404);
    });
  });
});