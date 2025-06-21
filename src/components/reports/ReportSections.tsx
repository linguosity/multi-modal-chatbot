import React, { useRef } from 'react';
import { motion, useInView } from "framer-motion";
import { SpeechLanguageReport, AssessmentTool } from '@/types/reportSchemas';
import { EditableCard } from './EditableCard';

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
  viewMode?: 'swipe' | 'grid';
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

// Function to extract all report sections as individual cards
const getAllReportCards = (report: SpeechLanguageReport, updateSection: any) => {
  const cards: Array<{id: string, title: string, content: any, path: string[]}> = [];
  
  // Student Information
  if (report.header?.studentInformation) {
    cards.push({
      id: 'student-info',
      title: 'Student Information',
      content: report.header.studentInformation,
      path: ['header', 'studentInformation']
    });
  }
  
  // Background - Educational History
  if (report.background?.studentDemographicsAndBackground?.educationalHistory) {
    cards.push({
      id: 'educational-history',
      title: 'Educational History',
      content: report.background.studentDemographicsAndBackground.educationalHistory,
      path: ['background', 'studentDemographicsAndBackground', 'educationalHistory']
    });
  }
  
  // Background - Health Info
  if (report.background?.healthReport?.medicalHistory) {
    cards.push({
      id: 'health-info',
      title: 'Health Information',
      content: report.background.healthReport.medicalHistory,
      path: ['background', 'healthReport', 'medicalHistory']
    });
  }
  
  // Present Levels - Functioning domains
  if (report.presentLevels?.functioning) {
    Object.entries(report.presentLevels.functioning).forEach(([domain, data]: [string, any]) => {
      if (data?.topicSentence) {
        cards.push({
          id: `domain-${domain}-topicSentence`,
          title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Topic`,
          content: data.topicSentence,
          path: ['presentLevels', 'functioning', domain, 'topicSentence']
        });
      }
      if (data?.currentPerformance) {
        cards.push({
          id: `domain-${domain}-currentPerformance`,
          title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Performance`,
          content: data.currentPerformance,
          path: ['presentLevels', 'functioning', domain, 'currentPerformance']
        });
      }
      if (data?.strengths) {
        cards.push({
          id: `domain-${domain}-strengths`,
          title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Strengths`,
          content: data.strengths,
          path: ['presentLevels', 'functioning', domain, 'strengths']
        });
      }
      if (data?.needs) {
        cards.push({
          id: `domain-${domain}-needs`,
          title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Needs`,
          content: data.needs,
          path: ['presentLevels', 'functioning', domain, 'needs']
        });
      }
    });
  }
  
  // Assessment Results
  if (report.assessmentResults?.observations) {
    Object.entries(report.assessmentResults.observations).forEach(([key, value]: [string, any]) => {
      if (value) {
        cards.push({
          id: `assessment-${key}`,
          title: `Assessment - ${key.charAt(0).toUpperCase() + key.slice(1)}`,
          content: value,
          path: ['assessmentResults', 'observations', key]
        });
      }
    });
  }
  
  // Conclusion sections
  if (report.conclusion?.conclusion?.summary) {
    cards.push({
      id: 'conclusion-summary',
      title: 'Conclusion Summary',
      content: report.conclusion.conclusion.summary,
      path: ['conclusion', 'conclusion', 'summary']
    });
  }
  
  // Add more sections as needed...
  
  return cards;
};

export function ReportSections({
  report,
  setReport,
  assessmentTools,
  batchStatus,
  isUpdating,
  updateSection,
  processText,
  processPdf,
  viewMode = 'swipe'
}: ReportSectionsProps) {
  
  // Grid view implementation
  if (viewMode === 'grid') {
    const allCards = getAllReportCards(report, updateSection);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <EditableCard
              id={card.id}
              title={card.title}
              initialContent={typeof card.content === 'string' ? card.content : JSON.stringify(card.content, null, 2)}
              onSave={(content) => {
                // Convert path array to dot notation for updateSection
                const pathStr = card.path.join('.');
                updateSection(pathStr, content);
              }}
              className="h-[300px]"
              contentClassName="max-h-[200px]"
            />
          </motion.div>
        ))}
      </div>
    );
  }
  
  // Default swipe view
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