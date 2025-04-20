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
import { EMPTY_REPORT, SAMPLE_REPORT } from '@/types/sampleReportData';
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
  // Properly handle route parameters in Next.js 15+
  const params = useParams();
  const userId = params.userId;
  const reportId = params.reportId;
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
  const [reportData, setReportData] = useState<SpeechLanguageReport | null>(null);
  
  // Always call the hook, but use a safe default empty report initially
  // This ensures the hooks ordering is consistent across renders
  const emptyReportSkeleton = useMemo(() => createReportSkeleton(), []);
  
  // Use the batch report updater hook with a safe default
  const batchUpdaterHook = useBatchReportUpdater(
    initialReport 
      ? (initialReport.report || initialReport) 
      : emptyReportSkeleton
  );
  
  // When initialReport changes, update the hook's internal state
  useEffect(() => {
    if (initialReport) {
      console.log("initialReport loaded, updating hook state", initialReport);
      
      // Extract just the report part if initialReport has a report property
      // Otherwise use initialReport directly
      const reportForHook = (initialReport && initialReport.report) 
        ? initialReport.report 
        : initialReport;
        
      // Update the hook's internal state using its setReport function
      batchUpdaterHook.setReport(reportForHook);
    }
  }, [initialReport, batchUpdaterHook.setReport]);
      
  // Destructure the hook result  
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
  } = batchUpdaterHook;
  
  console.log('[useBatchReportUpdater] current report:', report);

  useEffect(() => {
    setLoading(true);
 
    const loadReport = async () => {
      try {
        // Fetch a specific report with ID parameter
        const response = await fetch(`/api/reports?id=${reportId}&userId=${userId}`);
        const json = await response.json();
 
        console.log("Loaded report JSON:", json);
        
        if (!response.ok) throw new Error(json.error || 'Failed to fetch report');
 
        // Enhanced detailed logging
        console.log('API Response Structure:', {
          hasId: Boolean(json?.id), 
          hasUserId: Boolean(json?.user_id),
          hasReport: Boolean(json?.report),
          reportType: typeof json?.report,
          reportHasHeader: Boolean(json?.report?.header),
          studentInfoExists: Boolean(json?.report?.header?.studentInformation),
          studentInfoFields: json?.report?.header?.studentInformation ? 
            Object.keys(json.report.header.studentInformation) : []
        });
        
        // Log full JSON for complete visibility
        console.log('Full JSON response (stringified):', 
          JSON.stringify(json, null, 2)
        );
        
        // Use the entire JSON response object instead of just the report field
        // This includes id, user_id, created_at, updated_at, and report
        const reportData = json;
        
        if (!reportData || !reportData.report || typeof reportData.report !== 'object') {
          console.error("Invalid report data structure:", json);
          throw new Error('Invalid report data');
        }
 
        console.log('[loadReport] Setting initialReport:', reportData);
        
        // Safety check - confirm report has the expected structure
        if (reportData && reportData.id) {
          console.info('[Report Safety Check] All nested report access points verified for:', reportData.id);
        }
        
        setInitialReport(reportData);
      } catch (e) {
        console.error("Failed to load report from Supabase, falling back to skeleton:", e);
        console.log('[loadReport] Falling back to skeleton report');
        setInitialReport(createReportSkeleton());
      } finally {
        setLoading(false);
      }
    };
 
    if (reportId === 'new') {
      setInitialReport(createReportSkeleton());
      setLoading(false);
    } else {
      loadReport();
    }
  }, [reportId, userId]);
  // Monitor initialReport changes
  useEffect(() => {
    console.log('[useEffect] initialReport updated:', initialReport);
  }, [initialReport]);
  
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
    if (!report?.presentLevels?.functioning) {
        return []; // Return empty array if functioning is not available
    }
    
    // Access the nested functioning object properly
    const functioning = report.presentLevels.functioning;
    
    // Example: Return keys of functioning domains marked as a concern
    return Object.entries(functioning)
        .filter(([key, value]) => value?.isConcern === true)
        .map(([key]) => key);
  }, [report?.presentLevels?.functioning]);

  // FIX: Add fallback default array `[]` in case activeDomains is undefined during initial render
  const activeDomainsKey = useMemo(() => (activeDomains || []).join(','), [activeDomains]); // <-- ADDED || []

  const domainConcernsKey = useMemo(() => {
    if (!report?.presentLevels?.functioning || !activeDomains) {
        return ''; // Or some default key
    }
    
    // Access the nested functioning object properly
    const functioning = report.presentLevels.functioning;
    
    return (activeDomains || []).map(domain => 
        `${domain}-${functioning[domain as keyof Functioning]?.isConcern ?? false}`
    ).join(',');
  }, [activeDomains, report?.presentLevels?.functioning]);


  // --- Build section groups for sidebar - UPDATED for split Conclusion ---
  useEffect(() => {
    // Initialize domainItems properly
    let domainItems: { title: string, url: string, isActive: boolean }[] = [];
    
    // Process functioning domains properly
    if (report?.presentLevels?.functioning) {
      const functioning = report.presentLevels.functioning;
      domainItems = (activeDomains || []).map(domain => ({
          title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Language`,
          url: `#domain-${domain}`,
          // Ensure value exists before accessing isConcern
          isActive: functioning[domain as keyof Functioning]?.isConcern ?? false
      }));
    }

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
    setReport(currentReport => {
      const updatedReport = JSON.parse(JSON.stringify(currentReport));
      let targetInfo: { parent: any; finalKey: string | number } | null = null;

      // --- Map ID to the correct path --- (keep the implementation)
      // ...

      // ... update timestamp ...
      const metaTarget = ensurePathAndGetParent(updatedReport, ['metadata', 'lastUpdated']); if (metaTarget) metaTarget.parent[metaTarget.finalKey] = new Date().toISOString();

      return updatedReport;
    });
  }, []);


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
  
  // Only do data inspection if report is available
  if (report) {
    // Detailed inspection of header and studentInformation parts
    console.log('----------- REPORT DATA INSPECTION -----------');
    console.log('Report object type:', typeof report);
    console.log('Report has header:', Boolean(report?.header));
    
    if (report?.header) {
      console.log('Header object type:', typeof report.header);
      console.log('Header keys:', Object.keys(report.header));
      console.log('Header has studentInformation:', Boolean(report.header.studentInformation));
      
      if (report.header.studentInformation) {
        console.log('studentInformation object type:', typeof report.header.studentInformation);
        console.log('studentInformation keys:', Object.keys(report.header.studentInformation));
        console.log('studentInformation values sample:', {
          firstName: report.header.studentInformation.firstName,
          lastName: report.header.studentInformation.lastName,
          homeLanguage: report.header.studentInformation.homeLanguage
        });
      } else {
        console.warn('studentInformation is missing or invalid');
      }
    } else {
      console.warn('Header is missing or invalid');
    }
    
    // Check for any unusual data formats that might come from Supabase
    try {
      // Check if there's any unexpected string encoding
      const jsonStr = JSON.stringify(report);
      const reparsed = JSON.parse(jsonStr);
      
      if (reparsed.header?.studentInformation !== report.header?.studentInformation) {
        console.warn('Warning: Possible reference issue with studentInformation');
      }
      
      // Check for common Supabase quirks
      if (typeof report.header === 'string') {
        console.warn('Warning: header is a string instead of an object - might need parsing');
      }
    } catch (e) {
      console.error('Error checking report data:', e);
    }
    
    console.log('Raw studentInformation object:', report?.header?.studentInformation);
    console.log('----------- END INSPECTION -----------');
    
    // Deep inspection of studentInformation object
    console.log('[render] Student info detailed:', 
      JSON.stringify(report?.header?.studentInformation, null, 2)
    );
  } else {
    console.log('Report is not yet initialized, waiting for data...');
  }
  
  // Log the raw report data structure (only in dev)
  if (process.env.NODE_ENV === 'development') {
    console.dir(report, { depth: 3 }); // Shows 3 levels deep
  }
  
  // Determine overall loading status - initially loading or waiting for hook initialization
  const isContentLoading = loading || !report;
  
  return (
    <div className="w-full">
      <Card className="relative border-0 overflow-auto" ref={editorRef} style={{ height: 'calc(100vh - 0px)' }}>
        
        {/* Editor Panel - Only show when report is ready */}
        {!isContentLoading && (
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
        )}
        
        {/* Batch Status Component - Shown only when a batch job is in progress */}
        {!isContentLoading && batchId && batchStatus === 'processing' && (
          <div className="absolute top-20 right-4 z-30 w-80">
            <BatchJobStatus 
              batchId={batchId}
              onComplete={handleBatchComplete}
              onError={handleBatchError}
            />
          </div>
        )}

        {/* Conditional Rendering */}
        {isContentLoading ? (
          <div className="p-6">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-bold mb-2">Loading Report Data...</h2>
              <p className="text-gray-500 mb-6">Please wait while we retrieve and initialize your report.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Skeleton */}
              <div className="space-y-4"> 
                <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" /> 
                <Skeleton className="h-40 w-full bg-gray-200 dark:bg-gray-700" /> 
                <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-700" /> 
              </div>
              <div className="space-y-4"> 
                <Skeleton className="h-40 w-full bg-gray-200 dark:bg-gray-700" /> 
                <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" /> 
                <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-700 md:col-span-2" /> 
              </div>
            </div>
            
            {/* Debug info for loading state */}
            <div className="mt-8 p-4 bg-gray-100 rounded border border-gray-200">
              <h3 className="font-bold mb-2">Loading Status</h3>
              <ul className="list-disc pl-5 text-sm">
                <li>API loading: {loading ? 'Still loading' : 'Complete'}</li>
                <li>Initial report loaded: {initialReport ? 'Yes' : 'No'}</li>
                <li>Report data prepared: {reportData ? 'Yes' : 'No'}</li>
                <li>Hook initialized: {report ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          </div>
        ) : (
          // Actual Report Content Area - Only render when report is fully loaded
          <div className="p-6 mt-4 flex-wrap">
            {/* Empty state check */}
            {/* ... */}

            {/* Row 1 - Background & Assessment Tools */}
            <AnimatedSectionRow id="row-1" index={0}>
              {/* Add debug check to see if report.header exists before rendering */}
              {report.header ? (
                <>
                  {/* Add raw debug info for header object */}
                  <div className="bg-blue-50 p-3 mb-4 border border-blue-200 rounded">
                    <h3 className="font-bold text-sm mb-2">Report Header Debug</h3>
                    <p className="text-xs mb-1">Header type: {typeof report.header}</p>
                    <p className="text-xs mb-1">Has studentInformation: {Boolean(report.header?.studentInformation)}</p>
                    <pre className="text-xs overflow-auto max-h-32">
                      {JSON.stringify(report.header, null, 2)}
                    </pre>
                  </div>
                  
                  <BackgroundSection
                    studentInfo={report.header?.studentInformation}
                    background={report.background}
                    headerLockStatus={report.header?.lockStatus}
                    backgroundLockStatus={report.background?.lockStatus}
                    onLockSection={handleLockSection}
                    onToggleSynthesis={handleToggleSynthesis}
                    onSaveContent={handleSaveContent}
                    onToggleMarkedDone={handleToggleMarkedDone}
                    backgroundMarkedDoneStatus={report.background?.markedDoneStatus}
                    studentInfoMarkedDoneStatus={report.header?.markedDoneStatus}
                    headerMarkedDoneStatus={report.header?.markedDoneStatus}
                  />
                </>
              ) : (
                /* Alternate display for missing header */
                <div className="bg-red-50 p-4 border border-red-200 rounded">
                  <h3 className="font-bold text-lg mb-2">Header Data Missing</h3>
                  <p>The report header object is missing or invalid. This could indicate:</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>API response format issue</li>
                    <li>Data structure mismatch</li>
                    <li>Incomplete report loading</li>
                  </ul>
                  <pre className="mt-4 text-xs bg-gray-100 p-2 rounded">
                    report type: {typeof report}<br/>
                    report keys: {report ? Object.keys(report).join(', ') : 'undefined'}
                  </pre>
                </div>
              )}
              
              {/* Debug panel for data inspection (DEV only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded my-4 overflow-auto max-h-96">
                  <h3 className="font-bold mb-2">Student Information Debug</h3>
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(report.header?.studentInformation, null, 2) || "No student information found"}
                  </pre>
                  
                  <h3 className="font-bold mb-2 mt-4">Report Structure</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Header: {report.header ? "✅" : "❌"}</div>
                    <div>Background: {report.background ? "✅" : "❌"}</div>
                    <div>Present Levels: {report.presentLevels ? "✅" : "❌"}</div>
                    <div>Assessment Results: {report.assessmentResults ? "✅" : "❌"}</div>
                    <div>Conclusion: {report.conclusion ? "✅" : "❌"}</div>
                  </div>
                </div>
              )}
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