import { NextRequest, NextResponse } from 'next/server';
import { openaiClient, DEFAULT_IMAGE_OPTIONS, ImageGenerationOptions } from '@/lib/openai-config';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the prompt
    if (!body.prompt) {
      return NextResponse.json(
        { error: 'Missing prompt in request body' },
        { status: 400 }
      );
    }

    // Merge default options with provided options
    const options: ImageGenerationOptions = {
      ...DEFAULT_IMAGE_OPTIONS,
      prompt: body.prompt,
      ...(body.model && { model: body.model }),
      ...(body.size && { size: body.size }),
      ...(body.quality && { quality: body.quality }),
      ...(body.style && { style: body.style }),
      ...(body.n && { n: body.n })
    };

    // Generate the image using OpenAI
    const response = await openaiClient.images.generate({
      model: options.model,
      prompt: options.prompt,
      n: options.n,
      size: options.size,
      quality: options.quality,
      style: options.style
    });

    // Return the image URL(s)
    return NextResponse.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error generating image with OpenAI:', error);
    
    // Determine if it's an API error with status code
    const apiError = error as any;
    const statusCode = apiError.status || 500;
    const errorMessage = apiError.message || 'Unknown error occurred while generating image';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: statusCode }
    );
  }
}