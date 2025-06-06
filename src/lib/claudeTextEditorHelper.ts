/**
 * Helper functions for Claude Text Editor Tool integration
 * Based on: https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/text-editor-tool
 */

import { normalizeInput } from '@/lib/report-utilities';
import { getFullSchemaOutline } from './batchApiHelper';

/**
 * Get the appropriate text editor tool type based on the model
 */
export function getTextEditorToolType(model: string): string {
  if (model.includes('claude-3-5-sonnet')) {
    return 'text_editor_20241022';
  } else if (model.includes('claude-3-7-sonnet')) {
    return 'text_editor_20250124';
  } else {
    // Default to Claude 4 tool type
    return 'text_editor_20250429';
  }
}

/**
 * Create a structured prompt for the text editor tool to update reports
 */
export async function createTextEditorPrompt(input: string, currentReport: any): Promise<string> {
  const schemaOutline = getFullSchemaOutline();
  const normalizedInput = await normalizeInput(input);
  
  console.log('Creating prompt with input:', normalizedInput);
  console.log('Current report passed to prompt:', JSON.stringify(currentReport, null, 2));
  
  return `You are an expert speech-language pathologist's assistant. I need you to analyze the provided input and update the existing report JSON using the text editor tool.

Target Schema Structure:
${schemaOutline}

New Input to Process:
<user_input>
${normalizedInput}
</user_input>

Instructions:
1. First create a file called 'report.json' with the EXACT current report content provided below
2. Analyze the new input text to extract relevant information
3. Use 'str_replace_editor' with 'str_replace' commands to update specific sections based on the input
4. Only update sections where the new input provides relevant information
5. Preserve all existing data that isn't contradicted by the new input
6. For arrays like 'strengths' or 'needs', add new items without removing existing ones
7. Ensure all JSON syntax remains valid after edits
8. CRITICAL: After all str_replace operations, use 'str_replace_editor' with 'view' command to show the final report.json content
9. When using the 'view' command, return ONLY the complete JSON content of the file, with no explanations or additional text

IMPORTANT: 
- Start with the exact current report content, do not create a skeleton!
- The final 'view' command must return the complete, valid JSON structure
- Do not include any commentary or explanations with the final JSON

Please proceed step by step to update the report.`;

  return prompt + '\n\nCurrent Report Content to Start With:\n```json\n' + JSON.stringify(currentReport, null, 2) + '\n```';
}

/**
 * Create the tools array for Claude API call with text editor
 */
export function createTextEditorTools(model: string = 'claude-3-7-sonnet-20250219') {
  const toolType = getTextEditorToolType(model);
  
  return [
    {
      type: toolType,
      name: 'str_replace_editor'
    }
  ];
}

/**
 * Prepare the initial file content for the text editor
 */
export function prepareReportFile(report: any): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Call Claude API with text editor tool and handle multi-turn conversation
 */
export async function callClaudeWithTextEditor(
  prompt: string,
  initialFileContent: string,
  model: string = 'claude-3-7-sonnet-20250219'
): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const tools = createTextEditorTools(model);
  
  try {
    // Initial message to Claude
    let messages = [
      {
        role: 'user',
        content: prompt + '\n\nInitial report content to edit:\n```json\n' + initialFileContent + '\n```'
      }
    ];

    let maxTurns = 8; // Increased to allow for final view command
    let finalResponse = null;
    let allClaudeResponses = []; // Store all Claude responses to find file content
    let currentFileContent = initialFileContent; // Track file state manually

    for (let turn = 0; turn < maxTurns; turn++) {
      console.log(`Claude conversation turn ${turn + 1}`);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 8000,
          tools,
          messages
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API request failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Turn ${turn + 1} stop reason:`, data.stop_reason);
      
      // Store this response for later analysis
      allClaudeResponses.push(data);
      
      // Add Claude's response to conversation
      messages.push({
        role: 'assistant',
        content: data.content
      });

      // Check if Claude used tools
      if (data.stop_reason === 'tool_use') {
        // Process tool uses and create tool results
        const toolResults = [];
        
        for (const content of data.content) {
          if (content.type === 'tool_use') {
            console.log(`Processing tool use: ${content.input?.command}`);
            
            let toolResult = {
              type: 'tool_result',
              tool_use_id: content.id,
              content: 'Tool executed successfully'
            };

            // Simulate proper file operations and track content
            if (content.input?.command === 'create') {
              if (content.input.file_text) {
                currentFileContent = content.input.file_text;
                console.log(`File created with ${currentFileContent.length} characters`);
              }
              toolResult.content = 'File created successfully';
            } else if (content.input?.command === 'str_replace') {
              // Apply the string replacement to our tracked file content
              const oldStr = content.input.old_str;
              const newStr = content.input.new_str;
              
              if (oldStr && newStr !== undefined && currentFileContent.includes(oldStr)) {
                currentFileContent = currentFileContent.replace(oldStr, newStr);
                console.log(`Applied str_replace: "${oldStr.substring(0, 50)}..." -> "${newStr.substring(0, 50)}..."`);
                console.log(`File now ${currentFileContent.length} characters`);
                toolResult.content = 'Text replaced successfully';
              } else {
                console.warn(`str_replace failed: old_str not found in current content`);
                toolResult.content = 'String not found in file';
              }
            } else if (content.input?.command === 'view') {
              // Return the current file content for view commands
              toolResult.content = currentFileContent;
              console.log(`Returning file content for view: ${currentFileContent.length} characters`);
            }

            toolResults.push(toolResult);
          }
        }

        if (toolResults.length > 0) {
          // Add tool results to conversation
          messages.push({
            role: 'user',
            content: toolResults
          });
          
          // If we've had several tool uses, ask Claude to view the final file
          if (turn >= 4) {
            messages.push({
              role: 'user',
              content: 'CRITICAL: Use str_replace_editor with "view" command on report.json and return ONLY the complete JSON content with no explanations.'
            });
          }
          
          // Continue conversation
          continue;
        }
      }

      // If Claude stopped for any other reason, this is our final response
      finalResponse = data;
      break;
    }

    // Return an object that includes all responses for better content extraction
    return {
      finalResponse: finalResponse || messages[messages.length - 1],
      allResponses: allClaudeResponses,
      conversationLength: allClaudeResponses.length,
      finalFileContent: currentFileContent
    };
  } catch (error) {
    console.error('Error calling Claude with text editor:', error);
    throw error;
  }
}

/**
 * Extract the final edited content from Claude's multi-turn response
 */
export function extractEditedContent(claudeResponse: any): any {
  try {
    console.log('Parsing Claude response for final content...');
    
    let finalContent = null;
    let latestFileContent = null;
    
    // Check if we have the tracked final file content (new approach)
    if (claudeResponse.finalFileContent) {
      console.log('Using tracked final file content from file simulation');
      finalContent = claudeResponse.finalFileContent;
    }
    // Check if this is a conversation response with multiple Claude responses (fallback)
    else if (claudeResponse.allResponses && Array.isArray(claudeResponse.allResponses)) {
      console.log(`Analyzing ${claudeResponse.allResponses.length} Claude responses...`);
      
      // Look through all responses in chronological order to find the most recent file content
      for (let i = 0; i < claudeResponse.allResponses.length; i++) {
        const response = claudeResponse.allResponses[i];
        console.log(`Checking response ${i + 1}...`);
        
        if (response.content && Array.isArray(response.content)) {
          for (const block of response.content) {
            if (block.type === 'tool_use' && block.input) {
              const input = block.input;
              console.log(`Turn ${i + 1} tool use: ${input.command} for path: ${input.path}`);
              
              // Log what fields are available in this tool use
              console.log(`Turn ${i + 1} available fields:`, Object.keys(input || {}));
              
              // Keep the latest file content - this includes all edits made so far
              if (input.file_text && (input.path === '/report.json' || input.path === 'report.json')) {
                const hasActualContent = input.file_text.includes('"header"') && input.file_text.length > 100;
                const hasStutteringContent = input.file_text.includes('stuttering') || input.file_text.includes('fluency');
                
                console.log(`Turn ${i + 1} file_text preview:`, input.file_text.substring(0, 200) + '...');
                console.log(`Turn ${i + 1} has stuttering content:`, hasStutteringContent);
                
                if (hasActualContent) {
                  latestFileContent = input.file_text;
                  console.log(`Found updated file_text in turn ${i + 1} (${input.file_text.length} chars)`);
                }
              } else {
                console.log(`Turn ${i + 1} has no file_text or wrong path`);
              }
            }
          }
        }
      }
      
      // If we only got the initial skeleton, there might be an issue with the text editor responses
      if (latestFileContent && latestFileContent.includes('"firstName": ""') && !latestFileContent.includes('stuttering')) {
        console.warn('Warning: Only found initial skeleton content, checking for view command results...');
        
        // Look for view commands that might have the updated content
        for (let i = claudeResponse.allResponses.length - 1; i >= 0; i--) {
          const response = claudeResponse.allResponses[i];
          if (response.content && Array.isArray(response.content)) {
            for (const block of response.content) {
              if (block.type === 'tool_use' && block.input && block.input.command === 'view') {
                if (block.input.file_text && block.input.file_text.includes('stuttering')) {
                  latestFileContent = block.input.file_text;
                  console.log(`Found view command with stuttering content in turn ${i + 1}`);
                  break;
                }
              }
            }
          }
        }
      }
    } else {
      // Fallback to single response analysis
      console.log('Analyzing single response...');
      let contentArray = claudeResponse.content || claudeResponse.finalResponse?.content;
      
      if (!Array.isArray(contentArray)) {
        throw new Error('Invalid response structure from Claude');
      }
      
      for (const block of contentArray) {
        console.log('Processing block:', block.type);
        
        if (block.type === 'tool_use' && block.input) {
          const input = block.input;
          console.log('Tool use command:', input.command, 'for path:', input.path);
          
          if (input.file_text && (input.path === '/report.json' || input.path === 'report.json')) {
            latestFileContent = input.file_text;
            console.log('Found file_text in tool_use block');
          }
        }
      }
    }
    
    finalContent = latestFileContent;
    
    if (!finalContent) {
      console.error('No file content found. Full response:', JSON.stringify(claudeResponse, null, 2));
      
      // If we have the tracked final file content as a fallback, use it
      if (claudeResponse.finalFileContent) {
        console.log('Using tracked file content as fallback');
        finalContent = claudeResponse.finalFileContent;
      } else {
        throw new Error('No edited content found in Claude response. The text editor tool may not have completed successfully.');
      }
    }
    
    // Validate that we have actual JSON content, not just a message
    if (typeof finalContent === 'string' && !finalContent.trim().startsWith('{')) {
      console.warn('Final content appears to be a message, not JSON:', finalContent.substring(0, 200));
      
      // If we have tracked file content as fallback, use it
      if (claudeResponse.finalFileContent && claudeResponse.finalFileContent.trim().startsWith('{')) {
        console.log('Using tracked file content instead of message response');
        finalContent = claudeResponse.finalFileContent;
      } else {
        throw new Error('Claude returned a message instead of JSON content. Please try again.');
      }
    }
    
    // Parse and validate the JSON
    let parsedContent;
    try {
      parsedContent = JSON.parse(finalContent);
      console.log('Successfully extracted and parsed JSON content');
      console.log('Updated sections detected:', Object.keys(parsedContent).join(', '));
      
      // Validate it's actually a report structure
      if (!parsedContent.header && !parsedContent.background && !parsedContent.presentLevels) {
        throw new Error('Parsed content does not appear to be a valid report structure');
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Content that failed to parse:', finalContent.substring(0, 500));
      throw new Error(`Failed to parse Claude's response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }
  } catch (error) {
    console.error('Error extracting edited content:', error);
    console.error('Raw response:', JSON.stringify(claudeResponse, null, 2));
    throw new Error(`Failed to extract edited content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process a report update using Claude's text editor tool
 */
export async function processReportWithTextEditor(
  input: string,
  currentReport: any,
  model: string = 'claude-3-7-sonnet-20250219'
): Promise<any> {
  try {
    // Prepare the prompt and initial file
    const prompt = await createTextEditorPrompt(input, currentReport);
    const initialFileContent = prepareReportFile(currentReport);
    
    console.log('Calling Claude with text editor tool...');
    
    // Call Claude with text editor
    const claudeResponse = await callClaudeWithTextEditor(prompt, initialFileContent, model);
    
    console.log('Claude response received, extracting content...');
    
    // Extract the edited content
    const updatedReport = extractEditedContent(claudeResponse);
    
    console.log('Successfully processed report with text editor');
    
    return updatedReport;
  } catch (error) {
    console.error('Error processing report with text editor:', error);
    throw error;
  }
}