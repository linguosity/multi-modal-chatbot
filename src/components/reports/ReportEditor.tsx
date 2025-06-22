'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";

// Custom hooks
import { useReportEditorState } from '@/hooks/useReportEditorState';
import { useReportEditorEffects } from '@/hooks/useReportEditorEffects';
import { useBatchReportUpdater } from '@/hooks/useBatchReportUpdater';

// Components
import { ReportSections } from './ReportSections';
import JsonViewerDialog from "@/components/reports/text-editor/JsonViewerDialog";
import CommandDetailsCard from "@/components/reports/text-editor/CommandDetailsCard";
import BatchJobStatus from "@/components/reports/BatchJobStatus";
import { GlobalEditModeToggle } from './GlobalEditModeToggle';

// Utilities
import { createReportSkeleton } from '@/lib/report-utilities';
import { EMPTY_REPORT } from '@/types/sampleReportData';

// Helper Functions
function createReportSkeletonHelper() {
  try {
    const skeleton = JSON.parse(JSON.stringify(EMPTY_REPORT));
    if (!skeleton.header) skeleton.header = { studentInformation: { firstName: '', lastName: '' } };
    if (!skeleton.header.studentInformation) skeleton.header.studentInformation = { firstName: '', lastName: '' };
    if (!skeleton.background) skeleton.background = {};
    if (!skeleton.presentLevels) skeleton.presentLevels = { functioning: {} };
    if (!skeleton.assessmentResults) skeleton.assessmentResults = { assessmentProceduresAndTools: { assessmentToolsUsed: [] }, observations: {} };
    if (!skeleton.conclusion) skeleton.conclusion = { eligibility: { domains: {}, eligibilityStatus: {} }, conclusion: {}, recommendations: { services: {}, accommodations: [], facilitationStrategies: [] }, parentFriendlyGlossary: { terms: {} } };
    if (!skeleton.conclusion.eligibility) skeleton.conclusion.eligibility = { domains: {}, eligibilityStatus: {} };
    if (!skeleton.conclusion.eligibility.domains) skeleton.conclusion.eligibility.domains = {};
    if (!skeleton.conclusion.eligibility.eligibilityStatus) skeleton.conclusion.eligibility.eligibilityStatus = {};
    if (!skeleton.conclusion.conclusion) skeleton.conclusion.conclusion = {};
    if (!skeleton.conclusion.recommendations) skeleton.conclusion.recommendations = { services: {}, accommodations: [], facilitationStrategies: [] };
    if (!skeleton.conclusion.parentFriendlyGlossary) skeleton.conclusion.parentFriendlyGlossary = { terms: {} };
    if (!skeleton.metadata) skeleton.metadata = { version: 1, lastUpdated: new Date().toISOString() };
    return skeleton;
  } catch (e) {
    console.error("Error creating report skeleton:", e);
    return createReportSkeleton();
  }
}

function truncateText(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength - 3) + '...';
}

interface ReportEditorProps {
  reportId: string;
}

export default function ReportEditor({ reportId }: ReportEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Use our new state management hooks
  const { state, actions } = useReportEditorState();
  
  // View mode state (swipe vs grid) - default to grid
  const [viewMode, setViewMode] = React.useState<'swipe' | 'grid'>('grid');
  
  // Create empty report skeleton for hook initialization
  const emptyReportSkeleton = useMemo(() => createReportSkeletonHelper(), []);
  
  // Use the batch report updater hook
  const batchUpdaterHook = useBatchReportUpdater(
    state.initialReport 
      ? (state.initialReport.report || state.initialReport) 
      : emptyReportSkeleton
  );
      
  // Destructure the batch hook result  
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
    updateSection,
    // Add other destructured properties if they are also needed directly in ReportEditor
  } = batchUpdaterHook;

  // Handle save all changes for global edit mode
  const handleSaveAllChanges = async () => {
    try {
      // Save the current report state
      console.log('Saving all changes...', report);
      
      // If you have an API endpoint to save the report:
      // await saveReport(report);
      
      // Return success
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving all changes:', error);
      throw error;
    }
  };

  // Wrapper function for updateSection
  const handleUpdateSection = (id: string, content: any) => {
    let path: string[];
    // Example: "domain-receptive-topicSentence"
    if (id.startsWith('domain-')) {
      const parts = id.split('-');
      // parts[0] is "domain"
      // parts[1] is domainName e.g. "receptive"
      // parts[2] is fieldName e.g. "topicSentence"
      if (parts.length === 3) {
        path = ['presentLevels', 'functioning', parts[1], parts[2]];
      } else {
        console.error(`Invalid domain ID format: ${id}`);
        return;
      }
    } else {
      switch (id) {
        case 'educational-history':
          path = ['background', 'studentDemographicsAndBackground', 'educationalHistory'];
          break;
        case 'health-info':
          // Assuming health-info from BackgroundSection is a combined string for medicalHistory
          // This might need adjustment based on actual schema and BackgroundSection's saving behavior.
          path = ['background', 'healthReport', 'medicalHistory'];
          break;
        case 'student-info':
          path = ['header', 'studentInformation'];
          break;
        // Add other cases for different sections as needed
        default:
          console.error(`Unknown section ID: ${id}`);
          return;
      }
    }
    console.log(`Updating section with ID: ${id}, path: ${JSON.stringify(path)}, content:`, content);
    updateSection(path, content);
  };
  
  // Update batch hook when initial report changes (only on first load)
  useEffect(() => {
    if (state.initialReport && !report.id) {
      const reportForHook = (state.initialReport && state.initialReport.report) 
        ? state.initialReport.report 
        : state.initialReport;
        
      setReport(reportForHook);
    }
  }, [state.initialReport, report.id, setReport]);
  
  // Use our effects hook for complex side effects
  const { activeDomains } = useReportEditorEffects({
    reportId,
    state,
    actions,
    report
  });

  // Scroll Animation Setup
  const { scrollYProgress } = useScroll({
    target: editorRef,
    offset: ["start start", "end end"]
  });
  
  const smoothScrollProgress = useSpring(scrollYProgress, { 
    stiffness: 100, 
    damping: 30, 
    restDelta: 0.001 
  });

  // Loading state
  if (state.loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading report: {error}</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main render
  return (
    <div 
      ref={editorRef}
      className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50"
    >
      {/* Progress indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-500 z-50 origin-left"
        style={{ scaleX: smoothScrollProgress }}
      />

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Report Editor
              </h1>
              <p className="text-gray-600">
                {report?.header?.studentInformation?.firstName && report?.header?.studentInformation?.lastName
                  ? `${report.header.studentInformation.firstName} ${report.header.studentInformation.lastName}`
                  : 'Speech-Language Evaluation Report'
                }
              </p>
              {activeDomains && activeDomains.length > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  Active domains: {activeDomains.join(', ')}
                </p>
              )}
            </div>
            <GlobalEditModeToggle onSaveAll={handleSaveAllChanges} />
          </div>
        </div>

        {/* Report Sections */}
        {report && (
          <ReportSections
            report={report}
            setReport={setReport}
            assessmentTools={state.assessmentTools}
            batchStatus={batchStatus}
            isUpdating={isUpdating}
            updateSection={handleUpdateSection}
            processText={processText}
            processPdf={processPdf}
            viewMode={viewMode}
          />
        )}

        {/* Batch Status */}
        {batchId && (
          <div className="mt-8">
            <BatchJobStatus
              batchId={batchId}
              onComplete={handleBatchComplete}
              onError={handleBatchError}
              report={report}
            />
          </div>
        )}

        {/* Command Details */}
        {state.commandDetails && (
          <div className="mt-8">
            <CommandDetailsCard 
              details={state.commandDetails}
              onClose={() => actions.setCommandDetails(null)}
            />
          </div>
        )}

        {/* Success Message */}
        {state.success && (
          <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
            <div className="flex items-center">
              <span>{state.success}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.setSuccess(null)}
                className="ml-2 h-auto p-1"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* JSON Preview Dialog */}
        <JsonViewerDialog
          isOpen={state.showJsonPreview}
          onClose={() => actions.setShowJsonPreview(false)}
          jsonData={report}
        />
      </div>
    </div>
  );
}