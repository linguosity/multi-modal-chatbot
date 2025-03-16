'use server';

import { createStreamableValue } from 'ai/rsc';
import { CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Weather } from '@/components/weather';
import { generateText } from 'ai';
import { createStreamableUI } from 'ai/rsc';
import { ReactNode } from 'react';
import { z } from 'zod';
import { DEFAULT_SECTIONS, REPORT_SECTION_TYPES } from '@/lib/schemas/report';
import { openaiClient, getOpenAIConfig } from '@/lib/openai-config';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  display?: ReactNode;
}

// Streaming Chat 
export async function continueTextConversation(messages: CoreMessage[]) {
  try {
    const result = await streamText({
      model: openai('gpt-4-turbo', getOpenAIConfig()),
      messages,
      system: 'You are a helpful speech-language pathology assistant specializing in educational settings. You can help with report writing, activity suggestions, assessment guidance, and answering clinical questions based on evidence-based practices. Keep your responses professional and focused on educational speech-language services.',
      maxTokens: 1000,
    });

    const stream = createStreamableValue(result.textStream);
    return stream.value;
  } catch (error) {
    console.error("Error in AI text streaming:", error);
    if (error instanceof Error) {
      return `Error: ${error.message}. Please try again later.`;
    }
    return "An error occurred while generating the response. Please try again later.";
  }
}

// Gen UIs 
export async function continueConversation(history: Message[]) {
  const stream = createStreamableUI();

  const { text, toolResults } = await generateText({
    model: openai('gpt-3.5-turbo'),
    system: 'You are a friendly weather assistant!',
    messages: history,
    tools: {
      showWeather: {
        description: 'Show the weather for a given location.',
        parameters: z.object({
          city: z.string().describe('The city to show the weather for.'),
          unit: z
            .enum(['F'])
            .describe('The unit to display the temperature in'),
        }),
        execute: async ({ city, unit }) => {
          stream.done(<Weather city={city} unit={unit} />);
          return `Here's the weather for ${city}!`; 
        },
      },
    },
  });

  return {
    messages: [
      ...history,
      {
        role: 'assistant' as const,
        content:
          text || toolResults.map(toolResult => toolResult.result).join(),
        display: stream.value,
      },
    ],
  };
}

// Report Generation
export async function generateReportSection(
  sectionType: string, 
  studentInfo: any, 
  assessmentData: any = null
) {
  try {
    // Find the default section template
    const sectionTemplate = Object.values(DEFAULT_SECTIONS).find(
      section => section.sectionType === sectionType
    );
    
    if (!sectionTemplate) {
      console.error(`Section template not found for type: ${sectionType}`);
      return `Error: Template not found for ${sectionType}. Please contact support.`;
    }
    
    // Get the generation prompt from the template
    const prompt = sectionTemplate.generationPrompt;
    
    // Add context based on student info and assessment data
    let contextualPrompt = `${prompt}\n\nStudent Information:\n`;
    
    // Add available student information
    for (const [key, value] of Object.entries(studentInfo)) {
      if (value) {
        contextualPrompt += `${key}: ${value}\n`;
      }
    }
    
    // Add assessment data if available
    if (assessmentData) {
      contextualPrompt += `\nAssessment Data:\n`;
      for (const [key, value] of Object.entries(assessmentData)) {
        if (value) {
          contextualPrompt += `${key}: ${value}\n`;
        }
      }
    }
    
    const messages: CoreMessage[] = [
      { role: 'user', content: contextualPrompt }
    ];
    
    // Generate the content using OpenAI
    const result = await streamText({
      model: openai('gpt-4-turbo', getOpenAIConfig()),
      messages,
      system: 'You are a professional speech-language pathologist with expertise in writing educational evaluation reports. Your task is to generate a well-written, professional report section based on the provided student information and assessment data. Write in a clear, professional tone appropriate for educational documentation. Do not include placeholders or brackets in your response.',
      maxTokens: 1500,
      temperature: 0.7
    });
    
    const stream = createStreamableValue(result.textStream);
    return stream.value;
  } catch (error) {
    console.error("Error generating report section:", error);
    if (error instanceof Error) {
      return `Error: ${error.message}. Please try again or contact support if the problem persists.`;
    }
    return "An error occurred while generating the report section. Please try again later.";
  }
}

// Function to process report input and categorize it to appropriate sections
export async function processReportInput(input: string) {
  // Define the sections schema with detailed descriptions for each section
  const reportInputSchema = {
    type: "object",
    properties: {
      sections: {
        type: "object",
        properties: {
          parentConcern: {
            type: "string",
            description: "Information related to parent concerns about the student's communication"
          },
          pragmaticLanguage: {
            type: "string",
            description: "Information about the student's pragmatic/social language skills (eye contact, turn taking, etc.)"
          },
          receptiveLanguage: {
            type: "string",
            description: "Information about the student's receptive language abilities (understanding language)"
          },
          expressiveLanguage: {
            type: "string",
            description: "Information about the student's expressive language abilities (producing language)"
          },
          articulation: {
            type: "string",
            description: "Information about the student's articulation/phonology skills (speech sounds)"
          },
          fluency: {
            type: "string",
            description: "Information about the student's fluency/stuttering"
          },
          voice: {
            type: "string",
            description: "Information about the student's voice quality"
          },
          healthHistory: {
            type: "string",
            description: "Information about the student's health or developmental history"
          },
          educationalImpact: {
            type: "string",
            description: "Information about how communication affects education"
          },
          assessmentData: {
            type: "string",
            description: "Any assessment results or data points"
          },
          recommendations: {
            type: "string",
            description: "Recommendations for therapy or accommodations"
          },
          otherInfo: {
            type: "string",
            description: "Other information that doesn't fit the categories above"
          }
        },
        required: [
          "parentConcern", "pragmaticLanguage", "receptiveLanguage", "expressiveLanguage", 
          "articulation", "fluency", "voice", "healthHistory", "educationalImpact", 
          "assessmentData", "recommendations", "otherInfo"
        ],
        additionalProperties: false
      }
    },
    required: ["sections"],
    additionalProperties: false
  };

  try {
    // Use function calling to enforce the schema with a detailed system prompt
    const result = await generateText({
      model: openai('gpt-4o', getOpenAIConfig()),
      messages: [
        { 
          role: 'system', 
          content: `You are a speech-language pathologist with expertise in evaluating children with communication disorders. 
          Your task is to analyze the user's observation and categorize information into the appropriate speech-language report sections.
          
          GUIDELINES:
          - ANY mention of parent observations or concerns MUST be categorized under parentConcern
          - Information about eye contact, turn-taking, conversation skills, social skills MUST be categorized under pragmaticLanguage
          - Information about speech sound errors, articulation, phonological processes MUST be categorized under articulation
          - Information about understanding directions or comprehension MUST be categorized under receptiveLanguage
          - Information about sentence formation, vocabulary usage MUST be categorized under expressiveLanguage
          - For any section that is not applicable, return an empty string
          - Do NOT default to otherInfo - only use this if the information truly doesn't fit anywhere else

          EXAMPLES:
          - "Per parent report, Alex has difficulty maintaining eye contact" → parentConcern AND pragmaticLanguage
          - "Alex exhibited stopping, fronting and backing" → articulation
          - "He struggles with following multi-step directions" → receptiveLanguage
          
          Be thorough and analyze for clinical implications. If information could fit in multiple categories, include it in ALL relevant categories.`
        },
        { 
          role: 'user', 
          content: `User observation: "${input}"
          
          Analyze this input and determine which sections of the speech-language report need to be updated.
          Return a JSON object under "sections" with all the appropriate speech therapy report sections.
          If a section is not applicable, return an empty string for that key.`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "updateReportSections",
            description: "Analyzes user observation and returns structured updates for speech-language report sections",
            parameters: reportInputSchema
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "updateReportSections" } }
    });
    
    if (result.toolCalls && result.toolCalls.length > 0) {
      try {
        // Extract structured data from function arguments
        const functionArgs = JSON.parse(result.toolCalls[0].function.arguments);
        
        if (functionArgs.sections) {
          // Clean empty string values and filter out empty fields
          const categorizedData = Object.fromEntries(
            Object.entries(functionArgs.sections)
              .filter(([_, value]) => value && String(value).trim() !== "")
              .map(([key, value]) => [key, String(value).trim()])
          );
          
          return categorizedData;
        } else {
          console.warn("Function calling returned invalid structure - missing sections object");
          return { otherInfo: input };
        }
      } catch (parseError) {
        console.error("Error parsing function arguments:", parseError);
        return { otherInfo: input };
      }
    } else {
      console.warn("Function calling failed to categorize report input");
      return { otherInfo: input };
    }
  } catch (error) {
    console.error("Error categorizing report input:", error);
    return { otherInfo: input };
  }
}

// Function to process natural language input using function calling for structured output
export async function processSmartPrompt(prompt: string) {
  // Define the schema for the student information
  const studentInfoSchema = {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Student's full name"
      },
      dob: {
        type: "string",
        description: "Date of birth (any format)"
      },
      grade: {
        type: "string",
        description: "Current grade level (e.g., '1st', 'Kindergarten', etc.)"
      },
      school: {
        type: "string",
        description: "School name"
      },
      evaluator: {
        type: "string",
        description: "Name of evaluator or SLP (Speech-Language Pathologist)"
      },
      credentials: {
        type: "string",
        description: "Professional credentials (e.g., 'MS, CCC-SLP')"
      },
      evaluationDate: {
        type: "string",
        description: "Date of the evaluation (any format)"
      },
      diagnosis: {
        type: "string",
        description: "Any mentioned diagnosis or disorder"
      },
      gender: {
        type: "string",
        enum: ["male", "female", "neutral"],
        description: "Expected pronouns based on context clues"
      },
      parentInfo: {
        type: "string",
        description: "Any parent/guardian information"
      },
      referralInfo: {
        type: "string",
        description: "Referral source or reason for the evaluation"
      },
      assessmentInfo: {
        type: "string",
        description: "Any mentioned assessment names or results"
      }
    },
    required: ["name", "dob", "grade", "school", "evaluator", "credentials", "evaluationDate", 
               "diagnosis", "gender", "parentInfo", "referralInfo", "assessmentInfo"],
    additionalProperties: false
  };
  
  try {
    // Use function calling to enforce the schema
    const result = await generateText({
      model: openai('gpt-4o', getOpenAIConfig()), // Using the GPT-4o model that supports function calling
      messages: [
        { 
          role: 'system', 
          content: 'You are a speech-language pathology assistant that extracts student information from natural language input.'
        },
        { 
          role: 'user', 
          content: `Extract all the student information from this text: "${prompt}"`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_student_info",
            description: "Extracts structured student information from text input for speech and language reports",
            parameters: studentInfoSchema
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "extract_student_info" } }
    });
    
    if (result.toolCalls && result.toolCalls.length > 0) {
      // Extract structured data from function arguments
      const functionArgs = JSON.parse(result.toolCalls[0].function.arguments);
      
      // Clean empty string values to null for consistency
      const cleanedData = Object.fromEntries(
        Object.entries(functionArgs).map(([key, value]) => [
          key, 
          (value === "" || value === "N/A" || value === "None" || value === "Unknown") ? null : value
        ])
      );
      
      return cleanedData;
    } else {
      // Fallback to regex extraction if function calling fails
      console.warn("Function calling didn't return expected structure, falling back to regex");
      return extractDataWithRegex(prompt);
    }
  } catch (error) {
    console.error("Error using function calling for structured data:", error);
    // Fallback to regex extraction
    return extractDataWithRegex(prompt);
  }
}

// Fallback regex extraction function
function extractDataWithRegex(prompt: string) {
  const data: any = {};
  
  // Extract student name
  const studentMatch = prompt.match(/student:?\s*([^,\.]+)/i);
  if (studentMatch && studentMatch[1].trim()) {
    data.name = studentMatch[1].trim();
  }
  
  // Extract date of birth
  const dobMatch = prompt.match(/dob:?\s*([^,\.]+)/i) || prompt.match(/birth(?:day|date)?:?\s*([^,\.]+)/i);
  if (dobMatch && dobMatch[1].trim()) {
    data.dob = dobMatch[1].trim();
  }
  
  // Extract grade
  const gradeMatch = prompt.match(/grade:?\s*([^,\.]+)/i);
  if (gradeMatch && gradeMatch[1].trim()) {
    data.grade = gradeMatch[1].trim();
  }
  
  // Extract school
  const schoolMatch = prompt.match(/school:?\s*([^,\.]+)/i);
  if (schoolMatch && schoolMatch[1].trim()) {
    data.school = schoolMatch[1].trim();
  }
  
  // Extract evaluator
  const evaluatorMatch = prompt.match(/evaluator:?\s*([^,\.]+)/i) || prompt.match(/slp:?\s*([^,\.]+)/i);
  if (evaluatorMatch && evaluatorMatch[1].trim()) {
    data.evaluator = evaluatorMatch[1].trim();
  }
  
  // Extract evaluation date
  const dateMatch = prompt.match(/(?:evaluation|assessment|test(?:ing)?) date:?\s*([^,\.]+)/i);
  if (dateMatch && dateMatch[1].trim()) {
    data.evaluationDate = dateMatch[1].trim();
  }
  
  // Extract diagnosis
  const diagnosisMatch = prompt.match(/diagnosis:?\s*([^,\.]+)/i);
  if (diagnosisMatch && diagnosisMatch[1].trim()) {
    data.diagnosis = diagnosisMatch[1].trim();
  }
  
  // Determine gender/pronouns from context
  if (/\b(he|him|his)\b/i.test(prompt)) {
    data.gender = 'male';
  } else if (/\b(she|her)\b/i.test(prompt)) {
    data.gender = 'female';
  } else {
    data.gender = 'neutral';
  }
  
  return data;
}

// Utils
export async function checkAIAvailability() {
  try {
    const envVarExists = !!process.env.OPENAI_API_KEY;
    if (!envVarExists) {
      console.error("OpenAI API key is not set in environment variables");
      return false;
    }
    
    // Additional validation for project-based API keys
    const apiKey = process.env.OPENAI_API_KEY || "";
    if (apiKey.startsWith('sk-proj-') && !process.env.OPENAI_ORG_ID) {
      console.warn("Using project-based API key without organization ID");
    }
    
    return true;
  } catch (error) {
    console.error("Error checking AI availability:", error);
    return false;
  }
}