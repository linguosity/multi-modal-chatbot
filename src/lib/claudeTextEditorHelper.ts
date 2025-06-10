/**
 * Helper functions for Claude Text Editor Tool integration
 * Based on: https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/text-editor-tool
 */

import { normalizeInput } from '@/lib/report-utilities';
import { getFullSchemaOutline } from './batchApiHelper'; // Assuming this is still needed for schema
import {
  ANTHROPIC_MODELS,
  TEXT_EDITOR_TOOL_TYPES,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_MAX_TOKENS_TEXT_EDITOR,
  DEFAULT_SLP_ASSISTANT_PERSONA
} from '@/lib/config';
import { anthropicApiCall } from './anthropicApiClient';

/**
 * Get the appropriate text editor tool type based on the model
 */
export function getTextEditorToolType(model: string): string {
  if (model.includes(ANTHROPIC_MODELS.CLAUDE_3_5_SONNET)) {
    return TEXT_EDITOR_TOOL_TYPES.FOR_CLAUDE_3_5_SONNET;
  } else if (model.includes(ANTHROPIC_MODELS.CLAUDE_3_7_SONNET_20250219) || model.includes('claude-3-7-sonnet')) {
    return TEXT_EDITOR_TOOL_TYPES.FOR_CLAUDE_3_7_SONNET;
  } else {
    return TEXT_EDITOR_TOOL_TYPES.DEFAULT_CLAUDE_4_TOOL;
  }
}

/**
 * Create a structured prompt for the text editor tool to update reports
 */
export async function createTextEditorPrompt(input: string, currentReport: any): Promise<string> {
  const schemaOutline = getFullSchemaOutline(); // This implies batchApiHelper is still a relevant import
  const normalizedInput = await normalizeInput(input);
  
  // Using DEFAULT_SLP_ASSISTANT_PERSONA from config
  let promptContent = `${DEFAULT_SLP_ASSISTANT_PERSONA} I need you to analyze the provided input and update the existing report JSON using the text editor tool.

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

  // Append current report content for Claude to use as starting point
  // The original had a line: return prompt + '\n\nCurrent Report Content to Start With:\n```json\n' + JSON.stringify(currentReport, null, 2) + '\n```';
  // This was problematic as it returned from within the function before the actual return.
  // The current report content is added to the initial message in callClaudeWithTextEditor.
  return promptContent;
}

/**
 * Create the tools array for Claude API call with text editor
 */
export function createTextEditorTools(model: string = DEFAULT_ANTHROPIC_MODEL) {
  const toolType = getTextEditorToolType(model);
  return [{ type: toolType, name: 'str_replace_editor' }];
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
  model: string = DEFAULT_ANTHROPIC_MODEL
): Promise<any> {
  const tools = createTextEditorTools(model);
  
  let conversationMessages = [
    {
      role: 'user' as const, // Explicitly type role
      content: prompt + '\n\nInitial report content to edit:\n```json\n' + initialFileContent + '\n```'
    }
  ];

  let maxTurns = 8;
  let finalApiResponse = null;
  let allClaudeResponses = [];
  let currentFileContent = initialFileContent;

  try {
    for (let turn = 0; turn < maxTurns; turn++) {
      console.log(`Claude conversation turn ${turn + 1}`);
      
      const requestBody = {
        // model will be set by anthropicApiCall using the 'model' parameter passed to it
        max_tokens: DEFAULT_MAX_TOKENS_TEXT_EDITOR,
        tools,
        messages: conversationMessages,
      };
      
      const data = await anthropicApiCall('messages', requestBody, model);
      
      console.log(`Turn ${turn + 1} stop reason:`, data.stop_reason);
      allClaudeResponses.push(data);
      
      conversationMessages.push({
        role: 'assistant' as const, // Explicitly type role
        content: data.content
      });

      if (data.stop_reason === 'tool_use') {
        const toolResults = [];
        for (const contentBlock of data.content) { // Renamed 'content' to 'contentBlock' to avoid conflict
          if (contentBlock.type === 'tool_use') {
            console.log(`Processing tool use: ${contentBlock.input?.command}`);
            
            let toolResultContent = 'Tool executed successfully'; // Default content

            // Simulate proper file operations and track content
            if (contentBlock.input?.command === 'create') {
              if (contentBlock.input.file_text) {
                currentFileContent = contentBlock.input.file_text;
                console.log(`File created with ${currentFileContent.length} characters`);
              }
              toolResultContent = 'File created successfully';
            } else if (contentBlock.input?.command === 'str_replace' && contentBlock.input.old_str !== undefined && contentBlock.input.new_str !== undefined) {
              const oldStr = contentBlock.input.old_str;
              const newStr = contentBlock.input.new_str;
              if (currentFileContent.includes(oldStr)) {
                currentFileContent = currentFileContent.replace(oldStr, newStr);
                console.log(`Applied str_replace: "${oldStr.substring(0, 50)}..." -> "${newStr.substring(0, 50)}..."`);
                toolResultContent = 'Text replaced successfully';
              } else {
                console.warn(`str_replace failed: old_str not found in current content`);
                toolResultContent = 'String not found in file';
              }
            } else if (contentBlock.input?.command === 'view') {
              toolResultContent = currentFileContent;
              console.log(`Returning file content for view: ${currentFileContent.length} characters`);
            }

            toolResults.push({
              type: 'tool_result' as const, // Explicitly type role
              tool_use_id: contentBlock.id,
              content: toolResultContent
            });
          }
        }

        if (toolResults.length > 0) {
          conversationMessages.push({
            role: 'user' as const, // Response to tool_use should be 'user' with tool_result content blocks
            content: toolResults as any, // Cast as any if TS complains about structure, though it should match expected
          });
          
          if (turn >= 4) { // Heuristic to ask for final view
            conversationMessages.push({
              role: 'user' as const,
              content: 'CRITICAL: Use str_replace_editor with "view" command on report.json and return ONLY the complete JSON content with no explanations.'
            });
          }
          continue;
        }
      }

      finalApiResponse = data;
      break;
    }

    return {
      finalResponse: finalApiResponse || conversationMessages[conversationMessages.length - 1],
      allResponses: allClaudeResponses,
      conversationLength: allClaudeResponses.length,
      finalFileContent: currentFileContent
    };
  } catch (error) {
    console.error('Error in callClaudeWithTextEditor (using anthropicApiCall):', error);
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
    // Prioritize the manually tracked finalFileContent
    if (claudeResponse.finalFileContent) {
      console.log('Using tracked final file content from file simulation');
      finalContent = claudeResponse.finalFileContent;
    } else if (claudeResponse.allResponses && Array.isArray(claudeResponse.allResponses)) {
      // Fallback: try to find the last 'view' command or 'create' command's file_text
      console.log(`Analyzing ${claudeResponse.allResponses.length} Claude responses for fallback content extraction...`);
      for (let i = claudeResponse.allResponses.length - 1; i >= 0; i--) {
        const response = claudeResponse.allResponses[i];
        if (response.content && Array.isArray(response.content)) {
          for (const block of response.content) {
            if (block.type === 'tool_use' && block.input?.command === 'view' && typeof block.input.file_text === 'string') {
              finalContent = block.input.file_text;
              console.log(`Found content in 'view' command in response ${i + 1}`);
              break; // Found the latest view
            }
            // Less ideal, but might catch the last state if 'view' wasn't the last tool use
            if (!finalContent && block.type === 'tool_use' && block.input?.file_text && typeof block.input.file_text === 'string') {
               finalContent = block.input.file_text;
               console.log(`Found content in tool_use block (command: ${block.input.command}) in response ${i + 1}`);
            }
          }
        }
        if (finalContent) break;
      }
    } else if (claudeResponse.finalResponse?.content) {
        // Fallback for single response structure (less likely for multi-turn)
        const contentArray = claudeResponse.finalResponse.content;
        if (Array.isArray(contentArray)) {
            for (const block of contentArray) {
                if (block.type === 'text') {
                    finalContent = block.text;
                    break;
                }
            }
        }
    }
    
    if (!finalContent) {
      console.error('No file content could be reliably extracted. Full response:', JSON.stringify(claudeResponse, null, 2));
      throw new Error('No edited content found in Claude response. The text editor tool may not have completed successfully or returned content as expected.');
    }
    
    if (typeof finalContent === 'string' && !finalContent.trim().startsWith('{')) {
      console.warn('Final extracted content appears to be a message, not JSON:', finalContent.substring(0, 200));
      // This could be an error message from Claude or an unexpected text block.
      // Depending on strictness, one might throw an error here.
      // For now, we'll attempt to parse, but it will likely fail.
    }
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(finalContent);
      console.log('Successfully extracted and parsed JSON content');
      if (!parsedContent.header && !parsedContent.background && !parsedContent.presentLevels) {
        // Basic sanity check for report structure
        console.warn('Parsed content does not appear to be a valid report structure, but parsing succeeded.');
      }
      return parsedContent;
    } catch (parseError) {
      console.error('JSON parsing failed for extracted content:', parseError);
      console.error('Content that failed to parse:', finalContent.substring(0, 500));
      throw new Error(`Failed to parse Claude's response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  } catch (error) {
    console.error('Error extracting edited content:', error);
    // Rethrow original error or a new one if preferred
    throw error instanceof Error ? error : new Error(`Failed to extract edited content: ${String(error)}`);
  }
}

/**
 * Process a report update using Claude's text editor tool
 */
export async function processReportWithTextEditor(
  input: string,
  currentReport: any,
  model: string = DEFAULT_ANTHROPIC_MODEL
): Promise<any> {
  try {
    const prompt = await createTextEditorPrompt(input, currentReport);
    const initialFileContent = prepareReportFile(currentReport);
    
    console.log('Calling Claude with text editor tool (using anthropicApiCall)...');
    const claudeResponse = await callClaudeWithTextEditor(prompt, initialFileContent, model);
    
    console.log('Claude response received, extracting content...');
    const updatedReport = extractEditedContent(claudeResponse);
    
    console.log('Successfully processed report with text editor');
    return updatedReport;
  } catch (error) {
    console.error('Error processing report with text editor:', error);
    throw error;
  }
}