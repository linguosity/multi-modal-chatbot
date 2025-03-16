import React, { useState, useEffect, ReactNode } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

// Import icons
import { Pencil, Save, X, FileText } from 'lucide-react';

export interface ToggleEditCardProps {
  title: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  viewComponent?: ReactNode;
  editComponent?: ReactNode;
  renderEditMode?: (props: {
    value: string;
    onChange: (value: string) => void;
  }) => ReactNode;
  renderViewMode?: (props: { content: string }) => ReactNode;
  className?: string;
  compact?: boolean;
  icon?: ReactNode;
}

export function ToggleEditCard({
  title,
  initialContent = '',
  onSave,
  viewComponent,
  editComponent,
  renderEditMode,
  renderViewMode,
  className = '',
  compact = false,
  icon = <FileText className="h-5 w-5" />
}: ToggleEditCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [tempContent, setTempContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset temp content when switching to edit mode
  useEffect(() => {
    if (isEditing) {
      setTempContent(content);
      setHasChanges(false);
    }
  }, [isEditing, content]);

  const handleChange = (value: string) => {
    setTempContent(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    setContent(tempContent);
    if (onSave) {
      onSave(tempContent);
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setTempContent(content);
    setIsEditing(false);
    setHasChanges(false);
  };

  // Apply flex column layout if the card has the aspect ratio class
  const hasAspectRatio = className.includes('aspect-square');

  return (
    <Card 
      className={`mb-4 transition-all duration-200 ${
        isEditing ? 'border border-blue-500' : ''
      } ${className} ${hasAspectRatio ? 'flex flex-col' : ''} hover:shadow-md group`}
    >
      <CardHeader className={`flex flex-row items-center justify-between ${compact ? 'py-3 px-4' : 'py-4 px-5'}`}>
        <div className="flex items-center gap-2">
          <div className="text-primary/80">
            {icon}
          </div>
          <h3 className={`${compact ? 'text-base' : 'text-lg'} font-medium`}>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                className="h-8 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel</span>
              </Button>
              
              <Button 
                variant={hasChanges ? "outline" : "ghost"}
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges}
                className={`h-8 ${hasChanges ? 'text-blue-600 border-blue-300 hover:bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Save className="h-4 w-4" />
                <span className="sr-only">Save</span>
              </Button>
            </div>
          ) : (
            <Toggle 
              pressed={isEditing}
              onPressedChange={setIsEditing}
              variant="ghost"
              size="sm"
              className="edit-toggle h-8 w-8 p-0 rounded-full hover:bg-gray-100 hover:text-blue-500 focus:outline-none"
              aria-label="Toggle edit mode"
            >
              <Pencil className="h-4 w-4" />
            </Toggle>
          )}
        </div>
      </CardHeader>

      <CardContent className={`${compact ? 'p-4 pt-0' : 'p-5 pt-0'} ${hasAspectRatio ? 'flex-grow' : ''}`}>
        {isEditing ? (
          <div className="editing-interface">
            {editComponent ? (
              editComponent
            ) : renderEditMode ? (
              renderEditMode({
                value: tempContent,
                onChange: handleChange,
              })
            ) : (
              <textarea
                className={`w-full ${hasAspectRatio ? 'h-full flex-grow' : 'min-h-[150px]'} p-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-sm`}
                value={tempContent}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Enter content here..."
                style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
              />
            )}
          </div>
        ) : (
          <div className="preview">
            {viewComponent ? (
              viewComponent
            ) : renderViewMode ? (
              renderViewMode({ content })
            ) : content ? (
              <div className={`whitespace-pre-wrap ${hasAspectRatio ? 'h-full' : ''}`}>{content}</div>
            ) : (
              <div className="text-gray-400 italic">No content yet. Click pencil icon to edit.</div>
            )}
          </div>
        )}
      </CardContent>

      {isEditing && (
        <CardFooter className="flex justify-end gap-2 pt-1 pb-3 px-4 border-t">
          {hasChanges && (
            <div className="text-xs text-blue-500 mr-auto">
              <span className="animate-pulse">●</span> Unsaved changes
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}