import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AssessmentToolManager } from './AssessmentToolManager';
import { AssessmentTool } from '@/lib/assessments';

/**
 * A popover component that provides an interface to search and add assessment tools to a report
 */
export function AssessmentLibraryPanel({
  onAddTool,
  selectedDomain
}: {
  onAddTool?: (tool: AssessmentTool) => void;
  selectedDomain?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Function to handle selecting a tool from the library
  const handleSelectTool = (tool: AssessmentTool) => {
    if (onAddTool) {
      onAddTool(tool);
    }
    // Keep the popover open so users can add multiple tools
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50 ml-2"
          data-assessment-library-trigger="true"
        >
          <BookOpen className="h-4 w-4 mr-1" />
          Assessment Library
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[450px] max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-auto p-0"
        align="end"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={8}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="sticky top-0 bg-white z-10 border-b pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Assessment Tools Library</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Search, manage, and add assessment tools to your report
            </CardDescription>
          </CardHeader>

          <CardContent className="max-h-[70vh] overflow-auto p-2">
            <AssessmentToolManager 
              onSelectTool={handleSelectTool}
              selectedDomain={selectedDomain}
              isInPopover={true}
            />
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}