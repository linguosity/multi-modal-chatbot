import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface JsonViewerDialogProps {
  data: any;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Dialog component for displaying JSON data in a pretty-printed format
 */
export const JsonViewerDialog: React.FC<JsonViewerDialogProps> = ({ 
  data, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="max-w-3xl w-full m-4" onClick={(e) => e.stopPropagation()}>
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-white border-b flex flex-row justify-between items-center">
            <CardTitle className="text-lg font-medium">JSON Report Structure</CardTitle>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="bg-gray-50 p-4 rounded text-sm font-mono overflow-auto max-h-[600px]">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t py-2 flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default JsonViewerDialog;