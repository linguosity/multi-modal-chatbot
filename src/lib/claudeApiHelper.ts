/**
 * Helper function to call Claude Messages API and parse the JSON response
 * @param systemPrompt - The system prompt to send to Claude
 * @param userMessage - The user message content
 * @returns Parsed JSON object from Claude's response
 */
export async function callClaudeMessagesApi(systemPrompt: string, userMessage: string): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 4000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Find the text content in the response
    const textBlock = data.content.find((block: any) => block.type === 'text');
    
    if (!textBlock) {
      throw new Error('No text block found in Claude response');
    }
    
    try {
      // Try to parse the JSON from Claude's response
      return JSON.parse(textBlock.text);
    } catch (parseError) {
      throw new Error(`Failed to parse Claude's text response as JSON: ${parseError}`);
    }
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}