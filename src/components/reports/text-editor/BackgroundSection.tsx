// FILE: BackgroundSection.tsx (Modified for Combined UI - No Schema Change)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { EditableCard } from '@/components/reports/EditableCard';
// Import necessary types from schema (assuming studentInformation is still under Header)
import { Background, StudentInformation, Header } from '@/types/reportSchemas'; // Ensure Header type is available if needed for lock status typing
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle } from "lucide-react"; // Use CheckCircle for finished badge
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, ChevronLeft, ChevronRight, X as LucideX, Edit3 } from "lucide-react"; // Use LucideX alias
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { safeMotionNumber } from '@/lib/utils'; // For safe animation values
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogTrigger,
  // DialogContent, // Content is in StudentInfoDialog
  // DialogHeader,
  // DialogTitle,
  // DialogDescription,
  // DialogFooter,
  // DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
// Assume you will create this component in the next step
import StudentInfoDialog from './StudentInfoDialog';

// --- Interface Definitions ---
interface BackgroundSectionProps {
    studentInfo: StudentInformation | undefined | null; // From report.header
    background: Background | undefined | null;       // From report.background
    headerLockStatus?: Header['lockStatus'];           // From report.header.lockStatus
    backgroundLockStatus?: Background['lockStatus'];   // From report.background.lockStatus
    // Callbacks passed from ReportEditor
    onLockSection?: (id: string, locked: boolean) => void;
    onToggleSynthesis?: (id: string) => void;
    onGenerateSynthesis?: (id: string, content: string) => Promise<string>;
    onSaveContent?: (id: string, content: string | object) => void; // Allow object for student info save
    onToggleMarkedDone?: (id: string, isDone: boolean) => void;
     // Assuming markedDoneStatus might exist similarly to lockStatus later
     headerMarkedDoneStatus?: Header['markedDoneStatus'];
     backgroundMarkedDoneStatus?: Background['markedDoneStatus'];
}

// More flexible card data interface
interface CombinedBackgroundCardData {
    id: string; // More flexible ID type
    title: string;
    isLocked?: boolean;
    hasSynthesis?: boolean;
    synthesisContent?: string;
    initialContent?: string; // Optional content for editable cards
    viewComponent?: React.ReactNode; // For display-only or complex cards
    isEditable?: boolean; // Explicitly state if card uses EditableCard's editor
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
const TRANSITION_TWEEN = { type: "tween", duration: TRANSITION_DURATION, ease: EASE_FUNCTION };
const SWIPE_THRESHOLD = 40;
const SWIPE_VELOCITY_THRESHOLD = 200;


export const BackgroundSection: React.FC<BackgroundSectionProps> = ({
    studentInfo,
    background,
    headerLockStatus,
    backgroundLockStatus,
    onLockSection,
    onToggleSynthesis,
    onGenerateSynthesis,
    onSaveContent,
    onToggleMarkedDone: notifyParentOfMarkDoneChange,
    headerMarkedDoneStatus, // If added later
    backgroundMarkedDoneStatus // If added later
}) => {
    // Debug studentInfo prop when component mounts
    React.useEffect(() => {
        console.log('----------- BACKGROUND SECTION PROPS INSPECTION -----------');
        console.log('studentInfo prop type:', typeof studentInfo);
        if (studentInfo) {
            console.log('studentInfo keys:', Object.keys(studentInfo));
            console.log('studentInfo values:', {
                firstName: studentInfo.firstName,
                lastName: studentInfo.lastName,
                DOB: studentInfo.DOB,
                homeLanguage: studentInfo.homeLanguage,
            });
        } else {
            console.warn('studentInfo is null or undefined in BackgroundSection');
        }
        console.log('----------- END BACKGROUND SECTION INSPECTION -----------');
    }, [studentInfo]);
    const [finishedCardIds, setFinishedCardIds] = useState(new Set<string>());
    const [activeIndex, setActiveIndex] = useState(0);
    const [isStudentInfoDialogOpen, setIsStudentInfoDialogOpen] = useState(false); // State for Dialog

    // --- Data Preparation: Combine student info and background into one list ---
    const allCombinedCards: CombinedBackgroundCardData[] = useMemo(() => {
        const cards: CombinedBackgroundCardData[] = [];
        const studentInfoCardId = 'student-info'; // Unique ID for this card

        // 1. Add Student Info Card (if data exists)
        if (studentInfo) {
             // Determine lock status from headerLockStatus
             const isStudentInfoLocked = headerLockStatus?.studentInfo ?? headerLockStatus?.demographics ?? false; // Use appropriate key
             // Determine done status if feature exists
             const isStudentInfoDone = headerMarkedDoneStatus?.studentInfo ?? false;

             cards.push({
                id: studentInfoCardId,
                title: "Student Information",
                isLocked: isStudentInfoLocked,
                isEditable: false, // Editing happens via Dialog
                initialIsMarkedDone: isStudentInfoDone,
                color: "neutral",
                viewComponent: ( // Display component for the card view
                    <div className="space-y-1 text-xs relative pr-8"> {/* Padding for button */}
                        {/* Display Key Info */}
                        <p><strong>Name:</strong> {studentInfo.firstName} {studentInfo.lastName}</p>
                        <p><strong>DOB:</strong> {studentInfo.DOB || 'N/A'}</p>
                        <p><strong>Grade:</strong> {studentInfo.grade || 'N/A'}</p>
                        <p><strong>Home Lang:</strong> {studentInfo.homeLanguage || 'N/A'}</p>
                        {/* Add more fields: school, teacher, eval, case manager etc. */}
                         <p><strong>School:</strong> {studentInfo.school || 'N/A'}</p>
                         <p><strong>Evaluator:</strong> {studentInfo.evaluator || 'N/A'}</p>

                        {/* Edit Button - Triggers the Dialog */}
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-[-4px] right-[-4px] h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                                aria-label="Edit Student Information"
                                disabled={isStudentInfoLocked} // Disable if locked
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                        </DialogTrigger>
                    </div>
                ),
            });
        }

        // 2. Add Original Background Cards (if data exists)
        if (background) {
            // Educational History
             if (background.studentDemographicsAndBackground) {
                 const id = "educational-history";
                 cards.push({
                     id: id,
                     title: "Educational History",
                     isLocked: backgroundLockStatus?.educationalHistory,
                     isEditable: true,
                     hasSynthesis: !!background.studentDemographicsAndBackground.synthesis,
                     synthesisContent: background.studentDemographicsAndBackground.synthesis || "",
                     initialContent: background.studentDemographicsAndBackground.educationalHistory || '',
                     initialIsMarkedDone: backgroundMarkedDoneStatus?.educationalHistory,
                     color: "neutral",
                 });
             }
            // Health Info
             if (background.healthReport) {
                 const id = "health-info";
                 cards.push({
                     id: id,
                     title: "Health Information",
                     isLocked: backgroundLockStatus?.healthInfo,
                     isEditable: true, // Make it editable (raw text) or keep viewComponent
                     hasSynthesis: !!background.healthReport.synthesis,
                     synthesisContent: background.healthReport.synthesis || "",
                     // Example using initialContent for simpler editing
                     initialContent: `Medical History: ${background.healthReport.medicalHistory || ''}\nVision/Hearing: ${background.healthReport.visionAndHearingScreening || ''}\nMedications/Allergies: ${background.healthReport.medicationsAndAllergies || ''}`,
                     // Or keep viewComponent if preferred for display-only
                     // viewComponent: (<><p><strong>Medical History:</strong> {background.healthReport?.medicalHistory}</p><p><strong>Vision/Hearing:</strong> {background.healthReport?.visionAndHearingScreening}</p></>),
                     initialIsMarkedDone: backgroundMarkedDoneStatus?.healthInfo,
                     color: "neutral",
                 });
             }
             // Family Info
              if (background.familyHistory) {
                  const id = "family-info";
                  cards.push({
                      id: id,
                      title: "Family Information",
                      isLocked: backgroundLockStatus?.familyInfo,
                      isEditable: true, // Make editable (raw text)
                      hasSynthesis: !!background.familyHistory.synthesis,
                      synthesisContent: background.familyHistory.synthesis || "",
                      initialContent: `Structure: ${background.familyHistory.familyStructure || ''}\nLanguage Background: ${background.familyHistory.languageAndCulturalBackground || ''}\nSocioeconomic Factors: ${background.familyHistory.socioeconomicFactors || ''}`,
                      // Or keep viewComponent
                      // viewComponent: (<><p><strong>Structure:</strong> {background.familyHistory?.familyStructure}</p><p><strong>Language Background:</strong> {background.familyHistory?.languageAndCulturalBackground}</p></>),
                      initialIsMarkedDone: backgroundMarkedDoneStatus?.familyInfo,
                      color: "neutral",
                  });
              }
              // Parent Concerns
               if (background.parentGuardianConcerns !== undefined) { // Check existence even if empty
                   const id = "parent-concerns";
                   cards.push({
                       id: id,
                       title: "Parent/Guardian Concerns",
                       // Lock status might be directly on background or in lockStatus
                       isLocked: backgroundLockStatus?.parentConcerns ?? background.isLocked ?? false, // Check parent level lock too?
                       isEditable: true,
                       hasSynthesis: !!background.synthesis, // Assuming overall background synthesis applies here? Adjust if needed.
                       synthesisContent: background.synthesis || "",
                       initialContent: background.parentGuardianConcerns || '',
                       initialIsMarkedDone: backgroundMarkedDoneStatus?.parentConcerns,
                       color: "neutral",
                   });
               }
              // Add Early Intervention if it exists and needs a card
              // if (background.earlyInterventionHistory) { ... }
        }

        return cards;
        // Dependencies: Data sources and lock statuses
    }, [studentInfo, background, headerLockStatus, backgroundLockStatus, headerMarkedDoneStatus, backgroundMarkedDoneStatus]);


    // --- Derived State (uses combined card list) ---
    const visibleCardsInDeck = useMemo(() =>
        allCombinedCards.filter(card => !finishedCardIds.has(card.id)),
        [allCombinedCards, finishedCardIds]
    );
    const finishedCardsForBadges = useMemo(() =>
        allCombinedCards.filter(card => finishedCardIds.has(card.id)),
        [allCombinedCards, finishedCardIds]
    );
    const numCardsInDeck = visibleCardsInDeck.length;

    // --- Effects (remain the same) ---
    useEffect(() => {
        if (numCardsInDeck > 0 && activeIndex >= numCardsInDeck) {
            setActiveIndex(numCardsInDeck - 1);
        } else if (numCardsInDeck === 0) {
            setActiveIndex(0);
        }
    }, [numCardsInDeck, activeIndex]);


    // --- Navigation & Swipe (remain the same) ---
    const handlePrev = useCallback(() => { /* ... */ if (numCardsInDeck <= 1) return; setActiveIndex((prev) => (prev - 1 + numCardsInDeck) % numCardsInDeck); }, [numCardsInDeck]);
    const handleNext = useCallback(() => { /* ... */ if (numCardsInDeck <= 1) return; setActiveIndex((prev) => (prev + 1) % numCardsInDeck); }, [numCardsInDeck]);
    useEffect(() => { /* ... keyboard listener ... */
        const handleKeyDown = (event: KeyboardEvent) => { if (numCardsInDeck <= 1) return; if (event.key === 'ArrowLeft') handlePrev(); else if (event.key === 'ArrowRight') handleNext(); };
        window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
     }, [handlePrev, handleNext, numCardsInDeck]);
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => { /* ... */
        if (numCardsInDeck <= 1) return; const { offset, velocity } = info; const swipePower = Math.abs(offset.x) * velocity.x; const threshold = SWIPE_THRESHOLD * SWIPE_VELOCITY_THRESHOLD / 5; if (swipePower < -threshold) handleNext(); else if (swipePower > threshold) handlePrev();
    };

    // --- Finish/Unfinish Card Handlers (remain the same) ---
    const handleMarkCardFinished = useCallback((cardId: string) => {
        setFinishedCardIds(prev => new Set(prev).add(cardId));
        notifyParentOfMarkDoneChange?.(cardId, true);
    }, [notifyParentOfMarkDoneChange]);
    const handleUnfinishCard = useCallback((cardId: string) => {
        setFinishedCardIds(prev => { const next = new Set(prev); next.delete(cardId); return next; });
        notifyParentOfMarkDoneChange?.(cardId, false);
    }, [notifyParentOfMarkDoneChange]);

    // --- Animation Calculation (remains the same) ---
    const calculateCardStyle = (index: number) => {
      let offset = index - activeIndex; 
      const half = Math.floor(numCardsInDeck / 2); 
      if (numCardsInDeck > 1) { 
        if (offset > half) offset -= numCardsInDeck; 
        else if (offset < -half) offset += numCardsInDeck; 
      } 
      const absOffset = Math.abs(offset);

      // Style for the active card (center)
      if (offset === 0) return { 
        x: 0, y: 0, scale: 1, rotateY: 0, opacity: 1, zIndex: numCardsInDeck + 1, display: 'flex' 
      };
      // Style for visible cards behind the active card
      else if (absOffset <= MAX_VISIBLE_OFFSET) return { 
        x: safeMotionNumber(offset * HORIZONTAL_STAGGER), 
        y: safeMotionNumber(absOffset * VERTICAL_STAGGER), 
        scale: safeMotionNumber(1 - (absOffset * SCALE_FACTOR)), 
        rotateY: safeMotionNumber(-offset * ROTATE_Y_FACTOR), 
        opacity: 1, zIndex: numCardsInDeck - absOffset, display: 'flex' 
      };
      // Style for cards completely hidden
      else { 
        const sign = Math.sign(offset); 
        return { 
          x: safeMotionNumber(sign * HORIZONTAL_STAGGER * (MAX_VISIBLE_OFFSET + 0.5)), 
          y: safeMotionNumber(VERTICAL_STAGGER * MAX_VISIBLE_OFFSET), 
          scale: safeMotionNumber(1 - (MAX_VISIBLE_OFFSET * SCALE_FACTOR)), 
          rotateY: safeMotionNumber(-sign * ROTATE_Y_FACTOR * MAX_VISIBLE_OFFSET), 
          opacity: 0, zIndex: 0, display: 'flex' 
        }; 
      }
    };

    // --- Section Lock Logic (Updated) ---
    // Lock button only locks/unlocks the original Background items
    const areOriginalBackgroundCardsLocked = useCallback(() => {
        if (!background) return false; // Can't lock if no background data
        // Check lock status only for cards derived from the 'background' prop
        return !!(
            backgroundLockStatus?.educationalHistory &&
            backgroundLockStatus?.healthInfo &&
            backgroundLockStatus?.familyInfo &&
            backgroundLockStatus?.parentConcerns
        );
    }, [background, backgroundLockStatus]);

    const isAnyOriginalBackgroundCardLocked = useCallback(() => {
         if (!background) return false;
         return !!(
            backgroundLockStatus?.educationalHistory ||
            backgroundLockStatus?.healthInfo ||
            backgroundLockStatus?.familyInfo ||
            backgroundLockStatus?.parentConcerns
         );
    }, [background, backgroundLockStatus]);

    // Section lock handler targets only the background section/items
    const handleSectionLock = useCallback(() => {
        const shouldLock = !areOriginalBackgroundCardsLocked();
        if (onLockSection) {
            // Pass the specific section ID for background
            onLockSection('section-background', shouldLock);
        }
    }, [onLockSection, areOriginalBackgroundCardsLocked]);
    // --- End Lock Logic ---

    return (
        // Wrap with Dialog Provider
        <Dialog open={isStudentInfoDialogOpen} onOpenChange={setIsStudentInfoDialogOpen}>
            <div className="mb-8">
                {/* Section Header - Use updated lock logic */}
                {/* Section Header with Dropdown */}
              <div className="flex items-center justify-between border-b border-neutral-200">
                <h3 className="text-md font-semibold uppercase tracking-wide">Background Information</h3>
              </div>
              <div className="flex justify-end mb-16">
                {finishedCardsForBadges.length > 0 && (
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-orange-600 hover:bg-orange-50 transition-colors px-2"
                    >
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Finished ({finishedCardsForBadges.length})
                      </span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-xs">Marked as Finished</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {finishedCardsForBadges.map((card) => (
                            <DropdownMenuItem
                            key={card.id}
                            className="group flex justify-between items-center gap-2 px-2 py-1 text-xs text-orangeTheme-text hover:bg-orangeTheme-background hover:text-orangeTheme-white transition-colors rounded-md"
                          >
                            <span className="truncate text-muted-foreground transition-colors">
                              {card.title}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnfinishCard(card.id);
                              }}
                              className="rounded-full p-1 group-hover:bg-orangeTheme-hover group-hover:text-orangeTheme-white transition-colors"
                              aria-label={`Remove ${card.title}`}
                            >
                              <LucideX className="h-4 w-4 transition-colors" />
                            </button>
                          </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) } 
              </div>


                {/* Stacking Card Container (Uses combined list) */}
                <div className="relative h-[380px] w-full max-w-lg mx-auto flex items-center justify-center overflow-hidden">
                    {/* Empty states */}
                    {allCombinedCards.length === 0 && ( <div className="text-center text-gray-500 italic">No background or student info available.</div> )}
                    {numCardsInDeck === 0 && allCombinedCards.length > 0 && ( <div className="text-center text-gray-500 italic">All background cards marked as finished.</div> )}

                    {/* AnimatePresence (Uses combined list) */}
                    <AnimatePresence initial={false}>
                        {visibleCardsInDeck.map((cardData, index) => {
                            const isActive = index === activeIndex;
                            return (
                                <motion.div
                                    key={cardData.id} // Use combined ID
                                    animate={calculateCardStyle(index)}
                                    initial={false}
                                    exit={{ opacity: 0, y: 50, scale: 0.8, transition: { duration: 0.3, ease: "easeIn" } }} // Example exit animation
                                    transition={TRANSITION_TWEEN}
                                    className="absolute top-0 left-0 w-full h-full flex items-center justify-center origin-center cursor-grab active:cursor-grabbing"
                                    style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                                     // Allow drag only if active and more than one card
                                    drag={isActive && numCardsInDeck > 1 ? "x" : false}
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.2}
                                    onDragEnd={isActive ? handleDragEnd : undefined}
                                >
                                    <div className="w-full max-w-md h-[95%]">
                                        <EditableCard
                                            // Pass all common props
                                            id={cardData.id}
                                            title={cardData.title}
                                            isLocked={cardData.isLocked}
                                            hasSynthesis={cardData.hasSynthesis}
                                            synthesisContent={cardData.synthesisContent}
                                            isEditable={cardData.isEditable}
                                            initialContent={cardData.initialContent}
                                            viewComponent={cardData.viewComponent}
                                            color={cardData.color || "neutral"} // Default to neutral
                                            // Callbacks
                                            onToggleMarkedDone={() => handleMarkCardFinished(cardData.id)}
                                            onSave={(content) => onSaveContent && onSaveContent(cardData.id, content)}
                                            onToggleSynthesis={() => onToggleSynthesis?.(cardData.id)}
                                            onGenerateSynthesis={onGenerateSynthesis}
                                            onLock={(id, lockState) => onLockSection?.(id, lockState)} // Pass individual lock through
                                            // Styling
                                            className="border border-neutral-200 shadow-lg bg-white h-full flex flex-col min-h-[200px]"
                                            headerClassName="py-2 px-3 bg-neutral-100 shrink-0"
                                            contentClassName="p-3 text-xs text-neutral-700 grow overflow-y-auto"
                                            disableHoverEffect={true}
                                             // Pass markedDone status if needed by EditableCard's UI
                                            // markedDone={finishedCardIds.has(cardData.id)}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    {numCardsInDeck > 1 && ( <> <Button variant="ghost" size="icon" onClick={handlePrev} className="absolute left-2 sm:-left-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Previous Card"> <ChevronLeft className="h-6 w-6" /> </Button> <Button variant="ghost" size="icon" onClick={handleNext} className="absolute right-2 sm:-right-8 top-1/2 -translate-y-1/2 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full" aria-label="Next Card"> <ChevronRight className="h-6 w-6" /> </Button> </> )}
                </div>

                 {/* Dialog Content (Rendered conditionally by Dialog state) */}
                 {/* Make sure StudentInfoDialog is created and imported */}
                 <StudentInfoDialog
                     studentInfo={studentInfo} // Pass current student info
                     onSave={(updatedInfo) => {
                         // Call the main save handler passed down from ReportEditor
                         onSaveContent?.('student-info', updatedInfo); // Pass specific ID and updated OBJECT
                         setIsStudentInfoDialogOpen(false); // Close dialog
                     }}
                     onClose={() => setIsStudentInfoDialogOpen(false)}
                 />

            </div>
        </Dialog> // Close Dialog Provider
    );
};

export default BackgroundSection;