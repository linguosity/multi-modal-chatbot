import { NextRequest, NextResponse } from 'next/server';
import { openaiClient } from '@/lib/openai-config';

// Define constants for static prompt parts to improve caching
const SYSTEM_PROMPT = `You are an AI that updates speech-language pathology report sections based on user input. 

IMPORTANT GUIDELINES:
1. Modify only the sections that are directly relevant to the input
2. Maintain professional tone and terminology appropriate for educational speech-language reports
3. Synthesize information across sections when appropriate - connect assessment results with parent concerns
4. For each assessment result, explicitly note whether it confirms or contradicts parent reports
5. When adding information to a section, integrate it with existing content - don't simply append
6. Consider developmental norms and clinical significance when interpreting results
7. Be specific about the implications of findings for diagnosis and treatment planning
8. When in list mode, each bullet point should be a complete, informative statement

For example, if parent concerns mention articulation difficulties and test results confirm them, explicitly note the connection: "GFTA results (standard score 75) confirm parent concerns about speech clarity, revealing consistent final consonant deletion that affects intelligibility in conversation."

Your goal is to create a cohesive, integrated report that shows clinical reasoning and connects findings across different sections.`;

// Schema definitions for different modes
const getSchemaByMode = (mode: 'paragraph' | 'list') => {
  if (mode === 'list') {
    return {
      name: "update_sections_list",
      description: "Update only the report sections that are directly relevant to the user's input, returning each section as a list of bullet points.",
      parameters: {
        type: "object",
        properties: {
          parentConcern: { 
            type: "array", 
            description: "Updated parent/guardian concerns as bullet points related to communication difficulties.",
            items: { type: "string" }
          },
          receptiveLanguage: { 
            type: "array", 
            description: "Updated receptive language bullet points describing language comprehension abilities.",
            items: { type: "string" }
          },
          expressiveLanguage: { 
            type: "array", 
            description: "Updated expressive language bullet points describing language production abilities.",
            items: { type: "string" }
          },
          pragmaticLanguage: { 
            type: "array", 
            description: "Updated pragmatic language bullet points describing social communication skills.",
            items: { type: "string" }
          },
          articulation: { 
            type: "array", 
            description: "Updated articulation bullet points describing speech sound production.",
            items: { type: "string" }
          },
          fluency: { 
            type: "array", 
            description: "Updated fluency bullet points describing stuttering or speech flow.",
            items: { type: "string" }
          },
          voice: { 
            type: "array", 
            description: "Updated voice bullet points describing voice quality and resonance.",
            items: { type: "string" }
          },
          assessmentData: { 
            type: "array", 
            description: "Updated assessment data bullet points including test scores and observations.",
            items: { type: "string" }
          },
          conclusion: { 
            type: "array", 
            description: "Updated conclusion bullet points summarizing findings and eligibility.",
            items: { type: "string" }
          },
          recommendations: { 
            type: "array", 
            description: "Updated therapy recommendations bullet points based on assessment findings.",
            items: { type: "string" }
          }
        },
        required: []
      }
    };
  }
  
  // Default paragraph mode
  return {
    name: "update_sections",
    description: "Update only the report sections that are directly relevant to the user's input, maintaining paragraph form.",
    parameters: {
      type: "object",
      properties: {
        parentConcern: { 
          type: "string", 
          description: "Updated parent/guardian concerns section content related to communication difficulties." 
        },
        receptiveLanguage: { 
          type: "string", 
          description: "Updated receptive language section describing language comprehension abilities." 
        },
        expressiveLanguage: { 
          type: "string", 
          description: "Updated expressive language section describing language production abilities." 
        },
        pragmaticLanguage: { 
          type: "string", 
          description: "Updated pragmatic language section describing social communication skills." 
        },
        articulation: { 
          type: "string", 
          description: "Updated articulation section describing speech sound production." 
        },
        fluency: { 
          type: "string", 
          description: "Updated fluency section describing stuttering or speech flow." 
        },
        voice: { 
          type: "string", 
          description: "Updated voice section describing voice quality and resonance." 
        },
        assessmentData: { 
          type: "string", 
          description: "Updated assessment data including test scores and observations." 
        },
        conclusion: { 
          type: "string", 
          description: "Updated conclusion summarizing findings and eligibility." 
        },
        recommendations: { 
          type: "string", 
          description: "Updated therapy recommendations based on assessment findings." 
        }
      },
      required: []
    }
  };
};

export async function POST(request: NextRequest) {
  try {
    const { input, sections, mode = 'paragraph' } = await request.json();

    if (!input || !sections) {
      return NextResponse.json(
        { error: 'Input and sections are required' },
        { status: 400 }
      );
    }

    // Ensure mode is valid
    const outputMode = (mode === 'list' || mode === 'paragraph') ? mode : 'paragraph';

    console.log('📝 API REQUEST:');
    console.log('- Input:', input);
    console.log('- Mode:', outputMode);
    console.log('- Current sections:', JSON.stringify(sections, null, 2));

    // Format existing sections to include in the prompt in a more organized way
    const existingSectionsText = Object.entries(sections)
      .map(([key, value]) => {
        const sectionTitle = getSectionDisplayName(key);
        
        // Format value based on type (string or array)
        let formattedValue = '';
        if (Array.isArray(value)) {
          // Format array as numbered points
          formattedValue = value.map((item, index) => `  ${index + 1}. ${item}`).join('\n');
        } else {
          formattedValue = value;
        }
        
        return `# ${sectionTitle}:\n${formattedValue}`;
      })
      .join('\n\n');

    // Keep messages format consistent for better caching
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { 
        role: "user", 
        content: `
NEW INFORMATION TO INCORPORATE: "${input}"

${existingSectionsText ? `EXISTING REPORT SECTIONS:\n${existingSectionsText}` : 'No existing sections yet.'}

INSTRUCTIONS:
1. Update only those sections directly relevant to the new information
2. Synthesize new information with existing content - don't just append
3. Make explicit connections between parent concerns and assessment findings
4. Consider developmental expectations when interpreting results 
5. Be specific about clinical implications of findings
6. ${outputMode === 'list' ? 'Format your updates as bullet point lists with complete, informative statements.' : 'Format your updates as cohesive paragraphs that flow naturally.'}
7. Maintain professional clinical tone throughout
`
      }
    ];

    console.log('📤 REQUEST TO OPENAI:');
    console.log('- Messages:', JSON.stringify(messages, null, 2));
    console.log(`- Using function calling for structured updates (${outputMode} mode)`);

    // Get the appropriate schema based on mode
    const functionSchema = getSchemaByMode(outputMode);
    
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages,
      functions: [functionSchema],
      function_call: { name: functionSchema.name }
    });

    // Don't log the full response as it's too verbose
    console.log('📥 RESPONSE FROM OPENAI RECEIVED');

    // Extract function call results
    const functionCall = response.choices[0].message.function_call;
    
    if (functionCall && functionCall.name === functionSchema.name) {
      try {
        // Parse the function arguments as JSON
        const updatedSections = JSON.parse(functionCall.arguments);
        
        console.log('🔄 UPDATED SECTIONS FROM AI:');
        console.log(JSON.stringify(updatedSections, null, 2));
        
        // Only include non-empty values from the AI response
        const cleanUpdatedSections: Record<string, any> = {};
        
        // Log each section and whether it passes the filter
        console.log('🧹 CLEANING UPDATED SECTIONS:');
        Object.entries(updatedSections).forEach(([key, value]) => {
          let hasContent = false;
          
          if (outputMode === 'list' && Array.isArray(value)) {
            // List mode - check if array has non-empty items
            hasContent = value.length > 0 && value.some((item: string) => typeof item === 'string' && item.trim() !== '');
            console.log(`- Section "${key}": ${hasContent ? 'HAS CONTENT' : 'EMPTY'} (array with ${value.length} items)`);
          } else if (outputMode === 'paragraph' && typeof value === 'string') {
            // Paragraph mode - check if string has content
            hasContent = value.trim() !== '';
            console.log(`- Section "${key}": ${hasContent ? 'HAS CONTENT' : 'EMPTY'} (${typeof value}, ${value === "" ? "empty string" : value})`);
          }
          
          if (hasContent) {
            cleanUpdatedSections[key] = value;
            
            // Attach metadata to help client determine how to render
            if (outputMode === 'list' && Array.isArray(value)) {
              cleanUpdatedSections[`${key}_format`] = 'list';
            }
          }
        });
        
        console.log('✅ CLEAN UPDATED SECTIONS:');
        console.log(JSON.stringify(cleanUpdatedSections, null, 2));
        
        // Return only the sections with content
        return NextResponse.json({
          sections: cleanUpdatedSections,
          mode: outputMode
        });
      } catch (error) {
        console.error('Error parsing function call arguments:', error);
        return NextResponse.json(
          { error: 'Failed to parse AI response' },
          { status: 500 }
        );
      }
    } else {
      console.error('No function call in response or incorrect function name');
      return NextResponse.json(
        { error: 'Function call failed or returned unexpected format' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing report update:', error);
    return NextResponse.json(
      { error: 'Failed to process the report update' },
      { status: 500 }
    );
  }
}

// Helper function to get human-readable section names
function getSectionDisplayName(sectionKey: string): string {
  const displayNames: Record<string, string> = {
    parentConcern: 'Parent/Guardian Concerns',
    receptiveLanguage: 'Receptive Language',
    expressiveLanguage: 'Expressive Language',
    pragmaticLanguage: 'Pragmatic Language',
    articulation: 'Articulation',
    fluency: 'Fluency',
    voice: 'Voice',
    assessmentData: 'Assessment Data',
    conclusion: 'Conclusion',
    recommendations: 'Recommendations',
  };
  
  return displayNames[sectionKey] || sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}