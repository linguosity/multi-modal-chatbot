// FILE: src/components/reports/text-editor/AssessmentToolsSection.tsx
// (Applied stacking card logic from BackgroundSection)

import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added hooks
import { EditableCard } from "@/components/reports/EditableCard";
// Removed unused Card, CardHeader, CardTitle, CardContent
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"; // Add this if not already imported
import { CheckCircle } from "lucide-react"; // Already used in BackgroundSection
import { PocketKnife } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge"; // Added Badge
import { BookOpen, Plus, Search, Lock, Unlock, ChevronLeft, ChevronRight, X } from "lucide-react"; // Added ChevronLeft, ChevronRight, X
import { motion, AnimatePresence, PanInfo } from 'framer-motion'; // Added framer-motion
import { safeMotionNumber } from '@/lib/utils'; // For safe animation values
// Use correct types from schema file
import { AssessmentResults } from '@/types/reportSchemas';
import { AssessmentTool } from '@/lib/assessment-tools';
import { AssessmentLibraryPanel } from "@/components/reports/AssessmentLibraryPanel";
import { cn } from "@/lib/utils";

// --- Interface Definitions ---
interface AssessmentToolsSectionProps {
  assessmentProcedures: AssessmentResults['assessmentProceduresAndTools'];
  observations: AssessmentResults['observations'];
  onAddTool: (toolId: string) => void; // Keep this for adding tools
  onRemoveTool?: (toolId: string) => void; // Potentially needed if tools can be removed from the stack
  onOpenLibrary: () => void;
  allTools: Record<string, AssessmentTool>;
  onLockSection?: (id: string, locked: boolean) => void;
  onToggleSynthesis?: (id: string) => void;
  onSaveContent?: (id: string, content: string) => void;
  assessmentResultsLockStatus?: AssessmentResults['lockStatus'];
  onToggleMarkedDone?: (id: string, isDone: boolean) => void;
  assessmentMarkedDoneStatus?: AssessmentResults['markedDoneStatus']; // Need overall markedDone status
}

// Data structure for unified cards
interface AssessmentCardData {
    id: string; // Unique ID (e.g., 'validity-statement', 'observation-behavior', 'tool-celf5')
    type: 'validity' | 'observation' | 'tool';
    title: string;
    isLocked?: boolean;
    hasSynthesis?: boolean;
    synthesisContent?: string;
    initialContent?: string; // For editable cards
    viewComponent?: React.ReactNode; // For non-editable cards (like tools)
    isEditable?: boolean;
    initialIsMarkedDone?: boolean;
    color?: string; // Optional color theming
}

// --- Animation Constants (Copied from BackgroundSection) ---
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


/**
 * Component for displaying Assessment Tools and Observations using stacking cards.
 */
export const AssessmentToolsSection: React.FC<AssessmentToolsSectionProps> = ({
  assessmentProcedures,
  observations,
  onAddTool,
  // onRemoveTool, // Add if needed
  onOpenLibrary,
  allTools,
  onLockSection,
  onToggleSynthesis,
  onSaveContent,
  assessmentResultsLockStatus,
  onToggleMarkedDone: notifyParentOfMarkDoneChange, // Rename for clarity
  assessmentMarkedDoneStatus
}) => {
  // --- State for Add/Search (Remains the same) ---
  const [toolSearchQuery, setToolSearchQuery] = React.useState('');
  const [showToolSearchResults, setShowToolSearchResults] = React.useState(false);
  const [toolSearchResults, setToolSearchResults] = React.useState<AssessmentTool[]>([]);
  const [quickToolForm, setQuickToolForm] = React.useState({
    name: '', id: '', domains: [] as string[]
  });

  // --- State for Stacking Cards (Adapted from BackgroundSection) ---
  const [finishedCardIds, setFinishedCardIds] = useState(new Set<string>());
  const [activeIndex, setActiveIndex] = useState(0);

  // --- Data Preparation (Unified Card Array) ---
  const allAssessmentCards: AssessmentCardData[] = useMemo(() => {
    const cards: AssessmentCardData[] = [];

    // 1. Validity Statement
    if (assessmentProcedures?.overviewOfAssessmentMethods !== undefined) {
      const id = 'validity-statement';
      cards.push({
        id: id,
        type: 'validity',
        title: 'Assessment Methods',
        isLocked: assessmentProcedures?.isLocked ?? assessmentResultsLockStatus?.validityStatement ?? false,
        hasSynthesis: !!assessmentProcedures?.synthesis,
        synthesisContent: assessmentProcedures?.synthesis || "",
        initialContent: assessmentProcedures?.overviewOfAssessmentMethods || "",
        isEditable: true,
        initialIsMarkedDone: assessmentMarkedDoneStatus?.validityStatement ?? false,
        color: "green"
      });
    }

    // 2. Observations
    const validObservationEntries = Object.entries(observations || {}).filter(
      ([key, content]) => key !== 'synthesis' && key !== 'isLocked' && key !== 'lockStatus' && key !== 'wasSectionLock' && key !== 'markedDoneStatus' && content // Filter out metadata and empty content
    );
    validObservationEntries.forEach(([obsKey, content]) => {
      const id = `observation-${obsKey}`;
      cards.push({
        id: id,
        type: 'observation',
        title: obsKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        isLocked: (observations?.lockStatus?.[obsKey]) ?? assessmentResultsLockStatus?.observations?.[obsKey] ?? false,
        // Note: Synthesis for observations might be section-wide, not per-observation.
        // Assuming section-wide synthesis for now. Adjust if needed.
        hasSynthesis: !!observations?.synthesis,
        synthesisContent: observations?.synthesis || "",
        initialContent: content || "",
        isEditable: true,
        initialIsMarkedDone: assessmentMarkedDoneStatus?.observations?.[id] ?? false,
        color: "green"
      });
    });

    // 3. Used Tools
    const usedToolIds = assessmentProcedures?.assessmentToolsUsed || [];
    usedToolIds.forEach(toolId => {
      const toolDetails = allTools?.[toolId];
      const id = `tool-${toolId}`;
      cards.push({
          id: id,
          type: 'tool',
          title: toolDetails?.name || toolId.toUpperCase(),
          isLocked: (assessmentProcedures?.lockStatus?.tools?.[toolId]) ?? assessmentResultsLockStatus?.tools?.[toolId] ?? false,
          // Assuming synthesis applies to the procedures section, not individual tools
          hasSynthesis: !!assessmentProcedures?.synthesis,
          synthesisContent: assessmentProcedures?.synthesis || "",
          isEditable: false, // Tools are generally view-only in this context
          viewComponent: toolDetails ? (
              <div className="space-y-1 text-xs"> {/* Ensure consistent font size */}
                  {toolDetails.authors && <p><span className="font-medium">Authors:</span> {toolDetails.authors.join(', ')}</p>}
                  {toolDetails.year && <p><span className="font-medium">Year:</span> {toolDetails.year}</p>}
                  {toolDetails.targetAgeRange && <p><span className="font-medium">Ages:</span> {toolDetails.targetAgeRange}</p>}
                  {toolDetails.domains && toolDetails.domains.length > 0 && (
                      <p><span className="font-medium">Domains:</span> {toolDetails.domains.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</p>
                  )}
                  {/* Add a placeholder if no specific details */}
                  {!toolDetails.authors && !toolDetails.year && !toolDetails.targetAgeRange && (!toolDetails.domains || toolDetails.domains.length === 0) && (
                    <p className="text-gray-500 italic">No specific details provided for this tool.</p>
                  )}
              </div>
          ) : (
              <p className="text-gray-600 text-xs">Details not found for tool ID: {toolId}</p>
          ),
          initialIsMarkedDone: assessmentMarkedDoneStatus?.tools?.[id] ?? false,
          color: "green"
      });
    });

    return cards;
  }, [assessmentProcedures, observations, allTools, assessmentResultsLockStatus, assessmentMarkedDoneStatus]); // Dependencies for the unified list


  // --- Derived State (Adapted from BackgroundSection) ---
  const visibleCardsInDeck = useMemo(() =>
      allAssessmentCards.filter(card => !finishedCardIds.has(card.id)),
      [allAssessmentCards, finishedCardIds]
  );
  const finishedCardsForBadges = useMemo(() =>
      allAssessmentCards.filter(card => finishedCardIds.has(card.id)),
      [allAssessmentCards, finishedCardIds]
  );

  const numCardsInDeck = visibleCardsInDeck.length;

  // Effect to adjust activeIndex if cards are finished/added (Adapted from BackgroundSection)
  useEffect(() => {
      if (numCardsInDeck > 0 && activeIndex >= numCardsInDeck) {
          setActiveIndex(numCardsInDeck - 1);
      } else if (numCardsInDeck === 0) {
          setActiveIndex(0); // Reset if deck becomes empty
      }
  }, [numCardsInDeck, activeIndex]);

   // --- START: Lock Logic (Checks original props, not derived state) ---
   // This logic remains largely the same, ensuring it checks the source props
   const areAllToolsCardsLocked = useCallback(() => {
    // Check validity statement lock
    const validityLocked = assessmentProcedures?.isLocked ?? assessmentResultsLockStatus?.validityStatement ?? false;

    // Check all *relevant* observation locks (those that generated cards)
    const obsKeysInData = allAssessmentCards
        .filter(card => card.type === 'observation')
        .map(card => card.id.replace('observation-', '')); // Extract original keys
    const allObsLocked = obsKeysInData.length === 0 || obsKeysInData.every(key =>
        (observations?.lockStatus?.[key]) ?? assessmentResultsLockStatus?.observations?.[key] ?? false
    );

    // Check all *used* tool locks
    const usedToolIds = assessmentProcedures?.assessmentToolsUsed || [];
    const allToolsLocked = usedToolIds.length === 0 || usedToolIds.every(toolId =>
       (assessmentProcedures?.lockStatus?.tools?.[toolId]) ?? assessmentResultsLockStatus?.tools?.[toolId] ?? false
    );

    return validityLocked && allObsLocked && allToolsLocked;
  }, [assessmentProcedures, observations, assessmentResultsLockStatus, allAssessmentCards]); // Include allAssessmentCards to re-evaluate if obs keys change


  const isAnyToolCardLocked = useCallback(() => {
    const validityLocked = assessmentProcedures?.isLocked ?? assessmentResultsLockStatus?.validityStatement ?? false;

    const obsKeysInData = allAssessmentCards
        .filter(card => card.type === 'observation')
        .map(card => card.id.replace('observation-', ''));
    const anyObsLocked = obsKeysInData.some(key =>
        (observations?.lockStatus?.[key]) ?? assessmentResultsLockStatus?.observations?.[key] ?? false
    );

    const usedToolIds = assessmentProcedures?.assessmentToolsUsed || [];
    const anyToolLocked = usedToolIds.some(toolId =>
       (assessmentProcedures?.lockStatus?.tools?.[toolId]) ?? assessmentResultsLockStatus?.tools?.[toolId] ?? false
    );

    return validityLocked || anyObsLocked || anyToolLocked;
  }, [assessmentProcedures, observations, assessmentResultsLockStatus, allAssessmentCards]);

  const handleSectionLock = useCallback(() => {
    const shouldLock = !areAllToolsCardsLocked();
    if (onLockSection) {
      // The parent component handles applying the lock state across
      // assessmentProcedures, observations, etc., based on this section ID.
      onLockSection('section-assessment-tools', shouldLock);
    }
  }, [onLockSection, areAllToolsCardsLocked]);
  // === END: Lock Logic ===


  // --- Navigation (Adapted from BackgroundSection) ---
  const handlePrev = useCallback(() => {
      if (numCardsInDeck === 0) return;
      setActiveIndex((prev) => (prev - 1 + numCardsInDeck) % numCardsInDeck);
  }, [numCardsInDeck]);

  const handleNext = useCallback(() => {
      if (numCardsInDeck === 0) return;
      setActiveIndex((prev) => (prev + 1) % numCardsInDeck);
  }, [numCardsInDeck]);

  // Optional: Keyboard listener (Adapted from BackgroundSection)
  useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
          if (numCardsInDeck <= 1) return;
          if (event.key === 'ArrowLeft') {
              handlePrev();
          } else if (event.key === 'ArrowRight') {
              handleNext();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, numCardsInDeck]); // Add numCardsInDeck dependency

  // --- Swipe Handler (Adapted from BackgroundSection) ---
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (numCardsInDeck <= 1) return; // No swiping if only one card or fewer
      const { offset, velocity } = info;
      // Simplified swipe power calculation for horizontal swipes
      const swipe = Math.abs(offset.x) * velocity.x;
      const swipeThreshold = SWIPE_THRESHOLD * SWIPE_VELOCITY_THRESHOLD / 5; // Adjust sensitivity as needed

      if (swipe < -swipeThreshold) { // Swipe left (faster/further) -> Next card
          handleNext();
      } else if (swipe > swipeThreshold) { // Swipe right (faster/further) -> Previous card
          handlePrev();
      }
      // No action if swipe is weak or vertical
  };


  // --- Finish/Unfinish Card Handlers (Adapted from BackgroundSection) ---
   const handleMarkCardFinished = useCallback((cardId: string) => {
       setFinishedCardIds(prev => new Set(prev).add(cardId));
       notifyParentOfMarkDoneChange?.(cardId, true); // Notify parent
   }, [notifyParentOfMarkDoneChange]);

   const handleUnfinishCard = useCallback((cardId: string) => {
       setFinishedCardIds(prev => {
           const next = new Set(prev);
           next.delete(cardId);
           return next;
       });
       notifyParentOfMarkDoneChange?.(cardId, false); // Notify parent
   }, [notifyParentOfMarkDoneChange]);

   // Initialize finishedCardIds from props on mount
   useEffect(() => {
        const initialFinished = new Set<string>();
        allAssessmentCards.forEach(card => {
            if (card.initialIsMarkedDone) {
                initialFinished.add(card.id);
            }
        });
        setFinishedCardIds(initialFinished);
        // Adjust active index if starting with some cards finished
        const initialVisibleCount = allAssessmentCards.length - initialFinished.size;
         if (initialVisibleCount > 0) {
             setActiveIndex(0); // Start at the first visible card
         }

    }, [allAssessmentCards]); // Run only when the card data changes fundamentally


  // --- Animation Calculation (Copied from BackgroundSection) ---
  const calculateCardStyle = (index: number) => {
    let offset = index - activeIndex;
    const half = Math.floor(numCardsInDeck / 2);

    // Handle wrap-around for calculating offset
    if (numCardsInDeck > 1) { // Avoid division by zero or unnecessary logic for 0 or 1 card
        if (offset > half) offset -= numCardsInDeck;
        else if (offset < -half) offset += numCardsInDeck;
    }

    const absOffset = Math.abs(offset);

    // Using the safeMotionNumber helper instead of inline function

    // Style for the active card (center)
    if (offset === 0) {
        return {
            x: 0, y: 0, scale: 1, rotateY: 0, opacity: 1, zIndex: numCardsInDeck + 1, // Highest zIndex
            display: 'flex', // Ensure it's visible
        };
    }
    // Style for visible cards behind the active card
    else if (absOffset <= MAX_VISIBLE_OFFSET) {
        return {
            x: safeMotionNumber(offset * HORIZONTAL_STAGGER),
            y: safeMotionNumber(absOffset * VERTICAL_STAGGER),
            scale: safeMotionNumber(1 - (absOffset * SCALE_FACTOR)),
            rotateY: safeMotionNumber(-offset * ROTATE_Y_FACTOR), // Rotate away from the center
            opacity: 1, // Fully visible
            zIndex: numCardsInDeck - absOffset, // Lower zIndex based on distance
            display: 'flex',
        };
    }
    // Style for cards completely hidden (beyond MAX_VISIBLE_OFFSET)
    else {
        const sign = Math.sign(offset);
        return {
            // Position further out, matching the last visible card's position/rotation/scale
            x: safeMotionNumber(sign * HORIZONTAL_STAGGER * (MAX_VISIBLE_OFFSET + 0.5)), // Slightly further than last visible
            y: safeMotionNumber(VERTICAL_STAGGER * MAX_VISIBLE_OFFSET),
            scale: safeMotionNumber(1 - (MAX_VISIBLE_OFFSET * SCALE_FACTOR)),
            rotateY: safeMotionNumber(-sign * ROTATE_Y_FACTOR * MAX_VISIBLE_OFFSET),
            opacity: 0, // Hidden
            zIndex: 0, // Lowest zIndex
            // 'display: flex' is kept to allow AnimatePresence to track it for exit animations
            // but opacity: 0 hides it visually. Alternatively, could use 'display: none'
            // but that might interfere with animations.
            display: 'flex',
        };
    }
  };


  // --- Main Return Statement ---
  return (
    <div className="mb-8"> {/* Main wrapper */}

        {/* Section Header */}
        <div id="assessment-tools-section-header" className="flex justify-between items-center mb-4 border-b border-neutral-200 scroll-mt-20">
            <h3 className="text-md font-semibold uppercase tracking-wide">Assessment Tools</h3>
            </div>
            {/* Add/Search Tools Controls (Keep this section as is) */}
            <div className="relative mb-4 flex justify-between items-start">
              <Popover className="absolute">
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50">
                    <PocketKnife className="h-3.5 w-3.5 mr-1" /> Add Tool
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[480px] p-4" align="start">
                  <Tabs defaultValue="quick" className="w-full">
                    <TabsList className="mb-3 w-full">
                      <TabsTrigger value="quick" className="flex-1 text-xs">Quick Add</TabsTrigger>
                      <TabsTrigger value="library" className="flex-1 text-xs">Library</TabsTrigger>
                      <TabsTrigger value="search" className="flex-1 text-xs">Search</TabsTrigger>
                    </TabsList>

                    <TabsContent value="quick">
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Add Assessment Tool</h3>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label htmlFor="quick-tool-name" className="text-xs">Tool Name</Label>
                            <Input
                              id="quick-tool-name"
                              placeholder="E.g., CELF-5"
                              className="h-8 text-xs"
                              value={quickToolForm.name}
                              onChange={(e) =>
                                setQuickToolForm({
                                  ...quickToolForm,
                                  name: e.target.value,
                                  id: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="quick-tool-id" className="text-xs">ID/Acronym</Label>
                            <Input
                              id="quick-tool-id"
                              placeholder="e.g., celf-5"
                              className="h-8 text-xs"
                              value={quickToolForm.id}
                              onChange={(e) =>
                                setQuickToolForm({
                                  ...quickToolForm,
                                  id: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Domains</Label>
                            <div className="flex flex-wrap gap-1">
                              {["receptive", "expressive", "pragmatic", "articulation", "voice", "fluency"].map((domain) => (
                                <Button
                                  key={domain}
                                  variant={quickToolForm.domains.includes(domain) ? "default" : "outline"}
                                  size="sm"
                                  className={`h-6 text-xs py-0 ${
                                    quickToolForm.domains.includes(domain) ? "bg-green-600 hover:bg-green-700 text-white" : ""
                                  }`}
                                  onClick={() =>
                                    setQuickToolForm((prev) => ({
                                      ...prev,
                                      domains: prev.domains.includes(domain)
                                        ? prev.domains.filter((d) => d !== domain)
                                        : [...prev.domains, domain],
                                    }))
                                  }
                                >
                                  {domain.charAt(0).toUpperCase() + domain.slice(1)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 flex justify-between">
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onOpenLibrary}>
                            Open Library
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-7 bg-green-600 hover:bg-green-700"
                            disabled={!quickToolForm.name || !quickToolForm.id}
                            onClick={() => {
                              onAddTool(quickToolForm.id);
                              console.log("Quick Added Tool:", quickToolForm);
                              setQuickToolForm({ name: "", id: "", domains: [] });
                              document.body.click(); // close the popover
                            }}
                          >
                            Add Tool
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="library">
                      <AssessmentLibraryPanel onAddTool={(tool) => onAddTool(tool.id)} selectedDomain={null} />
                    </TabsContent>

                    <TabsContent value="search">
                      <div className="relative">
                        <Input
                          placeholder="Search available tools..."
                          className="border mb-2 text-xs h-8"
                          value={toolSearchQuery}
                          onChange={(e) => {
                            const query = e.target.value.toLowerCase();
                            setToolSearchQuery(query);
                            const results = Object.values(allTools).filter((tool: AssessmentTool) =>
                              tool.name.toLowerCase().includes(query) ||
                              tool.id.toLowerCase().includes(query) ||
                              (tool.authors || []).some((author) => author.toLowerCase().includes(query))
                            );
                            setToolSearchResults(results);
                            setShowToolSearchResults(true);
                          }}
                        />
                        {showToolSearchResults && (
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {toolSearchResults.length ? (
                              toolSearchResults.map((tool) => (
                                <Button
                                  key={tool.id}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-left text-xs"
                                  onClick={() => {
                                    onAddTool(tool.id);
                                    setToolSearchQuery('');
                                    setShowToolSearchResults(false);
                                  }}
                                >
                                  <BookOpen className="w-3.5 h-3.5 mr-2" />
                                  {tool.name} <span className="text-gray-400 ml-2">({tool.id})</span>
                                </Button>
                              ))
                            ) : (
                              <div className="text-xs text-center text-gray-500 py-2">No matching tools found.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>
            

            {finishedCardsForBadges.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-green-700 hover:bg-green-50 transition-colors px-2 mb-2"
                  >
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Finished ({finishedCardsForBadges.length})
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs">Marked as Finished</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {finishedCardsForBadges.map((card) => (
                    <DropdownMenuItem
                      key={card.id}
                      className="group flex justify-between items-center gap-2 px-2 py-1 text-xs text-green-900 hover:bg-green-50 rounded-md"
                    >
                      <span className="truncate text-muted-foreground">{card.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnfinishCard(card.id);
                        }}
                        className="rounded-full p-1 group-hover:bg-green-200 group-hover:text-green-900 transition-colors"
                        aria-label={`Remove ${card.title}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        


        {/* --- Stacking Card Container (Replaces the old grid) --- */}
        <div className="relative h-[380px] w-full max-w-lg mx-auto flex items-center justify-center overflow-hidden">
            {/* Conditional rendering for empty states */}
            {numCardsInDeck === 0 && finishedCardsForBadges.length === 0 && ( <div className="text-center text-gray-500 italic">No assessment cards available. Add tools or observations.</div> )}
            {numCardsInDeck === 0 && finishedCardsForBadges.length > 0 && ( <div className="text-center text-gray-500 italic">All assessment cards marked as finished.</div> )}

            {/* AnimatePresence for exit/entry */}
            <AnimatePresence initial={false}>
                {visibleCardsInDeck.map((cardData, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <motion.div
                            key={cardData.id} // Use the unique card ID
                            animate={calculateCardStyle(index)}
                            initial={false} // Important for smooth transitions on index change
                            exit={{ opacity: 0, x: Math.sign(index - activeIndex || -1) * -100 , scale: 0.8, transition: { duration: 0.2, ease: "easeIn" } }} // Exit animation away from center
                            transition={TRANSITION_TWEEN}
                            className="absolute top-0 left-0 w-full h-full flex items-center justify-center origin-center cursor-grab active:cursor-grabbing"
                            style={{ pointerEvents: isActive ? 'auto' : 'none' }} // Only active card is interactive
                            drag={isActive && numCardsInDeck > 1 ? "x" : false} // Allow drag only on active card if > 1 card
                            dragConstraints={{ left: 0, right: 0 }} // Constrain drag horizontally
                            dragElastic={0.2} // Elasticity at drag bounds
                            onDragEnd={isActive && numCardsInDeck > 1 ? handleDragEnd : undefined} // Attach drag handler
                        >
                            {/* Ensure the card takes up appropriate space */}
                            <div className="w-full max-w-md h-[95%]">
                                <EditableCard
                                    // --- Core Card Data ---
                                    id={cardData.id}
                                    title={cardData.title}
                                    initialContent={cardData.initialContent}
                                    viewComponent={cardData.viewComponent}
                                    isEditable={cardData.isEditable}
                                    // --- State & Callbacks ---
                                    isLocked={cardData.isLocked}
                                    hasSynthesis={cardData.hasSynthesis}
                                    synthesisContent={cardData.synthesisContent}
                                    onSave={(content) => onSaveContent && onSaveContent(cardData.id, content)}
                                    onToggleMarkedDone={() => handleMarkCardFinished(cardData.id)} // Use the new handler
                                    onToggleSynthesis={() => onToggleSynthesis?.(cardData.id)}
                                    onLock={(id, lockState) => onLockSection?.(id, lockState)} // Pass direct lock callback if EditableCard supports it per-card
                                    // --- Styling ---
                                    color={cardData.color || "neutral"} // Use card color or default
                                    className="border border-neutral-200 shadow-lg bg-white h-full flex flex-col min-h-[200px]" // Base style for assessment cards
                                    headerClassName="py-2 px-3 bg-neutral-100" // Consistent header
                                    contentClassName="p-3 text-xs text-neutral-700 grow overflow-y-auto" // Content area styling
                                    disableHoverEffect={true} // Disable hover as it's inside a draggable container
                                    // markedDone={finishedCardIds.has(cardData.id)} // Pass derived done state if needed by EditableCard UI
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Navigation Buttons (Show only if more than one card in deck) */}
            {numCardsInDeck > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrev}
                        className="absolute left-2 sm:-left-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full"
                        aria-label="Previous Card"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNext}
                        className="absolute right-2 sm:-right-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full"
                        aria-label="Next Card"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </>
            )}
        </div> {/* End Stacking Card Container */}


    </div> // End Main Section Div
  );
};

export default AssessmentToolsSection;