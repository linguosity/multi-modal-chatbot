import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Story, StorySchema } from '@/lib/schemas/story';
import { nanoid } from 'nanoid';

// TODO: Replace with actual database once Supabase is integrated
const MOCK_STORIES: Record<string, Story> = {};

// Validation schema for request parameters
const GetStoryParamsSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');

    // Validate request parameters
    const validatedParams = GetStoryParamsSchema.parse({ id, userId });

    // Must provide either id or userId
    if (!validatedParams.id && !validatedParams.userId) {
      return NextResponse.json(
        { error: 'Either id or userId must be provided' },
        { status: 400 }
      );
    }

    // If id is provided, return a specific story
    if (validatedParams.id) {
      // TODO: Replace with database query
      const story = MOCK_STORIES[validatedParams.id];
      
      if (!story) {
        return NextResponse.json(
          { error: 'Story not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ story });
    }

    // If userId is provided, return all stories for that user
    if (validatedParams.userId) {
      // TODO: Replace with database query
      const userStories = Object.values(MOCK_STORIES).filter(
        (story) => story.userId === validatedParams.userId
      );
      
      return NextResponse.json({ stories: userStories });
    }

    // This should never be reached due to validation above
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting story:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}