"use client";

// Base React imports + hooks needed
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';

// UI Components
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Icon imports
import {
  User, BookOpen, HeartPulse, Users, MessageSquareWarning, // Background
  ClipboardCheck, Eye, Wrench, CheckSquare, // Assessment
  BarChart3, Ear, Speech, MessageSquare, // Present Levels (example domains)
  Gavel, Languages, Mic, Waves, Volume2, Baby, // Eligibility
  FileOutput, BriefcaseMedical, Puzzle, AlignJustify, // Conclusion/Recs
  BookMarked, List // Glossary
  // ... add any other needed icons
} from 'lucide-react';

// Animation imports
import { motion, useScroll, useInView, useSpring, useTransform } from "framer-motion";

// Context and Data Fetching/Definitions
import { useReports } from "@/components/contexts/reports-context";
import { getAllAssessmentTools } from '@/lib/assessment-tools';
import { EMPTY_REPORT, SAMPLE_REPORT } from '@/lib/seed-report';
import { useBatchReportUpdater } from '@/hooks/useBatchReportUpdater';

// === TYPE IMPORTS (from Zod Schema - Assuming 'applicableEdCodeText' was added) ===
import {
    SpeechLanguageReport,
    AssessmentTool,
    PresentLevels,
    AssessmentResults,
    Header,
    Background,
    Conclusion,
    Functioning,
    StudentInformation
} from '@/types/reportSchemas'; // Path to your schema file

// === SECTION COMPONENT IMPORTS ===
import EditorPanel from "@/components/reports/text-editor/EditorPanel";
import BackgroundSection from "@/components/reports/text-editor/BackgroundSection";
import PresentLevelsSection from "@/components/reports/text-editor/PresentLevelsSection";
import AssessmentToolsSection from "@/components/reports/text-editor/AssessmentToolsSection";
import EligibilitySection from "@/components/reports/text-editor/EligibilitySection";
import ConclusionRecsSection from "@/components/reports/text-editor/ConclusionSection";
import GlossarySection from "@/components/reports/text-editor/GlossarySection";

// Other Utility Components
import JsonViewerDialog from "@/components/reports/text-editor/JsonViewerDialog";
import CommandDetailsCard from "@/components/reports/text-editor/CommandDetailsCard";
import BatchJobStatus from "@/components/reports/BatchJobStatus";


// --- Helper Functions ---
function createReportSkeleton(): SpeechLanguageReport {
    try {
        const skeleton = JSON.parse(JSON.stringify(EMPTY_REPORT));
        if (!skeleton.header) skeleton.header = { studentInformation: { firstName: '', lastName: '' } };
        if (!skeleton.header.studentInformation) skeleton.header.studentInformation = { firstName: '', lastName: '' };
        if (!skeleton.background) skeleton.background = {};
        if (!skeleton.presentLevels) skeleton.presentLevels = { functioning: {} };
        if (!skeleton.assessmentResults) skeleton.assessmentResults = { assessmentProceduresAndTools: { assessmentToolsUsed: [] }, observations: {} };
        // Ensure conclusion and eligibility structure exists, including new text field if added
        if (!skeleton.conclusion) skeleton.conclusion = { eligibility: { domains: {}, eligibilityStatus: {} }, conclusion: {}, recommendations: { services: {}, accommodations: [], facilitationStrategies: [] }, parentFriendlyGlossary: { terms: {} } };
        if (!skeleton.conclusion.eligibility) skeleton.conclusion.eligibility = { domains: {}, eligibilityStatus: {} }; // Ensure eligibility exists
        if (!skeleton.conclusion.eligibility.domains) skeleton.conclusion.eligibility.domains = {}; // Ensure domains exist
        if (!skeleton.conclusion.eligibility.eligibilityStatus) skeleton.conclusion.eligibility.eligibilityStatus = {}; // Ensure new status object exists
        if (!skeleton.conclusion.conclusion) skeleton.conclusion.conclusion = {};
        if (!skeleton.conclusion.recommendations) skeleton.conclusion.recommendations = { services: {}, accommodations: [], facilitationStrategies: [] };
        if (!skeleton.conclusion.parentFriendlyGlossary) skeleton.conclusion.parentFriendlyGlossary = { terms: {} };
        if (!skeleton.metadata) skeleton.metadata = { version: 1, lastUpdated: new Date().toISOString() };
        return skeleton;
      } catch (e) { /* ... error handling ... */ return { header:{studentInformation:{firstName:'',lastName:''}},background:{},presentLevels:{functioning:{}},assessmentResults:{assessmentProceduresAndTools:{assessmentToolsUsed:[]},observations:{}},conclusion:{eligibility:{domains:{},eligibilityStatus:{}},conclusion:{},recommendations:{services:{},accommodations:[],facilitationStrategies:[]},parentFriendlyGlossary:{terms:{}}},metadata:{version:1,lastUpdated:new Date().toISOString()}}; }
}

function truncateText(str: string, maxLength: number): string {
    if (!str || str.length <= maxLength) return str || ''; return str.slice(0, maxLength - 3) + '...';
}
// --- End Helper Functions ---

// Animation component for row transitions
const AnimatedSectionRow = ({ children, index, id }: { children: React.ReactNode, index: number, id: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.4 });
  
  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.42, 0, 0.58, 1],
        staggerChildren: 0.3
      }
    }
  };
  
  // Animation variants for each child
  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: [0.42, 0, 0.58, 1] 
      }
    }
  };
  
  // Wrap each child in a motion.div for individual animations
  const animatedChildren = React.Children.map(children, (child, childIndex) => (
    <motion.div
      key={`${id}-child-${childIndex}`}
      variants={childVariants}
      className="h-full"
    >
      {child}
    </motion.div>
  ));
  
  // Calculate delay based on row index
  const delay = index * 0.1;

  return (
    <motion.div
      ref={ref}
      id={id}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      transition={{ delay }}
    >
      {animatedChildren}
    </motion.div>
  );
};

export default function ReportEditor() {
  const params = useParams();
  const userId = params?.userId as string;
  const reportId = params?.reportId as string;
  const isNewReport = reportId === 'new';

  const { setSectionGroups } = useReports();
  const editorRef = useRef<HTMLDivElement>(null);

  // --- State Declarations ---
  const [inputText, setInputText] = useState('');
  const [selectedSection, setSelectedSection] = useState('auto-detect');
  const [loading, setLoading] = useState(true);
  const [initialReport, setInitialReport] = useState<SpeechLanguageReport | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [assessmentTools, setAssessmentTools] = useState<Record<string, AssessmentTool>>({});
  const [savingReport, setSavingReport] = useState(false);
  const [commandDetails, setCommandDetails] = useState<any>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Use the batch report updater hook for report state management
  const {
    report,
    setReport,
    isUpdating,
    batchId,
    batchStatus,
    error,
    processText,
    processPdf,
    handleBatchComplete,
    handleBatchError,
    updateSection
  } = useBatchReportUpdater(initialReport || createReportSkeleton());

  // --- Effect to load report data ---
  useEffect(() => {
    setLoading(true);
    
    const timer = setTimeout(() => {
      console.log("Loading SAMPLE_REPORT for reportId:", reportId);
      
      try {
        const sampleData = JSON.parse(JSON.stringify(SAMPLE_REPORT));
        
        // Ensure all required structures exist
        if (!sampleData.header) sampleData.header = { studentInformation: { firstName: '', lastName: '' } };
        if (!sampleData.header.studentInformation) sampleData.header.studentInformation = { firstName: '', lastName: '' };
        if (!sampleData.background) sampleData.background = {};
        if (!sampleData.presentLevels) sampleData.presentLevels = { functioning: {} };
        if (!sampleData.assessmentResults) sampleData.assessmentResults = { assessmentProceduresAndTools: { assessmentToolsUsed: [] }, observations: {} };
        if (!sampleData.conclusion) sampleData.conclusion = { eligibility: { domains: {}, eligibilityStatus: {} }, conclusion: {}, recommendations: { services: {}, accommodations: [], facilitationStrategies: [] }, parentFriendlyGlossary: { terms: {} } };
        if (!sampleData.conclusion.eligibility) sampleData.conclusion.eligibility = { domains: {}, eligibilityStatus: {} };
        if (!sampleData.conclusion.eligibility.domains) sampleData.conclusion.eligibility.domains = {};
        if (!sampleData.conclusion.eligibility.eligibilityStatus) sampleData.conclusion.eligibility.eligibilityStatus = {};
        if (!sampleData.conclusion.conclusion) sampleData.conclusion.conclusion = {};
        if (!sampleData.conclusion.recommendations) sampleData.conclusion.recommendations = { services: {}, accommodations: [], facilitationStrategies: [] };
        if (!sampleData.conclusion.parentFriendlyGlossary) sampleData.conclusion.parentFriendlyGlossary = { terms: {} };
        if (!sampleData.metadata) sampleData.metadata = { version: 1, lastUpdated: new Date().toISOString() };
        
        // Set the initial report so the hook can use it
        setInitialReport(sampleData);
      } catch(e) {
        console.error("Failed to parse SAMPLE_REPORT, using skeleton:", e);
        setInitialReport(createReportSkeleton());
      }
      
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [reportId]);
  useEffect(() => { /* ... Load assessment tools ... */ try { const tools = getAllAssessmentTools(); setAssessmentTools(tools); } catch (error) { console.error("Failed to load assessment tools:", error); setAssessmentTools({}); } }, []);

  // --- Scroll Animation Setup ---
  const { scrollYProgress } = useScroll({
    target: editorRef,
    offset: ["start start", "end end"]
  });
  
  // Create a smoother version of scrollYProgress
  const smoothScrollProgress = useSpring(scrollYProgress, { 
    stiffness: 100, 
    damping: 30, 
    restDelta: 0.001 
  });

  // --- Memos for Sidebar Updates (remain the same logic for PL domains) ---
  const activeDomains = useMemo(() => {
    const functioning = report?.presentLevels?.functioning;
    if (!functioning) {
        return []; // Return empty array if functioning is not available
    }
    // Example: Return keys of functioning domains marked as a concern
    return Object.entries(functioning)
        .filter(([key, value]) => value?.isConcern === true)
        .map(([key]) => key);
  }, [report?.presentLevels?.functioning]);

  // FIX: Add fallback default array `[]` in case activeDomains is undefined during initial render
  const activeDomainsKey = useMemo(() => (activeDomains || []).join(','), [activeDomains]); // <-- ADDED || []

  const domainConcernsKey = useMemo(() => {
    const functioning = report?.presentLevels?.functioning;
    if (!functioning || !activeDomains) {
        return ''; // Or some default key
    }
    return (activeDomains || []).map(domain => // <-- ADDED || []
        `${domain}-${functioning[domain as keyof Functioning]?.isConcern ?? false}`
    ).join(',');
  }, [activeDomains, report?.presentLevels?.functioning]);


  // --- Build section groups for sidebar - UPDATED for split Conclusion ---
  useEffect(() => {
    const functioning = report?.presentLevels?.functioning;
    const domainItems = functioning ? (activeDomains || []).map(domain => ({
        title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Language`,
        url: `#domain-${domain}`,
        // Ensure value exists before accessing isConcern
        isActive: functioning[domain as keyof Functioning]?.isConcern ?? false
    })) : [];

    // Define keys for eligibility based on your schema/UI consolidation
    // Using consolidated 'language' for UI link here
    const eligibilityDomains = report?.conclusion?.eligibility?.domains ? Object.keys(report.conclusion.eligibility.domains) : [];
    const hasLanguage = eligibilityDomains.some(d => ['receptive', 'expressive', 'pragmatic'].includes(d));
    const eligibilityItems = [];
    if (hasLanguage) {
        eligibilityItems.push({ title: "Language", url: "#eligibility-language" });
    }
    eligibilityDomains.forEach(domain => {
        if (!['receptive', 'expressive', 'pragmatic'].includes(domain)) {
            eligibilityItems.push({ title: domain.charAt(0).toUpperCase() + domain.slice(1), url: `#eligibility-${domain}` });
        }
    });
     // Check boolean flag directly
     if (report?.conclusion?.eligibility?.isPreschool === true) {
         eligibilityItems.push({ title: "Preschool", url: "#eligibility-preschool" });
     }

// Inside the useEffect hook for setSectionGroups:
const iconProps = { size: 16, className: "mr-2" }; // Common props for expanded view
const collapsedIconProps = { size: 18 }; // Slightly larger for icon-only view

const newSectionGroups = [
  {
    title: "Background Information",
    icon: <BookOpen {...iconProps} />, // Icon for the main group title (optional)
    collapsedIcon: <BookOpen {...collapsedIconProps} />, // Icon for collapsed state
    items: [
      { title: "Student Info", url: "#student-info", icon: <User {...iconProps} />, collapsedIcon: <User {...collapsedIconProps} /> },
      { title: "Education", url: "#educational-history", icon: <BookOpen {...iconProps} />, collapsedIcon: <BookOpen {...collapsedIconProps} /> },
      { title: "Health", url: "#health-info", icon: <HeartPulse {...iconProps} />, collapsedIcon: <HeartPulse {...collapsedIconProps} /> },
      { title: "Family", url: "#family-info", icon: <Users {...iconProps} />, collapsedIcon: <Users {...collapsedIconProps} /> },
      { title: "Concerns", url: "#parent-concerns", icon: <MessageSquareWarning {...iconProps} />, collapsedIcon: <MessageSquareWarning {...collapsedIconProps} /> }
    ]
  },
  {
    title: "Assessment Tools",
    icon: <ClipboardCheck {...iconProps} />,
    collapsedIcon: <ClipboardCheck {...collapsedIconProps} />,
    items: [
      { title: "Methods", url: "#validity-statement", icon: <CheckSquare {...iconProps} />, collapsedIcon: <CheckSquare {...collapsedIconProps} /> },
      { title: "Observations", url: "#observations-summary", icon: <Eye {...iconProps} />, collapsedIcon: <Eye {...collapsedIconProps} /> },
      { title: "Tools Used", url: "#tools-summary", icon: <Wrench {...iconProps} />, collapsedIcon: <Wrench {...collapsedIconProps} /> }
    ]
  },
  {
    title: "Present Levels",
    icon: <BarChart3 {...iconProps} />,
    collapsedIcon: <BarChart3 {...collapsedIconProps} />,
    items: domainItems.map(item => ({ // Assuming domainItems is [{ title: 'Receptive Language', url: '#domain-receptive', isActive: true }, ...]
        ...item,
        // Choose icon based on domain title/key (example logic)
        icon: item.title.includes('Receptive') ? <Ear {...iconProps} /> : item.title.includes('Expressive') ? <Speech {...iconProps} /> : <MessageSquare {...iconProps} />,
        collapsedIcon: item.title.includes('Receptive') ? <Ear {...collapsedIconProps} /> : item.title.includes('Expressive') ? <Speech {...collapsedIconProps} /> : <MessageSquare {...collapsedIconProps} />
    }))
  },
   {
    title: "Eligibility", // Shortened title
    icon: <Gavel {...iconProps} />,
    collapsedIcon: <Gavel {...collapsedIconProps} />,
    items: eligibilityItems.map(item => ({ // Assuming eligibilityItems is [{ title: 'Language', url: '#eligibility-language'}, ...]
        ...item,
         // Choose icon based on domain title/key (example logic)
        icon: item.title === 'Language' ? <Languages {...iconProps}/> : item.title === 'Articulation' ? <Mic {...iconProps}/> : item.title === 'Preschool' ? <Baby {...iconProps}/> : <Gavel {...iconProps}/>,
        collapsedIcon: item.title === 'Language' ? <Languages {...collapsedIconProps}/> : item.title === 'Articulation' ? <Mic {...collapsedIconProps}/> : item.title === 'Preschool' ? <Baby {...collapsedIconProps}/> : <Gavel {...collapsedIconProps}/>
    }))
  },
   {
    title: "Conclusion", // Shortened title
    icon: <FileOutput {...iconProps} />,
    collapsedIcon: <FileOutput {...collapsedIconProps} />,
    items: [
        { title: "Summary", url: "#conclusion-summary", icon: <AlignJustify {...iconProps} />, collapsedIcon: <AlignJustify {...collapsedIconProps} /> }, // Reused Text icon
        { title: "Services", url: "#services-recommendations", icon: <BriefcaseMedical {...iconProps} />, collapsedIcon: <BriefcaseMedical {...collapsedIconProps} /> },
        { title: "Accomm/Strat", url: "#accommodations-strategies", icon: <Puzzle {...iconProps} />, collapsedIcon: <Puzzle {...collapsedIconProps} /> }
    ]
  },
   {
    title: "Glossary",
    icon: <BookMarked {...iconProps} />,
    collapsedIcon: <BookMarked {...collapsedIconProps} />,
    items: [ { title: "Terms", url: "#glossary", icon: <List {...iconProps} />, collapsedIcon: <List {...collapsedIconProps} /> } ] }
];
setSectionGroups(newSectionGroups);
  }, [setSectionGroups, activeDomainsKey, domainConcernsKey, report?.presentLevels?.functioning, report?.conclusion?.eligibility]); // Add dependencies

  // --- Handlers ---
  // handleSubmit, handlePdfUpload, handleSaveReport, handleAddTool, handleOpenLibrary, handleAddToolToGlobal
  // remain the same functions as implemented before
   // Text submission handler using batch processing
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!inputText.trim() || isUpdating) return;
     
     try {
       setSuccess(null);
       await processText(inputText);
       setInputText(''); // Clear input after submission
       setSuccess('Processing text input via batch API...');
     } catch (err) {
       console.error('Failed to process text input:', err);
     }
   };
   
   // PDF upload handler using batch processing
   const handlePdfUpload = async (pdfData: string) => {
     if (!pdfData || isUpdating) return;
     
     try {
       setSuccess(null);
       await processPdf(pdfData);
       setSuccess('Processing PDF via batch API...');
     } catch (err) {
       console.error('Failed to process PDF:', err);
     }
   };
   const handleSaveReport = async () => { /* ... */ };
   const handleAddTool = useCallback((toolId: string) => { /* ... */ }, [assessmentTools]);
   const handleOpenLibrary = useCallback(() => { /* ... */ }, []);
   const handleAddToolToGlobal = useCallback((toolDefinition: AssessmentTool | string) => { /* ... */ }, []);

   // handleToggleDomainEligibility
   const handleToggleDomainEligibility = useCallback((domain: string, value: boolean) => {
        console.log(`Toggle eligibility for ${domain} to ${value}`);
        setReport(currentReport => {
            const updatedReport = JSON.parse(JSON.stringify(currentReport));
            // Ensure path exists
            if (!updatedReport.conclusion) updatedReport.conclusion = {};
            if (!updatedReport.conclusion.eligibility) updatedReport.conclusion.eligibility = { domains: {}, eligibilityStatus: {} };
            if (!updatedReport.conclusion.eligibility.domains) updatedReport.conclusion.eligibility.domains = {};

            // Check if the specific domain exists before updating
            const domainKey = domain as keyof Conclusion['eligibility']['domains'];
            if (updatedReport.conclusion.eligibility.domains[domainKey] !== undefined) {
                updatedReport.conclusion.eligibility.domains[domainKey] = value;
            } else {
                console.warn(`Domain ${domain} not found in conclusion.eligibility.domains`);
            }
            return updatedReport;
        });
   }, []);

  const handleToggleSynthesis = useCallback((id: string) => {
    console.log(`Toggling synthesis for ID: ${id}`);
    setReport(currentReport => {
      const updatedReport = JSON.parse(JSON.stringify(currentReport));
      
      // Determine the path based on ID
      let path: (string | number)[] = [];
      
      // Domain cards
      if (id.startsWith('domain-')) {
        const domain = id.replace('domain-', '');
        path = ['presentLevels', 'functioning', domain];
      } 
      // Background cards
      else if (id === 'educational-history') {
        path = ['background', 'studentDemographicsAndBackground'];
      }
      else if (id === 'health-info') {
        path = ['background', 'healthReport'];  
      }
      else if (id === 'family-info') {
        path = ['background', 'familyHistory'];
      }
      else if (id === 'validity-statement') {
        path = ['assessmentResults', 'assessmentProceduresAndTools'];
      }
      else if (id.startsWith('observation-')) {
        const obsKey = id.replace('observation-', '');
        path = ['assessmentResults', 'observations'];
      }
      else if (id === 'conclusion-summary') {
        path = ['conclusion', 'conclusion'];
      }
      else if (id === 'services-recommendations' || id === 'accommodations-strategies') {
        path = ['conclusion', 'recommendations'];
      }
      
      // Get to the target object
      let current = updatedReport;
      for (const segment of path) {
        if (current[segment] === undefined) {
          current[segment] = {};
        }
        current = current[segment];
      }
      
      // Toggle synthesis
      if (current.synthesis) {
        // If synthesis exists, we don't need to do anything special
        console.log(`Synthesis already exists for ${id}`);
      } else {
        // Initialize empty synthesis field if it doesn't exist
        current.synthesis = '';
        console.log(`Created empty synthesis field for ${id}`);
      }
      
      // Update metadata
      const metaTarget = updatedReport.metadata || {};
      if (!updatedReport.metadata) updatedReport.metadata = metaTarget;
      metaTarget.lastUpdated = new Date().toISOString();
      
      return updatedReport;
    });
  }, []);

  // --- UPDATED CALLBACKS for Lock/Save ---

  const handleLockSection = useCallback((id: string, locked: boolean) => {
    console.log(`Locking/Unlocking Section/Card ID: ${id} to ${locked}`);
    setReport(currentReport => {
      const updatedReport = JSON.parse(JSON.stringify(currentReport));
      const getLockStatusTarget = (obj: any, path: (string | number)[], create = true): any => { 
          let current = obj; for (let i = 0; i < path.length; i++) { const key = path[i]; if (current[key] === undefined || current[key] === null) { if (!create) return null; const nextKeyIsNumber = (i + 1 < path.length && typeof path[i+1] === 'number'); current[key] = nextKeyIsNumber ? [] : {}; } current = current[key]; if (typeof current !== 'object' && typeof current !== 'function' && current !== null && i < path.length -1) { console.error("Invalid path in getLockStatusTarget:", path.slice(0, i+1).join('.')); return null; } }
          if (create && typeof current === 'object' && current !== null && !current.lockStatus) { current.lockStatus = {}; } return current?.lockStatus ? current.lockStatus : current;
       };

      // --- Section Locks --- (keep the implementation)
      // ...

      return updatedReport;
    });
    setSuccess(`Section/Card ${id} ${locked ? 'locked' : 'unlocked'}`);
  }, []);

  // Helper function for getting parent object and final key
  const ensurePathAndGetParent = (obj: any, path: (string|number)[]): { parent: any; finalKey: string | number } | null => {
    let current = obj; 
    for (let i = 0; i < path.length - 1; i++) { 
      const key = path[i]; 
      if (current[key] === undefined || current[key] === null) { 
        current[key] = {}; 
      } 
      current = current[key]; 
      if (typeof current !== 'object' || current === null) return null; 
    } 
    const finalKey = path[path.length - 1]; 
    if (typeof current === 'object' && current !== null) { 
      return { parent: current, finalKey }; 
    } 
    return null;
  };
  
  const handleSaveContent = useCallback((id: string, content: string | object) => {
    console.log(`Saving content for ID: ${id}`);
    
    // Map the ID to a path in the report structure
    let path: string[] = [];
    
    // Map common section IDs to their paths in the report object
    if (id === 'student-info') {
      path = ['header', 'studentInformation'];
    } else if (id === 'educational-history') {
      path = ['background', 'studentDemographicsAndBackground', 'educationalHistory'];
    } else if (id === 'health-info') {
      path = ['background', 'healthReport', 'medicalHistory'];
    } else if (id === 'family-info') {
      path = ['background', 'familyHistory', 'familyStructure'];
    } else if (id === 'validity-statement') {
      path = ['assessmentResults', 'assessmentProceduresAndTools', 'overviewOfAssessmentMethods'];
    } else if (id.startsWith('domain-')) {
      const domain = id.replace('domain-', '');
      path = ['presentLevels', 'functioning', domain];
    } else if (id === 'conclusion-summary') {
      path = ['conclusion', 'conclusion', 'summary'];
    } else if (id === 'services-recommendations') {
      path = ['conclusion', 'recommendations', 'services'];
    } else if (id === 'accommodations-strategies') {
      path = ['conclusion', 'recommendations', 'accommodations'];
    }
    
    // Use updateSection from our hook to update the report
    if (path.length > 0) {
      updateSection(path, content);
    } else {
      console.warn(`Unknown section ID: ${id}, content not saved`);
    }
  }, [updateSection]);


  // --- Finish/Unfinish (Mark As Done) Handler ---
  const handleToggleMarkedDone = useCallback((id: string, isDone: boolean) => { 
    console.log(`Toggling Mark Done for ${id} to ${isDone}`);
    setReport(currentReport => {
      const updatedReport = JSON.parse(JSON.stringify(currentReport));

      // --- DEFINE THE HELPER FUNCTION HERE ---
      const ensureMarkedDonePath = (pathSegments: string[]): Record<string, any> | null => {
        let current = updatedReport;
        // Traverse the path to the parent object
        for (let i = 0; i < pathSegments.length; i++) {
            const key = pathSegments[i];
            if (current[key] === undefined || current[key] === null) {
                // Create path segment if it doesn't exist
                current[key] = {};
            }
            current = current[key];
            // Ensure we are traversing objects
            if (typeof current !== 'object' || current === null) {
               console.error("Invalid path segment encountered in ensureMarkedDonePath:", pathSegments.slice(0, i + 1).join('.'));
               return null;
            }
        }
        // Now 'current' is the object where markedDoneStatus should reside
        // Ensure the 'markedDoneStatus' object itself exists within 'current'
        if (current.markedDoneStatus === undefined || current.markedDoneStatus === null) {
            current.markedDoneStatus = {};
        }
        // Return the markedDoneStatus object
        return current.markedDoneStatus;
    };
    // --- END HELPER FUNCTION DEFINITION ---
      
      // Find the appropriate section to update based on ID
      if (id.startsWith('domain-')) {
        const domain = id.replace('domain-', '');
        // Ensure the path exists
        if (!updatedReport.presentLevels) updatedReport.presentLevels = {};
        if (!updatedReport.presentLevels.markedDoneStatus) updatedReport.presentLevels.markedDoneStatus = {};
        if (!updatedReport.presentLevels.markedDoneStatus.functioning) updatedReport.presentLevels.markedDoneStatus.functioning = {};
        
        // Set the status
        updatedReport.presentLevels.markedDoneStatus.functioning[domain] = isDone;
      }
      else if (id === 'student-info') {
        if (!updatedReport.header) updatedReport.header = {};
        if (!updatedReport.header.markedDoneStatus) updatedReport.header.markedDoneStatus = {};
        updatedReport.header.markedDoneStatus.studentInfo = isDone;
      }
      else if (id.startsWith('observation-') || id.startsWith('tool-') || id === 'validity-statement') {
        if (!updatedReport.assessmentResults) updatedReport.assessmentResults = {};
        if (!updatedReport.assessmentResults.markedDoneStatus) updatedReport.assessmentResults.markedDoneStatus = {};
        
        if (id === 'validity-statement') {
          updatedReport.assessmentResults.markedDoneStatus.validityStatement = isDone;
        }
        else if (id.startsWith('observation-')) {
          if (!updatedReport.assessmentResults.markedDoneStatus.observations) {
            updatedReport.assessmentResults.markedDoneStatus.observations = {};
          }
          updatedReport.assessmentResults.markedDoneStatus.observations[id] = isDone;
        }
        else if (id.startsWith('tool-')) {
          if (!updatedReport.assessmentResults.markedDoneStatus.tools) {
            updatedReport.assessmentResults.markedDoneStatus.tools = {};
          }
          updatedReport.assessmentResults.markedDoneStatus.tools[id] = isDone;
        }
      }
      else if (id === 'educational-history' || id === 'health-info' || id === 'family-info' || id === 'parent-concerns') {
        if (!updatedReport.background) updatedReport.background = {};
        if (!updatedReport.background.markedDoneStatus) updatedReport.background.markedDoneStatus = {};
        
        if (id === 'educational-history') updatedReport.background.markedDoneStatus.educationalHistory = isDone;
        else if (id === 'health-info') updatedReport.background.markedDoneStatus.healthInfo = isDone;
        else if (id === 'family-info') updatedReport.background.markedDoneStatus.familyInfo = isDone;
        else if (id === 'parent-concerns') updatedReport.background.markedDoneStatus.parentConcerns = isDone;
      }
      // Unified handling for conclusion and eligibility cards
      else if (id.startsWith('eligibility-') || id === 'conclusion-summary' || id === 'services-recommendations' || id === 'accommodations-strategies' || id === 'glossary') {
        const targetStatus = ensureMarkedDonePath(['conclusion']);
        if (targetStatus) {
            // Store the status directly using the card ID as the key
            targetStatus[id] = isDone;
        }
      }
      
      return updatedReport;
    });
    
    // Optionally add a success message
    setSuccess(`${id} ${isDone ? 'marked as done' : 'unmarked'}`);
  }, []);
  const handleExportHtml = () => { console.log("Placeholder: Export HTML") };
  const handleClearReport = () => { console.log("Placeholder: Clear Report"); setReport(createReportSkeleton()); setSuccess("Report cleared."); };
  
  // No synthesis generation function needed as each component handles its own toggle state

  // --- Render Logic ---
  return (
    <div className="w-full">
      <Card className="relative border-0 overflow-auto" ref={editorRef} style={{ height: 'calc(100vh - 0px)' }}>
        

        {/* Editor Panel */}
        <EditorPanel
            inputText={inputText}
            setInputText={setInputText}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            isUpdating={isUpdating}
            error={error}
            success={success}
            handleSubmit={handleSubmit}
            handleExportHtml={handleExportHtml}
            handleClearReport={handleClearReport}
            report={report}
            onPdfUpload={handlePdfUpload}
            onViewJson={() => setShowJsonPreview(true)}
            onBatchComplete={handleBatchComplete}
            onBatchError={handleBatchError}
        />
        
        {/* Batch Status Component - Shown only when a batch job is in progress */}
        {batchId && batchStatus === 'processing' && (
          <div className="absolute top-20 right-4 z-30 w-80">
            <BatchJobStatus 
              batchId={batchId}
              onComplete={handleBatchComplete}
              onError={handleBatchError}
            />
          </div>
        )}

        {/* Conditional Rendering */}
        {loading ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Skeleton */}
            <div className="space-y-4"> <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" /> <Skeleton className="h-40 w-full bg-gray-200 dark:bg-gray-700" /> <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-700" /> </div>
            <div className="space-y-4"> <Skeleton className="h-40 w-full bg-gray-200 dark:bg-gray-700" /> <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" /> <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-700 md:col-span-2" /> </div>
          </div>
        ) : (
          // Actual Report Content Area
          <div className="p-6 mt-4">
            {/* Empty state check */}
            {/* ... */}

            {/* Row 1 - Background & Assessment Tools */}
            <AnimatedSectionRow id="row-1" index={0}>
              <BackgroundSection
                studentInfo={report.header?.studentInformation}
                background={report.background}
                headerLockStatus={report.header?.lockStatus}
                backgroundLockStatus={report.background?.lockStatus}
                onLockSection={handleLockSection}
                onToggleSynthesis={handleToggleSynthesis}
                onSaveContent={handleSaveContent}
                onToggleMarkedDone={handleToggleMarkedDone}
                backgroundMarkedDoneStatus={report.background?.markedDoneStatus} // Pass the current state
                studentInfoMarkedDoneStatus={report.header?.markedDoneStatus} // Pass the current state
                headerMarkedDoneStatus={report.header?.markedDoneStatus} // Pass the current state
              />
              <AssessmentToolsSection 
                assessmentProcedures={report.assessmentResults?.assessmentProceduresAndTools}
                observations={report.assessmentResults?.observations || {}}
                onAddTool={(toolId) => handleAddTool(toolId)}
                onOpenLibrary={handleOpenLibrary}
                allTools={assessmentTools}
                onLockSection={handleLockSection}
                onToggleSynthesis={handleToggleSynthesis}
                onSaveContent={handleSaveContent}
                assessmentResultsLockStatus={report.assessmentResults?.lockStatus}
                onToggleMarkedDone={handleToggleMarkedDone}
                assessmentMarkedDoneStatus={report.assessmentResults?.markedDoneStatus} // Pass the current state
              />
            </AnimatedSectionRow>

            {/* Row 2 - Present Levels & Eligibility */}
            <AnimatedSectionRow id="row-2" index={1}>
              <PresentLevelsSection 
                functioning={report.presentLevels?.functioning}
                onLockSection={handleLockSection}
                onToggleSynthesis={handleToggleSynthesis}
                onSaveContent={handleSaveContent}
                onToggleMarkedDone={handleToggleMarkedDone}
                presentLevelsLockStatus={report.presentLevels?.lockStatus}
                presentLevelsMarkedDoneStatus={report.presentLevels?.markedDoneStatus} // Pass the current state
              />
              <EligibilitySection 
                eligibilityData={report.conclusion?.eligibility}
                lockStatus={report.conclusion?.lockStatus}
                onToggleDomainEligibility={handleToggleDomainEligibility}
                onLockSection={handleLockSection}
                onToggleMarkedDone={handleToggleMarkedDone}
                markedDoneStatus={report.conclusion?.markedDoneStatus} // Correct prop name
              />
            </AnimatedSectionRow>

            {/* Row 3 - Conclusion & Glossary */}
            <AnimatedSectionRow id="row-3" index={2}>
              <ConclusionRecsSection
                conclusionData={report.conclusion?.conclusion}
                recommendationsData={report.conclusion?.recommendations}
                eligibilityText={report.conclusion?.eligibility?.applicableEdCodeText} 
                lockStatus={report.conclusion?.lockStatus}
                onLockSection={handleLockSection}
                onToggleSynthesis={handleToggleSynthesis}
                onSaveContent={handleSaveContent}
                onToggleMarkedDone={handleToggleMarkedDone}
                markedDoneStatus={report.conclusion?.markedDoneStatus}
              />
              <div id="glossary">
                <GlossarySection
                  glossary={report.conclusion?.parentFriendlyGlossary}
                  lockStatus={report.conclusion?.lockStatus}
                  onLockSection={handleLockSection}
                  onSaveContent={handleSaveContent}
                  onToggleMarkedDone={handleToggleMarkedDone}
                />
              </div>
            </AnimatedSectionRow>
          </div>
        )}
      </Card>

      {/* Dialogs and Overlays */}
      <JsonViewerDialog data={report} isOpen={showJsonPreview} onClose={() => setShowJsonPreview(false)} />
      {commandDetails && <CommandDetailsCard commandDetails={commandDetails} truncateText={truncateText} />}
    </div>
  );
}