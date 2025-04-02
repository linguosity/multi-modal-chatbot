import { NextRequest, NextResponse } from 'next/server';
import { claudeProvider } from '@/lib/claudeProvider';

/**
 * API endpoint to update report sections using Claude's text editor tool
 */
export async function POST(request: NextRequest) {
  try {
    // Extract request parameters
    const { input, sections, pdfData } = await request.json();

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

    console.log('📝 CLAUDE API REQUEST:');
    if (input) console.log('- Input:', input);
    if (pdfData) console.log('- PDF Data:', 'Included (base64 string)');
    console.log('- Current sections keys:', Object.keys(sections));

    let updatedSections;

    // Determine which provider method to use based on input type
    if (pdfData) {
      // PDF processing mode
      updatedSections = await claudeProvider.updateReportSectionsFromPDF(pdfData, sections);
    } else {
      // Text input mode
      updatedSections = await claudeProvider.updateReportSections(input, sections);
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
    console.error('Error processing report update with Claude:', error);
    return NextResponse.json(
      { error: 'Failed to process the report update' },
      { status: 500 }
    );
  }
}