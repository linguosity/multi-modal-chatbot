import { NextRequest, NextResponse } from 'next/server';
import { AssessmentTool, getAssessmentToolById } from '@/lib/assessment-tools';
import { SpeechLanguageReport, DomainSection } from '@/types/reportTypes';
import { normalizeInput, createReportSkeleton, deepMerge, updateDomainSection } from '@/lib/reportUtils';

/**
 * API endpoint that implements batch processing with Claude's Message Batches API
 */
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  console.log(`[${requestId}] 🚀 Batch API request started`);

  try {
    // Extract and validate input
    const { input, report: existingReport, updateSection, pdfData } = await request.json();
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

    // Use provided report or create default skeleton
    const report: SpeechLanguageReport = existingReport || createReportSkeleton();
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
      
      // === Token Counting ===
      let tokenCount = 0;
      try {
        console.log(`[${requestId}] 🧮 Counting tokens...`);
        const tokenCountPayload = {
          model: "claude-3-7-sonnet-20250219",
          system: "You are an expert educational speech-language pathologist.",
          messages: [{ role: "user", content: normalizedInput }]
        };
        
        const tokenCountResponse = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify(tokenCountPayload)
        });
        
        if (!tokenCountResponse.ok) {
          const errorData = await tokenCountResponse.json();
          console.error(`[${requestId}] ❌ Token counting failed:`, errorData);
          // Don't throw, just use an estimated token count instead
          tokenCount = Math.ceil(normalizedInput.length / 4); // Rough estimate: 4 chars per token
          console.log(`[${requestId}] ⚠️ Using estimated token count: ${tokenCount}`);
        } else {
          const tokenCountResult = await tokenCountResponse.json();
          tokenCount = tokenCountResult.input_tokens;
          console.log(`[${requestId}] 🧮 Token count:`, tokenCount);
        }
      } catch (tokenError) {
        // If token counting fails, estimate based on input length
        console.error(`[${requestId}] ❌ Token counting error:`, tokenError);
        tokenCount = Math.ceil(normalizedInput.length / 4); // Rough estimate: 4 chars per token
        console.log(`[${requestId}] ⚠️ Using estimated token count: ${tokenCount}`);
      }
      
      // === Build Batch Payload ===
      // If no specific section is provided, update all major sections.
      const sections = updateSection 
        ? updateSection.includes(',') 
            ? updateSection.split(',').map(s => s.trim()) 
            : [updateSection]
        : ["header", "background", "assessmentResults", "conclusion"];
      
      console.log(`[${requestId}] 🎯 Target sections: [${sections.join(', ')}]`);
      
      // Create content block for user message based on input type
      let userContentBlock: any;
      
      if (isPdfUpload) {
        // PDF document content
        userContentBlock = [
          {
            type: "text",
            text: `I need to update the speech-language report based on the content in this PDF document.`
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
        // Plain text content
        userContentBlock = [
          {
            type: "text",
            text: `I need to update the speech-language report based on this new information: "${normalizedInput}"`
          }
        ];
      }
      
      const requestsArray = sections.map(section => {
        // If section is a path like "assessmentResults.domains.receptive", extract the main section
        const mainSection = section.split('.')[0];
        const sectionJson = JSON.stringify(
          // If section is a path, traverse to the specific subsection
          section.includes('.') 
            ? section.split('.').reduce((obj, key) => obj?.[key], report)
            : report[section], 
          null, 2
        );
        
        // Create a contextual system prompt for this section
        let sectionPrompt: string;
        
        switch (mainSection) {
          case 'header':
            sectionPrompt = `You are an expert speech-language pathologist updating the student information and referral reasons.
Focus on extracting factual information like names, dates, and demographic details.
DO NOT create fictional details if they're not in the input.`;
            break;
          case 'background':
            sectionPrompt = `You are an expert speech-language pathologist updating background information.
Focus on educational history, health information, family details, and parent concerns.
Be thorough and clinically accurate, but stay objective and factual.`;
            break;
          case 'assessmentResults':
            sectionPrompt = `You are an expert speech-language pathologist updating assessment results.
When analyzing test results, note specific scores, strengths, and areas of need.
For language domains, extract the specific evidence and impact on educational performance.
If assessment tools are mentioned, add them to the appropriate domain sections.`;
            break;
          case 'conclusion':
            sectionPrompt = `You are an expert speech-language pathologist finalizing conclusions and recommendations.
Only identify domains as areas of concern when clear evidence supports it.
Be specific with recommendations for therapy frequency, service type, and setting.
Include only evidence-based recommendations appropriate for educational settings.`;
            break;
          default:
            sectionPrompt = `You are an expert speech-language pathologist updating the report section: ${section}.
Be specific, objective, and clinically accurate based only on the information provided.`;
        }
        
        // Use a consistent format for custom_id that matches what we expect in the status endpoint
        const customId = `update-${section}`;
        console.log(`[${requestId}] 📝 Creating batch request with custom_id: ${customId} for section: ${section}`);
        
        return {
          custom_id: customId,
          params: {
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 1024,
            system: `${sectionPrompt}

INSTRUCTIONS:
1. Analyze the input information and update the section JSON appropriately
2. Return your response as an update_key JSON command in this format:

\`\`\`json
{
  "command": "update_key",
  "path": "${section}",
  "action": "merge",
  "value": { updated content as JSON }
}
\`\`\`

Where:
- path: The exact JSON path to update
- action: Use "append" for arrays, "replace" for text fields, or "merge" for objects
- value: The new content, properly formatted as JSON

DO NOT use the text editor tool. ONLY respond with a properly formatted update_key JSON command.`,
            messages: [
              {
                role: "user",
                content: [
                  ...userContentBlock,
                  {
                    type: "text",
                    text: `Here is the current ${section} section JSON:
\`\`\`json
${sectionJson}
\`\`\`

Please update this section based on the information I provided.
Respond ONLY with an update_key JSON command.`
                  }
                ]
              }
            ]
          }
        };
      });
      
      // Log the mapping of custom_ids to sections for debugging
      const customIdMapping = requestsArray.map(req => `${req.custom_id} → ${req.custom_id.replace('update-', '')}`);
      console.log(`[${requestId}] 🔍 Custom ID mapping: ${customIdMapping.join(', ')}`);
      
      const batchPayload = { requests: requestsArray };
      console.log(`[${requestId}] 📦 Preparing batch with ${requestsArray.length} requests`);
      
      // === Submit Batch Request ===
      console.log(`[${requestId}] 🔌 Submitting batch request to Anthropic...`);
      
      // Define batchResponse outside the try block so it's accessible later
      let batchResponse;
      let batchResult;
      
      try {
        batchResponse = await fetch("https://api.anthropic.com/v1/messages/batches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify(batchPayload)
        });
        
        if (!batchResponse.ok) {
          // Try to get detailed error info if available
          try {
            const errorData = await batchResponse.json();
            console.error(`[${requestId}] ❌ Batch processing failed:`, errorData);
            
            // Check if there's an error with the API key or permissions
            if (batchResponse.status === 401 || batchResponse.status === 403) {
              throw new Error(`API authentication error: ${errorData.error || 'Invalid API key or permissions'}`);
            }
            
            throw new Error(JSON.stringify(errorData.error) || "Batch processing failed");
          } catch (parseError) {
            // If we can't parse the error response, return a generic error
            console.error(`[${requestId}] ❌ Failed to parse batch error response:`, parseError);
            throw new Error(`Batch API error: ${batchResponse.status} ${batchResponse.statusText}`);
          }
        }
        
        // Process successful response
        try {
          batchResult = await batchResponse.json();
        } catch (parseError) {
          console.error(`[${requestId}] ❌ Failed to parse batch response:`, parseError);
          throw new Error('Failed to parse batch response');
        }
      } catch (batchError) {
        // Handle network errors or other exceptions
        console.error(`[${requestId}] ❌ Batch request error:`, batchError);
        
        // Fall back to simulated response
        console.log(`[${requestId}] ⚠️ Falling back to simulated batch mode due to API error`);
        
        // Create a simulated batch ID using the request ID
        // Note: In a real API, the batch ID would start with msgbatch_ prefix
        // but for our simulation, we use simulated_ to distinguish it
        const simulatedBatchId = `simulated_${requestId}`;
        
        return NextResponse.json({
          batch: {
            id: simulatedBatchId,
            status: 'running',
            requestCount: sections.length,
            sections: sections,
            created: new Date().toISOString(),
            simulated: true
          },
          tokenCount: tokenCount,
          requestId: requestId,
          message: 'Using simulated batch due to API error'
        });
      }
      
      // If we reach here, we have a valid batchResult
      
      // Safely log and extract batch info, with fallbacks for unexpected response structure
      const batchId = batchResult?.id || 'unknown';
      const requestCount = batchResult?.requests?.length || 0;
      const batchStatus = batchResult?.status || 'unknown';
      const batchCreated = batchResult?.created || new Date().toISOString();
      
      console.log(`[${requestId}] ✅ Batch created, ID: ${batchId}, ${requestCount} requests`);
      
      // We successfully got a response from Anthropic's API!
      // Ensure the batch ID is a valid Anthropic batch ID (should start with msgbatch_)
      if (!batchId.startsWith('msgbatch_')) {
        console.warn(`[${requestId}] ⚠️ Unexpected batch ID format from Anthropic: ${batchId}`);
        console.warn(`[${requestId}] ⚠️ Batch IDs should start with 'msgbatch_'. Using simulated batch instead.`);
        
        // Fall back to simulated mode if Anthropic returned an unexpected batch ID format
        const simulatedBatchId = `simulated_${requestId}`;
        return NextResponse.json({
          batch: {
            id: simulatedBatchId,
            status: 'running',
            requestCount: sections.length,
            sections: sections,
            created: new Date().toISOString(),
            simulated: true
          },
          tokenCount: tokenCount,
          requestId: requestId,
          message: 'Using simulated batch due to unexpected ID format'
        });
      }
      
      // Return the details for a valid Anthropic batch
      return NextResponse.json({
        batch: {
          id: batchId,          // This should now always be a valid msgbatch_ ID
          status: batchStatus,
          requestCount: requestCount,
          sections: sections,
          created: batchCreated
        },
        tokenCount: tokenCount,
        requestId: requestId
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
    console.error(`[${requestId}] ❌ Error processing batch request:`, error);
    return NextResponse.json(
      { error: 'Failed to process the request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    console.log(`[${requestId}] 🏁 Batch API request completed`);
  }
}