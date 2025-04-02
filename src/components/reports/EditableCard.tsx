import React, { useState, useEffect, ReactNode } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface EditableCardProps {
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
}

export function EditableCard({
  title,
  initialContent = '',
  onSave,
  viewComponent,
  editComponent,
  renderEditMode,
  renderViewMode
}: EditableCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [tempContent, setTempContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);

  // Update internal state when props change - makes component controlled
  useEffect(() => {
    // Only update if not currently editing to avoid losing unsaved changes
    if (!isEditing) {
      setContent(initialContent);
      setTempContent(initialContent);
    }
  }, [initialContent, isEditing]);

  // Reset temp content when switching to edit mode
  useEffect(() => {
    if (isEditing) {
      setTempContent(content);
      setHasChanges(false);
    }
  }, [isEditing, content]);

  const handleChange = (value: string) => {
    setTempContent(value);
    setHasChanges(value !== content);
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

  return (
    <Card 
      className={`mb-4 transition-all duration-200 ${
        isEditing ? 'border-2 border-blue-400 shadow-md' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
        <h3 className="text-lg font-medium">{title}</h3>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="edit-toggle"
          >
            Edit
          </Button>
        )}
      </CardHeader>

      <CardContent className={`p-5 pt-0 ${isEditing ? 'bg-gray-50' : ''}`}>
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
                className="w-full min-h-[150px] p-3 border rounded focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={tempContent}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Enter content here..."
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
              <div className="whitespace-pre-wrap">{content}</div>
            ) : (
              <div className="text-gray-400 italic">No content yet. Click edit to add content.</div>
            )}
          </div>
        )}
      </CardContent>

      {isEditing && (
        <CardFooter className="flex justify-end gap-2 pt-1 pb-4 px-5">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}