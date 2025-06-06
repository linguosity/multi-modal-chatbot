import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Story, StorySchema } from '@/lib/schemas/story';

// TODO: Replace with actual database once Supabase is integrated
const MOCK_STORIES: Record<string, Story> = {};

// Create a schema for the update request
const UpdateStoryRequestSchema = z.object({
  storyId: z.string(),
  updates: StorySchema.partial(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body against our schema
    const { storyId, updates } = UpdateStoryRequestSchema.parse(body);
    
    // Check if the story exists
    // TODO: Replace with database query
    const existingStory = MOCK_STORIES[storyId];
    
    if (!existingStory) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }
    
    // Update the story with the provided updates
    const updatedStory: Story = {
      ...existingStory,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (existingStory.version || 1) + 1, // Increment version
    };
    
    // Persist the updated story
    // TODO: Replace with database update
    MOCK_STORIES[storyId] = updatedStory;
    
    return NextResponse.json({
      message: 'Story updated successfully',
      story: updatedStory
    });
  } catch (error) {
    console.error('Error updating story:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid update data',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}