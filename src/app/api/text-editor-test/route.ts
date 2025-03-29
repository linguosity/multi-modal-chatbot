import { NextRequest, NextResponse } from 'next/server';
import { AssessmentTool, getAssessmentToolById } from '@/lib/assessment-tools';
import { SpeechLanguageReport, DomainSection } from '@/types/reportTypes';
import { normalizeInput, createReportSkeleton, deepMerge, updateDomainSection } from '@/lib/reportUtils';

/**
 * API endpoint to test Claude's text editor tool with JSON report updates
 */
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  console.log(`[${requestId}] 🚀 REQUEST STARTED: Text Editor API called`);
  
  try {
    // Extract request parameters
    const { input, report: existingReport, updateSection, pdfData } = await request.json();
    
    // Determine if this is a PDF upload or text input
    const isPdfUpload = !!pdfData;
    const inputData = isPdfUpload ? { pdfData } : input;
    
    console.log(`[${requestId}] 📥 Received request payload:`, { 
      inputType: isPdfUpload ? 'PDF' : 'text',
      inputSize: isPdfUpload ? `${pdfData.length} chars (base64)` : 
                (typeof input === 'string' ? `${input.substring(0, 50)}${input.length > 50 ? '...' : ''}` : input),
      reportProvided: !!existingReport,
      updateSection: updateSection || 'auto-detect' 
    });

    // Validate request parameters
    if (!inputData && !isPdfUpload) {
      console.log(`[${requestId}] ❌ Validation failed: Missing input data`);
      return NextResponse.json(
        { error: 'Input data is required' },
        { status: 400 }
      );
    }

    // Create or use existing report
    const report = existingReport || createReportSkeleton();
    console.log(`[${requestId}] 📋 Using ${existingReport ? 'provided' : 'default'} report structure with ${Object.keys(report.assessmentResults.domains).length} domains`);
    
    // Get API key from environment variables
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    // Check if API key is available
    if (!apiKey) {
      console.log(`[${requestId}] ❌ Missing API key: ANTHROPIC_API_KEY not set`);
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not set in environment variables' },
        { status: 500 }
      );
    }
    
    try {
      // Normalize input data (handles text, PDF, etc.)
      console.log(`[${requestId}] 🔄 Normalizing input data...`);
      const normalizedInput = await normalizeInput(inputData);
      console.log(`[${requestId}] ✅ Input normalized, length: ${normalizedInput.length} chars`);
      
      // Log if this is a PDF upload
      if (isPdfUpload) {
        console.log(`[${requestId}] 📄 Processing PDF data...`);
      }
      
      // Determine which section(s) to update
      const sectionToUpdate = updateSection || 'auto-detect';
      console.log(`[${requestId}] 🎯 Target section(s): ${sectionToUpdate}`);
      
      // Prepare the report section that Claude will view and edit
      let viewContent: string;
      let targetPath: string;
      
      console.log(`[${requestId}] 📑 Preparing view content for Claude...`);
      
      // Helper function to get a nested value from an object using a path string
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((o, key) => o?.[key], obj);
      };
      
      // Extract the main section (header, background, assessmentResults, conclusion)
      const getMainSection = (path: string) => {
        if (path.startsWith('header.')) return 'header';
        if (path.startsWith('background.')) return 'background';
        if (path.startsWith('assessmentResults.')) return 'assessmentResults';
        if (path.startsWith('conclusion.')) return 'conclusion';
        return null;
      };
      
      // NEW LOGIC: Always send the full serialized report if "auto-detect" or if multiple sections are specified.
      if (sectionToUpdate === 'auto-detect') {
        // Send the full report JSON when no sections are specified
        viewContent = JSON.stringify(report, null, 2);
        targetPath = '';
        console.log(`[${requestId}] Tag mode: Sending full report structure without specific section tags.`);
      } else if (sectionToUpdate.includes(',')) {
        // If the user specifies multiple sections (comma-separated), send the full report and tag those sections
        viewContent = JSON.stringify(report, null, 2);
        targetPath = sectionToUpdate; // targetPath now holds a comma-separated list of sections
        console.log(`[${requestId}] Tag mode: User-specified sections: ${sectionToUpdate}`);
      } else {
        // For a single specified section, handle as before
        const mainSection = getMainSection(sectionToUpdate);
        if (mainSection) {
          viewContent = JSON.stringify(report[mainSection], null, 2);
          targetPath = sectionToUpdate;
          console.log(`[${requestId}] Section update: ${mainSection} -> ${sectionToUpdate}`);
        } else {
          const nestedValue = getNestedValue(report, sectionToUpdate);
          viewContent = nestedValue 
            ? JSON.stringify(nestedValue, null, 2)
            : JSON.stringify(report, null, 2);
          targetPath = sectionToUpdate;
          console.log(`[${requestId}] Other section update: ${sectionToUpdate}`);
        }
      }
      
      // Call the Anthropic API directly
      console.log(`[${requestId}] 🔌 Making first API call to Claude...`);
      
      // Create appropriate system prompt based on input type
      const systemPrompt = `You are an expert educational speech-language pathologist that specializes in writing detailed assessment reports. 
Your task is to update a JSON report structure based on ${isPdfUpload ? 'the contents of the uploaded PDF document' : 'user input'}.

REPORT STRUCTURE:
The report is organized into four main sections:
1. header - Student information and referral reason
2. background - Health history, family info, and parent concerns
3. assessmentResults - Observations, assessment tools, and domain evaluations
4. conclusion - Eligibility determination, summary, and recommendations

User-specified sections: ${sectionToUpdate === 'auto-detect' ? 'None specified' : sectionToUpdate}

INSTRUCTIONS:
1. DO NOT use the text editor tool's str_replace command for these updates
2. INSTEAD, analyze ALL sections of the report that need updating based on the input
3. Return MULTIPLE update_key JSON commands - one for each section that needs updating

IMPORTANT: Your response should include separate JSON commands for:
- Student information (name, DOB, demographics)
- Background information (educational, family, medical, developmental history)
- Each language domain with relevant findings (receptive, expressive, fluency, etc.)
- Assessment tools mentioned in the input

JSON PATH COMMAND FORMAT:
\`\`\`json
{
  "command": "update_key",
  "path": "assessmentResults.domains.pragmatic.strengths",
  "action": "append",
  "value": ["Your observation here"]
}
\`\`\`

Where:
- path: The exact JSON path to update (using the new structure paths, e.g., "assessmentResults.domains.pragmatic.strengths")
- action: Use "append" for arrays, "replace" for fields, or "merge" for objects
- value: The new value to insert, properly formatted as JSON

For domain sections, maintain these guidelines:
- topicSentence: A clear statement summarizing the domain findings
- strengths: Array of specific skills and abilities the student demonstrates
- needs: Array of specific difficulties the student exhibits
- impactStatement: How challenges affect educational performance
- assessmentTools: Array of assessment tools used to evaluate this specific domain (full names, not IDs)

IMPORTANT: When processing standardized tests, add the assessment tool name directly to the domain.assessmentTools array. For example:
"assessmentTools": ["Goldman-Fristoe Test of Articulation-3 (GFTA-3)"]

FORMAT YOUR RESPONSE AS MULTIPLE JSON COMMANDS, EACH IN ITS OWN CODE BLOCK.`;

      // Prepare the user message based on input type
      let userContent = [];
      
      if (isPdfUpload) {
        // Construct message for PDF content
        userContent = [
          {
            type: "text",
            text: `I need to update the speech-language report based on the content in this PDF document. ${sectionToUpdate !== 'auto-detect' ? `Please focus on updating the ${sectionToUpdate} section.` : 'Please analyze the PDF and determine which section of the report to update.'}\n\nHere is the current report structure:\n\`\`\`json\n${viewContent}\n\`\`\`\n\nFor standardized tests like GFTA, CELF, etc., identify key scores and findings, and update the appropriate domain section. Extract any relevant phonological processes, error patterns, or specific strengths/needs.\n\nIMPORTANT: When extracting data from standardized tests, be sure to add the test\'s full name to the domain.assessmentTools array using the update_key command. For example, if analyzing GFTA-3 results for articulation, include "assessmentTools": ["Goldman-Fristoe Test of Articulation, Third Edition (GFTA-3)"] in your update. This helps track which tools were used for each domain.\n\nRespond with an update_key JSON command as described in the system prompt.`
          },
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: normalizedInput
            }
          }
        ];
      } else {
        // Construct message for text content
        userContent = [
          {
            type: "text",
            text: `I need to update the speech-language report based on this new information:
"${normalizedInput}"

Here is the current report structure:
\`\`\`json
${viewContent}
\`\`\`

${sectionToUpdate === 'auto-detect' 
  ? 'Please analyze the input and determine which section of the report to update.' 
  : `Please update the ${sectionToUpdate} section.`}

DO NOT use the text editor tool. Instead, respond with an update_key JSON command.

For example, if updating pragmatic domain strengths and adding assessment tools, respond with:
\`\`\`json
{
  "command": "update_key",
  "path": "assessmentResults.domains.pragmatic",
  "action": "merge",
  "value": {
    "strengths": ["Student maintains eye contact during conversations"],
    "assessmentTools": ["Clinical Evaluation of Language Fundamentals-5 (CELF-5)"]
  }
}
\`\`\`

Guidelines:
- For strengths/needs arrays: use "append" and array values
- For topic sentences: use "replace" and string value
- Empty/missing fields need to be created with appropriate value types
- Analyze which domain fits best: receptive, expressive, pragmatic, articulation, voice, fluency
- The domains are found at the path "assessmentResults.domains.[domainName]"

IMPORTANT: Format your entire response as a text message containing only the JSON command. DO NOT use the text editor tool.`
          }
        ];
      }
      
      const firstApiPayload = {
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1024,
        system: systemPrompt,
        tools: [
          {
            type: 'text_editor_20250124',
            name: 'str_replace_editor'
          }
        ],
        messages: [
          {
            role: 'user',
            content: userContent
          }
        ]
      };
      console.log(`[${requestId}] 📤 First API payload prepared, user message length: ${normalizedInput.length}`);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(firstApiPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`[${requestId}] ❌ First API call failed:`, errorData);
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }
      
      let claudeResponse = await response.json();
      console.log(`[${requestId}] ✅ First Claude response received, content blocks:`, 
        claudeResponse.content.map((block: any) => ({ type: block.type, ...(block.type === 'tool_use' ? { command: block.input?.command } : {}) }))
      );
      
      // Handle the two-way conversation flow with Claude for the text editor tool
      let finalCommand = null;
      
      // Check if Claude is using a tool
      const toolUseBlock = claudeResponse.content.find((block: any) => 
        block.type === 'tool_use' && 
        block.name === 'str_replace_editor'
      );
      
      // Log the tool use block
      if (toolUseBlock) {
        console.log(`[${requestId}] 🛠️ Claude is using tool: ${toolUseBlock.name}, command: ${toolUseBlock.input?.command}`);
      } else {
        console.log(`[${requestId}] ⚠️ No tool use block found in Claude's response`);
      }
      
      // If Claude is using the "view" command first (common with text editor)
      if (toolUseBlock && toolUseBlock.input && toolUseBlock.input.command === 'view') {
        console.log(`[${requestId}] 👁️ Claude is requesting to view content first. Sending content...`);
        
        // Send back the content that Claude requested to view
        console.log(`[${requestId}] 🔌 Making second API call to Claude with view result...`);
        // Create a second API payload that's consistent with the first
        let secondUserContent = [];
        
        if (isPdfUpload) {
          // Construct message for PDF content with previous view result
          secondUserContent = [
            {
              type: "text",
              text: `I need to update the speech-language report based on the content in this PDF document. ${sectionToUpdate !== 'auto-detect' ? `Please focus on updating the ${sectionToUpdate} section.` : 'Please analyze the PDF and determine which section of the report to update.'}\n\nRespond with an update_key JSON command as described in the system prompt.`
            },
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: normalizedInput
              }
            }
          ];
        } else {
          // Construct message for text content with previous view result
          secondUserContent = [
            {
              type: "text",
              text: `I need to update the speech-language report based on this new information:
"${normalizedInput}"

${sectionToUpdate === 'auto-detect' 
  ? 'Please analyze the input and determine which section of the report to update.' 
  : `Please update the ${sectionToUpdate} section.`}

DO NOT use the text editor tool. Instead, respond with an update_key JSON command.

Guidelines:
- For strengths/needs arrays: use "append" and array values
- For topic sentences: use "replace" and string value
- Empty/missing fields need to be created with appropriate value types
- Analyze which domain fits best: receptive, expressive, pragmatic, articulation, voice, fluency
- The domains are found at the path "assessmentResults.domains.[domainName]"

IMPORTANT: Format your entire response as a text message containing only the JSON command. DO NOT use the text editor tool.`
            }
          ];
        }
        
        const secondApiPayload = {
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 1024,
          system: systemPrompt,
          tools: [
            {
              type: 'text_editor_20250124',
              name: 'str_replace_editor'
            }
          ],
          messages: [
            {
              role: 'user',
              content: secondUserContent
            },
            {
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: 'I\'ll help you update the report using the text editor tool.'
                },
                {
                  type: 'tool_use',
                  id: toolUseBlock.id,
                  name: 'str_replace_editor',
                  input: toolUseBlock.input
                }
              ]
            },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUseBlock.id,
                  content: viewContent
                }
              ]
            }
          ]
        };
        
        const secondResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(secondApiPayload)
        });
        
        if (!secondResponse.ok) {
          const errorData = await secondResponse.json();
          console.log(`[${requestId}] ❌ Second API call failed:`, errorData);
          throw new Error(errorData.error?.message || `API error in second request: ${secondResponse.status}`);
        }
        
        // Get Claude's response with the actual edit
        claudeResponse = await secondResponse.json();
        console.log(`[${requestId}] ✅ Second Claude response received, content blocks:`, 
          claudeResponse.content.map((block: any) => ({ type: block.type, ...(block.type === 'tool_use' ? { command: block.input?.command } : {}) }))
        );
        
        // Now check for the str_replace command
        const secondToolUseBlock = claudeResponse.content.find((block: any) => 
          block.type === 'tool_use' && 
          block.name === 'str_replace_editor'
        );
        
        if (secondToolUseBlock) {
          console.log(`[${requestId}] 🛠️ Second response tool use: ${secondToolUseBlock.name}, command: ${secondToolUseBlock.input?.command}`);
          
          if (secondToolUseBlock.input && 
             (secondToolUseBlock.input.command === 'str_replace' || secondToolUseBlock.input.command === 'insert')) {
            finalCommand = secondToolUseBlock.input;
            console.log(`[${requestId}] ✅ Got final command:`, {
              command: finalCommand.command,
              old_str: finalCommand.old_str ? `${finalCommand.old_str.substring(0, 50)}...` : undefined,
              new_str: finalCommand.new_str ? `${finalCommand.new_str.substring(0, 50)}...` : undefined,
              text: finalCommand.text ? `${finalCommand.text.substring(0, 50)}...` : undefined,
              position: finalCommand.position
            });
          } else {
            console.log(`[${requestId}] ⚠️ Second tool use block doesn't contain str_replace or insert command:`, secondToolUseBlock.input);
          }
        } else {
          console.log(`[${requestId}] ⚠️ No tool use block found in Claude's second response`);
        }
      } else if (toolUseBlock && toolUseBlock.input && 
                (toolUseBlock.input.command === 'str_replace' || toolUseBlock.input.command === 'insert')) {
        // Claude directly used str_replace or insert (unusual but possible)
        finalCommand = toolUseBlock.input;
        console.log(`[${requestId}] ✅ Got final command directly from first response:`, {
          command: finalCommand.command,
          old_str: finalCommand.old_str ? `${finalCommand.old_str.substring(0, 50)}...` : undefined,
          new_str: finalCommand.new_str ? `${finalCommand.new_str.substring(0, 50)}...` : undefined,
          text: finalCommand.text ? `${finalCommand.text.substring(0, 50)}...` : undefined,
          position: finalCommand.position
        });
      } else {
        console.log(`[${requestId}] ⚠️ No usable command found in Claude's responses`);
      }
      
      // Check if there's a JSON path update command in Claude's response text
      let updateKeyCommand = null;
      const textBlocks = claudeResponse.content.filter((block: any) => block.type === 'text');
      
      for (const block of textBlocks) {
        // Look for JSON objects in the text that might contain our command
        const jsonMatches = block.text.match(/```json\s*({[\s\S]*?})\s*```|({[\s\S]*"command"[\s\S]*})/g);
        
        if (jsonMatches) {
          for (const match of jsonMatches) {
            try {
              // Extract the JSON object from markdown code blocks or plain text
              const jsonStr = match.replace(/```json\s*|\s*```/g, '').trim();
              
              // Parse as full JSON object to preserve structure
              const jsonObj = JSON.parse(jsonStr);
              
              // Check if this is an update_key command
              if (jsonObj.command === 'update_key' && jsonObj.path && jsonObj.action && jsonObj.value !== undefined) {
                updateKeyCommand = jsonObj; // Use the object directly, not stringified then reparsed
                console.log(`[${requestId}] 🔑 Found update_key command in text`);
                // Log the full structure to help with debugging
                console.log(`[${requestId}] 📊 Update command structure:`, JSON.stringify(updateKeyCommand));
                break;
              }
            } catch (e) {
              console.warn(`[${requestId}] ⚠️ Failed to parse potential JSON command:`, e);
            }
          }
        }
        
        if (updateKeyCommand) break;
      }
      
      // Process the command if we have one (either update_key or text editor command)
      if (updateKeyCommand) {
        console.log(`[${requestId}] 🔄 Processing update_key command...`);
        console.log(`[${requestId}] 📊 Update details: path=${updateKeyCommand.path}, action=${updateKeyCommand.action}`);
        
        let updatedReport = { ...report };
        let affectedDomain = '';
        
        // Extract domain if path starts with domains.X
        if (updateKeyCommand.path.includes('domains.')) {
          const pathParts = updateKeyCommand.path.split('.');
          const domainIndex = pathParts.findIndex(part => part === 'domains');
          if (domainIndex !== -1 && pathParts.length > domainIndex + 1) {
            affectedDomain = pathParts[domainIndex + 1];
            console.log(`[${requestId}] 🎯 Affected domain from path: ${affectedDomain}`);
          }
        }
        
        try {
          // Apply the update based on the path and action
          const pathParts = updateKeyCommand.path.split('.');
          let current = updatedReport;
          
          // Navigate to the parent object of the target property
          for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            
            // Create missing objects in the path
            if (!current[part]) {
              // Check if the next path segment is a number (array index)
              const nextPart = pathParts[i + 1];
              const isNextPartArrayIndex = !isNaN(parseInt(nextPart));
              
              // Create appropriate container type (array or object)
              current[part] = isNextPartArrayIndex ? [] : {};
              console.log(`[${requestId}] 🏗️ Created missing ${isNextPartArrayIndex ? 'array' : 'object'} at ${pathParts.slice(0, i + 1).join('.')}`);
            }
            
            current = current[part];
          }
          
          // Get the target property name
          const targetProp = pathParts[pathParts.length - 1];
          
          // Apply the action
          switch (updateKeyCommand.action) {
            case 'append':
              // For arrays, append the new values
              if (!current[targetProp]) {
                current[targetProp] = [];
              } else if (!Array.isArray(current[targetProp])) {
                // Convert to array if not already
                current[targetProp] = [current[targetProp]];
              }
              
              // Handle both single value and array of values
              if (Array.isArray(updateKeyCommand.value)) {
                current[targetProp] = [...current[targetProp], ...updateKeyCommand.value];
              } else {
                current[targetProp].push(updateKeyCommand.value);
              }
              
              console.log(`[${requestId}] ✅ Appended to ${updateKeyCommand.path}, new length: ${current[targetProp].length}`);
              break;
              
            case 'replace':
              // Replace the value entirely
              current[targetProp] = updateKeyCommand.value;
              console.log(`[${requestId}] ✅ Replaced ${updateKeyCommand.path}`);
              break;
              
            case 'merge':
              // For objects, deep merge properties
              if (!current[targetProp] || typeof current[targetProp] !== 'object') {
                current[targetProp] = {};
              }
              
              current[targetProp] = deepMerge(current[targetProp], updateKeyCommand.value);
              
              console.log(`[${requestId}] ✅ Merged into ${updateKeyCommand.path}`);
              // Log the structure after merge
              console.log(`[${requestId}] 📊 Structure after merge:`, JSON.stringify(current[targetProp]));
              break;
              
            default:
              console.warn(`[${requestId}] ⚠️ Unknown action: ${updateKeyCommand.action}`);
          }
          
          // Update metadata
          updatedReport.metadata.lastUpdated = new Date().toISOString();
          updatedReport.metadata.version = (updatedReport.metadata.version || 0) + 1;
          
          console.log(`[${requestId}] ✅ Successfully applied update_key command`);
          
          // Log the final affected section
          const sectionPath = updateKeyCommand.path.split('.')[0]; // Get top-level section
          const updatedSection = updatedReport[sectionPath];
          console.log(`[${requestId}] 📊 Updated section structure:`, JSON.stringify(updatedSection).substring(0, 200) + '...');
          
          return NextResponse.json({
            report: updatedReport,
            command: updateKeyCommand,
            affectedDomain
          });
          
        } catch (error) {
          console.error(`[${requestId}] ❌ Error applying update_key command:`, error);
          return NextResponse.json({
            error: 'Failed to apply update_key command',
            details: error instanceof Error ? error.message : 'Unknown error',
            command: updateKeyCommand
          }, { status: 400 });
        }
      } else if (finalCommand) {
        console.log(`[${requestId}] 🔄 Processing ${finalCommand.command} command...`);
        // Get Claude's analysis of which domain/section to update
        let affectedDomain = '';
        let updatedReport = { ...report };
        
        if (sectionToUpdate === 'auto-detect') {
          // Extract domain from Claude's response text
          const textContent = claudeResponse.content
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text)
            .join('\n');
          
          // Extract domain from text - look for specific patterns like "pragmatic domain" or "update the pragmatic"
          console.log(`[${requestId}] 🔍 Analyzing text for domain keywords...`);
          
          // List of domain keywords to search for
          const domainKeywords = ['receptive', 'expressive', 'pragmatic', 'articulation', 'voice', 'fluency'];
          let foundDomain = '';
          
          // First look for the path pattern in JSON commands
          const pathRegex = /"path":\s*"assessmentResults\.domains\.([^."]+)"/;
          const pathMatch = textContent.match(pathRegex);
          
          if (pathMatch && pathMatch[1]) {
            foundDomain = pathMatch[1];
            console.log(`[${requestId}] 🔍 Found domain in JSON path: "${foundDomain}"`);
          } else {
            // Check for domain keywords in the text
            for (const domain of domainKeywords) {
              const pattern = new RegExp(`\\b${domain}\\b`, 'i');
              if (pattern.test(textContent)) {
                console.log(`[${requestId}] 🔍 Found domain keyword in text: "${domain}"`);
                foundDomain = domain;
                break;
              }
            }
          }
          
          affectedDomain = foundDomain;
          
          console.log(`[${requestId}] 🔍 Auto-detected domain: ${affectedDomain || 'none detected'}`);
          console.log(`[${requestId}] 📝 Text content for domain detection:`, textContent);
        } else if (sectionToUpdate.startsWith('assessmentResults.domains.')) {
          affectedDomain = sectionToUpdate.split('.')[2];
          console.log(`[${requestId}] 🎯 Using specified domain: ${affectedDomain}`);
        }
        
        if (finalCommand.command === 'str_replace') {
          console.log(`[${requestId}] 🔄 Processing str_replace command...`);
          console.log(`[${requestId}] ⚠️ Note: str_replace is being used instead of the recommended update_key command`);
          let updatedContent = '';
          
          try {
            // First, check if the str_replace command is targeting a specific domain
            // We need to detect this by seeing if the old_str contains specific domain JSON
            const strContainsDomainPattern = Object.keys(report.assessmentResults.domains).some(domain => {
              const pattern = `"${domain}":\\s*{`;
              const regex = new RegExp(pattern, 'i');
              return regex.test(finalCommand.old_str || '');
            });
            
            console.log(`[${requestId}] 🔍 Command contains domain pattern in old_str: ${strContainsDomainPattern}`);
            
            // If we've auto-detected a domain and it exists in the report
            if (affectedDomain && report.assessmentResults.domains[affectedDomain]) {
              console.log(`[${requestId}] 🔄 Updating specific domain: ${affectedDomain}`);
              
              // Check if Claude's str_replace is directly targeting this domain section
              if (finalCommand.old_str && finalCommand.old_str.includes(`"${affectedDomain}"`)) {
                console.log(`[${requestId}] 🎯 Direct match: Claude's command targets ${affectedDomain} domain`);
                
                // Implement a more careful search and replace for the specific domain
                // Start with the full report JSON
                const fullReportJson = JSON.stringify(report, null, 2);
                
                // Find the domain section in the JSON
                const domainPattern = new RegExp(`(\\s*"${affectedDomain}"\\s*:\\s*{[^}]*})`, 's');
                const domainMatch = fullReportJson.match(domainPattern);
                
                if (domainMatch) {
                  console.log(`[${requestId}] ✅ Found domain section in JSON`);
                  
                  // Replace just the domain section
                  updatedContent = fullReportJson.replace(
                    domainMatch[0], 
                    finalCommand.new_str.trim()
                  );
                  
                  try {
                    // Parse the complete updated report
                    updatedReport = JSON.parse(updatedContent);
                    console.log(`[${requestId}] ✅ Successfully replaced domain section in full report`);
                  } catch (parseError) {
                    console.error(`[${requestId}] ❌ JSON parse error after domain replacement:`, parseError);
                    
                    // Fallback to updating just the domain section
                    const domainSection = JSON.parse(JSON.stringify(report.assessmentResults.domains[affectedDomain]));
                    const domainJson = JSON.stringify(domainSection, null, 2);
                    
                    try {
                      // Try to extract just the domain object from Claude's new_str
                      const domainObjectMatch = finalCommand.new_str.match(/{\s*"topicSentence".*}/s);
                      if (domainObjectMatch) {
                        const newDomainSection = JSON.parse(domainObjectMatch[0]);
                        updatedReport = updateDomainSection(report, affectedDomain, newDomainSection);
                        console.log(`[${requestId}] ✅ Fallback: Updated domain section via extraction`);
                      } else {
                        throw new Error('Could not extract domain object from new_str');
                      }
                    } catch (extractError) {
                      console.error(`[${requestId}] ❌ Failed to extract domain object:`, extractError);
                      return NextResponse.json({
                        error: 'Failed to update report - invalid JSON format',
                        details: {
                          originalError: parseError.message,
                          extractError: extractError.message
                        }
                      }, { status: 400 });
                    }
                  }
                } else {
                  console.error(`[${requestId}] ❌ Could not find domain section in JSON`);
                  
                  // Fallback to updating via domain object
                  const domainSection = JSON.parse(JSON.stringify(report.assessmentResults.domains[affectedDomain]));
                  console.log(`[${requestId}] 📊 Original domain section:`, domainSection);
                  
                  // Manually construct an updated domain section based on the content
                  const extractedContent = {};
                  
                  // Try to extract topic sentence
                  const tsMatch = finalCommand.new_str.match(/"topicSentence":\s*"([^"]*)"/);
                  if (tsMatch) extractedContent['topicSentence'] = tsMatch[1];
                  
                  // Try to extract strengths/evidence (simplified)
                  const strengthsMatch = finalCommand.new_str.match(/"strengths":\s*\[(.*?)\]/s);
                  if (strengthsMatch) {
                    try {
                      extractedContent['strengths'] = JSON.parse(`[${strengthsMatch[1]}]`);
                    } catch (e) {
                      console.warn(`[${requestId}] ⚠️ Could not parse strengths`, e);
                    }
                  }
                  
                  // Try to extract needs/challenges (simplified)
                  const needsMatch = finalCommand.new_str.match(/"needs":\s*\[(.*?)\]/s);
                  if (needsMatch) {
                    try {
                      extractedContent['needs'] = JSON.parse(`[${needsMatch[1]}]`);
                    } catch (e) {
                      console.warn(`[${requestId}] ⚠️ Could not parse needs`, e);
                    }
                  }
                  
                  // Update the domain with the extracted content
                  updatedReport = updateDomainSection(report, affectedDomain, extractedContent);
                  console.log(`[${requestId}] ✅ Used extraction to update domain section`);
                }
              } else {
                // Standard domain section update
                const domainSection = JSON.parse(JSON.stringify(report.assessmentResults.domains[affectedDomain]));
                console.log(`[${requestId}] 📊 Original domain section:`, domainSection);
                
                console.log(`[${requestId}] 🔄 Applying str_replace:`, {
                  old_str_length: finalCommand.old_str?.length || 0,
                  new_str_length: finalCommand.new_str?.length || 0
                });
                
                // Instead of a general replace, we'll try to improve the domain directly
                if (finalCommand.new_str && finalCommand.new_str.includes('"topicSentence"')) {
                  // Try to extract JSON structure from the new string
                  const jsonMatch = finalCommand.new_str.match(/({[\s\S]*})/);
                  if (jsonMatch) {
                    try {
                      // Parse the JSON from the new string
                      const updatedDomainSection = JSON.parse(jsonMatch[1]);
                      // Update the specific domain in the report
                      updatedReport = updateDomainSection(report, affectedDomain, updatedDomainSection);
                      console.log(`[${requestId}] ✅ Successfully extracted and updated domain JSON`);
                    } catch (jsonError) {
                      console.error(`[${requestId}] ❌ Error parsing extracted JSON:`, jsonError);
                      // Fallback to standard replacement
                      updatedContent = JSON.stringify(domainSection).replace(finalCommand.old_str || '', finalCommand.new_str || '');
                      const updatedDomainSection = JSON.parse(updatedContent);
                      updatedReport = updateDomainSection(report, affectedDomain, updatedDomainSection);
                    }
                  } else {
                    // No JSON structure found, use standard replacement
                    updatedContent = JSON.stringify(domainSection).replace(finalCommand.old_str || '', finalCommand.new_str || '');
                    const updatedDomainSection = JSON.parse(updatedContent);
                    updatedReport = updateDomainSection(report, affectedDomain, updatedDomainSection);
                  }
                } else {
                  // Standard replacement
                  updatedContent = JSON.stringify(domainSection).replace(finalCommand.old_str || '', finalCommand.new_str || '');
                  const updatedDomainSection = JSON.parse(updatedContent);
                  updatedReport = updateDomainSection(report, affectedDomain, updatedDomainSection);
                }
                
                console.log(`[${requestId}] ✅ Domain section updated successfully`);
              }
            } else if (strContainsDomainPattern) {
              // We detected a domain pattern in the str_replace command, so try to extract the domain name
              console.log(`[${requestId}] 🔎 Trying to extract domain from str_replace command...`);
              
              let extractedDomain = '';
              for (const domain of Object.keys(report.assessmentResults.domains)) {
                if (finalCommand.old_str?.includes(`"${domain}"`)) {
                  extractedDomain = domain;
                  break;
                }
              }
              
              if (extractedDomain) {
                console.log(`[${requestId}] 🔍 Extracted domain from command: ${extractedDomain}`);
                affectedDomain = extractedDomain;
                
                // Now update using the full report update, then re-process with the correct domain
                updatedContent = JSON.stringify(report, null, 2).replace(finalCommand.old_str || '', finalCommand.new_str || '');
                try {
                  updatedReport = JSON.parse(updatedContent);
                  console.log(`[${requestId}] ✅ Updated report with extracted domain: ${extractedDomain}`);
                } catch (parseError) {
                  console.error(`[${requestId}] ❌ Parse error with extracted domain update:`, parseError);
                  
                  // Fallback to just updating the domain section
                  const domainSection = JSON.parse(JSON.stringify(report.assessmentResults.domains[extractedDomain]));
                  const updatedDomainSection = {
                    ...domainSection,
                    topicSentence: finalCommand.new_str.match(/"topicSentence":\s*"([^"]*)"/)?.[1] || domainSection.topicSentence,
                    strengths: [...(domainSection.strengths || []), normalizedInput]
                  };
                  updatedReport = updateDomainSection(report, extractedDomain, updatedDomainSection);
                }
              } else {
                // Fall back to full report update
                console.log(`[${requestId}] 🔄 Updating entire report (domain pattern found but couldn't extract domain)`);
                updatedContent = JSON.stringify(report, null, 2).replace(finalCommand.old_str || '', finalCommand.new_str || '');
                updatedReport = JSON.parse(updatedContent);
              }
            } else {
              // For whole report updates or other sections
              if (sectionToUpdate === 'auto-detect') {
                console.log(`[${requestId}] 🔄 Updating entire report (no specific domain identified)`);
                // Full report update
                updatedContent = JSON.stringify(report, null, 2).replace(finalCommand.old_str || '', finalCommand.new_str || '');
                updatedReport = JSON.parse(updatedContent);
                console.log(`[${requestId}] ✅ Full report updated successfully`);
              } else {
                console.log(`[${requestId}] 🔄 Updating specific non-domain section: ${sectionToUpdate}`);
                // Specific non-domain section update
                updatedContent = viewContent.replace(finalCommand.old_str || '', finalCommand.new_str || '');
                
                // This is simplified; you'd need to merge this into the right section
                // based on the sectionToUpdate path
                try {
                  updatedReport = { ...report };
                  // Simple path-based setter (would need a more robust version in production)
                  const pathParts = sectionToUpdate.split('.');
                  let current = updatedReport;
                  for (let i = 0; i < pathParts.length - 1; i++) {
                    current = current[pathParts[i]];
                  }
                  current[pathParts[pathParts.length - 1]] = JSON.parse(updatedContent);
                  console.log(`[${requestId}] ✅ Specific section updated successfully: ${sectionToUpdate}`);
                } catch (e) {
                  console.error(`[${requestId}] ❌ Error updating specific path:`, e);
                }
              }
            }
          } catch (parseError) {
            console.error(`[${requestId}] ❌ Error parsing updated JSON:`, parseError);
            console.log(`[${requestId}] 📋 Problem content:`, updatedContent);
            return NextResponse.json({
              error: 'Invalid JSON produced by text editor command',
              originalCommand: finalCommand,
              parseError: parseError.message
            }, { status: 400 });
          }
          
          // Update metadata
          const originalTimestamp = updatedReport.metadata.lastUpdated;
          updatedReport.metadata.lastUpdated = new Date().toISOString();
          updatedReport.metadata.version = (updatedReport.metadata.version || 0) + 1;
          
          console.log(`[${requestId}] 📊 Metadata updated:`, { 
            oldTimestamp: originalTimestamp,
            newTimestamp: updatedReport.metadata.lastUpdated,
            newVersion: updatedReport.metadata.version 
          });
          
          console.log(`[${requestId}] ✅ Report update complete, returning response`);
          return NextResponse.json({
            report: updatedReport,
            command: finalCommand,
            affectedDomain
          });
        } else if (finalCommand.command === 'insert') {
          console.log(`[${requestId}] ⚠️ Insert command not fully implemented`);
          // Handle insert command - this would be more complex and depends on your specific needs
          // For simplicity in this demo, we'll just acknowledge it
          return NextResponse.json({
            report,
            error: 'Insert command not fully implemented yet',
            command: finalCommand
          });
        }
      }
      
      // If no tool command found, return the original report
      console.log(`[${requestId}] ⚠️ No tool command found in Claude's response, returning original report`);
      return NextResponse.json({
        report,
        error: 'Claude did not provide a JSON update command'
      });
      
    } catch (apiError) {
      console.error(`[${requestId}] ❌ Error calling Claude API:`, apiError);
      
      // Fallback for testing without API
      console.log(`[${requestId}] ⚠️ Using fallback mode for testing`);
      const updatedReport = { ...report };
      
      // Simple domain detection based on keywords
      const inputLower = input?.toLowerCase() || '';
      let targetDomain = 'articulation';
      
      if (inputLower.includes('understand') || inputLower.includes('follow') || inputLower.includes('direction')) {
        targetDomain = 'receptive';
      } else if (inputLower.includes('express') || inputLower.includes('vocabulary') || inputLower.includes('sentence')) {
        targetDomain = 'expressive';
      } else if (inputLower.includes('social') || inputLower.includes('eye contact') || inputLower.includes('peer')) {
        targetDomain = 'pragmatic';
      } else if (inputLower.includes('sound') || inputLower.includes('pronounce') || inputLower.includes('intelligible')) {
        targetDomain = 'articulation';
      }
      
      console.log(`[${requestId}] 🔍 Fallback detected domain: ${targetDomain}`);
      
      // Create a simulated update
      const updates: Partial<DomainSection> = {
        strengths: [input]
      };
      
      if (!updatedReport.assessmentResults.domains[targetDomain].topicSentence) {
        updates.topicSentence = `Student demonstrates challenges in ${targetDomain} language skills.`;
      }
      
      const simulatedReport = updateDomainSection(updatedReport, targetDomain, updates);
      console.log(`[${requestId}] ✅ Simulated update applied to domain: ${targetDomain}`);
      
      return NextResponse.json({
        report: simulatedReport,
        apiError: apiError instanceof Error ? apiError.message : 'API call failed',
        simulated: true,
        affectedDomain: targetDomain
      });
    }
  } catch (error) {
    console.error(`[${requestId}] ❌ Error processing text editor request:`, error);
    return NextResponse.json(
      { error: 'Failed to process the request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    console.log(`[${requestId}] 🏁 REQUEST COMPLETED: Text Editor API`);
  }
}