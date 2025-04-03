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

// Narrative generation options
export interface NarrativeGenerationOptions {
  narrativeLevel: 'heaps' | 'sequences' | 'primitive_narratives' | 'chain_narratives' | 'focused_chains' | 'true_narratives';
  targetVocabulary?: string[];
  targetGrammar?: string;
  studentAge?: number;
  studentName?: string;
  includeBarrettQuestions?: boolean;
  includePreReadingActivities?: boolean;
  generateImages?: boolean;
  consistentImageStyle?: boolean;
  storyGrammar?: {
    setting?: string;
    characters?: string;
    problem?: string;
    attempts?: string;
    resolution?: string;
    theme?: string;
  };
}

// Barrett's Taxonomy of Reading Comprehension levels description
const BARRETTS_TAXONOMY_DESCRIPTION = `
Barrett's Taxonomy of Reading Comprehension includes five levels:
1. Literal Comprehension: Recognizing and recalling explicit information from the text.
2. Reorganization: Organizing or ordering information explicitly stated in the text.
3. Inferential Comprehension: Using information explicitly stated to hypothesize about unstated information.
4. Evaluation: Making judgments about the content of the text based on external criteria or internal evidence.
5. Appreciation: Emotional response to the text, identification with characters, sensitivity to style, and imagery.
`;

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

/**
 * Generates a narrative based on specified vocabulary and developmental level
 */
export async function generateNarrative({
  narrativeLevel,
  targetVocabulary = [],
  targetGrammar,
  studentAge = 8,
  studentName = "",
  includeBarrettQuestions = true,
  includePreReadingActivities = true,
  generateImages = false,
  consistentImageStyle = true,
  storyGrammar = {}
}: NarrativeGenerationOptions): Promise<{
  narrative: string;
  vocabulary?: Array<{word: string, definition: string, exampleSentence: string}>;
  preReadingActivities?: string;
  comprehensionQuestions?: Array<{question: string, level: string, sampleAnswer: string}>;
  imagePrompts?: Array<{description: string, sceneContext: string}>;
  grammarExamples?: Array<{sentence: string, explanation: string}>;
}> {
  try {
    // Determine appropriate narrative complexity based on narrative level
    const narrativeDescriptions = {
      heaps: "Simple collection of unrelated ideas with no plot or organization (2-3 years development level)",
      sequences: "Related events around a central topic but lacking causal relationships, may include temporal order (3 years development level)",
      primitive_narratives: "Has a central person, object, or event with actions and feelings, but no clear cause/effect (4 years development level)",
      chain_narratives: "Events linked by cause and effect or time, but no clear goal-directed behavior (5 years development level)",
      focused_chains: "Events revolve around a problem and a goal, may have a basic plan but lacks full resolution (5-6 years development level)",
      true_narratives: "Complete story with all essential elements: setting, characters, problem, plan, actions, outcome, resolution (6-7+ years development level)"
    };

    // Prepare system prompt for narrative generation
    let systemPrompt = `
      You are a speech-language pathologist assistant specialized in creating developmentally appropriate narratives for children.
      
      I need you to generate a narrative story for a ${studentAge}-year-old${studentName ? ` named ${studentName}` : ''} at the "${narrativeLevel}" developmental level, which means: ${narrativeDescriptions[narrativeLevel]}
    `;

    // Add target vocabulary or grammar feature to the prompt
    if (targetVocabulary && targetVocabulary.length > 0) {
      systemPrompt += `
      
      The narrative must incorporate the following target vocabulary words:
      ${targetVocabulary.join(', ')}
      
      Please highlight each target vocabulary word in the narrative by placing it within <mark></mark> tags.
      
      For each target vocabulary word, please provide:
      1. A child-friendly definition
      2. An example sentence showing the word in context (different from how it's used in the narrative)
      `;
    } else if (targetGrammar) {
      systemPrompt += `
      
      The narrative must emphasize the following grammar feature: ${targetGrammar.replace('_', ' ')}
      
      Please highlight examples of this grammar feature in the narrative by placing them within <mark></mark> tags.
      
      Also provide 5-7 example sentences using this grammar feature with brief explanations of how the feature is used in each sentence.
      `;
    }

    // Add story grammar elements for true narratives
    if (narrativeLevel === 'true_narratives' && Object.keys(storyGrammar).length > 0) {
      systemPrompt += `
      
      Please incorporate the following story elements in your narrative:
      ${Object.entries(storyGrammar)
        .filter(([_, value]) => value && value.trim() !== '')
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n')}
      `;
    }

    // Add other requested elements
    if (includePreReadingActivities) {
      systemPrompt += `
      
      Also include 3-5 pre-reading activities that will prepare students for the narrative, such as:
      - Picture walk suggestions
      - Vocabulary preview activities
      - Prediction exercises
      - Background knowledge activation
      `;
    }

    if (includeBarrettQuestions) {
      systemPrompt += `
      
      ${BARRETTS_TAXONOMY_DESCRIPTION}
      
      Please include 1-2 comprehension questions for each level of Barrett's Taxonomy, with sample answers for each.
      `;
    }

    // Add image generation instructions if requested
    if (generateImages) {
      systemPrompt += `
      
      Additionally, provide 3-5 image generation prompts that would illustrate key scenes from the narrative.
      For each image prompt, include:
      1. A detailed description for DALL-E to generate the image
      2. The context of the scene in the story
      
      ${consistentImageStyle ? 'Very important: Ensure that characters and settings maintain consistent appearance across all image prompts. Describe the character designs and settings in detail to maintain consistency.' : ''}
      `;
    }

    systemPrompt += `
    
    Return your response in a structured format with separate sections for the narrative, ${targetVocabulary && targetVocabulary.length > 0 ? 'vocabulary definitions' : 'grammar examples'}, ${includePreReadingActivities ? 'pre-reading activities,' : ''} ${includeBarrettQuestions ? 'comprehension questions,' : ''} ${generateImages ? 'and image prompts.' : '.'}
    `;

    // In a real implementation, you would make an API call to Claude here
    // For this example, we'll mock a response based on the parameters

    // Sample vocabulary definitions for target vocabulary approach
    const vocabularyDefinitions = targetVocabulary && targetVocabulary.length > 0 
      ? targetVocabulary.map(word => {
          const mockDefinitions: Record<string, {definition: string, example: string}> = {
            "adventure": {
              definition: "An exciting experience that might be a little dangerous or take you to new places",
              example: "Going camping in the mountains was quite an adventure for the family."
            },
            "forest": {
              definition: "A large area covered with trees and plants",
              example: "We took a hike through the forest and saw many different animals."
            },
            "discover": {
              definition: "To find something for the first time or learn something new",
              example: "The scientists were excited to discover a new type of butterfly."
            },
            "curious": {
              definition: "Wanting to know or learn about something",
              example: "The curious puppy sniffed everything in the new house."
            },
            "treasure": {
              definition: "Something valuable or precious like gold or jewels",
              example: "The pirates buried their treasure on a deserted island."
            }
          };
          
          return {
            word,
            definition: mockDefinitions[word]?.definition || `A word that means ${word}`,
            exampleSentence: mockDefinitions[word]?.example || `Here is an example using the word ${word}.`
          };
        })
      : undefined;

    // Sample grammar examples for target grammar approach
    const grammarExamples = targetGrammar
      ? [
          {
            sentence: "Yesterday, I walked to the store and bought some groceries.",
            explanation: "Uses regular past tense verb 'walked' with -ed ending and irregular past tense 'bought'."
          },
          {
            sentence: "Last week, she saw a movie that she really enjoyed.",
            explanation: "Uses irregular past tense verbs 'saw' and 'enjoyed' to describe completed actions."
          },
          {
            sentence: "The children played in the park until it started to rain.",
            explanation: "Uses regular past tense 'played' and 'started' to describe sequence of events."
          },
          {
            sentence: "They built a sandcastle that was taller than anyone expected.",
            explanation: "Uses irregular past tense 'built' and 'was' for describing past creation and state."
          },
          {
            sentence: "When I arrived, the party had already ended.",
            explanation: "Uses past perfect 'had ended' to show an action completed before another past action."
          }
        ]
      : undefined;

    // Sample narrative based on level, vocabulary/grammar, and story grammar elements
    let mockNarrative = "";
    
    switch(narrativeLevel) {
      case 'sequences':
        mockNarrative = `<p>We went to the <mark>forest</mark>. We had an <mark>adventure</mark>. I was <mark>curious</mark>. I <mark>discovered</mark> a box. The box had <mark>treasure</mark>. We went home. We ate dinner.</p>`;
        break;
      case 'primitive_narratives':
        mockNarrative = `<p>Jamie went to the <mark>forest</mark>. Jamie was <mark>curious</mark> about the sounds. Jamie had an <mark>adventure</mark> with a squirrel. Jamie <mark>discovered</mark> a shiny rock. The rock was like a <mark>treasure</mark>. Jamie was happy.</p>`;
        break;
      case 'chain_narratives':
        mockNarrative = `<p>Ana went on an <mark>adventure</mark> to the <mark>forest</mark>. She was <mark>curious</mark> about the old tree. She looked inside a hole in the tree. She <mark>discovered</mark> a box. The box had a <mark>treasure</mark> inside. It was a pretty rock. Ana was happy to find it.</p>`;
        break;
      case 'focused_chains':
        mockNarrative = `<p>Max wanted to have an <mark>adventure</mark> in the <mark>forest</mark> near his house. He was <mark>curious</mark> about what was behind the big rock. He climbed over the rock and <mark>discovered</mark> a hidden path. Max followed the path to see where it led. He found an old tree with a hole in it. Inside was a small box. The box had a <mark>treasure</mark> inside. It was an old coin. Max tried to find the owner but couldn't.</p>`;
        break;
      case 'true_narratives':
        if (Object.keys(storyGrammar).length > 0) {
          // Incorporate story grammar elements if provided
          const setting = storyGrammar.setting || "a magical forest";
          const characters = storyGrammar.characters || "a young explorer named Lily";
          const problem = storyGrammar.problem || "a hidden treasure";
          const attempts = storyGrammar.attempts || "following a map and asking for help";
          const resolution = storyGrammar.resolution || "finding the treasure and sharing it";

          mockNarrative = `<p>Once upon a time, in ${setting}, there was ${characters}. On a bright sunny morning, they set out on an <mark>adventure</mark> through the winding paths of the <mark>forest</mark>. They were very <mark>curious</mark> about finding ${problem}.</p>
          
          <p>"I wonder what I'll find today," they said with excitement. As they walked deeper into the forest, they noticed something unusual—a strange marking on an old tree. They decided to investigate by ${attempts}.</p>
          
          <p>After searching for hours, they finally <mark>discovered</mark> what they had been looking for. Hidden beneath some fallen leaves was a small wooden box. Inside was a magnificent <mark>treasure</mark> that sparkled in the sunlight.</p>
          
          <p>The adventure ended with ${resolution}. They returned home, tired but happy, knowing that their curiosity and perseverance had led them to something special. From that day on, they would always remember their wonderful discovery in the forest.</p>`;
        } else {
          mockNarrative = `<p>Once upon a time, there was a girl named Lily who loved <mark>adventures</mark>. One sunny Saturday morning, she decided to explore the <mark>forest</mark> behind her grandparents' house. Lily had always been <mark>curious</mark> about what might be hidden among the tall trees and winding paths.</p>
          
          <p>"I'm going to explore today," Lily told her grandmother. "I'll be careful and stay on the main path." Her grandmother gave her a small backpack with water and snacks for her journey.</p>
          
          <p>As Lily walked deeper into the <mark>forest</mark>, she noticed something unusual—a bright blue feather on the ground. Her <mark>curious</mark> nature made her wonder what kind of bird it came from. She decided to follow the trail of feathers that seemed to lead off the main path. That's when she <mark>discovered</mark> a small clearing she had never seen before.</p>
          
          <p>In the middle of the clearing stood an old oak tree with a hollow at its base. Lily carefully peeked inside and gasped. There was a bird's nest with a beautiful blue egg! This was better than any <mark>treasure</mark> she could have imagined. Lily knew this was a special <mark>discovery</mark>, but she also knew not to disturb the nest. She quietly backed away, marking the path in her mind so she could tell her grandparents about this amazing <mark>adventure</mark>. Sometimes the best treasures aren't gold or jewels, but the wonders of nature waiting to be discovered by those <mark>curious</mark> enough to look.</p>`;
        }
        break;
      default:
        mockNarrative = `<p>Please select a narrative level.</p>`;
    }

    // If using target grammar instead of vocabulary, create a different narrative with grammar examples
    if (targetGrammar) {
      switch(targetGrammar) {
        case 'past_tense':
          mockNarrative = `<p>Yesterday, Max <mark>visited</mark> his grandmother. She <mark>lived</mark> in a small cottage near the forest. Max <mark>brought</mark> her some cookies that his mother <mark>baked</mark>. His grandmother <mark>smiled</mark> when she <mark>saw</mark> him at the door.</p>
          
          <p>They <mark>spent</mark> the afternoon together. Grandmother <mark>told</mark> stories about when she <mark>was</mark> young. Max <mark>listened</mark> carefully to every word. They <mark>walked</mark> in the garden and <mark>picked</mark> some flowers.</p>
          
          <p>Before he <mark>left</mark>, Grandmother <mark>gave</mark> Max a small wooden box. "This <mark>belonged</mark> to your grandfather," she <mark>said</mark>. Max <mark>opened</mark> it carefully and <mark>found</mark> a shiny silver compass inside. He <mark>thanked</mark> his grandmother with a big hug.</p>
          
          <p>On his way home, Max <mark>used</mark> the compass to guide him. He <mark>felt</mark> very grown-up and special. When he <mark>arrived</mark> home, he <mark>showed</mark> everyone his special gift. His parents <mark>were</mark> happy that he <mark>had</mark> such a wonderful time.</p>`;
          break;
        case 'present_tense':
          // Similar mock narratives would be generated for other grammar targets
          mockNarrative = `<p>Max <mark>visits</mark> his grandmother every Sunday. She <mark>lives</mark> in a small cottage near the forest. Max <mark>brings</mark> her cookies that his mother <mark>bakes</mark>. His grandmother always <mark>smiles</mark> when she <mark>sees</mark> him at the door.</p>
          
          <p>They <mark>spend</mark> the afternoon together. Grandmother <mark>tells</mark> stories about when she <mark>is</mark> young. Max <mark>listens</mark> carefully to every word. They <mark>walk</mark> in the garden and <mark>pick</mark> some flowers.</p>
          
          <p>Before he <mark>leaves</mark>, Grandmother often <mark>gives</mark> Max a small gift. "This <mark>belongs</mark> to you now," she <mark>says</mark>. Max <mark>opens</mark> it carefully and <mark>finds</mark> something special inside. He <mark>thanks</mark> his grandmother with a big hug.</p>
          
          <p>On his way home, Max <mark>uses</mark> his imagination to create adventures. He <mark>feels</mark> very grown-up and special. When he <mark>arrives</mark> home, he <mark>shows</mark> everyone his special gift. His parents <mark>are</mark> happy that he <mark>has</mark> such a wonderful time.</p>`;
          break;
        default:
          mockNarrative = `<p>Narrative with ${targetGrammar.replace('_', ' ')} examples would be generated here.</p>`;
      }
    }

    // Sample pre-reading activities
    const preReadingActivities = includePreReadingActivities ? `
      ### Pre-Reading Activities
      
      #### Picture Walk
      Look at the illustrations in the story together. Ask questions like:
      - What do you see in this picture?
      - What do you think might happen in this story?
      - How do you think the character feels?
      
      #### Vocabulary Preview
      Before reading, introduce these target words with simple definitions and actions:
      - Adventure: Act out going on an adventure with a backpack
      - Forest: Pretend to walk through trees and hear forest sounds
      - Curious: Make a curious face with raised eyebrows and finger on chin
      - Discover: Act out finding something exciting
      - Treasure: Pretend to open a treasure chest
      
      #### Prediction Chart
      Create a simple chart with "What might happen in the story?" and have students draw or write their predictions.
      
      #### Personal Connection
      Ask students: "Have you ever found something interesting outside? Tell me about what you discovered."
    ` : undefined;

    // Sample comprehension questions based on Barrett's Taxonomy
    const comprehensionQuestions = includeBarrettQuestions ? [
      {
        question: "Where did the main character go on their adventure?",
        level: "literal",
        sampleAnswer: "The main character went to the forest."
      },
      {
        question: "What did the main character find in the story?",
        level: "literal",
        sampleAnswer: "The main character found a treasure/special object."
      },
      {
        question: "What happened first, second, and last in the story?",
        level: "reorganization",
        sampleAnswer: "First, the character went to the forest. Second, they discovered something interesting. Last, they found a treasure."
      },
      {
        question: "Why was the main character curious about the forest?",
        level: "inferential",
        sampleAnswer: "The main character was probably curious because they wondered what interesting things might be hidden in the forest."
      },
      {
        question: "How do you think the main character felt when they discovered the treasure?",
        level: "inferential",
        sampleAnswer: "They probably felt excited and happy to find something special."
      },
      {
        question: "Was it a good idea for the character to go into the forest alone? Why or why not?",
        level: "evaluation",
        sampleAnswer: "Answers will vary. Students might say it wasn't safe to go alone, or that the character was prepared and careful."
      },
      {
        question: "If you found the same treasure as the character, what would you do with it?",
        level: "appreciation",
        sampleAnswer: "Answers will vary based on personal preference."
      }
    ] : undefined;

    // Sample image prompts for narrative illustration
    // Ensure consistency in character and setting descriptions for all images
    const imagePrompts = generateImages ? (() => {
      const characterDescription = studentName ? 
        `a child named ${studentName}` : 
        "a young child with a curious expression";
      
      const settingDescription = storyGrammar.setting || "a forest with tall trees";
      
      return [
        {
          description: `${characterDescription} standing at the edge of ${settingDescription}. The scene is bright, colorful, and inviting, suitable for a children's book illustration with soft lighting filtering through the leaves. The child is wearing a red t-shirt and blue pants with a small backpack.`,
          sceneContext: "The beginning of the story when the main character is about to enter the forest for their adventure."
        },
        {
          description: `A detailed close-up of ${characterDescription} (in the same red t-shirt and blue pants) discovering something interesting on the forest floor in ${settingDescription}. The child is kneeling down with an expression of wonder, surrounded by forest vegetation, mushrooms, and wildflowers. The same soft, dappled lighting filters through the tree canopy as in the first image.`,
          sceneContext: "The middle of the story when the character discovers something unusual and decides to investigate."
        },
        {
          description: `${characterDescription} (still in the same red t-shirt and blue pants) in a magical clearing within ${settingDescription}. There's an ancient oak tree at the center with a small hollow at its base glowing with a subtle light. The child is carefully peeking into the hollow with a look of amazement. The scene has the same lighting and artistic style as the previous images, maintaining visual consistency.`,
          sceneContext: "The climax of the story when the character discovers the treasure or special object."
        },
        {
          description: `${characterDescription} (in the same outfit) returning home from ${settingDescription} with a happy expression, holding or carrying their discovery. The path leads from the forest to a small house in the distance. The same visual style and lighting as the previous images, maintaining consistency in the character's appearance and the overall scene.`,
          sceneContext: "The resolution of the story when the character returns home after their adventure."
        }
      ];
    })() : undefined;

    // Return mock response with all requested elements
    const response: any = {
      narrative: mockNarrative,
      preReadingActivities: preReadingActivities,
      comprehensionQuestions: comprehensionQuestions,
      imagePrompts: imagePrompts,
    };

    // Add either vocabulary definitions or grammar examples based on what was targeted
    if (targetVocabulary && targetVocabulary.length > 0) {
      response.vocabulary = vocabularyDefinitions;
    } else if (targetGrammar) {
      response.grammarExamples = grammarExamples;
    }

    return response;
  } catch (error) {
    console.error('Error generating narrative:', error);
    throw error;
  }
}