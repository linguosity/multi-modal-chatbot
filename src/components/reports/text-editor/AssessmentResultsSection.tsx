import React from 'react';
import DomainCard from './DomainCard';
import AssessmentToolsSection from './AssessmentToolsSection';
import { ReportAssessmentResults } from '@/types/reportTypes';
import { AssessmentTool } from '@/lib/assessment-tools';

interface AssessmentResultsSectionProps {
  assessmentResults: ReportAssessmentResults;
  allTools: Record<string, AssessmentTool>;
  onAddToolToGlobal: (tool: string) => void;
  onOpenLibrary: () => void;
  onAddTool: (toolId: string) => void;
}

/**
 * Component for displaying all assessment results, including domains and tools
 */
export const AssessmentResultsSection: React.FC<AssessmentResultsSectionProps> = ({ 
  assessmentResults,
  allTools,
  onAddToolToGlobal,
  onOpenLibrary,
  onAddTool
}) => {
  // Get active domains for display
  const activeDomains = Object.keys(assessmentResults.domains || {}).filter(
    domain => assessmentResults.domains[domain] && (
      assessmentResults.domains[domain].topicSentence || 
      (assessmentResults.domains[domain].strengths && assessmentResults.domains[domain].strengths.length > 0) ||
      (assessmentResults.domains[domain].needs && assessmentResults.domains[domain].needs.length > 0)
    )
  );

  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-green-700 mb-3 pb-1 border-b border-green-200">Assessment Results</h3>
      
      {/* Assessment Tools and Observations */}
      <AssessmentToolsSection 
        assessmentProcedures={assessmentResults.assessmentProceduresAndTools}
        observations={assessmentResults.observations}
        onAddTool={onAddTool}
        onOpenLibrary={onOpenLibrary}
        allTools={allTools}
      />
      
      {/* Domain subsection */}
      {activeDomains.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">Language Domains</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeDomains.map(domain => (
              <DomainCard 
                key={domain}
                domain={domain} 
                domainData={assessmentResults.domains[domain]}
                onAddToolToGlobal={(tool) => {
                  // Check if already in global list
                  if (!assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.includes(tool)) {
                    onAddToolToGlobal(tool);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AssessmentResultsSection;