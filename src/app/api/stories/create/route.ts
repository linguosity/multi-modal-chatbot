import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Story, StorySchema } from '@/lib/schemas/story';
import { nanoid } from 'nanoid';

// TODO: Replace with actual database once Supabase is integrated
const MOCK_STORIES: Record<string, Story> = {};

// Create a partial schema for story creation
const CreateStorySchema = StorySchema.partial().extend({
  title: z.string().min(1, "Title is required"),
  userId: z.string(),
  studentId: z.string(),
  narrativeLevel: StorySchema.shape.narrativeLevel,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    if (!body.story) {
      return NextResponse.json({ error: 'Story data is required' }, { status: 400 });
    }
    
    // Validate the story data against our schema
    const validatedStoryData = CreateStorySchema.parse(body.story);
    
    // Generate an ID for the new story
    const storyId = nanoid();
    
    // Create the story object with defaults for required fields
    const newStory: Story = {
      ...(validatedStoryData as Partial<Story>),
      id: storyId,
      narrative: validatedStoryData.narrative || '',
      languages: validatedStoryData.languages || ['English'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      version: 1,
    } as Story;
    
    // TODO: Replace with database insertion
    MOCK_STORIES[storyId] = newStory;
    
    return NextResponse.json({
      message: 'Story created successfully',
      story: newStory
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating story:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid story data',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}