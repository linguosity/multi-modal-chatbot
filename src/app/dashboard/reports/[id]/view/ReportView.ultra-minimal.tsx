'use client';
import React from 'react';

interface ReportViewProps {
  report: any;
}

export default function ReportView({ report }: ReportViewProps) {
  console.log("🔍 Step 5: Ultra-minimal ReportView component rendering started");
  
  try {
    console.log("🔍 Step 6: Testing with report data:", {
      id: report.id,
      title: report.title,
      hasMetadata: !!report.metadata,
      sectionsCount: report.sectionsCount
    });
    
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white">
        <h1 className="text-2xl font-bold mb-4">{report.title || 'Ultra-Minimal Report Test'}</h1>
        <p className="text-gray-600 mb-6">Report ID: {report.id}</p>
        <p className="text-gray-600 mb-6">Sections Count: {report.sectionsCount}</p>
        <p className="text-gray-600 mb-6">Has Metadata: {report.metadata ? 'Yes' : 'No'}</p>
        
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Test: Basic Section Structure</h2>
            <div className="text-sm text-gray-500 mb-2">
              Testing if basic section structure contains circular references
            </div>
            <div className="bg-gray-50 p-2 rounded text-xs">
              {report.sections ? `${report.sections.length} sections loaded safely` : 'No sections'}
            </div>
          </div>
          
          {report.sections?.map((section: any) => (
            <div key={section.id} className="border rounded-lg p-4">
              <h3 className="text-md font-semibold mb-2">{section.title}</h3>
              <div className="text-sm text-gray-500 mb-2">
                Type: {section.sectionType} | Index: {section.index}
              </div>
              <div className="bg-gray-50 p-2 rounded text-xs">
                [Basic section data - no content or structured_data yet]
              </div>
            </div>
          )) || <p>No sections to display</p>}
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Error during ultra-minimal component execution:", error);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Ultra-Minimal Component Error</h1>
        <p className="text-gray-600">
          Error in ultra-minimal component. Check console.
        </p>
      </div>
    );
  }
}