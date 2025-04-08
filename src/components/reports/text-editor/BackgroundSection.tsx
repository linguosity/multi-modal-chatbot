// FILE: BackgroundSection.tsx (Fixed ReferenceError)

import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback
import { EditableCard } from '@/components/reports/EditableCard';
import { ReportBackground } from '@/types/reportSchemas';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Interface Definitions ---
interface BackgroundSectionProps {
    background: ReportBackground;
    onLockSection?: (id: string, locked: boolean) => void;
    onToggleSynthesis?: (id: string) => void;
    onSaveContent?: (id: string, content: string) => void;
    onToggleMarkedDone?: (id: string, isDone: boolean) => void;
}

interface BackgroundCardData {
    id: 'educational-history' | 'health-info' | 'family-info' | 'parent-concerns';
    title: string;
    isLocked?: boolean; // Needed for lock status check
    hasSynthesis?: boolean;
    synthesisContent?: string;
    initialContent: string;
    viewComponent?: React.ReactNode;
    initialIsMarkedDone?: boolean;
}

// --- Animation Constants ---
const MAX_VISIBLE_OFFSET = 1;
const HORIZONTAL_STAGGER = 40;
const VERTICAL_STAGGER = 6;
const SCALE_FACTOR = 0.06;
const ROTATE_Y_FACTOR = 5;
const TRANSITION_DURATION = 0.4;
const EASE_FUNCTION = [0.4, 0, 0.2, 1];
const TRANSITION_TWEEN = { type: "tween", duration: TRANSITION_DURATION, ease: EASE_FUNCTION };
const SWIPE_THRESHOLD = 40;
const SWIPE_VELOCITY_THRESHOLD = 200;


export const BackgroundSection: React.FC<BackgroundSectionProps> = ({
    background,
    onLockSection,
    onToggleSynthesis,
    onSaveContent,
    onToggleMarkedDone: notifyParentOfMarkDoneChange
}) => {
    const [finishedCardIds, setFinishedCardIds] = useState(new Set<string>());
    const [activeIndex, setActiveIndex] = useState(0);

    // --- Data Preparation ---
    const allBackgroundCards: BackgroundCardData[] = useMemo(() => [
        { id: "educational-history", title: "Educational History", isLocked: background.lockStatus?.educationalHistory, hasSynthesis: !!background.studentDemographicsAndBackground?.synthesis, synthesisContent: background.studentDemographicsAndBackground?.synthesis || "", initialContent: background.studentDemographicsAndBackground?.educationalHistory || '', initialIsMarkedDone: background.markedDoneStatus?.educationalHistory },
        { id: "health-info", title: "Health Information", isLocked: background.lockStatus?.healthInfo, hasSynthesis: !!background.healthReport?.synthesis, synthesisContent: background.healthReport?.synthesis || "", viewComponent: (<><p><strong>Medical History:</strong> {background.healthReport?.medicalHistory}</p><p><strong>Vision/Hearing:</strong> {background.healthReport?.visionAndHearingScreening}</p></>), initialContent: `Medical History: ${background.healthReport?.medicalHistory || ''}\nVision/Hearing: ${background.healthReport?.visionAndHearingScreening || ''}`, initialIsMarkedDone: background.markedDoneStatus?.healthInfo },
        { id: "family-info", title: "Family Information", isLocked: background.lockStatus?.familyInfo, hasSynthesis: !!background.familyHistory?.synthesis, synthesisContent: background.familyHistory?.synthesis || "", viewComponent: (<><p><strong>Structure:</strong> {background.familyHistory?.familyStructure}</p><p><strong>Language Background:</strong> {background.familyHistory?.languageAndCulturalBackground}</p></>), initialContent: `Structure: ${background.familyHistory?.familyStructure || ''}\nLanguage Background: ${background.familyHistory?.languageAndCulturalBackground || ''}`, initialIsMarkedDone: background.markedDoneStatus?.familyInfo },
        { id: "parent-concerns", title: "Parent/Guardian Concerns", isLocked: background.lockStatus?.parentConcerns ?? false, hasSynthesis: !!background.synthesis, synthesisContent: background.synthesis || "", initialContent: background.parentGuardianConcerns || '', initialIsMarkedDone: background.markedDoneStatus?.parentConcerns },
      ], [background]); // Depend on the whole background object

    const visibleCardsInDeck = useMemo(() =>
        allBackgroundCards.filter(card => !finishedCardIds.has(card.id)),
        [allBackgroundCards, finishedCardIds]
    );
    const finishedCardsForBadges = useMemo(() =>
        allBackgroundCards.filter(card => finishedCardIds.has(card.id)),
        [allBackgroundCards, finishedCardIds]
    );

    const numCardsInDeck = visibleCardsInDeck.length;

    useEffect(() => {
        if (numCardsInDeck > 0 && activeIndex >= numCardsInDeck) {
            setActiveIndex(numCardsInDeck - 1);
        } else if (numCardsInDeck === 0) {
            setActiveIndex(0);
        }
    }, [numCardsInDeck, activeIndex]);

    // --- Navigation ---
    const handlePrev = useCallback(() => {
        if (numCardsInDeck === 0) return;
        setActiveIndex((prev) => (prev - 1 + numCardsInDeck) % numCardsInDeck);
    }, [numCardsInDeck]);

    const handleNext = useCallback(() => {
        if (numCardsInDeck === 0) return;
        setActiveIndex((prev) => (prev + 1) % numCardsInDeck);
    }, [numCardsInDeck]);

    useEffect(() => { /* ... keyboard listener ... */ }, [handlePrev, handleNext]);

    // --- Swipe Handler ---
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (numCardsInDeck <= 1) return;
        const { offset, velocity } = info;
        const swipePower = Math.abs(offset.x) * velocity.x;
        if (swipePower < -SWIPE_THRESHOLD * SWIPE_VELOCITY_THRESHOLD / 5) handleNext();
        else if (swipePower > SWIPE_THRESHOLD * SWIPE_VELOCITY_THRESHOLD / 5) handlePrev();
    };

    // --- Finish/Unfinish Card Handlers ---
    const handleMarkCardFinished = (cardId: string) => {
        setFinishedCardIds(prev => new Set(prev).add(cardId));
        notifyParentOfMarkDoneChange?.(cardId, true);
    };

    const handleUnfinishCard = (cardId: string) => {
        setFinishedCardIds(prev => {
            const next = new Set(prev);
            next.delete(cardId);
            return next;
        });
        notifyParentOfMarkDoneChange?.(cardId, false);
    };

    // --- Animation Calculation ---
    const calculateCardStyle = (index: number) => {
      let offset = index - activeIndex;
      const half = Math.floor(numCardsInDeck / 2);
    
      if (numCardsInDeck > 1) {
        if (offset > half) offset -= numCardsInDeck;
        else if (offset < -half) offset += numCardsInDeck;
      }
    
      const absOffset = Math.abs(offset);
    
      const safe = (n: number) => (Number.isFinite(n) ? n : 0); // 🛡️ Ensure animatable
    
      if (offset === 0) {
        return {
          x: 0, y: 0, scale: 1, rotateY: 0, opacity: 1, zIndex: numCardsInDeck + 1, display: 'flex',
        };
      } else if (absOffset <= MAX_VISIBLE_OFFSET) {
        return {
          x: safe(offset * HORIZONTAL_STAGGER),
          y: safe(absOffset * VERTICAL_STAGGER),
          scale: safe(1 - (absOffset * SCALE_FACTOR)),
          rotateY: safe(-offset * ROTATE_Y_FACTOR),
          opacity: 1,
          zIndex: numCardsInDeck - absOffset,
          display: 'flex',
        };
      } else {
        const sign = Math.sign(offset);
        return {
          x: safe(sign * HORIZONTAL_STAGGER * (MAX_VISIBLE_OFFSET + 0.5)),
          y: safe(VERTICAL_STAGGER * MAX_VISIBLE_OFFSET),
          scale: safe(1 - (MAX_VISIBLE_OFFSET * SCALE_FACTOR)),
          rotateY: safe(-sign * ROTATE_Y_FACTOR * MAX_VISIBLE_OFFSET),
          opacity: 0,
          zIndex: 0,
          display: 'flex',
        };
      }
    };

    // --- START FIX: Reinstate Lock Logic Functions ---
    const areAllCardsLocked = () => {
        // Check lock status from the original background prop based on ALL cards
        // Note: This checks based on the original data, not just visible ones.
        return !!(
            background.lockStatus?.educationalHistory &&
            background.lockStatus?.healthInfo &&
            background.lockStatus?.familyInfo &&
            background.lockStatus?.parentConcerns
        );
    };

    const isAnySectionLocked = () => {
        return !!(
            background.lockStatus?.educationalHistory ||
            background.lockStatus?.healthInfo ||
            background.lockStatus?.familyInfo ||
            background.lockStatus?.parentConcerns
        );
    };

    const handleSectionLock = () => {
        const shouldLock = !areAllCardsLocked();
        if (onLockSection) {
            // The parent handles applying the lock state to the actual report object
            onLockSection('section-background', shouldLock);
        }
    };
    // --- END FIX ---

    return (
        <div className="mb-8">
            {/* Section Header */}
            <div className="flex justify-between items-center mb-3 pb-1 border-b border-neutral-200">
                <h3 className="text-md font-semibold uppercase tracking-wide"> Background Information </h3>
                {/* Use the reinstated functions for the button */}
                {onLockSection && (
                    <Button
                        size="sm"
                        variant={areAllCardsLocked() ? "secondary" : "ghost"} // Use function
                        onClick={handleSectionLock} // Use function
                        className={`transition-all hover:scale-110 ${
                            areAllCardsLocked() ? "text-gray-600 bg-gray-200 border-gray-300" // Use function
                            : isAnySectionLocked() ? "text-amber-600" // Use function
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        title={areAllCardsLocked() ? "Unlock all cards" : "Lock all cards"} // Use function
                    >
                        {areAllCardsLocked() ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />} {/* Use function */}
                        {areAllCardsLocked() ? "Section Locked" : "Lock Section"} {/* Use function */}
                    </Button>
                )}
            </div>

            {/* Finished Cards Badge List */}
            {finishedCardsForBadges.length > 0 && (
                <div className="mb-4 px-2 py-2 border border-dashed border-gray-300 rounded-md">
                    <h5 className="text-xs font-semibold mb-2 text-gray-500 uppercase">Finished Items</h5>
                    <div className="flex flex-wrap gap-2">
                        {finishedCardsForBadges.map(card => (
                            <Badge key={card.id} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-0.5">
                                <span className="text-xs font-medium">{card.title}</span>
                                <button onClick={() => handleUnfinishCard(card.id)} className="rounded-full hover:bg-gray-300 p-0.5 focus:outline-none focus:ring-1 focus:ring-gray-400" aria-label={`Remove ${card.title} from finished`}>
                                    <X className="h-3 w-3 text-gray-600" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Stacking Card Container */}
            <div className="relative h-[380px] w-full max-w-lg mx-auto flex items-center justify-center overflow-hidden">
                {/* Conditional rendering for empty states */}
                {numCardsInDeck === 0 && finishedCardsForBadges.length === 0 && ( <div className="text-center text-gray-500 italic">No background cards available.</div> )}
                {numCardsInDeck === 0 && finishedCardsForBadges.length > 0 && ( <div className="text-center text-gray-500 italic">All background cards marked as finished.</div> )}

                {/* AnimatePresence for exit/entry */}
                <AnimatePresence initial={false}>
                    {visibleCardsInDeck.map((cardData, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <motion.div
                                key={cardData.id}
                                animate={calculateCardStyle(index)}
                                initial={false} // <<< THIS IS THE FIX
                                exit={{ opacity: 0, x: -100, scale: 0.8, transition: { duration: 0.2, ease: "easeIn" } }}
                                transition={TRANSITION_TWEEN}
                                className="absolute top-0 left-0 w-full h-full flex items-center justify-center origin-center cursor-grab active:cursor-grabbing"
                                style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                                drag={isActive ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={isActive ? handleDragEnd : undefined}
                            >
                                <div className="w-full max-w-md h-[95%]">
                                    <EditableCard
                                        {...cardData}
                                        onToggleMarkedDone={() => handleMarkCardFinished(cardData.id)}
                                        onSave={(content) => onSaveContent && onSaveContent(cardData.id, content)}
                                        onToggleSynthesis={() => onToggleSynthesis?.(cardData.id)}
                                        // Pass lock state from data if needed by EditableCard internally
                                        // isLocked={cardData.isLocked}
                                        // Pass lock callback if needed
                                        // onLock={onLockSection}
                                        className="border border-neutral-200 shadow-lg bg-white h-full flex flex-col min-h-[200px]"
                                        headerClassName="py-2 px-3 bg-neutral-100 shrink-0"
                                        contentClassName="p-3 text-xs text-neutral-700 grow overflow-y-auto"
                                        disableHoverEffect={true}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Navigation Buttons */}
                {numCardsInDeck > 1 && ( <> <Button variant="ghost" size="icon" onClick={handlePrev} className="absolute left-2 sm:-left-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Previous Card"> <ChevronLeft className="h-6 w-6" /> </Button> <Button variant="ghost" size="icon" onClick={handleNext} className="absolute right-2 sm:-right-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Next Card"> <ChevronRight className="h-6 w-6" /> </Button> </> )}
            </div>
        </div>
    );
};

export default BackgroundSection;