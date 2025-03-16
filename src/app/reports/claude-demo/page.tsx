'use client';

import { ClaudeReportUpdater } from '@/components/reports/ClaudeReportUpdater';
import { ReportSectionsList } from '@/components/reports/ReportSectionsList';
import { DEFAULT_SECTIONS } from '@/lib/schemas/report';
import { useReportStore } from '@/lib/store';
import { useEffect } from 'react';

/**
 * Demonstration page for Claude-powered report generation
 */
export default function ClaudeDemoPage() {
  // Get store methods
  const setSections = useReportStore(state => state.setSections);
  const sections = useReportStore(state => state.sections);
  
  // Initial sections for the demo
  const initialSections = {
    parentConcern: "Parent reports that the student has difficulty with speech clarity and frustration when not understood.",
    pragmaticLanguage: "Student demonstrates appropriate eye contact and turn-taking during structured activities.",
    receptiveLanguage: "Student follows simple 1-2 step directions with occasional need for repetition.",
    expressiveLanguage: "Student uses 3-4 word sentences to communicate basic needs and wants.",
    articulation: "Student demonstrates multiple phonological processes including fronting and stopping that affect overall intelligibility.",
    assessmentData: "Formal testing is scheduled for next week.",
    recommendations: "Weekly speech therapy sessions are recommended to address articulation errors."
  };
  
  // Initialize store with the demo sections when the component mounts
  useEffect(() => {
    console.log("Initializing store with sections:", initialSections);
    setSections(initialSections);
  }, [setSections]);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-medium mb-2">Claude Report Generator</h1>
        <p className="text-gray-600 text-sm">
          Enter a single observation or upload a PDF document to update your speech-language report.
        </p>
      </header>
      
      <div className="flex flex-col md:flex-row md:gap-6">
        <div className="w-full md:w-1/2 mb-6 md:mb-0">
          <ClaudeReportUpdater />
          
          <div className="bg-white rounded-lg p-4 border text-sm">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <svg className="mr-2 text-purple-600" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              How it works
            </h3>
            <ol className="space-y-2 text-gray-600 pl-5 list-decimal">
              <li>Enter a <strong>single data point</strong> (observation or assessment result)</li>
              <li>Claude uses the <strong>text editor tool</strong> to update only relevant sections</li> 
              <li>Changes are precise and <strong>preserve existing content</strong></li>
            </ol>
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="border-b px-4 py-3 flex justify-between items-center">
              <h2 className="font-medium text-gray-900">Current Report</h2>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Live Preview
              </span>
            </div>
            <div className="p-4">
              <ReportSectionsList initialSections={sections} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}