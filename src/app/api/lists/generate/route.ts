import { NextRequest, NextResponse } from 'next/server';
import type { WordList } from '@/lib/schemas/wordlist';

// This route handles Claude Batch API calls to generate word lists
export async function POST(req: NextRequest) {
  try {
    const { 
      targetSound, 
      wordPosition, 
      maxSyllables, 
      excludedSounds, 
      studentAge = '8' 
    } = await req.json();
    
    // Validate required parameters
    if (!targetSound || !wordPosition || !maxSyllables) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Format the excluded sounds for the prompt
    const excludedSoundsText = excludedSounds?.length > 0 
      ? `and exclude the following sounds: ${excludedSounds.join(', ')}` 
      : '';
    
    // Construct the Claude Batch API request for generating words
    // In a real implementation, this would use the Anthropic client
    
    // For now, mock a successful response
    const mockResponse = {
      realWords: [
        "sun", "sit", "soap", "say", "six", "sand", "saw", "sip", "sell", "sick",
        "safe", "same", "sad", "sail", "salt", "sock", "soft", "soup", "seed", "seat"
      ],
      nonsenseWords: [
        "seb", "sig", "sop", "sut", "sek", "siv", "som", "saf", "sut", "sym"
      ],
      phrases: [
        "six sunny days",
        "sad sick sailor",
        "silver sand castle",
        "soft silk scarf",
        "second summer sunset"
      ],
      sentences: [
        "Sam saw six seals swimming.",
        "Sally sells seashells by the seashore.",
        "The student solved several science problems.",
        "Seven sisters sat silently.",
        "Susan sang songs at the celebration."
      ],
      narrative: `<p>Once upon a time, there was a <mark>silly</mark> <mark>snake</mark> named <mark>Sam</mark>. <mark>Sam</mark> loved to <mark>slither</mark> through the <mark>sand</mark> on <mark>sunny</mark> days. One day, <mark>Sam</mark> <mark>spotted</mark> a <mark>sparkling</mark> <mark>stone</mark> in the <mark>soil</mark>.</p>
      
      <p>"What a <mark>surprising</mark> <mark>sight</mark>!" <mark>said</mark> <mark>Sam</mark>. He <mark>slowly</mark> <mark>slid</mark> toward the <mark>shiny</mark> object. When he got closer, he <mark>saw</mark> it was a <mark>special</mark> <mark>silver</mark> key.</p>
      
      <p><mark>Sam</mark> decided to <mark>search</mark> for what the key might open. He <mark>slithered</mark> through the <mark>soft</mark> grass, past a <mark>small</mark> pond, and up a <mark>steep</mark> hill. At the top, he found a <mark>strange</mark> little box with a <mark>silver</mark> lock.</p>
      
      <p>When <mark>Sam</mark> used the key, the box opened to reveal a <mark>stunning</mark> map leading to a <mark>secret</mark> garden filled with the <mark>sweetest</mark> berries a <mark>snake</mark> could ever taste. From that day on, <mark>Sam</mark> would <mark>smile</mark> whenever he thought about his <mark>special</mark> discovery.</p>`
    };
    
    // Return the mocked response
    return NextResponse.json({ 
      success: true, 
      data: mockResponse 
    });
    
  } catch (error) {
    console.error('Error generating word list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}