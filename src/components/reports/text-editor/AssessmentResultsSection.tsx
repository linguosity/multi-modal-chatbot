import React from 'react';
import DomainCard from './DomainCard';
import AssessmentToolsSection from './AssessmentToolsSection';
import { ReportAssessmentResults } from '@/types/reportSchemas';
import { AssessmentTool } from '@/lib/assessment-tools';
import { Button } from "@/components/ui/button";
import { Lock, Unlock, BookOpen, Plus } from "lucide-react";

interface AssessmentResultsSectionProps {
  assessmentResults: ReportAssessmentResults;
  allTools: Record<string, AssessmentTool>;
  onAddToolToGlobal: (tool: string) => void;
  onOpenLibrary: () => void;
  onAddTool: (toolId: string) => void;
  onLockSection?: (id: string, locked: boolean) => void;
  onToggleSynthesis?: (id: string) => void;
  onSaveContent?: (id: string, content: string) => void;
}

/**
 * Component for displaying all assessment results, including domains and tools
 */
export const AssessmentResultsSection: React.FC<AssessmentResultsSectionProps> = ({ 
  assessmentResults,
  allTools,
  onAddToolToGlobal,
  onOpenLibrary,
  onAddTool,
  onLockSection,
  onToggleSynthesis,
  onSaveContent
}) => {
  // Get active domains for display
  const activeDomains = Object.keys(assessmentResults.domains || {}).filter(
    domain => assessmentResults.domains[domain] && (
      assessmentResults.domains[domain].topicSentence || 
      (assessmentResults.domains[domain].strengths && assessmentResults.domains[domain].strengths.length > 0) ||
      (assessmentResults.domains[domain].needs && assessmentResults.domains[domain].needs.length > 0)
    )
  );

  // Check if all domains are locked
  const areAllDomainsLocked = () => {
    return Object.keys(assessmentResults.domains || {}).every(domain => 
      assessmentResults.domains[domain].isLocked
    );
  };

  // Check if all tools are locked
  const areAllToolsLocked = () => {
    const toolIds = assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed || [];
    return assessmentResults.lockStatus?.validityStatement && 
           (toolIds.length === 0 || toolIds.every(toolId => assessmentResults.lockStatus?.tools?.[toolId]));
  };

  // Check if all observations are locked
  const areAllObservationsLocked = () => {
    const obsKeys = Object.keys(assessmentResults.observations || {}).filter(key => 
      key !== 'synthesis' && key !== 'isLocked'
    );
    return obsKeys.length === 0 || obsKeys.every(key => assessmentResults.lockStatus?.observations?.[key]);
  };

  const areAllCardsLocked = () => {
    return areAllDomainsLocked() && areAllToolsLocked() && areAllObservationsLocked();
  };

  const isAnySectionLocked = () => {
    return (Object.keys(assessmentResults.domains || {}).some(domain => 
      assessmentResults.domains[domain].isLocked
    )) || 
    assessmentResults.lockStatus?.validityStatement || 
    (Object.keys(assessmentResults.lockStatus?.tools || {}).some(tool => 
      assessmentResults.lockStatus?.tools?.[tool]
    )) ||
    (Object.keys(assessmentResults.lockStatus?.observations || {}).some(obs => 
      assessmentResults.lockStatus?.observations?.[obs]
    ));
  };

  const handleSectionLock = () => {
    // If any card is unlocked, lock all of them. Otherwise, unlock all
    const shouldLock = !areAllCardsLocked();
    if (onLockSection) {
      onLockSection('section-assessment', shouldLock);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-1">
      <h3 className="text-md font-semibold uppercase tracking-wide">Assessment Results</h3>
  <div className="flex gap-2 items-center">
    <Button
      size="sm"
      variant={areAllCardsLocked() ? "secondary" : "ghost"}
      onClick={handleSectionLock}
      className={`transition-all hover:scale-110 ${
        areAllCardsLocked() ? "text-gray-600 bg-gray-200 border-gray-300" : 
        isAnySectionLocked() ? "text-amber-600" : "text-gray-500 hover:text-gray-700"
      }`}
      title={areAllCardsLocked() ? "Unlock all cards in this section" : "Lock all cards in this section"}
    >
      {areAllCardsLocked() ? (
        <Lock className="h-4 w-4 mr-1" />
      ) : (
        <Unlock className="h-4 w-4 mr-1" />
      )}
      {areAllCardsLocked() ? "Unlock Section" : "Lock Section"}
    </Button>
  </div>
</div>
<hr className="mb-3 border-green-200" />
      
      {/* Assessment Tools and Observations */}
      <AssessmentToolsSection 
        assessmentProcedures={assessmentResults.assessmentProceduresAndTools}
        observations={assessmentResults.observations}
        onAddTool={onAddTool}
        onOpenLibrary={onOpenLibrary}
        allTools={allTools}
        onLockSection={onLockSection}
        onToggleSynthesis={onToggleSynthesis}
        onSaveContent={onSaveContent}
        assessmentResults={assessmentResults}
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
                onLockSection={onLockSection}
                onToggleSynthesis={onToggleSynthesis}
                onSaveContent={onSaveContent}
              />
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AssessmentResultsSection;