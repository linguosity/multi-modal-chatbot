// FILE: src/components/reports/text-editor/ConclusionRecsSection.tsx
// (Finished Items UI updated to dropdown menu)

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Ensure ReportConclusion type is correctly defined/exported and includes markedDoneStatus/lockStatus if used
import { Conclusion as ReportConclusion } from '@/types/reportSchemas';
// Removed Badge import
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, ChevronLeft, ChevronRight, X as LucideX, CheckCircle } from "lucide-react"; // Added CheckCircle
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { safeMotionNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { EditableCard } from "@/components/reports/EditableCard";
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
interface ConclusionRecsSectionProps {
    conclusionData: ReportConclusion['conclusion'] | undefined | null;
    recommendationsData: ReportConclusion['recommendations'] | undefined | null;
    // Assuming 'applicableEdCodeText' might not exist based on previous errors, made optional
    eligibilityText?: string;
    lockStatus?: ReportConclusion['lockStatus']; // Assumes lockStatus exists on ReportConclusion type
    onLockSection?: (id: string, locked: boolean) => void;
    onToggleSynthesis?: (id: string) => void;
    onSaveContent?: (id: string, content: string | object) => void;
    onToggleMarkedDone?: (id: string, isDone: boolean) => void;
    markedDoneStatus?: ReportConclusion['markedDoneStatus']; // Assumes markedDoneStatus exists on ReportConclusion type
}

interface ConclusionRecsCardData {
    id: string;
    title: string;
    isLocked?: boolean;
    hasSynthesis?: boolean;
    synthesisContent?: string;
    initialContent?: string;
    viewComponent?: React.ReactNode;
    isEditable?: boolean;
    initialIsMarkedDone?: boolean;
    color?: string;
}

// --- Animation Constants (remain the same) ---
const MAX_VISIBLE_OFFSET = 1;
const HORIZONTAL_STAGGER = 40;
const VERTICAL_STAGGER = 6;
const SCALE_FACTOR = 0.06;
const ROTATE_Y_FACTOR = 5;
const TRANSITION_DURATION = 0.4;
const EASE_FUNCTION = [0.4, 0, 0.2, 1];
const TRANSITION_TWEEN = { type: "spring", stiffness: 120, damping: 24 };
const SWIPE_THRESHOLD = 40;
const SWIPE_VELOCITY_THRESHOLD = 200;
// --- End Animation Constants ---


export const ConclusionRecsSection: React.FC<ConclusionRecsSectionProps> = ({
    conclusionData,
    recommendationsData,
    eligibilityText,
    lockStatus,
    onLockSection,
    onToggleSynthesis,
    onSaveContent,
    onToggleMarkedDone: notifyParentOfMarkDoneChange,
    markedDoneStatus
}) => {
    // --- State (remains the same) ---
    const [finishedCardIds, setFinishedCardIds] = useState(new Set<string>());
    const [activeIndex, setActiveIndex] = useState(0);
    // --- End State ---

    // --- Data Preparation (includes reading markedDoneStatus for initial state) ---
    const allConclusionRecsCards: ConclusionRecsCardData[] = useMemo(() => {
        const cards: ConclusionRecsCardData[] = [];
        // Helper to check markedDoneStatus safely
        const getInitialDone = (id: string) => !!markedDoneStatus?.[id];

        // 1. Summary Card
        if (conclusionData) {
            const id = 'conclusion-summary';
            cards.push({
                id, title: "Overall Summary", isLocked: lockStatus?.summary,
                hasSynthesis: !!conclusionData.synthesis, synthesisContent: conclusionData.synthesis || "",
                initialContent: conclusionData.summary || "", isEditable: true, color: "neutral",
                initialIsMarkedDone: getInitialDone(id),
            });
        }

        // 2. Recommended Services Card
        if (recommendationsData) {
            const idServices = 'services-recommendations';
            cards.push({
                id: idServices, title: "Recommended Services", isLocked: lockStatus?.services,
                hasSynthesis: !!recommendationsData.synthesis, synthesisContent: recommendationsData.synthesis || "",
                isEditable: true,
                initialContent: `Type: ${recommendationsData.services?.typeOfService || ''}\nFrequency: ${recommendationsData.services?.frequency || ''}\nSetting: ${recommendationsData.services?.setting || ''}`,
                color: "neutral",
                viewComponent: recommendationsData.services ? (
                    <table className="w-full text-xs"><tbody><tr><td className="font-medium pr-2 py-0.5">Type:</td><td>{recommendationsData.services.typeOfService}</td></tr><tr><td className="font-medium pr-2 py-0.5">Frequency:</td><td>{recommendationsData.services.frequency}</td></tr><tr><td className="font-medium pr-2 py-0.5">Setting:</td><td>{recommendationsData.services.setting}</td></tr></tbody></table>
                ) : <p className="text-xs text-gray-500">No service details.</p>,
                initialIsMarkedDone: getInitialDone(idServices),
            });
        }

        // 3. Accommodations & Strategies Card
        if (recommendationsData) {
            const idAccomm = 'accommodations-strategies';
            cards.push({
                id: idAccomm, title: "Accommodations & Strategies", isLocked: lockStatus?.accommodations,
                hasSynthesis: !!recommendationsData.synthesis, synthesisContent: recommendationsData.synthesis || "",
                isEditable: true,
                initialContent: [...(recommendationsData.accommodations || []).map(acc => `- ${acc}`), ...((recommendationsData.accommodations?.length || 0) > 0 && (recommendationsData.facilitationStrategies?.length || 0) > 0 ? ["\n--- STRATEGIES ---"] : []), ...(recommendationsData.facilitationStrategies || []).map(strat => `- ${strat}`)].join("\n"),
                color: "neutral",
                viewComponent: (<> {(recommendationsData.accommodations?.length || 0) > 0 && ( <div className="mb-2"> <h5 className="text-xs font-semibold mb-1 text-gray-600">Accommodations</h5> <ul className="list-disc pl-4 space-y-0.5 text-gray-800"> {recommendationsData.accommodations!.map((rec, index) => ( <li key={`acc-${index}`}>{rec}</li> ))} </ul> </div> )} {(recommendationsData.facilitationStrategies?.length || 0) > 0 && ( <div> <h5 className="text-xs font-semibold mb-1 text-gray-600">Facilitation Strategies</h5> <ul className="list-disc pl-4 space-y-0.5 text-gray-800"> {recommendationsData.facilitationStrategies!.map((strat, index) => ( <li key={`strat-${index}`}>{strat}</li> ))} </ul> </div> )} {!(recommendationsData.accommodations?.length || 0) && !(recommendationsData.facilitationStrategies?.length || 0) && ( <p className="text-xs text-gray-500">None listed.</p> )} </>),
                initialIsMarkedDone: getInitialDone(idAccomm),
            });
        }

        return cards;
    }, [conclusionData, recommendationsData, /* eligibilityText, */ lockStatus, markedDoneStatus]);
    // --- End Data Preparation ---


    // --- Derived State & Effects (remain the same) ---
    const visibleCardsInDeck = useMemo(() => allConclusionRecsCards.filter(card => !finishedCardIds.has(card.id)), [allConclusionRecsCards, finishedCardIds]);
    const finishedCardsForBadges = useMemo(() => allConclusionRecsCards.filter(card => finishedCardIds.has(card.id)), [allConclusionRecsCards, finishedCardIds]);
    const numCardsInDeck = visibleCardsInDeck.length;
    useEffect(() => { if (numCardsInDeck > 0 && activeIndex >= numCardsInDeck) { setActiveIndex(numCardsInDeck - 1); } else if (numCardsInDeck === 0) { setActiveIndex(0); } }, [numCardsInDeck, activeIndex]);
    // --- End Derived State ---

    // --- Navigation & Swipe (remain the same) ---
    const handlePrev = useCallback(() => { if (numCardsInDeck <= 1) return; setActiveIndex((prev) => (prev - 1 + numCardsInDeck) % numCardsInDeck); }, [numCardsInDeck]);
    const handleNext = useCallback(() => { if (numCardsInDeck <= 1) return; setActiveIndex((prev) => (prev + 1) % numCardsInDeck); }, [numCardsInDeck]);
    useEffect(() => { const handleKeyDown = (e: KeyboardEvent) => { if (numCardsInDeck <= 1) return; if (e.key === 'ArrowLeft') handlePrev(); else if (e.key === 'ArrowRight') handleNext(); }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handlePrev, handleNext, numCardsInDeck]);
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => { if (numCardsInDeck <= 1) return; const { offset, velocity } = info; const swipe = Math.abs(offset.x) * velocity.x; const thresh = SWIPE_THRESHOLD * SWIPE_VELOCITY_THRESHOLD / 5; if (swipe < -thresh) handleNext(); else if (swipe > thresh) handlePrev(); };
    // --- End Navigation ---

    // --- Finish/Unfinish (remain the same) ---
    const handleMarkCardFinished = useCallback((cardId: string) => { setFinishedCardIds(prev => new Set(prev).add(cardId)); notifyParentOfMarkDoneChange?.(cardId, true); }, [notifyParentOfMarkDoneChange]);
    const handleUnfinishCard = useCallback((cardId: string) => { setFinishedCardIds(prev => { const next = new Set(prev); next.delete(cardId); return next; }); notifyParentOfMarkDoneChange?.(cardId, false); }, [notifyParentOfMarkDoneChange]);
    // --- End Finish/Unfinish ---

    // --- Initialize finished state from props (remain the same) ---
    useEffect(() => {
        const initialFinished = new Set<string>();
        allConclusionRecsCards.forEach(card => {
            if (card.initialIsMarkedDone) { initialFinished.add(card.id); }
        });
        setFinishedCardIds(initialFinished);
        const initialVisibleCount = allConclusionRecsCards.length - initialFinished.size;
        if (initialVisibleCount > 0) { if (activeIndex >= initialVisibleCount) { setActiveIndex(Math.max(0, initialVisibleCount - 1)); } }
        else { setActiveIndex(0); }
    }, [allConclusionRecsCards, activeIndex]); // Removed markedDoneStatus dep, relying on allConclusionRecsCards

    // --- Animation Calculation (remain the same) ---
    const calculateCardStyle = (index: number) => { let offset = index - activeIndex; const half = Math.floor(numCardsInDeck / 2); if (numCardsInDeck > 1) { if (offset > half) offset -= numCardsInDeck; else if (offset < -half) offset += numCardsInDeck; } const absOffset = Math.abs(offset); const safe = (n: number) => (Number.isFinite(n) ? n : 0); const depthOffset = safe(-absOffset * 10); return { x: safe(offset * HORIZONTAL_STAGGER), y: safe(absOffset * VERTICAL_STAGGER), scale: safe(1 - absOffset * SCALE_FACTOR), rotateY: safe(-offset * ROTATE_Y_FACTOR), z: depthOffset, opacity: absOffset <= MAX_VISIBLE_OFFSET + 1 ? 1 : 0.4, zIndex: numCardsInDeck - absOffset, display: 'flex' }; };
    // --- End Animation ---

    // --- Section Lock Logic (remain the same) ---
    const areAllRecsCardsLocked = useCallback(() => { return !!(lockStatus?.summary && lockStatus?.services && lockStatus?.accommodations); }, [lockStatus]);
    const handleRecsSectionLock = useCallback(() => { if (onLockSection) { onLockSection('section-conclusion-recs', !areAllRecsCardsLocked()); } }, [onLockSection, areAllRecsCardsLocked]);
    // --- End Lock ---

    // --- Render ---
    if (allConclusionRecsCards.length === 0) {
        return <div className="mb-8"><h3 className="text-md font-semibold uppercase tracking-wide mb-3 pb-1 border-b border-neutral-200">Conclusion & Recommendations</h3><p className="p-4 text-center text-gray-500 italic">No conclusion or recommendation data available.</p></div>;
    }

    return (
        <div className="mb-8">
            {/* Section Header */}
            <div id="conclusion-recs-section-header" className="flex justify-between items-center mb-1 pb-1 scroll-mt-20">
                <h3 className="text-md font-semibold uppercase tracking-wide">Conclusion & Recommendations</h3>
                {/* Optional Lock Button */}
                 {/* <Button variant="ghost" size="icon" onClick={handleRecsSectionLock} ... > ... </Button> */}
            </div>
            <hr className="mb-3 border-neutral-200" />

            {/* --- V V V REPLACED FINISHED ITEMS UI V V V --- */}
            <div className="flex justify-end mb-2 h-8"> {/* Added fixed height */}
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
                                     onSelect={(e) => e.preventDefault()} // Prevent close on item click
                                 >
                                     <span className="truncate text-muted-foreground">
                                         {card.title}
                                     </span>
                                     <button
                                         onClick={(e) => {
                                             e.stopPropagation();
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
                {/* Empty State */}
                {numCardsInDeck === 0 && allConclusionRecsCards.length > 0 && (
                    <div className="text-center text-gray-500 italic">All conclusion cards marked finished.</div>
                )}

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
                                    style={{ perspective: "1000px", pointerEvents: isActive ? 'auto' : 'none' }}
                                    drag={isActive && numCardsInDeck > 1 ? "x" : false}
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.2}
                                    onDragEnd={isActive ? handleDragEnd : undefined}
                                >
                                    <div className="w-full max-w-md h-[95%]">
                                        <EditableCard
                                            id={cardData.id}
                                            title={cardData.title}
                                            isLocked={cardData.isLocked}
                                            hasSynthesis={cardData.hasSynthesis}
                                            synthesisContent={cardData.synthesisContent}
                                            isEditable={cardData.isEditable}
                                            initialContent={cardData.initialContent}
                                            viewComponent={cardData.viewComponent}
                                            color={"neutral"}
                                            onToggleMarkedDone={() => handleMarkCardFinished(cardData.id)}
                                            isMarkedDone={finishedCardIds.has(cardData.id)}
                                            onSave={(content) => onSaveContent && onSaveContent(cardData.id, typeof content === 'string' ? content : JSON.stringify(content))}
                                            onToggleSynthesis={() => onToggleSynthesis?.(cardData.id)}
                                            onLock={(id, lockState) => onLockSection?.(id, lockState)}
                                            className="border border-neutral-200 shadow-lg bg-white h-full flex flex-col"
                                            headerClassName="py-2 px-3 bg-neutral-100 shrink-0"
                                            contentClassName="p-3 text-xs text-neutral-700 grow overflow-y-auto"
                                            disableHoverEffect={true}
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
                        <Button variant="ghost" size="icon" onClick={handlePrev} className="absolute left-2 sm:-left-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Previous Card"> <ChevronLeft className="h-6 w-6" /> </Button>
                        <Button variant="ghost" size="icon" onClick={handleNext} className="absolute right-2 sm:-right-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Next Card"> <ChevronRight className="h-6 w-6" /> </Button>
                    </>
                )}
            </div> {/* End Stacking Card Container */}
        </div> // End Main Section Div
    );
};

export default ConclusionRecsSection;