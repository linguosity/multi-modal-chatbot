// FILE: ReportEditor.tsx (Refactored for 2-Columns & New Sections: Present Levels + Assessment Tools)

"use client";

// Base React imports + hooks needed
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useMemo, useCallback
import { useParams } from 'next/navigation';

// UI Components
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Context and Data Fetching/Definitions
import { useReports } from "@/components/contexts/reports-context";
import { getAllAssessmentTools } from '@/lib/assessment-tools'; // Function to get tool definitions
// Assuming these report data structures are updated to match the NEW schema
import { EMPTY_REPORT, SAMPLE_REPORT } from '@/lib/seed-report';

// === UPDATED TYPE IMPORTS (from Zod Schema) ===
import {
    SpeechLanguageReport,
    AssessmentTool,     // Type for a tool definition
    PresentLevels,      // Type for the new Present Levels section data
    AssessmentResults,  // Type for the refactored Assessment Results (Tools/Obs only)
    Header,             // Keep for prop typing if StudentInfo section needs it
    Background,         // Keep for prop typing if BackgroundSection needs it
    Conclusion,         // Keep for prop typing if ConclusionSection needs it
    Functioning         // Type for the object holding all domain data
} from '@/types/reportSchemas'; // Ensure this path points to your Zod-derived types

// === UPDATED SECTION COMPONENT IMPORTS ===
import EditorPanel from "@/components/reports/text-editor/EditorPanel";
import StudentInformationSection from "@/components/reports/text-editor/StudentInformationSection";
import BackgroundSection from "@/components/reports/text-editor/BackgroundSection";
// Import the NEW section components
import PresentLevelsSection from "@/components/reports/text-editor/PresentLevelsSection";     // <<< IMPORT Present Levels Component
import AssessmentToolsSection from "@/components/reports/text-editor/AssessmentToolsSection"; // <<< IMPORT Assessment Tools Component
import ConclusionSection from "@/components/reports/text-editor/ConclusionSection";
import GlossarySection from "@/components/reports/text-editor/GlossarySection";
// Remove the OLD AssessmentResultsSection import if it was explicitly here before
// =======================================

// Other Utility Components
import JsonViewerDialog from "@/components/reports/text-editor/JsonViewerDialog";
import CommandDetailsCard from "@/components/reports/text-editor/CommandDetailsCard";
// Removed AssessmentLibraryPanel import as it seems integrated elsewhere now


// --- Helper Functions ---
function createReportSkeleton(): SpeechLanguageReport {
  // Ensure EMPTY_REPORT matches the NEW schema structure
  try {
    const skeleton = JSON.parse(JSON.stringify(EMPTY_REPORT));
    // Initialize required nested structures for the new schema if missing in EMPTY_REPORT
    if (!skeleton.presentLevels) skeleton.presentLevels = { functioning: {} };
    if (!skeleton.assessmentResults) skeleton.assessmentResults = { assessmentProceduresAndTools: { assessmentToolsUsed: [] }, observations: {} };
    if (!skeleton.conclusion) skeleton.conclusion = { eligibility: { domains: {} }, conclusion: {}, recommendations: { services: {}, accommodations: [], facilitationStrategies: [] }, parentFriendlyGlossary: { terms: {} } };
    if (!skeleton.metadata) skeleton.metadata = { version: 1, lastUpdated: new Date().toISOString() };
    return skeleton;
  } catch (e) {
      console.error("Failed to parse EMPTY_REPORT for new schema, creating basic structure:", e);
      // Fallback basic structure matching new schema
      return {
          header: { studentInformation: { firstName: '', lastName: '' } },
          background: {},
          presentLevels: { functioning: {} }, // Init new section
          assessmentResults: { assessmentProceduresAndTools: { assessmentToolsUsed: [] }, observations: {} }, // Init refactored section
          conclusion: { eligibility: { domains: {} }, conclusion: {}, recommendations: { services: {}, accommodations: [], facilitationStrategies: [] }, parentFriendlyGlossary: { terms: {} } },
          metadata: { version: 1, lastUpdated: new Date().toISOString() }
      };
  }
}

function truncateText(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength - 3) + '...';
}
// --- End Helper Functions ---


export default function ReportEditor() {
  const params = useParams();
  const userId = params?.userId as string;
  const reportId = params?.reportId as string;
  const isNewReport = reportId === 'new';

  const { setSectionGroups } = useReports();

  // --- State Declarations ---
  const [inputText, setInputText] = useState('');
  const [selectedSection, setSelectedSection] = useState('auto-detect');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // State uses the report type derived from the NEW schema
  const [report, setReport] = useState<SpeechLanguageReport>(createReportSkeleton());
  const [commandDetails, setCommandDetails] = useState<any>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  // Holds definitions of all available tools (e.g., from getAllAssessmentTools)
  const [assessmentTools, setAssessmentTools] = useState<Record<string, AssessmentTool>>({});
  const [savingReport, setSavingReport] = useState(false);

  // --- Effects ---

  // Load report data - Adjusted to handle possibility of new schema in SAMPLE_REPORT
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      console.log("Loading SAMPLE_REPORT for reportId:", reportId);
      try {
          const sampleData = JSON.parse(JSON.stringify(SAMPLE_REPORT));
          // Ensure essential nested objects exist if SAMPLE_REPORT is incomplete based on NEW structure
          if (!sampleData.presentLevels) sampleData.presentLevels = { functioning: {} };
          if (!sampleData.assessmentResults) sampleData.assessmentResults = { assessmentProceduresAndTools: { assessmentToolsUsed: [] }, observations: {} };
          if (!sampleData.conclusion) sampleData.conclusion = { eligibility: { domains: {} }, conclusion: {}, recommendations: { services: {}, accommodations: [], facilitationStrategies: [] }, parentFriendlyGlossary: { terms: {} } };
          if (!sampleData.metadata) sampleData.metadata = { version: 1, lastUpdated: new Date().toISOString() };
          setReport(sampleData);
      } catch(e) {
          console.error("Failed to parse SAMPLE_REPORT, using skeleton:", e);
          setReport(createReportSkeleton());
      }
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [reportId]);

  // Load all available assessment tools definitions
  useEffect(() => {
    try {
      const tools = getAllAssessmentTools();
      setAssessmentTools(tools);
    } catch (error) {
      console.error("Failed to load assessment tools:", error);
      setAssessmentTools({});
    }
  }, []);

  // --- Memos for Sidebar Updates (Adjusted for New Schema) ---

  // Identify active domains from the NEW location: report.presentLevels.functioning
  const activeDomains = useMemo(() => {
      const functioning = report?.presentLevels?.functioning; // Read from new path
      if (!functioning) return [];
      return Object.keys(functioning).filter(domain => {
          const domainKey = domain as keyof Functioning;
          const domainData = functioning[domainKey];
          return domainData && (
              domainData.topicSentence ||
              (domainData.strengths && domainData.strengths.length > 0) ||
              (domainData.needs && domainData.needs.length > 0)
          );
      });
  }, [report?.presentLevels?.functioning]); // Depend on new path

  const activeDomainsKey = useMemo(() => activeDomains.join(','), [activeDomains]);

  // Check concerns from the NEW location
  const domainConcernsKey = useMemo(() => {
    const functioning = report?.presentLevels?.functioning; // Read from new path
    if (!functioning) return '';
    return activeDomains
      .map(domain => {
          const domainKey = domain as keyof Functioning;
          return `${domain}:${functioning[domainKey]?.isConcern ?? false}`;
       })
      .join(',');
  }, [activeDomains, report?.presentLevels?.functioning]); // Depend on new path

  // Build section groups for sidebar - CORRECTED STRUCTURE
  useEffect(() => {
    const functioning = report?.presentLevels?.functioning; // Read from new path
    const domainItems = functioning ? activeDomains.map(domain => {
        const domainKey = domain as keyof Functioning;
        return {
          title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Language`,
          url: `#domain-${domain}`, // ID used within PresentLevelsSection/DomainCard
          isActive: functioning[domainKey]?.isConcern ?? false
        };
    }) : [];

    // Reflect the new sections in the sidebar
    const newSectionGroups = [
      {
        title: "Student Information",
        items: [ { title: "Demographics", url: "#demographics" }, { title: "Referral Reason", url: "#referral" } ]
      },
      {
        title: "Background",
        items: [ { title: "Educational History", url: "#educational-history" }, { title: "Health Information", url: "#health-info" }, { title: "Family Information", url: "#family-info" }, { title: "Parent Concerns", url: "#parent-concerns" } ]
      },
      { // <<< NEW Section for Tools / Observations >>>
        title: "Assessment Tools", // Correct Title
        items: [
          // Links pointing to IDs within AssessmentToolsSection
          { title: "Methods/Validity", url: "#validity-statement" }, // Assuming this ID exists inside AssessmentToolsSection
          { title: "Observations", url: "#assessment-summary" }, // Link to the general area within AssessmentToolsSection
          { title: "Tools Used", url: "#assessment-summary" } // Link to the general area within AssessmentToolsSection
        ]
      },
      { // <<< NEW Section for Present Levels / Domains >>>
        title: "Present Levels", // Correct Title
        items: [ ...domainItems ] // Only domain items here
      },
      
      {
        title: "Conclusions",
        items: [ { title: "Eligibility", url: "#eligibility" }, { title: "Summary", url: "#conclusion-summary" }, { title: "Recommendations", url: "#recommendations" } ] // Use appropriate IDs
      },
      {
        title: "Glossary",
        items: [ { title: "Terms", url: "#glossary" } ]
      }
    ];
    setSectionGroups(newSectionGroups);
    // Dependencies are correct for the new structure
  }, [setSectionGroups, activeDomainsKey, domainConcernsKey, report?.presentLevels?.functioning]);

  // --- Handlers ---

  // handleSubmit (API call): Sends the report object with the new structure.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isUpdating) return;
    setIsUpdating(true); setError(null); setSuccess(null); setCommandDetails(null);
    try {
      const response = await fetch('/api/text-editor-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputText, report: report, updateSection: selectedSection === 'auto-detect' ? undefined : selectedSection, userId, reportId }),
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Failed to update report'); }
      const data = await response.json();
      if (data.report) { // Assume API returns the report with the new structure
        setReport(data.report); setInputText('');
        if (data.command) { setCommandDetails(data.command); setSuccess(`Report updated via ${data.command.command}`); }
        else { setSuccess('Report updated successfully'); }
      } else if (data.error) { setError(data.error); }
    } catch (err) { setError(err instanceof Error ? err.message : 'An unexpected error occurred'); }
    finally { setIsUpdating(false); }
  };

  const handleSaveReport = async () => {
      setSavingReport(true);
      console.log("Saving report (New Structure)...", report);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save
      setSavingReport(false);
      setSuccess("Report saved successfully!");
   };

  // handleAddTool: Targets the correct path in the new schema
  const handleAddTool = useCallback((toolId: string) => {
    console.log(`Adding tool ${toolId} to assessmentResults.assessmentProceduresAndTools`);
    setReport(currentReport => {
      const updatedReport = JSON.parse(JSON.stringify(currentReport));
      const procToolsPath = ['assessmentResults', 'assessmentProceduresAndTools']; // Correct path
      let currentLevel = updatedReport;
      for (const key of procToolsPath) {
          if (!currentLevel[key]) currentLevel[key] = {};
          currentLevel = currentLevel[key];
      }
      if (!currentLevel.assessmentToolsUsed) currentLevel.assessmentToolsUsed = [];
      if (!currentLevel.assessmentToolsUsed.includes(toolId)) {
        currentLevel.assessmentToolsUsed.push(toolId);
        setSuccess(`Added ${assessmentTools[toolId]?.name || toolId} to assessment tools`);
      }
      return updatedReport;
    });
  }, [assessmentTools]);

  // handleOpenLibrary, handleAddToolToGlobal, handleToggleDomainEligibility remain largely the same logic, targeting appropriate data/actions
  const handleOpenLibrary = useCallback(() => {
    console.log("Open Assessment Library handler called");
    const libraryTrigger = document.querySelector('[data-assessment-library-trigger="true"]');
    if (libraryTrigger instanceof HTMLElement) libraryTrigger.click();
    else console.warn('Assessment library trigger button not found.');
   }, []);

  const handleAddToolToGlobal = useCallback((toolDefinition: AssessmentTool | string) => {
    console.log("Add tool to global definitions:", toolDefinition);
    // Implement logic to save toolDefinition globally (e.g., localStorage, API)
    // ... (Example localStorage logic can be added here if needed) ...
   }, []);

   const handleToggleDomainEligibility = useCallback((domain: string, value: boolean) => {
        console.log(`Toggle eligibility for ${domain} to ${value}`);
        setReport(currentReport => {
            const updatedReport = JSON.parse(JSON.stringify(currentReport));
            if (updatedReport.conclusion?.eligibility?.domains?.[domain] !== undefined) {
                updatedReport.conclusion.eligibility.domains[domain] = value;
            } else {
                console.warn(`Domain ${domain} not found in conclusion.eligibility.domains`);
            }
            return updatedReport;
        });
   }, []);

  const handleToggleSynthesis = useCallback((id: string) => {
    console.log(`Toggle synthesis for section/card ${id}`);
    // Needs implementation: Fetch or generate synthesis based on `id` and update `report` state
  }, []);


  // --- REFACTORED CALLBACKS for Lock/Save (Aware of New Schema Structure) ---
  // Use the robust versions from previous step, adapted for this base code context

  const handleLockSection = useCallback((id: string, locked: boolean) => {
    console.log(`Locking/Unlocking ID: ${id} to ${locked}`);
    setReport(currentReport => {
      const updatedReport = JSON.parse(JSON.stringify(currentReport)); // Deep copy

       // Helper to ensure path exists and return the target object for lock status
       const getLockStatusTarget = (obj: any, path: (string | number)[], create = true): any => {
           let current = obj;
           for (let i = 0; i < path.length; i++) {
               const key = path[i];
               if (current[key] === undefined || current[key] === null) {
                   if (!create) return null; // Stop if path doesn't exist and shouldn't be created
                   // Determine if we need an object or array based on next key
                   const nextKeyIsNumber = (i + 1 < path.length && typeof path[i+1] === 'number');
                   current[key] = nextKeyIsNumber ? [] : {};
               }
               current = current[key];
               if (typeof current !== 'object' && typeof current !== 'function' && current !== null && i < path.length -1) {
                  console.error("Invalid path encountered in getLockStatusTarget:", path.slice(0, i+1).join('.'));
                  return null; // Invalid path segment
               }
           }
           // The last level often needs a 'lockStatus' property within it
           if (create && typeof current === 'object' && current !== null && !current.lockStatus) {
                current.lockStatus = {};
           }
            // Return the object *containing* lockStatus, or lockStatus itself if appropriate
           return current?.lockStatus ? current.lockStatus : current;
       };


      // --- Section Locks ---
      if (id === 'section-student-info') {
          const status = getLockStatusTarget(updatedReport, ['header']); // Get header.lockStatus
          if(status) { status.demographics = locked; status.referral = locked; status.wasSectionLock = true; }
      } else if (id === 'section-background') {
          const status = getLockStatusTarget(updatedReport, ['background']); // Get background.lockStatus
          if(status) { status.educationalHistory = locked; status.healthInfo = locked; status.familyInfo = locked; status.parentConcerns = locked; status.wasSectionLock = true; }
      } else if (id === 'section-present-levels') {
          const status = getLockStatusTarget(updatedReport, ['presentLevels']); // Get presentLevels.lockStatus
          const functioning = updatedReport.presentLevels?.functioning || {};
          if (status) {
             if (!status.functioning) status.functioning = {}; // Ensure functioning map exists in lockStatus
             Object.keys(functioning).forEach(domain => { status.functioning[domain] = locked; });
             status.wasSectionLock = true;
          }
          // Update direct isLocked if schema has it at top level
          if (updatedReport.presentLevels) updatedReport.presentLevels.isLocked = locked;
      } else if (id === 'section-assessment-tools') {
          const status = getLockStatusTarget(updatedReport, ['assessmentResults']); // Get assessmentResults.lockStatus
          if (status) {
            status.validityStatement = locked;
            if (!status.observations) status.observations = {};
            const obs = updatedReport.assessmentResults?.observations || {};
            Object.keys(obs).forEach(key => { if (key !== 'synthesis' && key !== 'isLocked') status.observations[key] = locked; });
            if (!status.tools) status.tools = {};
            const toolsUsed = updatedReport.assessmentResults?.assessmentProceduresAndTools?.assessmentToolsUsed || [];
            toolsUsed.forEach(toolId => { status.tools[toolId] = locked; });
            status.wasSectionLock = true;
          }
           // Update direct isLocked if schema has it at top level
          if (updatedReport.assessmentResults) updatedReport.assessmentResults.isLocked = locked;
      } else if (id === 'section-conclusion') {
          const status = getLockStatusTarget(updatedReport, ['conclusion']); // Get conclusion.lockStatus
          if (status) { status.summary = locked; status.eligibility = locked; status.services = locked; status.accommodations = locked; status.parentGlossary = locked; status.wasSectionLock = true; }
      }
      // --- Individual Card Locks (Mapped to NEW Schema Paths) ---
      else if (id.startsWith('domain-')) {
          const domain = id.replace('domain-', '');
          const status = getLockStatusTarget(updatedReport, ['presentLevels', 'lockStatus']);
           if (status) {
               if (!status.functioning) status.functioning = {};
               status.functioning[domain] = locked;
           }
           // Update direct isLocked on domain data if schema has it
           if(updatedReport.presentLevels?.functioning?.[domain]) updatedReport.presentLevels.functioning[domain].isLocked = locked;
      }
      else if (id === 'validity-statement') { // Maps to assessmentProceduresAndTools lock
          getLockStatusTarget(updatedReport, ['assessmentResults', 'assessmentProceduresAndTools']).isLocked = locked; // Direct lock
          getLockStatusTarget(updatedReport, ['assessmentResults']).validityStatement = locked; // Reference in parent lockStatus
      } else if (id.startsWith('observation-')) {
          const obsKey = id.replace('observation-', '');
          getLockStatusTarget(updatedReport, ['assessmentResults', 'observations', 'lockStatus'])[obsKey] = locked; // Use nested lockStatus
          // Update direct isLocked if schema has it on observations obj (less likely for individual keys)
          // if(updatedReport.assessmentResults?.observations) updatedReport.assessmentResults.observations.isLocked = locked;
      } else if (id.startsWith('tool-')) {
          const toolId = id.replace('tool-', '');
          const status = getLockStatusTarget(updatedReport, ['assessmentResults', 'assessmentProceduresAndTools', 'lockStatus']);
           if (status) {
               if (!status.tools) status.tools = {}; // Store tool locks under assessmentProceduresAndTools.lockStatus.tools
               status.tools[toolId] = locked;
           }
      }
      else if (id === 'demographics') getLockStatusTarget(updatedReport, ['header']).demographics = locked;
      else if (id === 'referral') getLockStatusTarget(updatedReport, ['header']).referral = locked;
      else if (id === 'educational-history') getLockStatusTarget(updatedReport, ['background']).educationalHistory = locked;
      else if (id === 'health-info') getLockStatusTarget(updatedReport, ['background']).healthInfo = locked;
      else if (id === 'family-info') getLockStatusTarget(updatedReport, ['background']).familyInfo = locked;
      else if (id === 'parent-concerns') getLockStatusTarget(updatedReport, ['background']).parentConcerns = locked;
      else if (id === 'conclusion-summary') getLockStatusTarget(updatedReport, ['conclusion']).summary = locked;
      else if (id === 'eligibility' || id === 'eligibility-determination') getLockStatusTarget(updatedReport, ['conclusion']).eligibility = locked;
      else if (id === 'services-recommendations') getLockStatusTarget(updatedReport, ['conclusion']).services = locked;
      else if (id === 'accommodations-strategies') getLockStatusTarget(updatedReport, ['conclusion']).accommodations = locked;
      else if (id === 'parent-glossary' || id === 'glossary') getLockStatusTarget(updatedReport, ['conclusion']).parentGlossary = locked;
      else { console.warn(`Unhandled lock ID: ${id}`); }

      return updatedReport;
    });
    setSuccess(`Card ${id} ${locked ? 'locked' : 'unlocked'}`);
  }, []);

  const handleSaveContent = useCallback((id: string, content: string | object) => {
    console.log(`Saving content for ID: ${id}`);
    setReport(currentReport => {
      const updatedReport = JSON.parse(JSON.stringify(currentReport));

       // Helper to ensure path and return parent object for setting value
       const ensurePathAndGetParent = (obj: any, path: (string|number)[]): { parent: any; finalKey: string | number } | null => {
           let current = obj;
           for (let i = 0; i < path.length - 1; i++) {
               const key = path[i];
               if (current[key] === undefined || current[key] === null) { current[key] = {}; }
               current = current[key];
               if (typeof current !== 'object' || current === null) return null;
           }
           const finalKey = path[path.length - 1];
           // Ensure the parent exists and is an object before returning
           if (typeof current === 'object' && current !== null) {
               return { parent: current, finalKey };
           }
           return null;
       };

      // --- Map ID to the correct path in the NEW structure ---
      let targetInfo: { parent: any; finalKey: string | number } | null = null;

      if (id.startsWith('domain-')) {
          const domain = id.replace('domain-', '');
          targetInfo = ensurePathAndGetParent(updatedReport, ['presentLevels', 'functioning', domain]);
           if (targetInfo?.parent && targetInfo.finalKey) {
               // Requires parsing 'content' based on DomainCard editor. Assuming complex object for now.
               if (typeof content === 'object' && content !== null) {
                   // Merge or replace the domain data object
                   targetInfo.parent[targetInfo.finalKey] = { ...targetInfo.parent[targetInfo.finalKey], ...content };
               } else if (typeof content === 'string') {
                    console.warn(`Saving string content for domain '${domain}' requires parsing logic.`);
                    // Simple example: Assume it's the topic sentence
                    if (!targetInfo.parent[targetInfo.finalKey]) targetInfo.parent[targetInfo.finalKey] = {};
                    targetInfo.parent[targetInfo.finalKey].topicSentence = content;
               }
           } else console.error(`Invalid path for domain save: ${id}`);
      }
      else if (id === 'validity-statement') { // Maps to assessmentResults.assessmentProceduresAndTools.overviewOfAssessmentMethods
          if (typeof content === 'string') {
              targetInfo = ensurePathAndGetParent(updatedReport, ['assessmentResults', 'assessmentProceduresAndTools', 'overviewOfAssessmentMethods']);
              if (targetInfo) targetInfo.parent[targetInfo.finalKey] = content; else console.error("Path error saving validity");
          }
      } else if (id.startsWith('observation-')) { // Maps to assessmentResults.observations[key]
          if (typeof content === 'string') {
              const obsKey = id.replace('observation-', '');
              targetInfo = ensurePathAndGetParent(updatedReport, ['assessmentResults', 'observations', obsKey]);
               if (targetInfo) targetInfo.parent[targetInfo.finalKey] = content; else console.error("Path error saving observation");
          }
      }
      else if (id === 'referral') { // Maps to header.reasonForReferral
          if (typeof content === 'string') {
              targetInfo = ensurePathAndGetParent(updatedReport, ['header', 'reasonForReferral']);
              if (targetInfo) targetInfo.parent[targetInfo.finalKey] = content; else console.error("Path error saving referral");
          }
      }
      else if (id === 'demographics') { // Maps to header.studentInformation
            if (typeof content === 'object' && content !== null) {
                 targetInfo = ensurePathAndGetParent(updatedReport, ['header', 'studentInformation']);
                 if (targetInfo?.parent && targetInfo.finalKey) {
                     // Merge content into existing student info
                     targetInfo.parent[targetInfo.finalKey] = { ...targetInfo.parent[targetInfo.finalKey], ...content };
                 } else console.error("Path error saving demographics");
            } else if (typeof content === 'string') { /* Handle stringified JSON? */ }
       }
      else if (id === 'educational-history') { // Maps to background.studentDemographicsAndBackground.educationalHistory
           if (typeof content === 'string') {
              targetInfo = ensurePathAndGetParent(updatedReport, ['background', 'studentDemographicsAndBackground', 'educationalHistory']);
              if (targetInfo) targetInfo.parent[targetInfo.finalKey] = content; else console.error("Path error saving ed history");
           }
       }
       else if (id === 'health-info') { // Complex: needs parsing or structured object save
            if (typeof content === 'object' && content !== null) { // Assume content is { medicalHistory: '...', visionHearing: '...' }
                targetInfo = ensurePathAndGetParent(updatedReport, ['background', 'healthReport']);
                 if (targetInfo?.parent && targetInfo.finalKey) {
                     targetInfo.parent[targetInfo.finalKey] = { ...targetInfo.parent[targetInfo.finalKey], ...content };
                 } else console.error("Path error saving health info object");
            } else if (typeof content === 'string') { /* Requires parsing */ }
       }
        else if (id === 'family-info') { // Complex: needs parsing or structured object save
             if (typeof content === 'object' && content !== null) { // Assume content is { structure: '...', language: '...' }
                 targetInfo = ensurePathAndGetParent(updatedReport, ['background', 'familyHistory']);
                  if (targetInfo?.parent && targetInfo.finalKey) {
                      targetInfo.parent[targetInfo.finalKey] = { ...targetInfo.parent[targetInfo.finalKey], ...content };
                  } else console.error("Path error saving family info object");
             } else if (typeof content === 'string') { /* Requires parsing */ }
        }
       else if (id === 'parent-concerns') { // Maps to background.parentGuardianConcerns
           if (typeof content === 'string') {
              targetInfo = ensurePathAndGetParent(updatedReport, ['background', 'parentGuardianConcerns']);
              if (targetInfo) targetInfo.parent[targetInfo.finalKey] = content; else console.error("Path error saving parent concerns");
           }
       }
       else if (id === 'conclusion-summary') { // Maps to conclusion.conclusion.summary
           if (typeof content === 'string') {
               targetInfo = ensurePathAndGetParent(updatedReport, ['conclusion', 'conclusion', 'summary']);
               if (targetInfo) targetInfo.parent[targetInfo.finalKey] = content; else console.error("Path error saving summary");
           }
       }
       else if (id === 'eligibility' || id === 'eligibility-determination') { // Maps to conclusion.eligibility.californiaEdCode
            if (typeof content === 'string') {
                targetInfo = ensurePathAndGetParent(updatedReport, ['conclusion', 'eligibility', 'californiaEdCode']);
                if (targetInfo) targetInfo.parent[targetInfo.finalKey] = content; else console.error("Path error saving ed code");
            }
        }
        else if (id === 'services-recommendations') { // Complex: needs parsing or structured object save
            if (typeof content === 'object' && content !== null) { // Assume { typeOfService: '', frequency: '', setting: '' }
                 targetInfo = ensurePathAndGetParent(updatedReport, ['conclusion', 'recommendations', 'services']);
                  if (targetInfo?.parent && targetInfo.finalKey) {
                      targetInfo.parent[targetInfo.finalKey] = { ...targetInfo.parent[targetInfo.finalKey], ...content };
                  } else console.error("Path error saving services object");
            } else if (typeof content === 'string') { /* Requires parsing */ }
        }
        else if (id === 'accommodations-strategies') { // Complex: needs parsing or structured object save
            if (typeof content === 'object' && content !== null && Array.isArray((content as any).accommodations) && Array.isArray((content as any).facilitationStrategies)) { // Assume { accommodations: [], facilitationStrategies: [] }
                targetInfo = ensurePathAndGetParent(updatedReport, ['conclusion', 'recommendations']);
                if (targetInfo?.parent && targetInfo.finalKey) {
                    targetInfo.parent[targetInfo.finalKey].accommodations = (content as any).accommodations;
                    targetInfo.parent[targetInfo.finalKey].facilitationStrategies = (content as any).facilitationStrategies;
                } else console.error("Path error saving accomms/strats object");
            } else if (typeof content === 'string') { /* Requires parsing */ }
        }
        else if (id === 'parent-glossary' || id === 'glossary') { // Maps to conclusion.parentFriendlyGlossary.terms
            if (typeof content === 'object' && content !== null) { // Assume content is the terms object
                targetInfo = ensurePathAndGetParent(updatedReport, ['conclusion', 'parentFriendlyGlossary', 'terms']);
                if (targetInfo) targetInfo.parent[targetInfo.finalKey] = content; else console.error("Path error saving glossary terms");
            } else if (typeof content === 'string') { /* Requires parsing: "Term: Def\nTerm: Def" */ }
        }
      else { console.warn(`Unhandled save content ID: ${id}`); }

      // Update timestamp
      const metaTarget = ensurePathAndGetParent(updatedReport, ['metadata', 'lastUpdated']);
      if (metaTarget) metaTarget.parent[metaTarget.finalKey] = new Date().toISOString();

      return updatedReport;
    });
  }, []);

  const handleToggleMarkedDone = useCallback((id: string, isDone: boolean) => { /* ... (unchanged placeholder logic targeting metadata.cardStatus) ... */ }, []);
  const handleExportHtml = () => { /* ... unchanged placeholder ... */ };
  const handleClearReport = () => { /* ... unchanged placeholder ... */ };
  // handlePdfUpload was in original but seems unused/unimplemented - keep if needed
  const handlePdfUpload = async (pdfData: string) => { console.log("PDF Upload handler called - Needs Implementation"); };


  // --- Render Logic ---
  return (
    <div className="w-full">
      <Card className="relative border-0 overflow-auto" style={{ height: 'calc(100vh - 0px)' }}>
        {/* Save Button */}
        <div className="absolute top-4 right-4 z-20">
          <Button onClick={handleSaveReport} disabled={savingReport} variant="default" size="sm">
            {savingReport ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save Report
          </Button>
        </div>

        {/* Editor Panel - Pass necessary props */}
        <EditorPanel
             {...{ inputText, setInputText, selectedSection, setSelectedSection, isUpdating, error, success, handleSubmit, handleExportHtml, handleClearReport, report, handlePdfUpload }}
             onViewJson={() => setShowJsonPreview(true)}
             onBatchComplete={(updatedReport, commands, affectedDomains) => { setReport(updatedReport); setSuccess(`Batch update completed.`); setCommandDetails({ command: 'batch_update', updates: commands?.length || 0 }); }}
             onBatchError={(errorMessage) => { setError(errorMessage); }}
        />

        {/* Conditional Rendering: Skeleton or Report Content */}
        {loading ? (
           // Skeleton Layout
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4"> <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" /> <Skeleton className="h-40 w-full bg-gray-200 dark:bg-gray-700" /> <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-700" /> </div>
            <div className="space-y-4"> <Skeleton className="h-40 w-full bg-gray-200 dark:bg-gray-700" /> <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-700" /> <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-700 md:col-span-2" /> </div>
          </div>
        ) : (
          // Actual Report Content Area
          <div className="p-6">
            {/* Empty state check */}
             {!loading && !activeDomains.length && !Object.values(report.assessmentResults?.observations || {}).some(Boolean) && !report.conclusion?.conclusion?.summary && (
               <div className="text-center py-10 col-span-1 md:col-span-2">
                 <p className="text-gray-500 dark:text-gray-400 mb-2">Report is empty.</p>
                 <p className="text-gray-400 dark:text-gray-500 text-sm">Use the editor above to add content.</p>
               </div>
             )}

            {/* --- 2-COLUMN GRID LAYOUT --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Row 1 */}
              <StudentInformationSection
                header={report.header}
                onLockSection={handleLockSection}
                onToggleSynthesis={handleToggleSynthesis}
                onSaveContent={handleSaveContent} // Assumes StudentInfoSection internally maps card IDs correctly
                onToggleMarkedDone={handleToggleMarkedDone}
              />
              <BackgroundSection
                background={report.background} // Pass the whole background slice
                onLockSection={handleLockSection}
                onToggleSynthesis={handleToggleSynthesis}
                onSaveContent={handleSaveContent}
                onToggleMarkedDone={handleToggleMarkedDone}
              />

              {/* Row 2 */}
              <AssessmentToolsSection
                assessmentProcedures={report.assessmentResults?.assessmentProceduresAndTools}
                observations={report.assessmentResults?.observations}
                allTools={assessmentTools}
                assessmentResultsLockStatus={report.assessmentResults?.lockStatus}
                onAddTool={handleAddTool}
                onOpenLibrary={handleOpenLibrary}
                onLockSection={handleLockSection}
                onToggleSynthesis={handleToggleSynthesis}
                onSaveContent={handleSaveContent}
                onToggleMarkedDone={handleToggleMarkedDone}
              />
              <PresentLevelsSection
                  functioning={report.presentLevels?.functioning}
                  presentLevelsLockStatus={report.presentLevels?.lockStatus}
                  onLockSection={handleLockSection}
                  onToggleSynthesis={handleToggleSynthesis}
                  onSaveContent={handleSaveContent}
                  onToggleMarkedDone={handleToggleMarkedDone}
              />
              

              {/* Row 3 (Spanning) */}
              <div className="md:col-span-2">
                   <ConclusionSection
                    conclusion={report.conclusion}
                    onToggleDomainEligibility={handleToggleDomainEligibility}
                    onLockSection={handleLockSection}
                    onToggleSynthesis={handleToggleSynthesis}
                    onSaveContent={handleSaveContent}
                    onToggleMarkedDone={handleToggleMarkedDone}
                   />
               </div>

              {/* Row 4 (Spanning) */}
              <div id="glossary" className="md:col-span-2">
                <GlossarySection
                  glossary={report.conclusion?.parentFriendlyGlossary}
                  conclusion={report.conclusion}
                  onLockSection={handleLockSection}
                  onToggleSynthesis={handleToggleSynthesis}
                  onSaveContent={handleSaveContent}
                  onToggleMarkedDone={handleToggleMarkedDone}
                />
              </div>

            </div> {/* --- END OF GRID --- */}
          </div>
        )}
      </Card>

      {/* Dialogs and Overlays */}
      <JsonViewerDialog data={report} isOpen={showJsonPreview} onClose={() => setShowJsonPreview(false)} />
      {commandDetails && <CommandDetailsCard commandDetails={commandDetails} truncateText={truncateText} />}
      {/* AssessmentLibraryPanel logic assumed to be within AssessmentToolsSection or triggered via state */}
    </div>
  );
}