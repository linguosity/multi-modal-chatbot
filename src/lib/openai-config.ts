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

// Types for image generation
export interface ImageGenerationOptions {
  prompt: string;
  model?: 'dall-e-2' | 'dall-e-3';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

// Default options for image generation
export const DEFAULT_IMAGE_OPTIONS: Partial<ImageGenerationOptions> = {
  model: 'dall-e-3',
  size: '1024x1024',
  quality: 'standard',
  style: 'vivid',
  n: 1
};