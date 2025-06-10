import React, { useRef } from 'react';
import { motion, useInView } from "framer-motion";
import { SpeechLanguageReport, AssessmentTool } from '@/types/reportSchemas';

// Section component imports
import EditorPanel from "@/components/reports/text-editor/EditorPanel";
import BackgroundSection from "@/components/reports/text-editor/BackgroundSection";
import PresentLevelsSection from "@/components/reports/text-editor/PresentLevelsSection";
import AssessmentToolsSection from "@/components/reports/text-editor/AssessmentToolsSection";
import EligibilitySection from "@/components/reports/text-editor/EligibilitySection";
import ConclusionRecsSection from "@/components/reports/text-editor/ConclusionSection";
import GlossarySection from "@/components/reports/text-editor/GlossarySection";

interface ReportSectionsProps {
  report: SpeechLanguageReport;
  setReport: (report: SpeechLanguageReport) => void;
  assessmentTools: Record<string, AssessmentTool>;
  batchStatus: any;
  isUpdating: boolean;
  updateSection: (section: string, updates: any) => void;
  processText?: (text: string, section: string) => Promise<void>;
  processPdf?: (pdfData: string) => Promise<void>;
}

// Animation component for row transitions
const AnimatedSectionRow = ({ 
  children, 
  index, 
  id 
}: { 
  children: React.ReactNode;
  index: number;
  id: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.4 });
  
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
  
  const animatedChildren = React.Children.map(children, (child, childIndex) => (
    <motion.div
      key={`${id}-child-${childIndex}`}
      variants={childVariants}
      className="h-full"
    >
      {child}
    </motion.div>
  ));
  
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

export function ReportSections({
  report,
  setReport,
  assessmentTools,
  batchStatus,
  isUpdating,
  updateSection,
  processText,
  processPdf
}: ReportSectionsProps) {
  return (
    <div className="space-y-8">
      {/* Row 1: Editor Panel + Background */}
      <AnimatedSectionRow index={0} id="row-1">
        <EditorPanel
          report={report}
          onReportUpdate={setReport}
          batchStatus={batchStatus}
          isUpdating={isUpdating}
          processText={processText}
          processPdf={processPdf}
        />
        <BackgroundSection
          background={report?.background}
          studentInformation={report?.header?.studentInformation}
          onUpdateReport={setReport}
          report={report}
        />
      </AnimatedSectionRow>

      {/* Row 2: Present Levels */}
      <AnimatedSectionRow index={1} id="row-2">
        <div className="md:col-span-2">
          <PresentLevelsSection
            presentLevels={report?.presentLevels}
            onUpdateReport={setReport}
            report={report}
          />
        </div>
      </AnimatedSectionRow>

      {/* Row 3: Assessment Tools */}
      <AnimatedSectionRow index={2} id="row-3">
        <div className="md:col-span-2">
          <AssessmentToolsSection
            assessmentProcedures={report?.assessmentResults?.assessmentProceduresAndTools}
            observations={report?.assessmentResults?.observations}
            onAddTool={(toolId: string) => {
              const tool = assessmentTools[toolId];
              if (tool && report?.assessmentResults?.assessmentProceduresAndTools) {
                const updatedReport = { ...report };
                const currentTools = updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed || [];
                if (!currentTools.includes(toolId)) {
                  updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed = [...currentTools, toolId];
                  setReport(updatedReport);
                }
              }
            }}
            onOpenLibrary={() => {}}
            allTools={assessmentTools}
            assessmentResultsLockStatus={report?.assessmentResults?.lockStatus}
            assessmentMarkedDoneStatus={report?.assessmentResults?.markedDoneStatus}
          />
        </div>
      </AnimatedSectionRow>

      {/* Row 4: Eligibility + Conclusion */}
      <AnimatedSectionRow index={3} id="row-4">
        <EligibilitySection
          eligibility={report?.conclusion?.eligibility}
          onUpdateReport={setReport}
          report={report}
        />
        <ConclusionRecsSection
          conclusion={report?.conclusion}
          onUpdateReport={setReport}
          report={report}
        />
      </AnimatedSectionRow>

      {/* Row 5: Glossary */}
      <AnimatedSectionRow index={4} id="row-5">
        <div className="md:col-span-2">
          <GlossarySection
            glossary={report?.conclusion?.parentFriendlyGlossary}
            onUpdateReport={setReport}
            report={report}
          />
        </div>
      </AnimatedSectionRow>
    </div>
  );
}