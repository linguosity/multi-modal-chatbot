// FILE: src/components/reports/text-editor/EligibilitySection.tsx
// (Finished Items UI updated to match BackgroundSection/PresentLevelsSection dropdown)

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Import types (Ensure these exist or remove imports)
import { Conclusion /*, californiaEdCodes, preschoolEdCode */ } from '@/types/reportSchemas'; // Commented out unused/missing imports
import { Switch } from "@/components/ui/switch";
// Removed Badge import
// import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Lock, Unlock, ChevronLeft, ChevronRight, X as LucideX, Languages, Mic, Baby, Gavel } from "lucide-react"; // Added needed icons
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { safeMotionNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { EditableCard } from '@/components/reports/EditableCard';
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
interface EligibilitySectionProps {
    eligibilityData: Conclusion['eligibility'] | undefined | null;
    lockStatus?: Conclusion['lockStatus'];
    onToggleDomainEligibility: (domain: string, value: boolean) => void;
    onLockSection?: (id: string, locked: boolean) => void;
    onToggleMarkedDone?: (id: string, isDone: boolean) => void;
    markedDoneStatus?: Conclusion['markedDoneStatus'];
}

// Simplified EdCode structure for example
interface EdCodeDetails {
    title: string;
    code: string;
    citation?: string;
    description: string;
    eligibilityCriteria: string[];
    detailedCriteriaText?: string;
}

// Placeholder data for missing codes
const placeholderEdCode = (title: string): EdCodeDetails => ({
    title: title, code: "N/A", description: "Ed Code info unavailable.", eligibilityCriteria: []
});
const placeholderPreschoolCode: EdCodeDetails = placeholderEdCode("Preschool");
const placeholderCaliforniaCodes: Record<string, EdCodeDetails> = {
    language: placeholderEdCode("Language Impairment"),
    articulation: placeholderEdCode("Speech Sound Disorder"),
    fluency: placeholderEdCode("Fluency Disorder"),
    voice: placeholderEdCode("Voice Disorder"),
    // Add more placeholders if needed
};


interface EligibilityCardData {
    id: string;
    domainKey: string;
    title: string;
    isEligible: boolean;
    isLocked?: boolean;
    edCodeDetails: EdCodeDetails; // Use simplified type
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
// --- End Animation Constants ---


export const EligibilitySection: React.FC<EligibilitySectionProps> = ({
    eligibilityData,
    lockStatus,
    onToggleDomainEligibility,
    onLockSection,
    onToggleMarkedDone: notifyParentOfMarkDoneChange,
    markedDoneStatus
}) => {
    // --- State ---
    const [finishedCardIds, setFinishedCardIds] = useState(new Set<string>());
    const [activeIndex, setActiveIndex] = useState(0);
    // --- End State ---

    // --- Data Preparation ---
    const allEligibilityCards: EligibilityCardData[] = useMemo(() => {
        const cards: EligibilityCardData[] = [];
        if (!eligibilityData?.domains) return cards;

        const domainStatuses = eligibilityData.domains;
        const languageDomainIds = ['receptive', 'expressive', 'pragmatic'];
        const otherDomainIds = ['articulation', 'fluency', 'voice'];

        // Use placeholder data if real codes aren't exported/available
        const getDomainEdCode = (domain: string): EdCodeDetails => {
            if (eligibilityData?.isPreschool) return placeholderPreschoolCode;
             // Adjust key for lookup if needed, e.g., use 'language' for all language-related keys
            const lookupKey = languageDomainIds.includes(domain) ? 'language' : domain;
            return placeholderCaliforniaCodes?.[lookupKey] || placeholderEdCode(domain.charAt(0).toUpperCase() + domain.slice(1));
        };

        // 1. Consolidated Language Card
        const languageEntries = languageDomainIds.filter(id => domainStatuses[id as keyof typeof domainStatuses] !== undefined);
        if (languageEntries.length > 0) {
            const isAnyLanguageEligible = languageEntries.some(id => !!domainStatuses[id as keyof typeof domainStatuses]);
            const languageCardId = 'eligibility-language';
            cards.push({
                id: languageCardId,
                domainKey: 'language',
                title: "Language Eligibility",
                isEligible: isAnyLanguageEligible,
                isLocked: lockStatus?.eligibility,
                edCodeDetails: getDomainEdCode('language'),
                initialIsMarkedDone: !!markedDoneStatus?.[languageCardId],
            });
        }

        // 2. Other Domain Cards
        otherDomainIds.forEach(domainKey => {
            if (domainStatuses[domainKey as keyof typeof domainStatuses] !== undefined) {
                const isEligible = !!domainStatuses[domainKey as keyof typeof domainStatuses];
                const cardId = `eligibility-${domainKey}`;
                cards.push({
                    id: cardId,
                    domainKey: domainKey,
                    title: `${domainKey.charAt(0).toUpperCase() + domainKey.slice(1)} Eligibility`,
                    isEligible: isEligible,
                    isLocked: lockStatus?.eligibility,
                    edCodeDetails: getDomainEdCode(domainKey),
                    initialIsMarkedDone: !!markedDoneStatus?.[cardId],
                });
            }
        });

        // 3. Preschool Card
        if (eligibilityData?.isPreschool) {
            const isPreschoolEligible = languageEntries.some(id => !!domainStatuses[id as keyof typeof domainStatuses]);
            const preschoolCardId = 'eligibility-preschool';
            cards.push({
                id: preschoolCardId,
                domainKey: 'preschool',
                title: "Preschool Eligibility",
                isEligible: isPreschoolEligible,
                isLocked: lockStatus?.eligibility,
                edCodeDetails: placeholderPreschoolCode, // Use placeholder
                initialIsMarkedDone: !!markedDoneStatus?.[preschoolCardId],
            });
        }

        return cards;
    }, [eligibilityData, lockStatus, markedDoneStatus]);
    // --- End Data Preparation ---

    // --- Derived State & Effects (Standard Stacking Logic) ---
    const visibleCardsInDeck = useMemo(() => allEligibilityCards.filter(card => !finishedCardIds.has(card.id)), [allEligibilityCards, finishedCardIds]);
    const finishedCardsForBadges = useMemo(() => allEligibilityCards.filter(card => finishedCardIds.has(card.id)), [allEligibilityCards, finishedCardIds]);
    const numCardsInDeck = visibleCardsInDeck.length;

    useEffect(() => {
        if (numCardsInDeck > 0 && activeIndex >= numCardsInDeck) {
            setActiveIndex(numCardsInDeck - 1);
        } else if (numCardsInDeck === 0) {
            setActiveIndex(0);
        }
    }, [numCardsInDeck, activeIndex]);
    // --- End Derived State ---


    // --- Navigation & Swipe (Standard Stacking Logic - remains same) ---
    const handlePrev = useCallback(() => { if (numCardsInDeck <= 1) return; setActiveIndex((prev) => (prev - 1 + numCardsInDeck) % numCardsInDeck); }, [numCardsInDeck]);
    const handleNext = useCallback(() => { if (numCardsInDeck <= 1) return; setActiveIndex((prev) => (prev + 1) % numCardsInDeck); }, [numCardsInDeck]);
    useEffect(() => { const handleKeyDown = (e: KeyboardEvent) => { if (numCardsInDeck <= 1) return; if (e.key === 'ArrowLeft') handlePrev(); else if (e.key === 'ArrowRight') handleNext(); }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handlePrev, handleNext, numCardsInDeck]);
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => { if (numCardsInDeck <= 1) return; const { offset, velocity } = info; const swipe = Math.abs(offset.x) * velocity.x; const swipeThreshold = SWIPE_THRESHOLD * SWIPE_VELOCITY_THRESHOLD / 5; if (swipe < -swipeThreshold) handleNext(); else if (swipe > swipeThreshold) handlePrev(); };
    // --- End Navigation ---

    // --- Finish/Unfinish (Standard Stacking Logic - remains same) ---
    const handleMarkCardFinished = useCallback((cardId: string) => { setFinishedCardIds(prev => new Set(prev).add(cardId)); notifyParentOfMarkDoneChange?.(cardId, true); }, [notifyParentOfMarkDoneChange]);
    const handleUnfinishCard = useCallback((cardId: string) => { setFinishedCardIds(prev => { const next = new Set(prev); next.delete(cardId); return next; }); notifyParentOfMarkDoneChange?.(cardId, false); }, [notifyParentOfMarkDoneChange]);

    // --- Initialize finished state from props (remains same) ---
     useEffect(() => {
        const initialFinished = new Set<string>();
        allEligibilityCards.forEach(card => {
            if (card.initialIsMarkedDone) {
                initialFinished.add(card.id);
            }
        });
        setFinishedCardIds(initialFinished);
        const initialVisibleCount = allEligibilityCards.length - initialFinished.size;
        if (initialVisibleCount > 0) { if (activeIndex >= initialVisibleCount) { setActiveIndex(Math.max(0, initialVisibleCount - 1)); } }
        else { setActiveIndex(0); }
    }, [allEligibilityCards, activeIndex]); // Removed markedDoneStatus dependency if initialization is stable


    // --- Animation Calculation (Standard Stacking Logic - remains same) ---
    const calculateCardStyle = (index: number) => { let offset = index - activeIndex; const half = Math.floor(numCardsInDeck / 2); if (numCardsInDeck > 1) { if (offset > half) offset -= numCardsInDeck; else if (offset < -half) offset += numCardsInDeck; } const absOffset = Math.abs(offset); const safe = (n: number) => (Number.isFinite(n) ? n : 0); if (offset === 0) { return { x: 0, y: 0, scale: 1, rotateY: 0, opacity: 1, zIndex: numCardsInDeck + 1, display: 'flex' }; } else if (absOffset <= MAX_VISIBLE_OFFSET) { return { x: safe(offset * HORIZONTAL_STAGGER), y: safe(absOffset * VERTICAL_STAGGER), scale: safe(1 - (absOffset * SCALE_FACTOR)), rotateY: safe(-offset * ROTATE_Y_FACTOR), opacity: 1, zIndex: numCardsInDeck - absOffset, display: 'flex' }; } else { const sign = Math.sign(offset); return { x: safe(sign * HORIZONTAL_STAGGER * (MAX_VISIBLE_OFFSET + 0.5)), y: safe(VERTICAL_STAGGER * MAX_VISIBLE_OFFSET), scale: safe(1 - (MAX_VISIBLE_OFFSET * SCALE_FACTOR)), rotateY: safe(-sign * ROTATE_Y_FACTOR * MAX_VISIBLE_OFFSET), opacity: 0, zIndex: 0, display: 'flex' }; } };
    // --- End Animation ---


    // --- Section Lock Logic (Standard Stacking Logic - remains same) ---
    const areAllEligibilityCardsLocked = useCallback(() => { return !!lockStatus?.eligibility; }, [lockStatus]);
    const handleEligibilityLock = useCallback(() => { if (onLockSection) { onLockSection('eligibility', !lockStatus?.eligibility); } }, [onLockSection, lockStatus]);
    // --- End Lock ---


    // --- Render ---
    if (!eligibilityData?.domains || allEligibilityCards.length === 0) {
        return ( /* ... keep empty state JSX ... */
          <div className="mb-8">
             <div className="flex justify-between items-center mb-1 pb-1 scroll-mt-20">
               <h3 className="text-md font-semibold uppercase tracking-wide">Eligibility by Domain</h3>
             </div>
             <hr className="mb-3 border-neutral-200" />
             <p className="p-4 text-center text-gray-500 italic">Eligibility data not available.</p>
           </div>
        );
    }

    return (
        <div className="mb-8">
            {/* Section Header */}
            <div id="eligibility-section-header" className="flex justify-between items-center mb-1 pb-1 scroll-mt-20">
                <h3 className="text-md font-semibold uppercase tracking-wide">Eligibility by Domain</h3>
                <Button variant="ghost" size="icon" onClick={handleEligibilityLock} className="h-7 w-7 text-gray-500 hover:text-gray-700">
                    {areAllEligibilityCardsLocked() ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </Button>
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
                                    className="group flex justify-between items-center gap-2 px-2 py-1 text-xs" // Use neutral hover
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
                                        className="ml-auto rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:text-destructive focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring transition-opacity"
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
                {numCardsInDeck === 0 && allEligibilityCards.length > 0 && (
                    <div className="text-center text-gray-500 italic">All eligibility cards marked finished.</div>
                )}

                {/* Animated Cards */}
                {numCardsInDeck > 0 && (
                    <AnimatePresence initial={false}>
                        {visibleCardsInDeck.map((cardData, index) => {
                            const isActive = index === activeIndex;
                            const calculatedStyle = calculateCardStyle(index);

                            // Define content for the card
                            const eligibilityCardContent = (
                                <div className="text-xs space-y-3">
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div>
                                            <h4 className="font-semibold text-sm text-gray-800">{cardData.edCodeDetails.title}</h4>
                                            <p className="text-gray-500 text-xs">{cardData.edCodeDetails.code} {cardData.edCodeDetails.citation || ''}</p>
                                        </div>
                                        <div className="flex items-center space-x-2 shrink-0 pt-1">
                                            <Label htmlFor={`switch-${cardData.id}`} className={cn("text-xs", cardData.isEligible ? "text-green-700 font-medium" : "text-gray-600")}>
                                                {cardData.isEligible ? 'Eligible' : 'Not Eligible'}
                                            </Label>
                                            <Switch
                                                id={`switch-${cardData.id}`}
                                                checked={cardData.isEligible}
                                                onCheckedChange={(checked) => {
                                                    if (cardData.domainKey === 'language') {
                                                        ['receptive', 'expressive', 'pragmatic'].forEach(id => onToggleDomainEligibility(id, checked));
                                                    } else {
                                                        onToggleDomainEligibility(cardData.domainKey, checked);
                                                    }
                                                }}
                                                disabled={cardData.isLocked}
                                                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200 scale-90"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-gray-700">{cardData.edCodeDetails.description}</p>
                                    {cardData.edCodeDetails.eligibilityCriteria.length > 0 && (
                                        <div>
                                            <h5 className="font-medium mb-1 text-gray-600 text-xs">Criteria Examples:</h5>
                                            <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                                {cardData.edCodeDetails.eligibilityCriteria.map((criteria, i) => (<li key={i}>{criteria}</li>))}
                                            </ul>
                                        </div>
                                    )}
                                     {cardData.edCodeDetails.detailedCriteriaText && (
                                         <div className="mt-2 pt-2 border-t border-gray-200">
                                            <h5 className="font-medium mb-1 text-gray-600 text-xs">Detailed Criteria:</h5>
                                            <p className="text-gray-600 whitespace-pre-wrap">{cardData.edCodeDetails.detailedCriteriaText}</p>
                                         </div>
                                     )}
                                </div>
                            );

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
                                            isEditable={false} // Not directly editable, content via viewComponent
                                            viewComponent={eligibilityCardContent}
                                            color={"neutral"} // Neutral theme
                                            onToggleMarkedDone={() => handleMarkCardFinished(cardData.id)}
                                            isMarkedDone={finishedCardIds.has(cardData.id)}
                                            // Hide synthesis/lock options if not applicable here via props or internal logic
                                            // hasSynthesis={false} // Example: eligibility cards might not have synthesis
                                            // onLock={() => handleEligibilityLock()} // Could lock/unlock whole section from card?
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
                        <Button variant="ghost" size="icon" onClick={handlePrev} className="absolute left-2 sm:-left-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Previous Eligibility Card"> <ChevronLeft className="h-6 w-6" /> </Button>
                        <Button variant="ghost" size="icon" onClick={handleNext} className="absolute right-2 sm:-right-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Next Eligibility Card"> <ChevronRight className="h-6 w-6" /> </Button>
                    </>
                )}
            </div> {/* End Stacking Card Container */}
        </div> // End Main Section Div
    );
};

export default EligibilitySection;