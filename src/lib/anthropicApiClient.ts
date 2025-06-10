import { ANTHROPIC_API_VERSION, DEFAULT_ANTHROPIC_MODEL } from '@/lib/config';

/**
 * Retrieves the Anthropic API key from environment variables.
 * @returns The API key.
 * @throws Error if the API key is not set.
 */
function getAnthropicApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set. Please configure it.');
  }
  return apiKey;
}

interface AnthropicErrorDetail {
  type: string;
  message: string;
}

interface AnthropicErrorResponse {
  type: 'error';
  error: AnthropicErrorDetail;
}

/**
 * Makes a POST request to the Anthropic API.
 * @param endpoint The API endpoint (e.g., 'messages').
 * @param body The request body.
 * @param requestSpecificModel Optional model override for this specific request.
 * @returns Parsed JSON response from the API.
 * @throws Error for network issues or non-200 API responses.
 */
export async function anthropicApiCall(
  endpoint: string,
  body: Record<string, any>,
  requestSpecificModel?: string
): Promise<any> {
  const apiKey = getAnthropicApiKey();
  const apiUrl = `https://api.anthropic.com/v1/${endpoint}`;

  // Ensure the model is correctly set in the body
  const effectiveModel = body.model || requestSpecificModel || DEFAULT_ANTHROPIC_MODEL;
  const requestBody = { ...body, model: effectiveModel };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorData: AnthropicErrorResponse | { error: string } | string = 'Unknown error structure';
      try {
        errorData = await response.json();
      } catch (e) {
        // If parsing JSON fails, use the response text
        errorData = await response.text();
      }

      let errorMessage = `Anthropic API request failed: ${response.status} ${response.statusText}.`;
      if (typeof errorData === 'string') {
        errorMessage += ` Details: ${errorData}`;
      } else if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
        if (typeof errorData.error === 'string') {
          errorMessage += ` Details: ${errorData.error}`;
        } else if (typeof errorData.error === 'object' && errorData.error !== null && 'message' in errorData.error) {
           // Matches AnthropicErrorResponse structure
          errorMessage += ` Type: ${(errorData.error as AnthropicErrorDetail).type}, Message: ${(errorData.error as AnthropicErrorDetail).message}`;
        }
      }
      console.error(errorMessage, 'Request Body:', requestBody, 'Response Data:', errorData);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // Log and re-throw
    // console.error('Error in anthropicApiCall:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.message.startsWith('Anthropic API request failed')) {
      throw error; // Re-throw already specific errors
    }
    throw new Error(`Network or other error during Anthropic API call: ${error instanceof Error ? error.message : String(error)}`);
  }
}
