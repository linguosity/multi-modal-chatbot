/**
 * Helper function to call Claude Messages API and parse the JSON response
 * @param systemPrompt - The system prompt to send to Claude
 * @param userMessage - The user message content
 * @returns Parsed JSON object from Claude's response
 */
export async function callClaudeMessagesApi(systemPrompt: string, userMessage: string): Promise<any> {
import { DEFAULT_ANTHROPIC_MODEL, DEFAULT_MAX_TOKENS_MESSAGES_API } from '@/lib/config';
import { anthropicApiCall } from './anthropicApiClient';

/**
 * Helper function to call Claude Messages API and parse the JSON response.
 * This specific function expects the API to return a JSON object directly
 * within the 'text' block of the first content element.
 * @param systemPrompt - The system prompt to send to Claude.
 * @param userMessage - The user message content.
 * @param model - Optional model override.
 * @param max_tokens - Optional max_tokens override.
 * @returns Parsed JSON object from Claude's response.
 * @throws Error if the API call fails or the response format is unexpected.
 */
export async function callClaudeMessagesApi(
  systemPrompt: string,
  userMessage: string,
  model: string = DEFAULT_ANTHROPIC_MODEL,
  max_tokens: number = DEFAULT_MAX_TOKENS_MESSAGES_API
): Promise<any> {
  const body = {
    model, // Model will be effectively handled by anthropicApiCall
    max_tokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  };

  try {
    // Use the new anthropicApiCall function
    // The model parameter to anthropicApiCall is passed to ensure it's included if not already in body.
    // However, we are explicitly adding it to the body here.
    const data = await anthropicApiCall('messages', body, model);
    
    // Standard Claude Messages API response structure has content as an array
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('Unexpected response structure from Claude API:', data);
      throw new Error('No content blocks found in Claude response');
    }

    // Find the first text content block
    const textBlock = data.content.find((block: any) => block.type === 'text');
    
    if (!textBlock || typeof textBlock.text !== 'string') {
      console.error('No text block found or text is not a string in Claude response:', data);
      throw new Error('No text block found or text is not a string in Claude response');
    }
    
    try {
      // Try to parse the JSON from Claude's text response
      return JSON.parse(textBlock.text);
    } catch (parseError) {
      console.error("Failed to parse Claude's text response as JSON:", textBlock.text, parseError);
      throw new Error(`Failed to parse Claude's text response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  } catch (error) {
    console.error('Error calling Claude Messages API via anthropicApiCall:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}