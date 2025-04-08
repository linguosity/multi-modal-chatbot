// FILE: ConclusionSection.tsx (Refactored for Stacking Cards & Finish Logic)

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added hooks
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Keep Card for Tabs card
import { ReportConclusion, californiaEdCodes, preschoolEdCode } from '@/types/reportSchemas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Lock, Unlock, ChevronLeft, ChevronRight } from "lucide-react"; // Added Chevrons
import { Badge } from "@/components/ui/badge"; // Added Badge
import { X as LucideX } from "lucide-react"; // Added X for badges, alias to avoid conflict
import { motion, AnimatePresence, PanInfo } from 'framer-motion'; // Added motion
import { cn } from "@/lib/utils";
import { EditableCard } from "@/components/reports/EditableCard";
import { Button } from "@/components/ui/button";

// --- Interface Definitions ---
interface ConclusionSectionProps {
  conclusion: ReportConclusion | undefined | null;
  onToggleDomainEligibility: (domain: string, value: boolean) => void; // Keep this for Tabs card
  onLockSection?: (id: string, locked: boolean) => void;
  onToggleSynthesis?: (id: string) => void;
  onSaveContent?: (id: string, content: string) => void;
  onToggleMarkedDone?: (id: string, isDone: boolean) => void; // Added for finish logic
  // Consider adding markedDoneStatus to ReportConclusion schema later
  // markedDoneStatus?: ReportConclusion['markedDoneStatus'];
}

// Data structure for unified cards
interface ConclusionCardData {
    id: string; // e.g., 'conclusion-summary', 'eligibility-determination', 'domain-eligibility', etc.
    title: string;
    isLocked?: boolean;
    hasSynthesis?: boolean;
    synthesisContent?: string;
    initialContent?: string; // For editable cards
    viewComponent?: React.ReactNode; // For non-editable/complex cards
    isEditable?: boolean;
    initialIsMarkedDone?: boolean; // Placeholder for potential future prop
    color?: string; // Optional color theming (will be set to neutral)
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

export const ConclusionSection: React.FC<ConclusionSectionProps> = ({
  conclusion,
  onToggleDomainEligibility,
  onLockSection,
  onToggleSynthesis,
  onSaveContent,
  onToggleMarkedDone: notifyParentOfMarkDoneChange // Rename prop
  // markedDoneStatus // Destructure if added later
}) => {

  // --- State for Stacking Cards ---
  const [finishedCardIds, setFinishedCardIds] = useState(new Set<string>());
  const [activeIndex, setActiveIndex] = useState(0);
  // --- End State ---


  // --- Data Preparation (Unified Card Array) ---
  const allConclusionCards: ConclusionCardData[] = useMemo(() => {
    const cards: ConclusionCardData[] = [];
    if (!conclusion) return cards; // Return empty if no conclusion data

    // 1. Summary Card
    if (conclusion.conclusion) {
      const id = 'conclusion-summary';
      cards.push({
        id: id,
        title: "Summary",
        isLocked: conclusion.lockStatus?.summary,
        hasSynthesis: !!conclusion.conclusion.synthesis,
        synthesisContent: conclusion.conclusion.synthesis || "",
        initialContent: conclusion.conclusion.summary || "",
        isEditable: true,
        // initialIsMarkedDone: markedDoneStatus?.[id], // Example if status prop exists
        color: "neutral"
      });
    }

    // 2. Eligibility Determination Card
    if (conclusion.eligibility) {
        const id = 'eligibility-determination';
        cards.push({
            id: id,
            title: "Eligibility Determination",
            isLocked: conclusion.lockStatus?.eligibility,
            hasSynthesis: !!conclusion.eligibility.synthesis,
            synthesisContent: conclusion.eligibility.synthesis || "",
            initialContent: conclusion.eligibility.californiaEdCode || "", // Or maybe a structured view?
            isEditable: true, // Assuming the text explanation is editable
            // initialIsMarkedDone: markedDoneStatus?.[id],
            color: "neutral"
        });
    }

    // 3. Domain Eligibility Tabs Card (rendered as a single ViewComponent card)
    const getDomainEdCode = (domain: string) => { /* ... same helper function as before ... */
        const isPreschool = conclusion?.eligibility?.isPreschool;
        if (isPreschool) { return preschoolEdCode; }
        return californiaEdCodes?.[domain] || { title: domain.charAt(0).toUpperCase() + domain.slice(1), code: "N/A", description: "Ed Code information not found for this domain.", eligibilityCriteria: [] };
    };
    const defaultActiveTab = Object.keys(conclusion?.eligibility?.domains || {})[0] || undefined; // Simpler default

    if (conclusion.eligibility && defaultActiveTab) {
        const id = 'domain-eligibility';
        cards.push({
            id: id,
            title: "Eligibility by Domain",
            isLocked: conclusion.lockStatus?.eligibility, // Link lock to main eligibility card
            isEditable: false, // The content itself is interactive tabs
            // initialIsMarkedDone: markedDoneStatus?.[id],
            color: "neutral", // Base color, tabs have internal colors
            viewComponent: (
              <Card id="domain-eligibility-card-content" className="border-0 shadow-none bg-transparent p-0 h-full overflow-y-auto"> {/* Remove card shell styling */}
                {/* <CardHeader className="py-2 px-3 bg-neutral-100"> // Remove header, title is on the main card
                  <CardTitle className="text-sm font-medium text-neutral-800">Eligibility by Domain</CardTitle>
                </CardHeader> */}
                <CardContent className="p-0 pt-1"> {/* Remove padding */}
                  <Tabs defaultValue={defaultActiveTab} className="h-full flex flex-col">
                    <TabsList className="w-full grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 bg-neutral-100/80 p-0 h-auto flex-wrap shrink-0">
                       {/* Use optional chaining safely */}
                      {Object.entries(conclusion.eligibility?.domains || {}).map(([domain, isEligible]) => (
                        <TabsTrigger
                          key={domain} value={domain}
                          className={cn( "text-xxs sm:text-xs py-1.5 px-1 sm:px-2 data-[state=active]:bg-amber-100 data-[state=active]:shadow data-[state=active]:text-amber-900", "whitespace-nowrap h-full", isEligible ? "text-green-700" : "text-gray-500" )}
                        >
                          <div className="flex items-center justify-center gap-1 flex-wrap sm:flex-nowrap">
                            <span>{domain.charAt(0).toUpperCase() + domain.slice(1)}</span>
                            {isEligible ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" /> : <XCircle className="h-3 w-3 text-gray-400 shrink-0" />}
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="grow overflow-y-auto mt-2"> {/* Allow content to scroll */}
                      {Object.entries(conclusion.eligibility?.domains || {}).map(([domain, isEligible]) => {
                        const edCode = getDomainEdCode(domain);
                        return (
                          <TabsContent key={domain} value={domain} className="mt-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"> {/* Remove margin top */}
                            <div className="border border-neutral-200 rounded-md bg-white p-3 shadow-inner">
                              <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                                <div>
                                  <h4 className="font-semibold text-sm">{edCode.title}</h4>
                                  <p className="text-gray-500">{edCode.code}</p>
                                </div>
                                <button
                                  onClick={() => onToggleDomainEligibility(domain, !isEligible)}
                                  disabled={conclusion.lockStatus?.eligibility}
                                  className={cn( "px-2 py-1 rounded text-xs border flex items-center gap-1 transition-colors", isEligible ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100", conclusion.lockStatus?.eligibility ? "opacity-50 cursor-not-allowed" : "" )}
                                >
                                  {isEligible ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                  {isEligible ? 'Mark Not Eligible' : 'Mark Eligible'}
                                </button>
                              </div>
                              <p className="text-xs text-gray-700 mb-3">{edCode.description}</p>
                              {edCode.eligibilityCriteria.length > 0 && ( <div> <h5 className="font-medium mb-1 text-gray-600">Eligibility Criteria Examples:</h5> <ul className="list-disc pl-4 space-y-1 text-gray-700"> {edCode.eligibilityCriteria.map((criteria, i) => ( <li key={i}>{criteria}</li> ))} </ul> </div> )}
                            </div>
                          </TabsContent>
                        );
                      })}
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            )
        });
    }

    // 4. Recommended Services Card
    if (conclusion.recommendations) {
        const id = 'services-recommendations';
        cards.push({
            id: id,
            title: "Recommended Services",
            isLocked: conclusion.lockStatus?.services,
            hasSynthesis: !!conclusion.recommendations?.synthesis, // Use optional chaining
            synthesisContent: conclusion.recommendations?.synthesis || "",
            isEditable: true, // Allow editing the raw text representation
            initialContent: `Type: ${conclusion.recommendations.services?.typeOfService || ''}\nFrequency: ${conclusion.recommendations.services?.frequency || ''}\nSetting: ${conclusion.recommendations.services?.setting || ''}`,
            // initialIsMarkedDone: markedDoneStatus?.[id],
            color: "neutral",
            viewComponent: conclusion.recommendations.services ? ( // Check if services object exists
                <table className="w-full text-xs">
                  <tbody>
                    <tr><td className="font-medium pr-2 py-0.5">Type:</td><td>{conclusion.recommendations.services.typeOfService}</td></tr>
                    <tr><td className="font-medium pr-2 py-0.5">Frequency:</td><td>{conclusion.recommendations.services.frequency}</td></tr>
                    <tr><td className="font-medium pr-2 py-0.5">Setting:</td><td>{conclusion.recommendations.services.setting}</td></tr>
                  </tbody>
                </table> ) : <p className="text-xs text-gray-500">No service details provided.</p>
        });
    }

     // 5. Accommodations & Strategies Card
     if (conclusion.recommendations) {
        const id = 'accommodations-strategies';
        cards.push({
            id: id,
            title: "Accommodations & Strategies",
            isLocked: conclusion.lockStatus?.accommodations,
            hasSynthesis: !!conclusion.recommendations?.synthesis,
            synthesisContent: conclusion.recommendations?.synthesis || "",
            isEditable: true, // Allow editing the raw text representation
             // Use optional chaining and default arrays safely
            initialContent: [
                ...(conclusion.recommendations.accommodations || []).map(acc => `- ${acc}`),
                ...((conclusion.recommendations.accommodations?.length || 0) > 0 && (conclusion.recommendations.facilitationStrategies?.length || 0) > 0 ? ["\n"] : []),
                ...(conclusion.recommendations.facilitationStrategies || []).map(strat => `- ${strat}`)
              ].join("\n"),
            // initialIsMarkedDone: markedDoneStatus?.[id],
            color: "neutral",
            viewComponent: (
                <>
                  {(conclusion.recommendations.accommodations?.length || 0) > 0 && ( <div className="mb-2"> <h5 className="text-xs font-semibold mb-1 text-gray-600">Accommodations</h5> <ul className="list-disc pl-4 space-y-0.5 text-gray-800"> {conclusion.recommendations.accommodations!.map((rec, index) => ( <li key={`acc-${index}`}>{rec}</li> ))} </ul> </div> )}
                  {(conclusion.recommendations.facilitationStrategies?.length || 0) > 0 && ( <div> <h5 className="text-xs font-semibold mb-1 text-gray-600">Facilitation Strategies</h5> <ul className="list-disc pl-4 space-y-0.5 text-gray-800"> {conclusion.recommendations.facilitationStrategies!.map((strat, index) => ( <li key={`strat-${index}`}>{strat}</li> ))} </ul> </div> )}
                  {(conclusion.recommendations.accommodations?.length || 0) === 0 && (conclusion.recommendations.facilitationStrategies?.length || 0) === 0 && ( <p className="text-xs text-gray-500">No accommodations or strategies listed.</p> )}
                </> )
        });
    }

    // Future: Add Glossary Card if needed

    return cards;
    // Add dependencies based on props used (conclusion object and potentially markedDoneStatus)
  }, [conclusion, onToggleDomainEligibility]); // onToggleDomainEligibility needed for Tabs card viewComponent


  // --- Derived State ---
  const visibleCardsInDeck = useMemo(() =>
      allConclusionCards.filter(card => !finishedCardIds.has(card.id)),
      [allConclusionCards, finishedCardIds]
  );
  const finishedCardsForBadges = useMemo(() =>
      allConclusionCards.filter(card => finishedCardIds.has(card.id)),
      [allConclusionCards, finishedCardIds]
  );
  const numCardsInDeck = visibleCardsInDeck.length;

  // Effect to adjust activeIndex
  useEffect(() => {
      if (numCardsInDeck > 0 && activeIndex >= numCardsInDeck) {
          setActiveIndex(numCardsInDeck - 1);
      } else if (numCardsInDeck === 0) {
          setActiveIndex(0);
      }
  }, [numCardsInDeck, activeIndex]);


  // --- Lock Logic (Updated to check based on allConclusionCards) ---
  const areAllCardsLocked = useCallback(() => {
    if (!conclusion || allConclusionCards.length === 0) return false;
    // Check if *every* card derived from the data is locked
    return allConclusionCards.every(card => card.isLocked);
  }, [conclusion, allConclusionCards]);

  const isAnySectionLocked = useCallback(() => {
    if (!conclusion || allConclusionCards.length === 0) return false;
    // Check if *any* card derived from the data is locked
    return allConclusionCards.some(card => card.isLocked);
  }, [conclusion, allConclusionCards]);

  const handleSectionLock = useCallback(() => {
    const shouldLock = !areAllCardsLocked();
    if (onLockSection) {
      // Parent needs to handle locking based on this section ID
      onLockSection('section-conclusion', shouldLock);
    }
  }, [onLockSection, areAllCardsLocked]);
  // --- End Lock Logic ---


  // --- Navigation & Swipe Logic ---
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

   // Initialize finished state (Placeholder - adapt if status prop exists)
   useEffect(() => {
       const initialFinished = new Set<string>();
       allConclusionCards.forEach(card => {
            // Example: if (markedDoneStatus?.[card.id]) initialFinished.add(card.id);
            if (card.initialIsMarkedDone) { // Check the property we added
                 initialFinished.add(card.id);
            }
       });
       setFinishedCardIds(initialFinished);
        const initialVisibleCount = allConclusionCards.length - initialFinished.size;
         if (initialVisibleCount > 0) {
             setActiveIndex(0);
         }
   }, [allConclusionCards]); // Rerun if the list of cards changes
  // --- End Finish/Unfinish ---


  // Early return if no conclusion data at all
  if (!conclusion) {
     return <div className="p-4 text-gray-500 italic">Conclusion data not available.</div>;
   }

  // --- Render ---
  return (
    <div className="mb-8">
      {/* Section Header - Updated HR color and Lock Button logic */}
      <div className="flex justify-between items-center mb-1 pb-1"> {/* Removed border bottom here */}
        <h3 className="text-md font-semibold uppercase tracking-wide">Conclusion & Recommendations</h3>
        {onLockSection && (
            <Button
              size="sm"
              variant={areAllCardsLocked() ? "secondary" : "ghost"}
              onClick={handleSectionLock} // Uses useCallback version
              className={`transition-all hover:scale-110 ${
                areAllCardsLocked() ? "text-gray-600 bg-gray-200 border-gray-300" :
                isAnySectionLocked() ? "text-amber-600" : "text-gray-500 hover:text-gray-700"
              }`}
              title={areAllCardsLocked() ? "Unlock all cards in this section" : "Lock all cards in this section"}
            >
              {areAllCardsLocked() ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
              {areAllCardsLocked() ? "Section Locked" : "Lock Section"}
            </Button>
        )}
      </div>
      <hr className="mb-3 border-neutral-200" /> {/* Changed color */}


      {/* Finished Cards Badge List */}
      {finishedCardsForBadges.length > 0 && (
         <div className="mb-4 px-2 py-2 border border-dashed border-gray-300 rounded-md">
             <h5 className="text-xs font-semibold mb-2 text-gray-500 uppercase">Finished Items</h5>
             <div className="flex flex-wrap gap-2">
                 {finishedCardsForBadges.map(card => (
                     <Badge key={card.id} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-0.5">
                         <span className="text-xs font-medium">{card.title}</span>
                         <button onClick={() => handleUnfinishCard(card.id)} className="rounded-full hover:bg-gray-300 p-0.5 focus:outline-none focus:ring-1 focus:ring-gray-400" aria-label={`Remove ${card.title} from finished`}>
                           <LucideX className="h-3 w-3 text-gray-600" /> {/* Use aliased X icon */}
                         </button>
                     </Badge>
                 ))}
             </div>
         </div>
      )}

      {/* --- Stacking Card Container (Replaces old Grid) --- */}
      {/* Set explicit height - adjust as needed based on content */}
      <div className="relative h-[500px] w-full max-w-lg mx-auto flex items-center justify-center overflow-hidden">
          {/* Empty states */}
          {allConclusionCards.length === 0 && ( <div className="text-center text-gray-500 italic">No conclusion cards available.</div> )}
          {numCardsInDeck === 0 && allConclusionCards.length > 0 && ( <div className="text-center text-gray-500 italic">All conclusion cards marked as finished.</div> )}

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
                            {/* Inner container for sizing */}
                            <div className="w-full max-w-md h-[95%]">
                                <EditableCard
                                    // --- Core Card Data ---
                                    id={cardData.id}
                                    title={cardData.title}
                                    initialContent={cardData.initialContent} // Undefined for viewComponent cards is fine
                                    viewComponent={cardData.viewComponent} // Render Tabs card content here
                                    isEditable={cardData.isEditable}
                                    // --- State & Callbacks ---
                                    isLocked={cardData.isLocked}
                                    hasSynthesis={cardData.hasSynthesis}
                                    synthesisContent={cardData.synthesisContent}
                                    onSave={(content) => onSaveContent && onSaveContent(cardData.id, content)}
                                    onToggleMarkedDone={() => handleMarkCardFinished(cardData.id)} // Hook up finish action
                                    onToggleSynthesis={() => onToggleSynthesis?.(cardData.id)}
                                    onLock={(id, lockState) => onLockSection?.(id, lockState)} // Pass direct lock if needed
                                    // --- Styling ---
                                    color={cardData.color || "neutral"} // Use neutral color
                                    className="border border-neutral-200 shadow-lg bg-white h-full flex flex-col" // Neutral card style
                                    headerClassName="py-2 px-3 bg-neutral-100 shrink-0" // Neutral header, prevent shrinking
                                    contentClassName="p-3 text-xs text-neutral-700 grow overflow-y-auto" // Content style
                                    disableHoverEffect={true} // Disable hover in draggable container
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
              <Button variant="ghost" size="icon" onClick={handlePrev} className="absolute left-2 sm:-left-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Previous Conclusion Card"> <ChevronLeft className="h-6 w-6" /> </Button>
              <Button variant="ghost" size="icon" onClick={handleNext} className="absolute right-2 sm:-right-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Next Conclusion Card"> <ChevronRight className="h-6 w-6" /> </Button>
            </>
          )}
      </div> {/* End Stacking Card Container */}
    </div> // End Main Section Div
  );
};

export default ConclusionSection;