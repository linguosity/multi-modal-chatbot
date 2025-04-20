// FILE: src/components/reports/text-editor/PresentLevelsSection.tsx
// (Finished Items UI updated to match BackgroundSection dropdown)

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DomainCard from './DomainCard'; // Assuming this component exists
import { Functioning, FunctioningSection } from '@/types/reportSchemas';
import { Button } from "@/components/ui/button";
// Removed Badge import
// import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, ChevronLeft, ChevronRight, X as LucideX, CheckCircle } from "lucide-react"; // Added CheckCircle, renamed X alias
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { safeMotionNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
// --- Add DropdownMenu Imports ---
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
// --- End DropdownMenu Imports ---

// --- Interface Definitions ---
interface PresentLevelsSectionProps {
    functioning: Functioning | undefined;
    onLockSection?: (id: string, locked: boolean) => void;
    onToggleSynthesis?: (id: string) => void;
    onSaveContent?: (id: string, content: string | object) => void;
    onToggleMarkedDone?: (id: string, isDone: boolean) => void;
    presentLevelsLockStatus?: {
        functioning?: Record<string, boolean>;
        wasSectionLock?: boolean;
        isLocked?: boolean;
    };
    presentLevelsMarkedDoneStatus?: {
        functioning?: Record<string, boolean>; // Matches the structure saved in ReportEditor
    };
}

interface DomainCardData {
    id: string;
    domainName: keyof Functioning;
    title: string;
    domainData: FunctioningSection;
}

// --- Animation Constants (remain the same) ---
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
// --- End Animation Constants ---


export const PresentLevelsSection: React.FC<PresentLevelsSectionProps> = ({
    functioning,
    onLockSection,
    onToggleSynthesis,
    onSaveContent,
    onToggleMarkedDone: notifyParentOfMarkDoneChange,
    presentLevelsLockStatus,
    presentLevelsMarkedDoneStatus
}) => {
    // --- State ---
    const [finishedCardIds, setFinishedCardIds] = useState(new Set<string>());
    const [activeIndex, setActiveIndex] = useState(0);
    // --- End State ---

    // --- Data Preparation (remains the same) ---
    const allDomainCards: DomainCardData[] = useMemo(() => {
        if (!functioning) return [];
        return Object.entries(functioning)
            .filter(([_, domainData]) => !!domainData)
            .map(([domainName, domainData]) => ({
                id: `domain-${domainName}`,
                domainName: domainName as keyof Functioning,
                title: `${domainName.charAt(0).toUpperCase() + domainName.slice(1)} Language`,
                domainData: domainData!,
            }));
    }, [functioning]);

    const visibleCardsInDeck = useMemo(() =>
        allDomainCards.filter(card => !finishedCardIds.has(card.id)),
        [allDomainCards, finishedCardIds]
    );

    const finishedCardsForBadges = useMemo(() =>
        allDomainCards.filter(card => finishedCardIds.has(card.id)),
        [allDomainCards, finishedCardIds]
    );

    const numCardsInDeck = visibleCardsInDeck.length;

    useEffect(() => {
        if (numCardsInDeck > 0 && activeIndex >= numCardsInDeck) {
            setActiveIndex(numCardsInDeck - 1);
        } else if (numCardsInDeck === 0 && activeIndex !== 0) {
            setActiveIndex(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [numCardsInDeck]);
    // --- End Data Preparation ---

    // --- Lock Logic (remains the same) ---
    const areAllDomainsLocked = useCallback(() => {
        if (!functioning || allDomainCards.length === 0) return false;
        return allDomainCards.every(card =>
            card.domainData.isLocked ?? presentLevelsLockStatus?.functioning?.[card.domainName] ?? false
        );
    }, [functioning, allDomainCards, presentLevelsLockStatus]);

    const isAnyDomainLocked = useCallback(() => {
        if (!functioning || allDomainCards.length === 0) return false;
        return allDomainCards.some(card =>
            card.domainData.isLocked ?? presentLevelsLockStatus?.functioning?.[card.domainName] ?? false
        );
    }, [functioning, allDomainCards, presentLevelsLockStatus]);

    const handleSectionLock = useCallback(() => {
        const shouldLock = !areAllDomainsLocked();
        if (onLockSection) {
            onLockSection('section-present-levels', shouldLock);
        }
    }, [onLockSection, areAllDomainsLocked]);
    // --- End Lock Logic ---

    // --- Card Navigation & Swipe Logic (remains the same) ---
    const handlePrev = useCallback(() => {
        if (numCardsInDeck <= 1) return;
        setActiveIndex((prev) => (prev - 1 + numCardsInDeck) % numCardsInDeck);
    }, [numCardsInDeck]);

    const handleNext = useCallback(() => {
        if (numCardsInDeck <= 1) return;
        setActiveIndex((prev) => (prev + 1) % numCardsInDeck);
    }, [numCardsInDeck]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (numCardsInDeck <= 1) return;
            if (event.key === 'ArrowLeft') handlePrev();
            else if (event.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePrev, handleNext, numCardsInDeck]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (numCardsInDeck <= 1) return;
        const { offset, velocity } = info;
        if (Math.abs(offset.x) > Math.abs(offset.y) && Math.abs(offset.x) > SWIPE_THRESHOLD) {
            const swipePower = offset.x * velocity.x;
            if (swipePower < -SWIPE_VELOCITY_THRESHOLD * 10) handleNext();
            else if (swipePower > SWIPE_VELOCITY_THRESHOLD * 10) handlePrev();
        }
    };

    const calculateCardStyle = (index: number) => {
        let offset = index - activeIndex; const half = Math.floor(numCardsInDeck / 2);
        if (numCardsInDeck > 1) { if (offset > half) offset -= numCardsInDeck; else if (offset < -half) offset += numCardsInDeck; }
        const absOffset = Math.abs(offset); const safe = (n: number) => (Number.isFinite(n) ? n : 0);
        if (offset === 0) return { x: 0, y: 0, scale: 1, rotateY: 0, opacity: 1, zIndex: numCardsInDeck + 1, display: 'flex' };
        else if (absOffset <= MAX_VISIBLE_OFFSET) return { x: safe(offset * HORIZONTAL_STAGGER), y: safe(absOffset * VERTICAL_STAGGER), scale: safe(1 - (absOffset * SCALE_FACTOR)), rotateY: safe(-offset * ROTATE_Y_FACTOR), opacity: 1, zIndex: numCardsInDeck - absOffset, display: 'flex' };
        else { const sign = Math.sign(offset); return { x: safe(sign * HORIZONTAL_STAGGER * (MAX_VISIBLE_OFFSET + 0.5)), y: safe(VERTICAL_STAGGER * MAX_VISIBLE_OFFSET), scale: safe(1 - (MAX_VISIBLE_OFFSET * SCALE_FACTOR)), rotateY: safe(-sign * ROTATE_Y_FACTOR * MAX_VISIBLE_OFFSET), opacity: 0, zIndex: 0, display: 'flex' }; }
    };
    // --- End Navigation & Swipe ---

    // --- Finish/Unfinish Card Handlers (remain the same) ---
    const handleMarkCardFinished = useCallback((cardId: string) => {
        setFinishedCardIds(prev => new Set(prev).add(cardId));
        notifyParentOfMarkDoneChange?.(cardId, true);
    }, [notifyParentOfMarkDoneChange]);

    const handleUnfinishCard = useCallback((cardId: string) => {
        setFinishedCardIds(prev => {
            const next = new Set(prev);
            next.delete(cardId);
            return next;
        });
        notifyParentOfMarkDoneChange?.(cardId, false);
    }, [notifyParentOfMarkDoneChange]);

    // --- useEffect for initializing finished state (remains the same) ---
    useEffect(() => {
        const initialFinished = new Set<string>();
        const doneStatus = presentLevelsMarkedDoneStatus?.functioning;
        if (doneStatus) {
            allDomainCards.forEach(card => {
                const domainKey = card.domainName;
                if (doneStatus[domainKey] === true) {
                    initialFinished.add(card.id);
                }
            });
        }
        setFinishedCardIds(initialFinished);

        const initialVisibleCount = allDomainCards.length - initialFinished.size;
        if (initialVisibleCount > 0) {
            if (activeIndex >= initialVisibleCount) {
                setActiveIndex(Math.max(0, initialVisibleCount - 1));
            }
        } else {
            setActiveIndex(0);
        }
    }, [allDomainCards, presentLevelsMarkedDoneStatus, activeIndex]); // Note: activeIndex dependency might cause loops if not careful


    // --- Render ---
    return (
        <div className="mb-8">
            {/* Section Header */}
            <div id="present-levels" className="flex justify-between items-center mb-1 pb-1 border-b border-neutral-200 scroll-mt-20">
                <h3 className="text-md font-semibold uppercase tracking-wide">Present Levels</h3>
                {/* Consider adding the section lock button here if needed */}
                {/* <Button variant="ghost" size="icon" onClick={handleSectionLock} className="h-7 w-7 text-gray-500 hover:text-gray-800">
                     {areAllDomainsLocked() ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                 </Button> */}
            </div>
            {/* Removed the hr here, header has border-b now */}

            {/* --- V V V REPLACED FINISHED ITEMS UI V V V --- */}
            <div className="flex justify-end mb-2 h-8"> {/* Added fixed height to prevent layout shift when empty */}
                {finishedCardsForBadges.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-muted-foreground hover:bg-accent transition-colors px-2 h-full" // Use neutral colors
                            >
                                <span className="inline-flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Finished ({finishedCardsForBadges.length})
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-xs px-2 py-1.5">Marked as Finished</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {finishedCardsForBadges.map((card) => (
                                <DropdownMenuItem
                                    key={card.id}
                                    className="group flex justify-between items-center gap-2 px-2 py-1 text-xs hover:bg-accent" // Use neutral hover
                                    // Prevent closing on item click to allow button press
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    <span className="truncate text-muted-foreground">
                                        {card.title}
                                    </span>
                                    {/* Use a button for the action */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Stop event bubbling
                                            handleUnfinishCard(card.id);
                                        }}
                                        className="ml-auto rounded-full p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring transition-opacity"
                                        aria-label={`Remove ${card.title} from finished`}
                                    >
                                        <LucideX className="h-3.5 w-3.5" />
                                    </button>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            {/* --- ^ ^ ^ END REPLACED FINISHED ITEMS UI ^ ^ ^ --- */}

            {/* Stacking Card Container */}
            <div className="relative h-[450px] w-full max-w-lg mx-auto flex items-center justify-center overflow-hidden">
                {/* Empty states */}
                {allDomainCards.length === 0 && (<div className="text-center text-gray-500 italic">No domain data available.</div>)}
                {numCardsInDeck === 0 && allDomainCards.length > 0 && (<div className="text-center text-gray-500 italic">All domain cards marked as finished.</div>)}

                {/* Animated Cards */}
                {numCardsInDeck > 0 && (
                    <AnimatePresence initial={false}>
                        {visibleCardsInDeck.map((cardData, index) => {
                            const isActive = index === activeIndex;
                            const calculatedStyle = calculateCardStyle(index);

                            return (
                                <motion.div
                                    key={cardData.id}
                                    animate={calculatedStyle}
                                    initial={false}
                                    exit={{ opacity: 0, y: 50, scale: 0.8, transition: { duration: 0.3, ease: "easeIn" } }}
                                    transition={TRANSITION_TWEEN}
                                    className="absolute top-0 left-0 w-full h-full flex items-center justify-center origin-center cursor-grab active:cursor-grabbing"
                                    style={{
                                        perspective: "1000px", // Keep for potential 3D effects if needed
                                        pointerEvents: isActive ? 'auto' : 'none'
                                    }}
                                    drag={isActive && numCardsInDeck > 1 ? "x" : false}
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.2}
                                    onDragEnd={isActive ? handleDragEnd : undefined}
                                >
                                    <div className="w-full max-w-md h-[95%]">
                                        {/* Ensure DomainCard exists and accepts these props */}
                                        <DomainCard
                                            domain={cardData.domainName}
                                            domainData={cardData.domainData}
                                            onLockSection={onLockSection}
                                            onToggleSynthesis={onToggleSynthesis}
                                            onSaveContent={onSaveContent}
                                            onMarkFinished={() => handleMarkCardFinished(cardData.id)}
                                            isLocked={cardData.domainData.isLocked ?? presentLevelsLockStatus?.functioning?.[cardData.domainName]}
                                            isMarkedDone={finishedCardIds.has(cardData.id)}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}

                {/* Navigation Buttons */}
                {numCardsInDeck > 1 && (
                    <>
                        <Button variant="ghost" size="icon" onClick={handlePrev} className="absolute left-2 sm:-left-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Previous Domain Card"> <ChevronLeft className="h-6 w-6" /> </Button>
                        <Button variant="ghost" size="icon" onClick={handleNext} className="absolute right-2 sm:-right-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Next Domain Card"> <ChevronRight className="h-6 w-6" /> </Button>
                    </>
                )}
            </div> {/* End Stacking Card Container */}
        </div> // End Main Section Div
    );
};

export default PresentLevelsSection;