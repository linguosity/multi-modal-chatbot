import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { NARRATIVE_LEVELS } from '@/lib/schemas/story';

// Schema for the narrative generation request
const GenerateNarrativeRequestSchema = z.object({
  narrativeLevel: z.enum([
    NARRATIVE_LEVELS.SEQUENCES,
    NARRATIVE_LEVELS.PRIMITIVE_NARRATIVES,
    NARRATIVE_LEVELS.CHAIN_NARRATIVES,
    NARRATIVE_LEVELS.FOCUSED_CHAINS,
    NARRATIVE_LEVELS.TRUE_NARRATIVES
  ]),
  studentAge: z.number().int().optional(),
  studentName: z.string().optional(),
  targetVocabulary: z.array(z.string()).optional(),
  targetWordList: z.array(z.string()).optional(),
  languages: z.array(z.string()).default(['English']),
  dialect: z.string().optional(),
  gradeLevel: z.union([z.string(), z.number()]).optional(),
  includePreReadingActivities: z.boolean().default(true),
  includeBarrettQuestions: z.boolean().default(true),
  generateImages: z.boolean().default(false),
  stream: z.boolean().default(false), // Whether to stream the response
});

export async function POST(request: NextRequest) {
  try {
    // Use ReadableStream to implement streaming
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();
    
    // Get and validate request body
    const body = await request.json();
    const validatedData = GenerateNarrativeRequestSchema.parse(body);
    
    // Check if we should stream the response
    if (validatedData.stream) {
      // Start the stream
      const responseStream = streamNarrativeGeneration(validatedData, writer);
      
      // Return the stream
      return new NextResponse(transformStream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Generate the narrative synchronously
      const narrative = await generateNarrative(validatedData);
      return NextResponse.json(narrative);
    }
  } catch (error) {
    console.error('Error generating narrative:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Function to stream the narrative generation
async function streamNarrativeGeneration(params: z.infer<typeof GenerateNarrativeRequestSchema>, writer: WritableStreamDefaultWriter) {
  try {
    // Mock delay for demonstration
    const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Send the start event
    await writer.write(
      `data: ${JSON.stringify({ type: "message_start", message: { id: "msg_" + Date.now() } })}\n\n`
    );
    
    await mockDelay(500);
    
    // Sample narrative content for demonstration
    const narrativeChunks = [
      "Once upon a time ",
      "in a small village ",
      "there lived a young ",
      "boy named ",
      params.studentName || "Alex",
      ". He loved to ",
      "explore the ",
      "nearby forest ",
      "with his dog."
    ];
    
    // Start content block
    await writer.write(
      `data: ${JSON.stringify({ type: "content_block_start", content_block: { id: "block_" + Date.now(), type: "text" } })}\n\n`
    );
    
    // Send content deltas
    for (const chunk of narrativeChunks) {
      await mockDelay(500);
      await writer.write(
        `data: ${JSON.stringify({ type: "content_block_delta", delta: { text: chunk } })}\n\n`
      );
    }
    
    // End content block
    await writer.write(
      `data: ${JSON.stringify({ type: "content_block_stop" })}\n\n`
    );
    
    // Message delta with stop reason
    await writer.write(
      `data: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "end_turn" } })}\n\n`
    );
    
    // Message stop
    await writer.write(
      `data: ${JSON.stringify({ type: "message_stop" })}\n\n`
    );
    
    // Close the stream
    await writer.close();
  } catch (error) {
    console.error('Error in streaming narrative:', error);
    
    // Send error event
    await writer.write(
      `data: ${JSON.stringify({ type: "error", error: "Generation failed" })}\n\n`
    );
    
    // Close the stream
    await writer.close();
  }
}

// Function to generate the narrative synchronously
async function generateNarrative(params: z.infer<typeof GenerateNarrativeRequestSchema>) {
  // TODO: Replace with actual API call to Claude or other AI provider
  
  // Mock delay for demonstration
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Sample response structure
  return {
    narrative: `<p>Once upon a time in a small village there lived a young boy named ${params.studentName || 'Alex'}. He loved to explore the nearby forest with his dog.</p>`,
    preReadingActivities: params.includePreReadingActivities ?
      '<h3>Preview</h3><p>Look at the pictures and predict what the story will be about.</p>' : undefined,
    vocabulary: params.targetVocabulary?.map(word => ({
      word,
      definition: `Definition for ${word}`,
      exampleSentence: `Example sentence using ${word}.`
    })),
    comprehensionQuestions: params.includeBarrettQuestions ? [
      {
        question: "Who is the main character in the story?",
        level: "literal",
        sampleAnswer: `The main character is ${params.studentName || 'Alex'}.`
      },
      {
        question: "Why do you think he likes to explore the forest?",
        level: "inferential",
        sampleAnswer: "He probably likes adventure and nature."
      }
    ] : undefined,
    images: params.generateImages ? [
      {
        url: "https://placeholder.com/400",
        context: "A boy exploring the forest"
      }
    ] : undefined,
    metadata: {
      wordCount: 20,
      readabilityLevel: params.studentAge ? `${params.studentAge} years` : "8 years",
      narrativeLevel: params.narrativeLevel
    }
  };
}