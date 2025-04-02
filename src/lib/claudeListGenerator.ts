import { WordList } from '@/lib/schemas/wordlist';

// Types for Claude batch API interaction
interface ClaudeBatchRequest {
  model: string;
  system: string;
  messages: ClaudeMessage[];
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeBatchResponse {
  words: string[];
  nonsenseWords: string[];
  phrases: string[];
  sentences: string[];
  narrative: string;
}

/**
 * Generates word lists using Claude Batch API
 */
export async function generateWordList({
  targetSound,
  wordPosition,
  maxSyllables,
  excludedSounds = [],
  studentAge = 8,
  studentName = ""
}: {
  targetSound: string;
  wordPosition: string;
  maxSyllables: number;
  excludedSounds?: string[];
  studentAge?: number;
  studentName?: string;
}): Promise<Partial<WordList>> {
  try {
    // Construct the Claude system prompt
    const systemPrompt = `
      You are a speech-language pathologist assistant specialized in creating targeted articulation word lists.
      
      I need you to generate the following for a ${studentAge}-year-old child targeting the sound "${targetSound}" in the ${wordPosition} position:
      
      1. A list of 20 real words with a maximum of ${maxSyllables} syllables
      2. A list of 10 nonsense words that follow English phonotactic rules
      3. 5 short phrases containing the target words
      4. 5 sentences containing the target words
      5. A 4-paragraph narrative story that incorporates multiple target words
      
      ${excludedSounds.length > 0 ? `Please exclude the following sounds: ${excludedSounds.join(', ')}` : ''}
      
      In the narrative, place the words containing the target sound within <mark></mark> tags to highlight them.
      
      Return your response as a JSON object with these keys: words, nonsenseWords, phrases, sentences, narrative.
    `;

    // In a real implementation, you would make an API call to Claude here
    // For this example, we'll mock a response

    // Mock response based on target sound
    const mockResponses: Record<string, ClaudeBatchResponse> = {
      '/s/': {
        words: [
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
      },
      '/r/': {
        words: [
          "red", "run", "road", "rain", "read", "room", "rock", "rug", "rice", "rope",
          "right", "write", "radio", "robot", "race", "round", "rabbit", "ring", "rose", "river"
        ],
        nonsenseWords: [
          "rab", "rin", "rop", "rut", "rek", "riv", "rom", "raf", "rut", "rym"
        ],
        phrases: [
          "red racing car",
          "running rabbit fast",
          "rough rocky road",
          "round rubber ball",
          "royal ruby ring"
        ],
        sentences: [
          "The rabbit ran around the rocky road.",
          "Ryan wrote a report about racing cars.",
          "The river runs through the rural region.",
          "Rachel read her favorite rainbow story.",
          "The robot rolled right across the room."
        ],
        narrative: `<p>Once there was a little <mark>rabbit</mark> named <mark>Ruby</mark>. <mark>Ruby</mark> loved to <mark>run</mark> through the forest and play near the <mark>river</mark>. One <mark>rainy</mark> day, <mark>Ruby</mark> found a <mark>red</mark> umbrella leaning against a <mark>rock</mark>.</p>
        
        <p>"I wonder who left this here," <mark>Ruby</mark> said with curiosity. The <mark>rain</mark> was falling hard, making little <mark>ripples</mark> in puddles all around. <mark>Ruby</mark> decided to use the umbrella to stay dry as she <mark>raced</mark> back home along the <mark>rocky</mark> path.</p>
        
        <p>On her way, <mark>Ruby</mark> met a <mark>robot</mark> who was getting all wet in the <mark>rain</mark>. "Would you like to share my umbrella?" <mark>Ruby</mark> asked kindly. The <mark>robot</mark>, whose name was <mark>Rex</mark>, was very grateful. Together they walked down the <mark>road</mark>, talking about their favorite things.</p>
        
        <p><mark>Ruby</mark> and <mark>Rex</mark> became good friends after that <mark>rainy</mark> day. They would often meet by the <mark>river</mark>, skip <mark>rocks</mark>, and <mark>read</mark> stories together. Sometimes they would just sit quietly and watch the <mark>rainbows</mark> that appeared after the <mark>rain</mark>, making the whole forest glow with beautiful colors.</p>`
      }
    };

    // Get response based on target sound or use /s/ as default
    const response = mockResponses[targetSound] || mockResponses['/s/'];

    // In a real implementation, return the data from the Claude API response
    return {
      realWords: response.words,
      nonsenseWords: response.nonsenseWords,
      phrases: response.phrases,
      sentences: response.sentences,
      narrative: response.narrative,
    };
  } catch (error) {
    console.error('Error generating word list:', error);
    throw error;
  }
}