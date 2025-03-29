import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, BookOpen } from 'lucide-react';
import { AssessmentToolManager } from './AssessmentToolManager';
import { AssessmentTool } from '@/lib/assessment-tools';

/**
 * A panel component that provides an interface to search and add assessment tools to a report
 */
export function AssessmentLibraryPanel({
  onAddTool,
  selectedDomain
}: {
  onAddTool?: (tool: AssessmentTool) => void;
  selectedDomain?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  // Function to handle selecting a tool from the library
  const handleSelectTool = (tool: AssessmentTool) => {
    if (onAddTool) {
      onAddTool(tool);
    }
    // Optionally close the panel after selection
    // setIsVisible(false);
  };

  return (
    <>
      {/* Floating button to open the panel */}
      {!isVisible && (
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            onClick={() => setIsVisible(true)}
            className="rounded-full h-12 w-12 shadow-lg bg-purple-600 hover:bg-purple-700"
            data-assessment-library-trigger="true"
          >
            <BookOpen className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Assessment tools panel */}
      {isVisible && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto shadow-xl">
            <CardHeader className="sticky top-0 bg-white z-10 border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Assessment Tools Library</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsVisible(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Search, manage, and add assessment tools to your report
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <AssessmentToolManager 
                onSelectTool={handleSelectTool}
                selectedDomain={selectedDomain}
              />
            </CardContent>
            
            <CardFooter className="border-t pt-3 bg-gray-50 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsVisible(false)}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}