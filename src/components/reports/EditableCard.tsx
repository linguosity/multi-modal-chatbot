// FILE: EditableCard.tsx (Version 5: Checkmark + Send Backward Effect)
'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, List, FileText, Check, CheckCircle } from "lucide-react";
import { motion, PanInfo } from "framer-motion"; // <-- Import PanInfo if using onDragEnd type annotation
import { cn } from "@/lib/utils";

export interface EditableCardProps {
  id?: string;
  title: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  onToggleSynthesis?: (id: string) => void;
  hasSynthesis?: boolean;
  synthesisContent?: string;
  initialIsMarkedDone?: boolean;
  onToggleMarkedDone?: (id: string, isDone: boolean) => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  viewComponent?: ReactNode;
  editComponent?: ReactNode;
  renderEditMode?: (props: {
    value: string;
    onChange: (value: string) => void;
  }) => ReactNode;
  renderViewMode?: (props: { content: string }) => ReactNode;
   // Add prop to disable internal hover if needed when stacked
  disableHoverEffect?: boolean;
}

export function EditableCard({
  id = '',
  title,
  initialContent = '',
  onSave,
  onToggleSynthesis,
  hasSynthesis = false,
  synthesisContent = '',
  initialIsMarkedDone = false,
  onToggleMarkedDone,
  className = "",
  headerClassName = "",
  contentClassName = "",
  viewComponent,
  editComponent,
  renderEditMode,
  renderViewMode,
  disableHoverEffect = false // Default to hover enabled
}: EditableCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [tempContent, setTempContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [isMarkedDone, setIsMarkedDone] = useState(initialIsMarkedDone);

  // Update internal state when props change
  useEffect(() => {
    if (!isEditing) {
      setContent(initialContent);
      setTempContent(initialContent);
      setHasChanges(false);
    }
  }, [initialContent]);

  // Update internal marked state if prop changes
  useEffect(() => {
    setIsMarkedDone(initialIsMarkedDone);
  }, [initialIsMarkedDone]);

  // Reset temp content when entering edit mode
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

  const handleEdit = () => {
    setIsEditing(true);
    setShowSynthesis(false);
  };

  const handleToggleSynthesis = () => {
    if (!isEditing) {
      const nextShowSynthesis = !showSynthesis;
      setShowSynthesis(nextShowSynthesis);
      if (nextShowSynthesis && onToggleSynthesis && id) {
        onToggleSynthesis(id);
      }
    }
  };

  const handleToggleMarkedDone = () => {
    const nextState = !isMarkedDone;
    setIsMarkedDone(nextState);
    onToggleMarkedDone?.(id, nextState);
  };


  return (
    // Removed outer div mb-6, margin should be handled by parent stack/layout
    // <div className="w-full mb-6">
      <motion.div
          // Conditionally disable hover lift effect based on prop
          whileHover={!isEditing && !isMarkedDone && !disableHoverEffect ? { y: -2, scale: 1.005 } : {}}
          // Apply scale/opacity effect only when marked done AND NOT editing
          animate={{
            scale: isMarkedDone && !isEditing ? 0.95 : 1,
            opacity: isMarkedDone && !isEditing ? 0.85 : 1,
            rotateX: 0, rotateY: 0, z: 0,
          }}
          transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
          className="relative h-full w-full" // Added h-full w-full
      >
        <Card
          className={cn(
            "border transition-colors duration-300 ease-out overflow-hidden h-full flex flex-col", // Added h-full flex flex-col
            isEditing ? "border-blue-500 shadow-md" : "border-gray-200 shadow-sm",
            className // Allow parent to pass styles (like min-height)
          )}
        >
          <CardHeader className={cn(
              "p-4 flex flex-row items-center justify-between border-b bg-white border-b-gray-100 shrink-0", // Added shrink-0
              headerClassName
              )}>
            <CardTitle className="text-base font-medium text-gray-800">
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Mark as Done Toggle Button */}
              <Button size="icon" variant="ghost" onClick={handleToggleMarkedDone} title={isMarkedDone ? "Unmark as done" : "Mark as done"} className={cn( "transition-all hover:scale-110", isMarkedDone && "text-green-600" )}>
                {isMarkedDone ? <CheckCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </Button>
              {/* Synthesis Toggle Button */}
              {onToggleSynthesis && id && ( <Button size="icon" variant={showSynthesis ? "secondary" : "ghost"} onClick={handleToggleSynthesis} title={showSynthesis ? "Show bulleted content" : "Show paragraph synthesis"} disabled={isEditing} className={cn( showSynthesis && !isEditing && "text-blue-500 bg-blue-50", "transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" )}> {showSynthesis ? <List className="h-4 w-4" /> : <FileText className="h-4 w-4" />} </Button> )}
              {/* Edit Button */}
              <Button size="icon" variant="ghost" onClick={handleEdit} title="Edit content" disabled={isEditing} className={cn( "transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" )}> <Pencil className="h-4 w-4" /> </Button>
            </div>
          </CardHeader>

          <CardContent className={cn(
              "p-4 text-sm grow overflow-y-auto", // Added grow and overflow
              isEditing ? "bg-gray-50" : "",
              contentClassName
              )}>
             {isEditing ? (
              <div className="editing-interface h-full"> {/* Ensure edit interface fills space */}
                 {editComponent ? ( editComponent ) : renderEditMode ? ( renderEditMode({ value: tempContent, onChange: handleChange, }) ) : ( <textarea className="w-full h-full p-2 border rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none" value={tempContent} onChange={(e) => handleChange(e.target.value)} placeholder="Enter content here..."/> )}
                 {(!editComponent) && ( <div className="flex justify-end gap-2 pt-2"> <Button variant="outline" size="sm" onClick={handleCancel}> Cancel </Button> <Button className="bg-blue-500 hover:bg-blue-600" size="sm" onClick={handleSave} disabled={!hasChanges}> Save Changes </Button> </div> )}
              </div>
            ) : (
              <div>
                 {showSynthesis ? ( <div className="prose prose-sm max-w-none"> {hasSynthesis && synthesisContent ? ( <div className="whitespace-pre-wrap">{synthesisContent}</div> ) : ( <div className="text-gray-400 italic">No synthesis available yet.</div> )} </div> ) : ( <div> {viewComponent ? ( viewComponent ) : renderViewMode ? ( renderViewMode({ content }) ) : content ? ( <div className="whitespace-pre-wrap">{content}</div> ) : ( <div className="text-gray-400 italic">No content yet. Click edit to add content.</div> )} </div> )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    // </div> // Removed outer div mb-6
  );
}

export default EditableCard;