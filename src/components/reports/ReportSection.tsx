import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, FileText } from 'lucide-react';

export interface ReportSectionProps {
  title: string;
  initialContent?: string;
  initialStructuredData?: Record<string, any>;
  onContentChange?: (content: string) => void;
  onStructuredDataChange?: (data: Record<string, any>) => void;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function ReportSection({
  title,
  initialContent = '',
  initialStructuredData = {},
  onContentChange,
  onStructuredDataChange,
  children,
  icon = <FileText className="h-5 w-5" />
}: ReportSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [structuredData, setStructuredData] = useState(initialStructuredData);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [tempContent, setTempContent] = useState(initialContent);

  // Reset temp content when switching to edit mode
  useEffect(() => {
    if (isEditing) {
      setTempContent(content);
    }
  }, [isEditing, content]);

  const handleContentChange = (newContent: string) => {
    setTempContent(newContent);
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    setContent(tempContent);
    setIsEditing(false);
    setUnsavedChanges(false);
    if (onContentChange) {
      onContentChange(tempContent);
    }
  };

  const handleCancel = () => {
    setTempContent(content);
    setIsEditing(false);
    setUnsavedChanges(false);
  };

  const handleStructuredDataChange = (newData: Record<string, any>) => {
    setStructuredData(newData);
    if (onStructuredDataChange) {
      onStructuredDataChange(newData);
    }
  };

  return (
    <Card className={`mb-6 transition-all duration-200 ${isEditing ? 'border-2 border-blue-400 shadow-md' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
        <div className="flex items-center gap-2">
          <div className="text-primary/80">
            {icon}
          </div>
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        {!isEditing && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="edit-toggle"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </CardHeader>
      
      <CardContent className={`p-5 pt-0 ${isEditing ? 'bg-gray-50' : ''}`}>
        {isEditing ? (
          <div className="editing-interface">
            {children ? children : (
              <textarea
                className="w-full min-h-[150px] p-3 border rounded focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={tempContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Enter content here..."
              />
            )}
          </div>
        ) : (
          <div className="preview">
            {content ? (
              <div className="whitespace-pre-wrap">{content}</div>
            ) : (
              <div className="text-gray-400 italic">No content yet. Click edit to add content.</div>
            )}
          </div>
        )}
      </CardContent>
      
      {isEditing && (
        <CardFooter className="flex justify-end gap-2 pt-1 pb-4 px-5">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={handleSave}
            disabled={!unsavedChanges}
          >
            Save
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}