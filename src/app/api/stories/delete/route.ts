import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Story } from '@/lib/schemas/story';

// TODO: Replace with actual database once Supabase is integrated
const MOCK_STORIES: Record<string, Story> = {};

// Create a schema for the delete request
const DeleteStoryRequestSchema = z.object({
  storyId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body against our schema
    const { storyId } = DeleteStoryRequestSchema.parse(body);
    
    // Check if the story exists
    // TODO: Replace with database query
    const existingStory = MOCK_STORIES[storyId];
    
    if (!existingStory) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }
    
    // Delete the story
    // TODO: Replace with database deletion
    delete MOCK_STORIES[storyId];
    
    return NextResponse.json({
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}