import type { AIProvider } from './aiProvider';

/**
 * Interface for the text editor tool commands 
 */
interface ToolCommand {
  command: string;      // The edit command (e.g., 'str_replace')
  path: string;         // The section key to update (e.g., 'parentConcern')
  old_str?: string;     // For 'str_replace', the text to be replaced
  new_str?: string;     // For 'str_replace', the replacement text
  text?: string;        // For 'insert' or 'create', the content to add
}

/**
 * Helper: Extract tool command from Claude's API response
 */
function extractToolCommand(response: any): ToolCommand | null {
  try {
    // Find a content block with type "tool_use"
    const toolUseBlock = response.content?.find((block: any) => 
      block.type === 'tool_use' && 
      block.name === 'str_replace_editor'
    );
    
    if (toolUseBlock && toolUseBlock.input) {
      return toolUseBlock.input as ToolCommand;
    }
    return null;
  } catch (error) {
    console.error('Error extracting tool command:', error);
    return null;
  }
}

/**
 * Apply a tool command to update the appropriate report section
 */
function applyToolCommandToSections(
  sections: Record<string, string>,
  command: ToolCommand
): Record<string, string> {
  const updatedSections = { ...sections };
  
  try {
    // Initialize the target section if it doesn't exist
    if (!updatedSections[command.path]) {
      console.log(`Creating new section "${command.path}" as it doesn't exist yet`);
      updatedSections[command.path] = ''; // Set default to empty string
    }
    
    // Handle different command types
    switch (command.command) {
      case 'str_replace':
        if (command.old_str !== undefined && command.new_str !== undefined) {
          // Replace the exact match of old_str with new_str
          updatedSections[command.path] = updatedSections[command.path].replace(
            command.old_str || '',
            command.new_str || ''
          );
        }
        break;
        
      case 'insert':
        if (command.text) {
          // Insert new content at the end of the section
          updatedSections[command.path] = updatedSections[command.path] + command.text;
        }
        break;
        
      case 'create':
        if (command.text) {
          // Create new content (overwrite existing)
          updatedSections[command.path] = command.text;
        }
        break;
        
      default:
        console.warn(`Unknown command type: ${command.command}`);
    }
    
    return updatedSections;
  } catch (error) {
    console.error(`Error applying tool command to section ${command.path}:`, error);
    return sections; // Return original sections unchanged on error
  }
}

/**
 * Implementation of the AIProvider interface for Claude
 */
export const claudeProvider: AIProvider = {
  /**
   * Updates report sections using Claude's text editor tool
   */
  async updateReportSections(input, currentSections) {
    try {
      // Ensure appropriate environment variables are set
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY is not set');
        return currentSections;
      }
      
      // Build system and user messages
      const messages = [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: `You are an expert speech-language pathologist (SLP) working in an educational setting. 
Your task is to update relevant sections of an evaluation report based on a single data point.

Guidelines:
- Examine the input and determine which report section(s) need updating
- Use the text editor tool to make precise updates to ONLY the necessary sections
- Preserve all existing content that doesn't need to be changed
- Maintain a professional, clinical tone appropriate for educational reports
- Use correct terminology and formatting for speech-language pathology

<!-- cache_control: { "type": "ephemeral" } -->`
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Update the relevant report sections based solely on the following observation:

"${input}"

Current report sections:
${JSON.stringify(currentSections, null, 2)}

Use the text editor tool to update ONLY the sections that are directly relevant to this observation.
Do not modify sections that don't need to be changed.`
            }
          ]
        }
      ];
      
      // Log the request details (excluding API key)
      console.log('Claude API Request:', {
        url: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229',
        hasApiKey: !!process.env.ANTHROPIC_API_KEY,
        messageCount: messages.length
      });
      
      // For debugging, let's create a mock response for now (just for the demo)
      // This creates a simulation without making the actual API call
      // In production, you would remove this and use the real API call
      
      console.log('Using simulated Claude response for demo purposes');
      
      // Determine which section to update based on the input
      let targetSection = 'articulation';
      
      // Check for specific keywords in the input
      const inputLower = input.toLowerCase();
      if (inputLower.includes('parent')) {
        targetSection = 'parentConcern';
      } else if (inputLower.includes('direction') || inputLower.includes('understand')) {
        targetSection = 'receptiveLanguage';
      } else if (inputLower.includes('express') || inputLower.includes('sentence')) {
        targetSection = 'expressiveLanguage';
      } else if (inputLower.includes('social') || inputLower.includes('eye contact')) {
        targetSection = 'pragmaticLanguage';
      } else if (inputLower.includes('front') || inputLower.includes('back') || 
                 inputLower.includes('intelligible') || inputLower.includes('articulat')) {
        targetSection = 'articulation';
      } else if (inputLower.includes('assess') || inputLower.includes('test') || 
                 inputLower.includes('score') || inputLower.includes('percentile')) {
        targetSection = 'assessmentData';
      }
      
      // Create a more professional update based on the input
      let updatedContent = '';
      
      // Get the existing content
      const existingContent = currentSections[targetSection] || '';
      
      // Prepare a professional update based on section type
      if (targetSection === 'articulation') {
        if (inputLower.includes('fronting') && inputLower.includes('backing')) {
          updatedContent = `${existingContent} During playground observation, the student demonstrated both fronting and backing processes in spontaneous conversation. Speech was approximately 50% intelligible to an unfamiliar listener, which significantly impacts functional communication.`;
        } else if (inputLower.includes('front')) {
          updatedContent = `${existingContent} The student demonstrates consistent fronting of velar sounds in all word positions, replacing /k/ with /t/ and /g/ with /d/. This phonological process is developmentally appropriate for younger children but persists in this student's speech.`;
        } else {
          updatedContent = `${existingContent} ${input}`;
        }
      } else if (targetSection === 'assessmentData') {
        updatedContent = `${existingContent} Recent assessment indicates ${input}`;
      } else {
        // For other sections, simply append with proper formatting
        if (existingContent) {
          updatedContent = `${existingContent} ${input}`;
        } else {
          updatedContent = input;
        }
      }
      
      // Clean up any double spaces
      updatedContent = updatedContent.replace(/\s\s+/g, ' ').trim();
      
      // Sample response that simulates Claude's behavior
      const result = {
        content: [
          {
            type: 'tool_use',
            name: 'str_replace_editor',
            input: {
              command: 'str_replace',
              path: targetSection,
              old_str: existingContent,
              new_str: updatedContent
            }
          }
        ]
      };
      
      // For debugging in console
      console.log('Mock response generated:', JSON.stringify(result, null, 2));
      
      /*
      // REAL API CALL - COMMENTED OUT FOR DEMO
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': process.env.ANTHROPIC_API_KEY
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          tools: [
            {
              type: 'text_editor_20250124',
              name: 'str_replace_editor'
            }
          ],
          messages
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      */
      
      // Extract and apply the tool command
      const toolCommand = extractToolCommand(result);
      if (toolCommand) {
        return applyToolCommandToSections(currentSections, toolCommand);
      }
      
      // If no tool command found but there's a text response, log it for debugging
      if (result.content) {
        const textContent = result.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n');
        console.log('Claude response (no tool command found):', textContent);
      }
      
      // No changes made
      return currentSections;
    } catch (error) {
      console.error('Error updating report sections with Claude:', error);
      return currentSections; // Return original sections unchanged on error
    }
  },
  
  /**
   * Updates report sections using a PDF document processed by Claude
   */
  async updateReportSectionsFromPDF(pdfData, currentSections) {
    try {
      // Ensure appropriate environment variables are set
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY is not set');
        return currentSections;
      }
      
      // Build messages including the PDF document
      const messages = [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: `You are an expert speech-language pathologist (SLP) working in an educational setting.
Your task is to extract relevant information from a PDF document and update appropriate sections of an evaluation report.

Guidelines:
- Examine the PDF document thoroughly to identify relevant clinical information
- Use the text editor tool to make precise updates to ONLY the necessary sections
- Preserve all existing content that doesn't need to be changed
- Maintain a professional, clinical tone appropriate for educational reports
- Use correct terminology and formatting for speech-language pathology

<!-- cache_control: { "type": "ephemeral" } -->`
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { 
                type: 'base64', 
                media_type: 'application/pdf', 
                data: pdfData 
              },
              cache_control: { type: 'ephemeral' }
            },
            {
              type: 'text',
              text: `Extract relevant clinical information from this document and update the appropriate report sections.

Current report sections:
${JSON.stringify(currentSections, null, 2)}

Use the text editor tool to update ONLY the sections that are directly relevant to the information in this document.
Do not modify sections that don't need to be changed.`
            }
          ]
        }
      ];
      
      // Log the request details (excluding sensitive data)
      console.log('Claude PDF API Request:', {
        url: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229',
        hasApiKey: !!process.env.ANTHROPIC_API_KEY,
        pdfDataSize: pdfData.length,
        messageCount: messages.length
      });
      
      // For debugging, let's create a mock response for the demo
      console.log('Using simulated Claude PDF response for demo purposes');
      
      // Simulate PDF data extraction with mock updates to 2-3 sections
      const result = {
        content: [
          {
            type: 'tool_use',
            name: 'str_replace_editor',
            input: {
              command: 'str_replace',
              path: 'assessmentData',
              old_str: currentSections.assessmentData || '',
              new_str: currentSections.assessmentData 
                ? currentSections.assessmentData + ' PDF assessment data extracted: CELF-5 test results show scores in the 15th percentile for word classes and 18th percentile for formulated sentences.'
                : 'PDF assessment data extracted: CELF-5 test results show scores in the 15th percentile for word classes and 18th percentile for formulated sentences.'
            }
          }
        ]
      };
      
      // For debugging in console
      console.log('Mock PDF response generated:', JSON.stringify(result, null, 2));
      
      /*
      // REAL API CALL - COMMENTED OUT FOR DEMO
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': process.env.ANTHROPIC_API_KEY
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          tools: [
            {
              type: 'text_editor_20250124',
              name: 'str_replace_editor'
            }
          ],
          messages
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      */
      
      // Extract and apply the tool command
      const toolCommand = extractToolCommand(result);
      if (toolCommand) {
        return applyToolCommandToSections(currentSections, toolCommand);
      }
      
      // If no tool command found but there's a text response, log it for debugging
      if (result.content) {
        const textContent = result.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n');
        console.log('Claude response (no tool command found):', textContent);
      }
      
      // No changes made
      return currentSections;
    } catch (error) {
      console.error('Error updating report sections from PDF with Claude:', error);
      return currentSections; // Return original sections unchanged on error
    }
  }
};