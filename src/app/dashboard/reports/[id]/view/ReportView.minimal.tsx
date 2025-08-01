'use client';
import React from 'react';
import { hasCircularReference, safeLog, safeStringify } from '@/lib/safe-logger';

interface ReportViewProps {
  report: any;
}

export default function ReportView({ report }: ReportViewProps) {
  console.log("🔍 Step 5: ReportView component rendering started");
  
  try {
    // Immediate circular reference check
    console.log("🔍 Step 5a: Checking for circular references in report props");
    if (hasCircularReference(report)) {
      console.error("❌ CIRCULAR REFERENCE DETECTED in ReportView props!");
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Circular Reference Error</h1>
          <p className="text-gray-600">
            The report data contains circular references that prevent rendering.
          </p>
        </div>
      );
    }
    
    console.log("✅ Step 5b: No circular references detected in ReportView props");
    
    // TEMPORARILY SKIP ALL LOGGING TO ISOLATE THE ISSUE
    console.log("🔍 Step 5c: Skipping detailed logging to isolate stack overflow");
    
    console.log("🔍 Step 6: About to render minimal JSX");
    
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white">
        <h1 className="text-2xl font-bold mb-4">Report Loading Test</h1>
        <p className="text-gray-600 mb-6">Basic rendering test - no complex data</p>
        
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Test Section</h2>
            <div className="text-sm text-gray-500 mb-2">
              This is a minimal test to isolate the stack overflow
            </div>
            <div className="bg-gray-50 p-2 rounded text-xs">
              [Minimal content for debugging]
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Error during component execution:", error);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Component Error</h1>
        <p className="text-gray-600">
          Error occurred during component execution. Check console for details.
        </p>
      </div>
    );
  }
}