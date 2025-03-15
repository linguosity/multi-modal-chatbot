import React, { useState, useCallback, memo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getSectionDisplayName } from '@/lib/report-utils';
import { InfoIcon, List, AlignLeft } from 'lucide-react';
import { useReportStore } from '@/lib/store';

/**
 * Component for updating report sections using AI
 */
function SmartReportUpdaterComponent() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState<string[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [outputMode, setOutputMode] = useState<'paragraph' | 'list'>('paragraph');
  
  // Get sections and actions from the store
  // Using selectors to minimize re-renders
  const sections = useReportStore(state => state.sections);
  const mergeSections = useReportStore(state => state.mergeSections);
  
  // Toggle output mode
  const toggleOutputMode = useCallback(() => {
    setOutputMode(prev => prev === 'paragraph' ? 'list' : 'paragraph');
  }, []);
  
  // Memoize the form submission handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);
    setRecentlyUpdated([]);

    try {
      const response = await fetch('/api/update-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          sections,
          mode: outputMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update report');
      }

      const responseData = await response.json();
      const updatedData = responseData.sections || responseData;
      
      // Clean up metadata format keys before sending to store
      const cleanedData = Object.entries(updatedData).reduce((acc, [key, value]) => {
        // Skip metadata format keys as they're handled separately
        if (!key.endsWith('_format')) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      // Update the store with the new sections
      const changedSections = mergeSections(cleanedData);
      
      // Track which sections were updated for UI feedback
      setRecentlyUpdated(changedSections);
      
      // Clear the input field
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error updating report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [input, sections, mergeSections, outputMode]);

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Smart Report Updater</CardTitle>
          <CardDescription>
            Add observations or assessment data and AI will update the relevant report sections
          </CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          title="Toggle debug info"
        >
          <InfoIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: Student demonstrates fronting of /k/ and /g/ sounds"
              className="pr-24"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Spinner className="h-4 w-4" />
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-red-500 mt-1">{error}</div>
          )}
          
          {recentlyUpdated.length > 0 && (
            <div className="text-sm text-green-600 mt-1">
              ✓ Updated sections: {recentlyUpdated.map(getSectionDisplayName).join(', ')}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleOutputMode}
                title={outputMode === 'paragraph' ? "Switch to bullet points mode" : "Switch to paragraph mode"}
              >
                {outputMode === 'paragraph' ? (
                  <>
                    <AlignLeft className="h-4 w-4 mr-2" />
                    Paragraphs
                  </>
                ) : (
                  <>
                    <List className="h-4 w-4 mr-2" />
                    Bullet Points
                  </>
                )}
              </Button>
            </div>
            
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? 'Updating...' : 'Update Report'}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        {showDebugInfo ? (
          <div className="w-full">
            <div className="bg-gray-50 p-2 rounded text-xs font-mono">
              <p>Active Sections: {Object.keys(sections).length}</p>
              <p>Examples to try:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>"Student produces /t/ for /k/ and /d/ for /g/ in all word positions"</li>
                <li>"Parent reports concerns about stuttering during class presentations"</li>
                <li>"Student struggles to follow multi-step directions in the classroom"</li>
                <li>"Assessment using GFTA-3 showed scores in the 15th percentile"</li>
              </ul>
            </div>
          </div>
        ) : (
          <p>The AI will only update sections that are directly relevant to your input, preserving all other content.</p>
        )}
      </CardFooter>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const SmartReportUpdater = memo(SmartReportUpdaterComponent);