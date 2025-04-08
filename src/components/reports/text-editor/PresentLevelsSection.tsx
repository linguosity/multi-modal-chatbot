// FILE: src/components/reports/text-editor/PresentLevelsSection.tsx
// (WITH Card Stacking Animation & Adjusted Neutral Styling)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DomainCard from './DomainCard'; // Assuming this component exists
import { Functioning, FunctioningSection } from '@/types/reportSchemas';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

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
}

interface DomainCardData {
    id: string;
    domainName: keyof Functioning;
    title: string;
    domainData: FunctioningSection;
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


export const PresentLevelsSection: React.FC<PresentLevelsSectionProps> = ({
  functioning,
  onLockSection,
  onToggleSynthesis,
  onSaveContent,
  onToggleMarkedDone: notifyParentOfMarkDoneChange,
  presentLevelsLockStatus
}) => {
  // --- State ---
  const [finishedCardIds, setFinishedCardIds] = useState(new Set<string>());
  const [activeIndex, setActiveIndex] = useState(0);
  // --- End State ---

  // --- Data Preparation ---
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

  // --- Lock Logic (Checks ALL domain locks for overall status) ---
   const areAllDomainsLocked = useCallback(() => {
     // Check based on *all* potential cards derived from the functioning prop
     if (!functioning || allDomainCards.length === 0) return false;
     // Check if *every* domain present in the data is locked
     return allDomainCards.every(card =>
        card.domainData.isLocked ?? presentLevelsLockStatus?.functioning?.[card.domainName] ?? false
     );
   }, [functioning, allDomainCards, presentLevelsLockStatus]);

   const isAnyDomainLocked = useCallback(() => {
    // Check based on *all* potential cards
     if (!functioning || allDomainCards.length === 0) return false;
     // Check if *any* domain present in the data is locked
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

  // --- Card Navigation & Swipe Logic ---
  const handlePrev = useCallback(() => { /* ... same logic ... */
      if (numCardsInDeck <= 1) return;
      setActiveIndex((prev) => (prev - 1 + numCardsInDeck) % numCardsInDeck);
  }, [numCardsInDeck]);

  const handleNext = useCallback(() => { /* ... same logic ... */
      if (numCardsInDeck <= 1) return;
      setActiveIndex((prev) => (prev + 1) % numCardsInDeck);
  }, [numCardsInDeck]);

  useEffect(() => { /* ... same keyboard listener logic ... */
      const handleKeyDown = (event: KeyboardEvent) => {
          if (numCardsInDeck <= 1) return;
          if (event.key === 'ArrowLeft') handlePrev();
          else if (event.key === 'ArrowRight') handleNext();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, numCardsInDeck]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => { /* ... same logic ... */
      if (numCardsInDeck <= 1) return;
      const { offset, velocity } = info;
      if (Math.abs(offset.x) > Math.abs(offset.y) && Math.abs(offset.x) > SWIPE_THRESHOLD) {
        const swipePower = offset.x * velocity.x;
        if (swipePower < -SWIPE_VELOCITY_THRESHOLD * 10) handleNext();
        else if (swipePower > SWIPE_VELOCITY_THRESHOLD * 10) handlePrev();
      }
  };

  const calculateCardStyle = (index: number) => { /* ... same animation logic ... */
      let offset = index - activeIndex; const half = Math.floor(numCardsInDeck / 2);
      if (numCardsInDeck > 1) { if (offset > half) offset -= numCardsInDeck; else if (offset < -half) offset += numCardsInDeck; }
      const absOffset = Math.abs(offset); const safe = (n: number) => (Number.isFinite(n) ? n : 0);
      if (offset === 0) return { x: 0, y: 0, scale: 1, rotateY: 0, opacity: 1, zIndex: numCardsInDeck + 1, display: 'flex' };
      else if (absOffset <= MAX_VISIBLE_OFFSET) return { x: safe(offset * HORIZONTAL_STAGGER), y: safe(absOffset * VERTICAL_STAGGER), scale: safe(1 - (absOffset * SCALE_FACTOR)), rotateY: safe(-offset * ROTATE_Y_FACTOR), opacity: 1, zIndex: numCardsInDeck - absOffset, display: 'flex' };
      else { const sign = Math.sign(offset); return { x: safe(sign * HORIZONTAL_STAGGER * (MAX_VISIBLE_OFFSET + 0.5)), y: safe(VERTICAL_STAGGER * MAX_VISIBLE_OFFSET), scale: safe(1 - (MAX_VISIBLE_OFFSET * SCALE_FACTOR)), rotateY: safe(-sign * ROTATE_Y_FACTOR * MAX_VISIBLE_OFFSET), opacity: 0, zIndex: 0, display: 'flex' }; }
   };
  // --- End Navigation & Swipe ---

  // --- Finish/Unfinish Card Handlers ---
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

  // Initialize finished state from domainData (if available) - run once on mount
   useEffect(() => {
       const initialFinished = new Set<string>();
       allDomainCards.forEach(card => {
           // Assuming DomainCard's internal state or domainData might hold a 'markedDone' status
           // If domainData has a 'markedDone' boolean:
           // if (card.domainData.markedDone) {
           //    initialFinished.add(card.id);
           // }
           // --- OR ---
           // If you track markedDone status separately in the parent (like in AssessmentResults):
           // Example: Check a hypothetical 'presentLevelsMarkedDoneStatus' prop
           // if (presentLevelsMarkedDoneStatus?.functioning?.[card.id]) { // Assuming ID matches key
           //      initialFinished.add(card.id);
           // }
           // For now, we'll leave it empty unless you have a specific prop for initial state
       });
       setFinishedCardIds(initialFinished);

       // Adjust active index if starting with some cards finished
        const initialVisibleCount = allDomainCards.length - initialFinished.size;
         if (initialVisibleCount > 0) {
             setActiveIndex(0); // Start at the first visible card
         }

   }, [allDomainCards]); // Rerun if the list of domains fundamentally changes
  // --- End Finish/Unfinish ---

  // --- Render ---
  return (
    <div className="mb-8">
      {/* Section Header */}
      <div id="present-levels" className="flex justify-between items-center mb-1 scroll-mt-20">
        <h3 className="text-md font-semibold uppercase tracking-wide">Present Levels</h3>
        <div className="flex gap-2 items-center">
          {/* Lock Button - Uses useCallback versions */}
          {onLockSection && ( <Button size="sm" variant={areAllDomainsLocked() ? "secondary" : "ghost"} onClick={handleSectionLock} className={`transition-all hover:scale-110 ${ areAllDomainsLocked() ? "text-gray-600 bg-gray-200 border-gray-300" : isAnyDomainLocked() ? "text-amber-600" : "text-gray-500 hover:text-gray-700" }`} title={areAllDomainsLocked() ? "Unlock all domain cards" : "Lock all domain cards"} > {areAllDomainsLocked() ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />} {areAllDomainsLocked() ? "Section Locked" : "Lock Section"} </Button> )}
        </div>
      </div>
      {/* HR STYLING CHANGED HERE */}
      <hr className="mb-3 border-neutral-200" /> {/* Changed from border-blue-200 */}

       {/* Finished Cards Badge List - Styling appears neutral already */}
       {finishedCardsForBadges.length > 0 && (
          <div className="mb-4 px-2 py-2 border border-dashed border-gray-300 rounded-md">
              <h5 className="text-xs font-semibold mb-2 text-gray-500 uppercase">Finished Items</h5>
              <div className="flex flex-wrap gap-2">
                  {finishedCardsForBadges.map(card => (
                      <Badge key={card.id} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-0.5">
                          <span className="text-xs font-medium">{card.title}</span>
                          <button onClick={() => handleUnfinishCard(card.id)} className="rounded-full hover:bg-gray-300 p-0.5 focus:outline-none focus:ring-1 focus:ring-gray-400" aria-label={`Remove ${card.title} from finished`}> <X className="h-3 w-3 text-gray-600" /> </button>
                      </Badge>
                  ))}
              </div>
          </div>
       )}

      {/* Stacking Card Container */}
      <div className="relative h-[450px] w-full max-w-lg mx-auto flex items-center justify-center overflow-hidden">
          {/* Empty states */}
          {allDomainCards.length === 0 && ( <div className="text-center text-gray-500 italic">No domain data available.</div> )}
          {numCardsInDeck === 0 && allDomainCards.length > 0 && ( <div className="text-center text-gray-500 italic">All domain cards marked as finished.</div> )}

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
                                perspective: "1000px",
                                pointerEvents: isActive ? 'auto' : 'none'
                            }}
                            drag={isActive && numCardsInDeck > 1 ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={isActive ? handleDragEnd : undefined}
                        >
                            <div className="w-full max-w-md h-[95%]">
                                {/* --- DomainCard Styling --- */}
                                {/* IMPORTANT: The visual styling (background, border, header color) */}
                                {/* of the card itself needs to be adjusted *inside* the DomainCard component. */}
                                {/* */}
                                {/* Example changes needed within DomainCard.tsx: */}
                                {/* - Set main card background to bg-white */}
                                {/* - Set card border to border border-neutral-200 */}
                                {/* - Set card header background to bg-neutral-100 (or bg-gray-100) */}
                                {/* - Remove any blue-specific styling unless intended. */}
                                <DomainCard
                                    domain={cardData.domainName}
                                    domainData={cardData.domainData}
                                    onLockSection={onLockSection} // Pass down if DomainCard needs it
                                    onToggleSynthesis={onToggleSynthesis} // Pass down
                                    onSaveContent={onSaveContent} // Pass down
                                    onMarkFinished={() => handleMarkCardFinished(cardData.id)} // Pass down finish callback
                                    // Add other props DomainCard needs, like isLocked, etc.
                                    isLocked={cardData.domainData.isLocked ?? presentLevelsLockStatus?.functioning?.[cardData.domainName]}
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