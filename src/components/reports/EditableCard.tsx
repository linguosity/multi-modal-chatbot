// FILE: EditableCard.tsx (Corrected Structure: Header Pencil -> Modal)
'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, List, FileText, Check, CheckCircle, Wand2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface EditableCardProps {
    id?: string;
    title: string;
    initialContent?: string;
    onSave?: (content: string) => void; // For internal inline edit fallback
    onToggleSynthesis?: (id: string) => void;
    onGenerateSynthesis?: (id: string, content: string) => Promise<string>;
    isLocked?: boolean;
    hasSynthesis?: boolean;
    synthesisContent?: string;
    isMarkedDone?: boolean;
    onToggleMarkedDone?: (id: string, isDone: boolean) => void; // For Checkmark button
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    viewComponent?: ReactNode;
    editComponent?: ReactNode; // For custom internal inline edit
    renderEditMode?: (props: { value: string; onChange: (value: string) => void; }) => ReactNode; // For custom internal inline edit
    onEditClick?: () => void; // *** For EXTERNAL modal trigger ***
    disableHoverEffect?: boolean;
}

export function EditableCard({
    id = '',
    title,
    initialContent = '',
    onSave, // Prop for internal save
    onToggleSynthesis,
    onGenerateSynthesis,
    isLocked = false,
    hasSynthesis = false,
    synthesisContent = '',
    isMarkedDone = false,
    onToggleMarkedDone, // Prop for checkmark button
    className = "",
    headerClassName = "",
    contentClassName = "",
    viewComponent,
    editComponent, // Prop for internal edit UI
    renderEditMode, // Prop for internal edit UI
    onEditClick, // *** Prop for external modal trigger ***
    disableHoverEffect = false
}: EditableCardProps) {

    // State management
    const [isEditing, setIsEditing] = useState(false); // Internal editing state
    const [content, setContent] = useState(initialContent);
    const [tempContent, setTempContent] = useState(initialContent);
    const [hasChanges, setHasChanges] = useState(false);
    const [showSynthesis, setShowSynthesis] = useState(false);
    const [generatingSynthesis, setGeneratingSynthesis] = useState(false);

    // Effects to sync content
    useEffect(() => { if (!isEditing) { setContent(initialContent); setTempContent(initialContent); setHasChanges(false); } }, [initialContent, isEditing]);
    useEffect(() => { if (isEditing) { setTempContent(content); setHasChanges(false); } }, [isEditing, content]);

    // Internal edit handlers
    const handleChange = (value: string) => { setTempContent(value); setHasChanges(value !== content); };
    const handleSave = () => { setContent(tempContent); if (onSave) { onSave(tempContent); } setIsEditing(false); setHasChanges(false); };
    const handleCancel = () => { setTempContent(content); setIsEditing(false); setHasChanges(false); };

    // Other handlers
    const handleToggleSynthesis = () => { if (!isEditing && !isLocked) { const next = !showSynthesis; setShowSynthesis(next); if (next && onToggleSynthesis && id) { onToggleSynthesis(id); } } };
    const handleGenerateSynthesis = async () => { /* ... */ };
    const handleToggleMarkedDone = () => { if (onToggleMarkedDone && id !== undefined) { onToggleMarkedDone(id, !isMarkedDone); } };

    // *** CRUCIAL: Handler for the single Header Pencil button ***
    const handleEditClick = () => {
        if (isLocked) return; // Don't do anything if locked

        // --- PRIORITY: External Modal Trigger ---
        // If onEditClick is provided as a function, call it and DO NOTHING ELSE.
        if (typeof onEditClick === 'function') {
            console.log(`EditableCard [${title}] handleEditClick: Calling onEditClick() for modal.`); // Debug
            onEditClick();
            return; // Explicitly stop execution here
        }

        // --- FALLBACK: Internal Inline Edit Trigger ---
        // Only reach here if onEditClick was NOT provided or was not a function.
        // Check if any internal edit mechanism is configured.
        if (onSave || editComponent || renderEditMode) {
            console.log(`EditableCard [${title}] handleEditClick: Falling back to internal edit -> setIsEditing(true).`); // Debug
            setShowSynthesis(false); // Ensure synthesis view is off when editing inline
            setIsEditing(true); // Set state to show inline textarea/component
        } else {
            console.log(`EditableCard [${title}] handleEditClick: No edit action configured.`); // Debug
        }
    };

    // Determine if internal editing *could* be used (if onEditClick wasn't provided)
    // This is mainly used to control rendering of the inline edit UI below.
    const canUseInternalEditMode = !!(onSave || editComponent || renderEditMode) && (typeof onEditClick !== 'function');

    // Determine if *any* edit functionality (modal OR internal) is enabled for showing the header pencil
    const isAnyEditEnabled = (typeof onEditClick === 'function') || canUseInternalEditMode;

    return (
        <motion.div
            whileHover={!isEditing && !isMarkedDone && !disableHoverEffect ? { y: -2, scale: 1.005 } : {}}
            animate={{ scale: isMarkedDone && !isEditing ? 0.95 : 1, opacity: isMarkedDone && !isEditing ? 0.85 : 1, rotateX: 0, rotateY: 0, z: 0 }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="relative h-full w-full"
        >
            <Card className={cn("border transition-colors duration-300 ease-out overflow-hidden h-full flex flex-col", isEditing && canUseInternalEditMode ? "border-blue-500 shadow-md" : "border-gray-200 shadow-sm", className)}>
                <CardHeader className={cn("p-4 flex flex-row items-center justify-between border-b bg-white border-b-gray-100 shrink-0", headerClassName)}>
                    <CardTitle className="text-base font-medium text-gray-800">
                        {showSynthesis && !isEditing ? "Summary" : title}
                    </CardTitle>
                    {/* --- HEADER ICONS --- */}
                    <div className="flex items-center gap-1 sm:gap-2">
                         {/* 1. Checkmark Button */}
                         {onToggleMarkedDone && (
                            <Button /* ... props for Checkmark ... */ onClick={handleToggleMarkedDone}>
                                {isMarkedDone ? <CheckCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                         )}

                         {/* 2. Synthesis Button (Optional) */}
                         {onToggleSynthesis && id && hasSynthesis && (
                             <Button /* ... props for Synthesis ... */ onClick={handleToggleSynthesis}>
                                {showSynthesis ? <List className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                            </Button>
                         )}

                         {/* 3. Header Pencil Button (Triggers Modal via handleEditClick) */}
                         {isAnyEditEnabled && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleEditClick} // *** Uses the corrected handler ***
                                title="Edit"
                                // Disable if locked OR if internal edit mode is somehow active
                                // (though internal edit shouldn't activate if onEditClick is passed)
                                disabled={(isEditing && canUseInternalEditMode) || isLocked}
                                className={cn("h-7 w-7 sm:h-8 sm:w-8 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100")}
                            >
                                <Pencil className="h-4 w-4" /> 
                            </Button>
                         )}
                    </div>
                     {/* --- END HEADER ICONS --- */}
                </CardHeader>

                <CardContent className={cn("p-4 text-sm grow overflow-y-auto", isEditing && canUseInternalEditMode ? "bg-gray-50" : "", contentClassName)}>
                    {/* --- Render Logic --- */}
                            
                    {/* A. INTERNAL EDITING UI */}
                    {/* This block should ONLY render if:
                        1. `isEditing` state is true (set via fallback in handleEditClick)
                        2. `canUseInternalEditMode` is true (meaning onEditClick was NOT passed as a function AND internal props like onSave exist)
                       For StudentInformationSection, `canUseInternalEditMode` should be FALSE, so this block is skipped.
                    */}
                    {isEditing && canUseInternalEditMode ? (
                         <div className="editing-interface h-full flex flex-col">
                             <div className="flex-grow min-h-[100px]">
                                 {/* Render custom edit component OR default textarea */}
                                 {editComponent ? editComponent : renderEditMode ? renderEditMode({ value: tempContent, onChange: handleChange }) : (
                                     <textarea /* ... props for textarea ... */ value={tempContent} onChange={(e) => handleChange(e.target.value)} />
                                 )}
                             </div>
                             {/* Render Save/Cancel only for default textarea */}
                             {(!editComponent && !renderEditMode) && ( <div className="flex justify-end gap-2 pt-2 shrink-0"> <Button variant="outline" size="sm" onClick={handleCancel}> Cancel </Button> <Button /* ... */ onClick={handleSave}> Save Changes </Button> </div> )}
                         </div>
                    ) : (
                    /* B. VIEW MODE UI */
                    /* This block renders when not in internal edit mode.
                       Ensure NO "inner pencil" button is present here.
                    */
                        <div>
                            {showSynthesis ? (
                                // Synthesis View
                                 <div /* ... */ > {/* ... */} </div>
                            ) : (
                                // Normal Content View
                                <div>
                                    {viewComponent ? viewComponent :
                                     content ? (<div className="whitespace-pre-wrap text-xs">{content}</div>) :
                                     (<div className="text-gray-400 italic text-xs">No content yet.{isAnyEditEnabled && !isLocked ? ' Click edit pencil in header to add.' : ''}</div>)
                                    }
                                    {/* *** NO INNER PENCIL BUTTON HERE *** */}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Helper to shorten button props for brevity in the main structure above
// (You would replace the /* ... */ comments with the full props from your previous code)
// Button /* ... props for Checkmark ... */ onClick={handleToggleMarkedDone}
// Button /* ... props for Synthesis ... */ onClick={handleToggleSynthesis}
// textarea /* ... props for textarea ... */ value={tempContent} onChange={(e) => handleChange(e.target.value)}

export default EditableCard;