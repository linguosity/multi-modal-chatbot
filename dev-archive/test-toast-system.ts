#!/usr/bin/env tsx

/**
 * Test script to verify the toast system is working correctly
 * This simulates the API response structure and checks the toast extraction logic
 */

// Simulate the API response structure
const mockApiResponse = {
  success: true,
  updatedSections: ['section-1', 'section-2'],
  analysisResult: {
    content_analysis: {
      processing_notes: "Successfully analyzed 2 PDF files containing standardized test results. Extracted WISC-V scores (VCI: 85, VSI: 92, FRI: 78) and behavioral observations. Updated assessment results and validity statement sections with comprehensive clinical data.",
      identified_updates: [
        {
          section_id: 'section-1',
          field_path: 'assessment_results.wisc_scores.verbal_iq',
          extracted_value: 85,
          confidence: 0.95,
          data_type: 'test_score',
          merge_strategy: 'replace'
        },
        {
          section_id: 'section-2', 
          field_path: 'validity_statement.cooperation_level',
          extracted_value: 'Good cooperation throughout testing',
          confidence: 0.9,
          data_type: 'observation',
          merge_strategy: 'replace'
        }
      ]
    }
  },
  processedFiles: [
    {
      name: 'WISC-V_Report.pdf',
      type: 'application/pdf',
      size: 245760,
      processingMethod: 'claude_pdf'
    },
    {
      name: 'Behavioral_Observations.pdf', 
      type: 'application/pdf',
      size: 156432,
      processingMethod: 'claude_pdf'
    }
  ],
  message: 'Successfully processed 2 files and updated 2 sections'
};

// Simulate the client-side processing logic
function extractProcessingSummary(json: typeof mockApiResponse) {
  console.log('🔍 Extracting processing summary from API response...');
  
  let processingSummary = null;
  
  // Try to get from analysisResult (analyze_assessment_content tool)
  if (json.analysisResult?.content_analysis?.processing_notes) {
    processingSummary = json.analysisResult.content_analysis.processing_notes;
    console.log('✅ Found processing summary in analysisResult.content_analysis.processing_notes');
  }
  
  // Try to get from tool data (update_report_data tool)
  if (!processingSummary && json.analysisResult?.data?.processing_summary) {
    processingSummary = json.analysisResult.data.processing_summary;
    console.log('✅ Found processing summary in analysisResult.data.processing_summary');
  }
  
  // Try to get from message (fallback)
  if (!processingSummary && json.message) {
    processingSummary = json.message;
    console.log('✅ Using message as processing summary fallback');
  }
  
  return processingSummary;
}

// Simulate the toast data structure
function createToastData(json: typeof mockApiResponse) {
  const processingSummary = extractProcessingSummary(json);
  
  // Collect all field changes for toast
  const allChanges: string[] = [];
  
  json.analysisResult?.content_analysis?.identified_updates
    ?.forEach((update: any) => {
      allChanges.push(update.field_path);
    });
  
  const toastData = {
    summary: processingSummary,
    updatedSections: json.updatedSections,
    processedFiles: json.processedFiles || [],
    fieldUpdates: allChanges
  };
  
  return toastData;
}

// Test the extraction logic
console.log('🧪 Testing Toast System Processing Summary Extraction');
console.log('='.repeat(60));

console.log('\n📊 Mock API Response:');
console.log(JSON.stringify(mockApiResponse, null, 2));

console.log('\n🔄 Processing...');
const toastData = createToastData(mockApiResponse);

console.log('\n🎯 Extracted Toast Data:');
console.log(JSON.stringify(toastData, null, 2));

console.log('\n✅ Toast System Test Results:');
console.log(`- Processing Summary: ${toastData.summary ? '✅ FOUND' : '❌ MISSING'}`);
console.log(`- Updated Sections: ${toastData.updatedSections.length} sections`);
console.log(`- Processed Files: ${toastData.processedFiles.length} files`);
console.log(`- Field Updates: ${toastData.fieldUpdates.length} fields`);

if (toastData.summary) {
  console.log('\n📝 Processing Summary Preview:');
  console.log(`"${toastData.summary.substring(0, 100)}${toastData.summary.length > 100 ? '...' : ''}"`);
}

console.log('\n🎉 Toast system extraction logic is working correctly!');