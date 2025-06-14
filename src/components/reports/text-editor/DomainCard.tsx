// FILE: src/components/reports/text-editor/DomainCard.tsx
// (Added onMarkFinished prop and passed it down)

import React from 'react';
import { EditableCard } from '@/components/reports/EditableCard';
import { FunctioningSchema, FunctioningSection } from '@/types/reportSchemas';

// --- Interface Updated ---
interface DomainCardProps {
  domain: string;
  domainData: FunctioningSection;
  onLockSection?: (id: string, locked: boolean) => void;
  onToggleSynthesis?: (id: string) => void;
  onSaveContent?: (id: string, content: string) => void;
  onMarkFinished?: () => void; // <<< ADD THIS PROP
  isMarkedDone?: boolean; // <<< ADD THIS PROP to receive status
}

/**
 * Component for displaying a language domain card with its strengths, needs, and impact.
 * Uses neutral styling consistent with other sections.
 */
export const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  domainData,
  onLockSection,
  onToggleSynthesis,
  onSaveContent,
  onMarkFinished // <<< Destructure the new prop
}) => {

  // Helper function to format content for editing (remains same)
  const formatContentForEdit = (): string => {
     // ... same function ...
     let content = `Topic: ${domainData.topicSentence || ''}\n\n`;
     if (domainData.strengths && domainData.strengths.length > 0) { content += `Strengths:\n${domainData.strengths.map(s => `- ${s}`).join('\n')}\n\n`; }
     if (domainData.needs && domainData.needs.length > 0) { content += `Needs:\n${domainData.needs.map(n => `- ${n}`).join('\n')}\n\n`; }
     if (domainData.impactStatement) { content += `Impact: ${domainData.impactStatement}`; }
     return content.trim();
  };

  // Helper function to parse saved content (remains same)
  const parseSavedContent = (content: string): Partial<FunctioningSection> => {
    // ... same function ...
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    const updatedData: Partial<FunctioningSection> = { strengths: [], needs: [] };
    let currentSection: 'topic' | 'strengths' | 'needs' | 'impact' | null = 'topic';
    lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('topic:')) { updatedData.topicSentence = line.substring(6).trim(); currentSection = null; }
        else if (lowerLine === 'strengths:') { currentSection = 'strengths'; }
        else if (lowerLine === 'needs:') { currentSection = 'needs'; }
        else if (lowerLine.startsWith('impact:')) { updatedData.impactStatement = line.substring(7).trim(); currentSection = null; }
        else if (line.startsWith('-') && currentSection) { const item = line.substring(1).trim(); if (currentSection === 'strengths') updatedData.strengths?.push(item); if (currentSection === 'needs') updatedData.needs?.push(item); }
        else if (currentSection === 'topic' && !updatedData.topicSentence) { updatedData.topicSentence = line; currentSection = null; }
        else if (currentSection === null && !lowerLine.endsWith(':')) { if (updatedData.impactStatement) updatedData.impactStatement += ` ${line}`; } });
    updatedData.isConcern = (updatedData.needs?.length ?? 0) > 0; return updatedData;
  };


  return (
    <EditableCard
      id={`domain-${domain}`}
      title={`${domain.charAt(0).toUpperCase() + domain.slice(1)} Language`}
      className="border border-neutral-200 bg-white shadow-sm h-full flex flex-col"
      headerClassName="py-2 px-3 bg-neutral-100"
      contentClassName="p-3 text-xs"
      color="neutral"
      isLocked={domainData.isLocked}
      onLock={onLockSection}
      onToggleSynthesis={onToggleSynthesis}
      hasSynthesis={!!domainData.synthesis}
      synthesisContent={domainData.synthesis || ""}
      initialContent={formatContentForEdit()}
      onSave={(content) => {
          // content is now HTML from TipTapEditor
          if (onSaveContent) {
              console.warn(`DomainCard (${domain}): Saving HTML content directly. The parent component (ReportEditor or equivalent) is responsible for storing this HTML appropriately (e.g., in topicSentence and clearing other fields, or a new dedicated HTML field) and ensuring 'parseSavedContent' is no longer used for this domain's content if it was previously.`);
              onSaveContent(`domain-${domain}`, content);
          }
      }}
      // --- Pass the callback down to EditableCard ---
      onToggleMarkedDone={onMarkFinished} // <<< ADD THIS LINE
      // --- ---
      viewComponent={
        <>
          {/* Concern Status Badge - Style updated for 'No Concern' */}
          {domainData.isConcern !== undefined && (
            <div className="absolute top-2 right-12">
              <div className={`px-1.5 py-0.5 rounded-full text-xxs font-medium ${
                domainData.isConcern
                  ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                  : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
              }`}>
                {domainData.isConcern ? 'Concern' : 'No Concern'}
              </div>
            </div>
          )}

          {/* Topic Sentence */}
          {domainData.topicSentence && (
            <p className="font-medium mb-2">{domainData.topicSentence}</p>
          )}

           {/* Strengths */}
           {domainData.strengths && domainData.strengths.length > 0 && (
             <div className="mb-1.5">
               <h5 className="text-xxs font-semibold mb-0.5 text-gray-600 uppercase tracking-wider">Strengths</h5>
               <ul className="list-disc list-outside pl-4 space-y-0.5 marker:text-gray-400">
                 {domainData.strengths.map((item, index) => ( <li key={`strength-${index}`} className="text-gray-800">{item}</li> ))}
               </ul>
             </div>
           )}

           {/* Needs */}
           {domainData.needs && domainData.needs.length > 0 && (
             <div className="mb-1.5">
               <h5 className="text-xxs font-semibold mb-0.5 text-gray-600 uppercase tracking-wider">Needs</h5>
               <ul className="list-disc list-outside pl-4 space-y-0.5 marker:text-gray-400">
                 {domainData.needs.map((item, index) => ( <li key={`need-${index}`} className="text-gray-800">{item}</li> ))}
               </ul>
             </div>
           )}

           {/* Impact Statement */}
           {domainData.impactStatement && (
             <div>
               <h5 className="text-xxs font-semibold mb-0.5 text-gray-600 uppercase tracking-wider">Educational Impact</h5>
               <p className="text-gray-800">{domainData.impactStatement}</p>
             </div>
           )}
        </>
      }
    />
  );
};

export default DomainCard;