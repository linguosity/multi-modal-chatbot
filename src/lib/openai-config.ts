import { OpenAI } from 'openai';

// Configure OpenAI client with proper error handling for project API keys
const configureOpenAI = () => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      throw new Error('OpenAI API key is required but not provided');
    }

    // Configuration options for project API keys
    const options: any = {
      apiKey,
      maxRetries: 3,
      timeout: 60 * 1000, // 60 seconds timeout
    };

    // Add organization ID if available
    if (process.env.OPENAI_ORG_ID) {
      options.organization = process.env.OPENAI_ORG_ID;
    }

    return new OpenAI(options);
  } catch (error) {
    console.error('Error configuring OpenAI client:', error);
    throw error;
  }
};

// Export a singleton instance
export const openaiClient = configureOpenAI();

// Helper for the AI SDK
export const getOpenAIConfig = () => {
  return {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
  };
};