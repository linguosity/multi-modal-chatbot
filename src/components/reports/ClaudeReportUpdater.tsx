import { useState, useCallback, memo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getSectionDisplayName } from '@/lib/report-utilities';
import { InfoIcon, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { useReportStore } from '@/lib/store';
import { PdfUploader } from './PdfUploader';
import { useClaudeReportUpdater } from '@/hooks/useClaudeReportUpdater';

/**
 * Smart report updater using Claude's text editor tool
 */
function ClaudeReportUpdaterComponent() {
  const [input, setInput] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isClaudeEnabled, setIsClaudeEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  
  // Get sections from store to initialize our updater hook
  const initialSections = useReportStore(state => state.sections);
  const mergeSections = useReportStore(state => state.mergeSections);
  
  // Use our Claude-enabled report updater hook
  const {
    sections,
    isUpdating,
    lastUpdated,
    error,
    updateMethod,
    updateReportWithText,
    updateReportWithPDF
  } = useClaudeReportUpdater(initialSections);
  
  // Toggle Claude API usage
  const toggleClaudeAPI = useCallback(() => {
    setIsClaudeEnabled(prev => !prev);
  }, []);
  
  // Handle form submission for text input
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isUpdating) return;
    
    try {
      // Call the update function with the current text input
      const updatedSections = await updateReportWithText(input, {
        useClaudeAPI: isClaudeEnabled
      });
      
      // Update the global store with the new sections
      mergeSections(sections);
      
      // Clear the input field on success
      setInput('');
    } catch (err) {
      // Error already handled by the hook
      console.error('Error in form submission:', err);
    }
  }, [input, isUpdating, updateReportWithText, isClaudeEnabled, sections, mergeSections]);
  
  // Handle PDF upload
  const handlePdfUpload = useCallback(async (pdfData: string) => {
    try {
      // Process the PDF with Claude
      await updateReportWithPDF(pdfData);
      
      // Update the global store with the new sections
      mergeSections(sections);
    } catch (err) {
      // Error already handled by the hook
      console.error('Error processing PDF:', err);
    }
  }, [updateReportWithPDF, sections, mergeSections]);

  return (
    <Card className="mb-6 shadow-sm border-0 overflow-hidden">
      <CardHeader className="bg-white border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CardTitle className="text-lg font-medium">
              Claude Editor
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
                  disabled={isUpdating} 
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
              <li>• "Student scored in the 15th percentile on GFTA-3 with consistent final consonant deletion"</li>
              <li>• "Parent reports concerns about stuttering during class presentations"</li>
              <li>• "Student follows 2-step directions when given visual supports"</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const ClaudeReportUpdater = memo(ClaudeReportUpdaterComponent);