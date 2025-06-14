// FILE: EditableCard.tsx (Corrected Structure: Header Pencil -> Modal)
'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, List, FileText, Check, CheckCircle, Wand2, Loader2 } from "lucide-react";
import EditorDialog from './text-editor/EditorDialog'; // Import EditorDialog
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface EditableCardProps {
    id?: string;
    title: string;
    initialContent?: string;
    onSave?: (content: string) => void; // Will be used by EditorDialog's onSave
    onToggleSynthesis?: (id: string) => void;
    onGenerateSynthesis?: (id: string, content: string) => Promise<string>;
    isLocked?: boolean;
    hasSynthesis?: boolean;
    synthesisContent?: string;
    isMarkedDone?: boolean;
    onToggleMarkedDone?: (id: string, isDone: boolean) => void;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    viewComponent?: ReactNode;
    // editComponent and renderEditMode are removed as we use EditorDialog
    onEditClick?: () => void; // For EXTERNAL modal trigger (like opening EditorDialog)
    disableHoverEffect?: boolean;
}

export function EditableCard({
    id = '',
    title,
    initialContent = '',
    onSave, // Prop for EditorDialog save
    onToggleSynthesis,
    onGenerateSynthesis,
    isLocked = false,
    hasSynthesis = false,
    synthesisContent = '',
    isMarkedDone = false,
    onToggleMarkedDone,
    className = "",
    headerClassName = "",
    contentClassName = "",
    viewComponent,
    // editComponent, // Removed
    // renderEditMode, // Removed
    onEditClick, // Prop for external modal trigger
    disableHoverEffect = false
}: EditableCardProps) {

    // State management
    const [content, setContent] = useState(initialContent);
    const [isEditorDialogOpen, setIsEditorDialogOpen] = useState(false); // New state for dialog
    const [showSynthesis, setShowSynthesis] = useState(false);
    const [generatingSynthesis, setGeneratingSynthesis] = useState(false); // Keep this if synthesis feature is separate

    // Effects to sync content
    useEffect(() => { setContent(initialContent); }, [initialContent]);


    // Other handlers
    const handleToggleSynthesis = () => { if (!isLocked) { const next = !showSynthesis; setShowSynthesis(next); if (next && onToggleSynthesis && id) { onToggleSynthesis(id); } } };
    const handleGenerateSynthesis = async () => { /* ... (keep existing logic) ... */ };
    const handleToggleMarkedDone = () => { if (onToggleMarkedDone && id !== undefined) { onToggleMarkedDone(id, !isMarkedDone); } };

    // Handler for the Header Pencil button
    const handleEditClickInternal = () => {
        if (isLocked) return;

        if (typeof onEditClick === 'function') {
            // If onEditClick prop is provided, call it (parent handles dialog)
            onEditClick();
        } else {
            // Otherwise, open the internal EditorDialog
            setIsEditorDialogOpen(true);
        }
    };

    // Handler for saving from EditorDialog
    const handleDialogSave = (newContent: string) => {
        setContent(newContent);
        if (onSave) {
            onSave(newContent); // Call the original onSave passed as prop
        }
        setIsEditorDialogOpen(false);
    };

    // Determine if any edit functionality is enabled for showing the header pencil
    // The pencil should be shown if the card is not locked, as it can always open its own dialog.
    const isAnyEditEnabled = !isLocked;

    return (
        <motion.div
            whileHover={!isMarkedDone && !disableHoverEffect ? { y: -2, scale: 1.005 } : {}}
            animate={{ scale: isMarkedDone ? 0.95 : 1, opacity: isMarkedDone ? 0.85 : 1 }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="relative h-full w-full"
        >
            <Card className={cn("border transition-colors duration-300 ease-out overflow-hidden h-full flex flex-col", "border-gray-200 shadow-sm", className)}>
                <CardHeader className={cn("p-4 flex flex-row items-center justify-between border-b bg-white border-b-gray-100 shrink-0", headerClassName)}>
                    <CardTitle className="text-base font-medium text-gray-800">
                        {showSynthesis ? "Summary" : title}
                    </CardTitle>
                    <div className="flex items-center gap-1 sm:gap-2">
                         {onToggleMarkedDone && (
                            <Button variant="ghost" size="icon" onClick={handleToggleMarkedDone} title={isMarkedDone ? "Mark as Incomplete" : "Mark as Complete"} className="h-7 w-7 sm:h-8 sm:w-8">
                                {isMarkedDone ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Check className="h-4 w-4" />}
                            </Button>
                         )}
                         {onToggleSynthesis && id && hasSynthesis && (
                             <Button variant="ghost" size="icon" onClick={handleToggleSynthesis} title={showSynthesis ? "Show Original" : "Show Summary"} className="h-7 w-7 sm:h-8 sm:w-8">
                                {showSynthesis ? <List className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                            </Button>
                         )}
                         {isAnyEditEnabled && ( // Pencil icon
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleEditClickInternal}
                                title="Edit"
                                disabled={isLocked} // Disable if locked
                                className={cn("h-7 w-7 sm:h-8 sm:w-8 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100")}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                         )}
                    </div>
                </CardHeader>

                <CardContent className={cn("p-4 text-sm grow overflow-y-auto", contentClassName)}>
                    {showSynthesis ? (
                        <div className="whitespace-pre-wrap text-xs">{synthesisContent || "No summary available."}</div>
                    ) : (
                        <div>
                            {viewComponent ? viewComponent :
                             content ? (<div className="whitespace-pre-wrap text-xs" dangerouslySetInnerHTML={{ __html: content }}></div>) : // Use dangerouslySetInnerHTML for HTML content
                             (<div className="text-gray-400 italic text-xs">No content yet.{isAnyEditEnabled && !isLocked ? ' Click edit pencil in header to add.' : ''}</div>)
                            }
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Render EditorDialog */}
            <EditorDialog
                isOpen={isEditorDialogOpen}
                onClose={() => setIsEditorDialogOpen(false)}
                initialContent={content}
                onSave={handleDialogSave}
                title={`Edit ${title}`}
            />
        </motion.div>
    );
}

export default EditableCard;