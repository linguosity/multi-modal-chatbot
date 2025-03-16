import React, { useState, useCallback, memo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getSectionDisplayName } from '@/lib/report-utils';
import { InfoIcon, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { PdfUploader } from './PdfUploader';
import { useMcpReportUpdater } from '@/hooks/useMcpReportUpdater';

/**
 * Smart report updater using Claude's text editor tool with MCP
 */
function McpReportUpdaterComponent() {
  const [input, setInput] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isClaudeEnabled, setIsClaudeEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  
  // Use our MCP report updater hook
  const {
    sections,
    isUpdating,
    lastUpdated,
    error,
    updateMethod,
    updateReportWithText,
    updateReportWithPDF,
    resetState
  } = useMcpReportUpdater({
    parentConcern: "Parent reports that the student has difficulty with speech clarity and frustration when not understood.",
    pragmaticLanguage: "Student demonstrates appropriate eye contact and turn-taking during structured activities.",
    receptiveLanguage: "Student follows simple 1-2 step directions with occasional need for repetition.",
    expressiveLanguage: "Student uses 3-4 word sentences to communicate basic needs and wants.",
    articulation: "Student demonstrates multiple phonological processes including fronting and stopping that affect overall intelligibility.",
    assessmentData: "Formal testing is scheduled for next week.",
    recommendations: "Weekly speech therapy sessions are recommended to address articulation errors."
  });
  
  // Toggle Claude API usage (in this demo it's just visual)
  const toggleClaudeAPI = useCallback(() => {
    setIsClaudeEnabled(prev => !prev);
  }, []);
  
  // Handle form submission for text input
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isUpdating) return;
    
    try {
      // Reset MCP state if configured to (useful for testing)
      // In production, you'd want to keep the state persistent
      // await resetState();
      
      // Call the update function with the current text input
      await updateReportWithText(input);
      
      // Clear the input field on success
      setInput('');
    } catch (err) {
      // Error already handled by the hook
      console.error('Error in form submission:', err);
    }
  }, [input, isUpdating, updateReportWithText]);
  
  // Handle PDF upload
  const handlePdfUpload = useCallback(async (pdfData: string) => {
    try {
      // Process the PDF with Claude and MCP
      await updateReportWithPDF(pdfData);
    } catch (err) {
      // Error already handled by the hook
      console.error('Error processing PDF:', err);
    }
  }, [updateReportWithPDF]);

  // Handle reset button click
  const handleReset = useCallback(async () => {
    await resetState();
  }, [resetState]);

  return (
    <Card className="mb-6 shadow-sm border-0 overflow-hidden">
      <CardHeader className="bg-white border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CardTitle className="text-lg font-medium">
              Claude MCP Editor
              {isClaudeEnabled && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Claude 3
                </span>
              )}
            </CardTitle>
            <div className="ml-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleClaudeAPI}
                title={isClaudeEnabled ? "Switch to OpenAI" : "Switch to Claude"}
                className="h-8 w-8 p-0 rounded-full"
              >
                {isClaudeEnabled ? (
                  <ToggleRight className="h-5 w-5 text-purple-600" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-gray-400" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              title="Reset MCP State"
              className="text-xs"
            >
              Reset
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              title="Toggle examples"
              className="h-8 w-8 p-0 rounded-full"
            >
              <InfoIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors
              ${activeTab === 'text' 
                ? 'text-purple-700 border-b-2 border-purple-700' 
                : 'text-gray-500 hover:text-purple-600'
              }`}
          >
            Text Input
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors
              ${activeTab === 'pdf' 
                ? 'text-purple-700 border-b-2 border-purple-700' 
                : 'text-gray-500 hover:text-purple-600'
              }`}
            disabled={!isClaudeEnabled}
          >
            PDF Upload
          </button>
        </div>
        
        <div className="p-4">
          {activeTab === 'text' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter a single observation or assessment result..."
                  className="border rounded-lg h-12 px-4 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isUpdating}
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isUpdating || !input.trim()} 
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 transition-colors"
                >
                  {isUpdating && updateMethod === 'text' ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Report'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <PdfUploader 
                onUpload={handlePdfUpload} 
                disabled={isUpdating || !isClaudeEnabled}
              />
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {lastUpdated.length > 0 && (
            <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md text-sm flex items-start">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mr-2 mt-0.5"
              >
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <div>
                <span className="font-medium">Updated:</span> {lastUpdated.map(getSectionDisplayName).join(', ')}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {showDebugInfo && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 p-3 rounded-md text-xs">
            <p className="font-medium mb-1">Try these examples:</p>
            <ul className="space-y-1 text-gray-700">
              <li className="cursor-pointer hover:text-purple-600" onClick={() => setInput("Student produced /t/ for /k/ and /d/ for /g/ in all word positions")}>
                • "Student produced /t/ for /k/ and /d/ for /g/ in all word positions"
              </li>
              <li className="cursor-pointer hover:text-purple-600" onClick={() => setInput("Parent reports concerns about stuttering during class presentations")}>
                • "Parent reports concerns about stuttering during class presentations"
              </li>
              <li className="cursor-pointer hover:text-purple-600" onClick={() => setInput("Student follows 2-step directions when given visual supports")}>
                • "Student follows 2-step directions when given visual supports"
              </li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="border-t p-4">
        <h3 className="font-medium text-gray-900 mb-2">Current Report Sections</h3>
        <div className="bg-white border rounded-md overflow-hidden">
          {Object.entries(sections).map(([key, value]) => (
            <div 
              key={key}
              className={`p-3 border-b last:border-b-0 transition-colors ${lastUpdated.includes(key) ? 'bg-green-50' : ''}`}
            >
              <h4 className="font-medium text-gray-900 text-sm mb-1">{getSectionDisplayName(key)}</h4>
              <p className="text-gray-700 text-xs leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const McpReportUpdater = memo(McpReportUpdaterComponent);