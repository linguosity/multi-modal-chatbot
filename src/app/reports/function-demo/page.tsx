'use client';

import { useState, useCallback } from 'react';
import { SmartReportUpdater } from '@/components/reports/SmartReportUpdater';
import { ReportSectionsList } from '@/components/reports/ReportSectionsList';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoIcon, RefreshCw, PlusCircle, Trash2 } from 'lucide-react';
import { useReportStore } from '@/lib/store';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getSectionDisplayName } from '@/lib/report-utils';

// Example content for demo sections
const EXAMPLE_SECTIONS = {
  parentConcern: 'According to parent report, their primary concerns include articulation errors and difficulties being understood by peers.',
  articulation: 'Student demonstrates age-appropriate articulation skills with some developmental errors.'
};

export default function FunctionDemoPage() {
  // Debug state
  const [debugMode, setDebugMode] = useState(false);
  
  // Access the global report store with selectors to minimize re-renders
  const sections = useReportStore(state => state.sections);
  const updateSection = useReportStore(state => state.updateSection);
  const mergeSections = useReportStore(state => state.mergeSections);
  const resetSections = useReportStore(state => state.resetSections);
  const highlightSections = useReportStore(state => state.highlightSections);

  // Add some example sections to demonstrate the functionality
  const addExampleSections = useCallback(() => {
    // Reset first to start fresh
    resetSections();
    
    // Add the example sections
    mergeSections(EXAMPLE_SECTIONS);
    
    if (debugMode) {
      console.log('📝 ADDED EXAMPLE SECTIONS:', Object.keys(EXAMPLE_SECTIONS));
    }
  }, [resetSections, mergeSections, debugMode]);
  
  // Create a new empty section
  const addEmptySection = useCallback((sectionKey: string) => {
    updateSection(sectionKey, 'New section content. Click Edit to modify.');
    highlightSections([sectionKey]);
    
    if (debugMode) {
      console.log('📝 ADDED EMPTY SECTION:', sectionKey);
    }
  }, [updateSection, highlightSections, debugMode]);
  
  // Toggle debug mode
  const toggleDebugMode = useCallback(() => {
    setDebugMode(prev => !prev);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Function Calling Demo (Zustand Version)</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates how to use OpenAI function calling with Zustand state management for structured report updates.
      </p>

      <div className="grid grid-cols-1 gap-6">
        {/* The SmartReportUpdater now connects directly to the Zustand store */}
        <SmartReportUpdater />

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Report Sections</h2>
          
          <div className="flex gap-2">
            {/* Debug Toggle */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleDebugMode}
              title={debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
            >
              <InfoIcon className="h-4 w-4 mr-2" />
              {debugMode ? "Debug: ON" : "Debug: OFF"}
            </Button>
            
            {/* Add Example Sections */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={addExampleSections}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Examples
            </Button>
            
            {/* Clear All Sections */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetSections}
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            
            {/* Add Section Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {['parentConcern', 'receptiveLanguage', 'expressiveLanguage', 
                  'pragmaticLanguage', 'articulation', 'fluency', 'voice', 
                  'assessmentData', 'conclusion', 'recommendations']
                  .filter(key => !sections[key])
                  .map(key => (
                    <DropdownMenuItem key={key} onClick={() => addEmptySection(key)}>
                      {getSectionDisplayName(key)}
                    </DropdownMenuItem>
                  ))
                }
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <p className="text-muted-foreground mb-4">
          Only populated sections are displayed. {Object.keys(sections).length === 0 && 
          "Click 'Add Examples' to see how sections appear, or enter observations in the Smart Report Updater above."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ReportSectionsList now connects directly to the Zustand store */}
          <ReportSectionsList 
            addSectionExample={addExampleSections}
            emptyMessage="No report sections yet. Click 'Add Examples' or enter observations in the Smart Report Updater above."
            debug={debugMode}
          />
        </div>

        {/* Debug Information Card */}
        {debugMode && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded">
                <p>Total Sections: {Object.keys(sections).length}</p>
                <p>Section Keys: {Object.keys(sections).join(', ')}</p>
                <div>
                  <p>Current Store State:</p>
                  <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded mt-2 max-h-40">
                    {JSON.stringify(sections, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              Using OpenAI function calling with Zustand for structured report updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter assessment data or clinical observations in the input field above</li>
              <li>The API uses function calling to determine which sections to update</li>
              <li>Updated sections are stored in the Zustand store and shared across components</li>
              <li>Only the relevant sections are modified and displayed</li>
              <li>Empty sections are automatically hidden from view</li>
              <li>Updated sections are briefly highlighted to show what changed</li>
              <li>You can manually add new report sections from the dropdown</li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              Try entering: "Student produces /t/ for /k/ and /d/ for /g/ in all word positions" or
              "Parent reports no concerns with speech production but notes difficulty following multi-step directions"
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}