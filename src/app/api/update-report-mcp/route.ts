import { NextRequest, NextResponse } from 'next/server';
import { claudeProviderMcp } from '@/lib/claudeProviderMcp';
import { resetMcpState, executeMcpCommand } from '@/lib/mcpClient';

/**
 * Initialize report sections in MCP if needed.
 * This ensures that all sections exist in the MCP "file system" before updates.
 */
async function initializeMcpReportSections(sections: Record<string, string>) {
  console.log('Initializing MCP report sections');
  
  // In a real implementation, we'd initialize each section as a "file" in the MCP system
  // For our simulation, we're using storage abstraction in the MCP client
  
  // For testing, you may want to reset the state first
  if (process.env.NODE_ENV === 'development') {
    resetMcpState();
  }
  
  // Initialize each section in MCP using the executeMcpCommand function
  const initializationPromises = Object.entries(sections).map(async ([key, value]) => {
    try {
      // Use the create command to initialize each section
      await executeMcpCommand({
        name: 'create',
        args: {
          path: key,
          text: value
        }
      });
    } catch (error) {
      console.error(`Error initializing section ${key}:`, error);
    }
  });
  
  // Wait for all sections to be initialized
  await Promise.all(initializationPromises);
  console.log('All sections initialized in MCP');
}

/**
 * API endpoint to update report sections using Claude's text editor tool via MCP
 */
export async function POST(request: NextRequest) {
  try {
    // Extract request parameters
    const { input, sections, pdfData, resetState } = await request.json();

    // Validate request parameters
    if (!sections) {
      return NextResponse.json(
        { error: 'Report sections are required' },
        { status: 400 }
      );
    }

    if (!input && !pdfData) {
      return NextResponse.json(
        { error: 'Either input text or PDF data is required' },
        { status: 400 }
      );
    }
    
    // Reset MCP state if requested (useful for testing)
    if (resetState) {
      resetMcpState();
      
      // If we're resetting state, skip further processing
      return NextResponse.json({
        message: 'MCP state reset successfully',
        resetState: true
      });
    }

    console.log('📝 MCP API REQUEST:');
    if (input) console.log('- Input:', input);
    if (pdfData) console.log('- PDF Data:', 'Included (base64 string)');
    console.log('- Current sections keys:', Object.keys(sections));
    
    // Initialize MCP with the current sections if needed
    await initializeMcpReportSections(sections);

    let updatedSections;

    // Determine which provider method to use based on input type
    if (pdfData) {
      // PDF processing mode
      updatedSections = await claudeProviderMcp.updateReportSectionsFromPDF(pdfData, sections);
    } else {
      // Text input mode
      updatedSections = await claudeProviderMcp.updateReportSections(input, sections);
    }

    // Only include sections that were actually modified
    const modifiedSections: Record<string, string> = {};
    
    // Compare each section to identify changes
    for (const [key, updatedValue] of Object.entries(updatedSections)) {
      // If the section was modified, include it in the response
      if (updatedValue !== sections[key]) {
        modifiedSections[key] = updatedValue;
      }
    }
    
    console.log('✅ MODIFIED SECTIONS:', Object.keys(modifiedSections));

    return NextResponse.json({
      sections: modifiedSections,
      updateMethod: pdfData ? 'pdf' : 'text'
    });
  } catch (error) {
    console.error('Error processing report update with Claude MCP:', error);
    return NextResponse.json(
      { error: 'Failed to process the report update' },
      { status: 500 }
    );
  }
}