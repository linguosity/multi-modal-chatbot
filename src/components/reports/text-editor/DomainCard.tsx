// FILE: src/components/reports/text-editor/DomainCard.tsx
// (Added onMarkFinished prop and passed it down)

import React, { useState, useCallback } from 'react';
import { EditableCard } from '@/components/reports/EditableCard';
import { FunctioningSection } from '@/types/reportSchemas';
import { CardHeader } from '@/components/ui/Card'; // Assuming CardHeader can be used
import { Button } from '@/components/ui/button'; // Assuming a Button component is available
import { Textarea } from '@/components/ui/textarea'; // Assuming a Textarea component is available

interface DomainCardProps {
  domain: string;
  domainData: FunctioningSection;
  onLockSection?: (id: string, locked: boolean) => void;
  onToggleSynthesis?: (id: string) => void;
  onSaveContent?: (id: string, content: string | string[]) => void; // Content can be string or string array
  onMarkFinished?: () -> void;
  isMarkedDone?: boolean;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  domainData,
  onLockSection,
  onToggleSynthesis,
  onSaveContent,
  onMarkFinished,
  isMarkedDone
}) => {
  const cardId = `domain-${domain}`;

  // States for textareas
  const [strengthsText, setStrengthsText] = useState(domainData.strengths?.join('\n') || '');
  const [needsText, setNeedsText] = useState(domainData.needs?.join('\n') || '');

  const handleSaveStrengths = useCallback(() => {
    if (onSaveContent) {
      const strengthsArray = strengthsText.split('\n').map(s => s.trim()).filter(s => s);
      onSaveContent(`${cardId}-strengths`, strengthsArray);
    }
  }, [strengthsText, onSaveContent, cardId]);

  const handleSaveNeeds = useCallback(() => {
    if (onSaveContent) {
      const needsArray = needsText.split('\n').map(n => n.trim()).filter(n => n);
      onSaveContent(`${cardId}-needs`, needsArray);
    }
  }, [needsText, onSaveContent, cardId]);


  // TODO: Implement lock, synthesis, and mark finished controls at the DomainCard level
  // These would typically be in a header section of this composite card.

  return (
    <div className="border border-neutral-200 bg-white shadow-sm h-full flex flex-col">
      {/* Card Header - Title, Lock, Synthesis, Mark Finished */}
      <CardHeader className="py-2 px-3 bg-neutral-100 flex flex-row justify-between items-center">
        <h4 className="font-semibold text-sm">{`${domain.charAt(0).toUpperCase() + domain.slice(1)} Language`}</h4>
        {/* TODO: Add Lock, Synthesis, Mark Finished buttons here, calling respective props */}
        {/* Example: <Button onClick={() => onLockSection?.(cardId, !domainData.isLocked)}>{domainData.isLocked ? 'Unlock' : 'Lock'}</Button> */}
      </CardHeader>

      <div className="p-3 text-xs space-y-4">
        {/* Concern Status Badge */}
        {domainData.isConcern !== undefined && (
          <div className="absolute top-2 right-12"> {/* Adjust positioning as needed */}
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
        <EditableCard
          id={`${cardId}-topicSentence`}
          title="Topic Sentence"
          color="neutral"
          isLocked={domainData.isLocked}
          // onLock and onToggleSynthesis might not be needed if handled at parent DomainCard level
          initialContent={domainData.topicSentence || ''}
          onSave={(content) => onSaveContent?.(`${cardId}-topicSentence`, content)}
          viewComponent={<p className="font-medium">{domainData.topicSentence || <span className="text-gray-400">Enter topic sentence...</span>}</p>}
          // Do not pass onToggleMarkedDone here, it's for the whole DomainCard
        />

        {/* Strengths */}
        <div>
          <label htmlFor={`${cardId}-strengths-area`} className="text-xxs font-semibold mb-0.5 text-gray-600 uppercase tracking-wider block">Strengths</label>
          {domainData.isLocked ? (
            <ul className="list-disc list-outside pl-4 space-y-0.5 marker:text-gray-400">
              {domainData.strengths?.map((item, index) => ( <li key={`strength-${index}`} className="text-gray-800">{item}</li> ))}
            </ul>
          ) : (
            <>
              <Textarea
                id={`${cardId}-strengths-area`}
                value={strengthsText}
                onChange={(e) => setStrengthsText(e.target.value)}
                onBlur={handleSaveStrengths}
                className="w-full text-xs p-1 border border-gray-300 rounded"
                rows={3}
                disabled={domainData.isLocked}
              />
              <Button onClick={handleSaveStrengths} size="xs" variant="outline" className="mt-1">Save Strengths</Button>
            </>
          )}
        </div>

        {/* Needs */}
        <div>
          <label htmlFor={`${cardId}-needs-area`} className="text-xxs font-semibold mb-0.5 text-gray-600 uppercase tracking-wider block">Needs</label>
          {domainData.isLocked ? (
            <ul className="list-disc list-outside pl-4 space-y-0.5 marker:text-gray-400">
              {domainData.needs?.map((item, index) => ( <li key={`need-${index}`} className="text-gray-800">{item}</li> ))}
            </ul>
          ) : (
            <>
              <Textarea
                id={`${cardId}-needs-area`}
                value={needsText}
                onChange={(e) => setNeedsText(e.target.value)}
                onBlur={handleSaveNeeds}
                className="w-full text-xs p-1 border border-gray-300 rounded"
                rows={3}
                disabled={domainData.isLocked}
              />
              <Button onClick={handleSaveNeeds} size="xs" variant="outline" className="mt-1">Save Needs</Button>
            </>
          )}
        </div>

        {/* Impact Statement */}
        <EditableCard
          id={`${cardId}-impactStatement`}
          title="Educational Impact"
          color="neutral"
          isLocked={domainData.isLocked}
          initialContent={domainData.impactStatement || ''}
          onSave={(content) => onSaveContent?.(`${cardId}-impactStatement`, content)}
          viewComponent={<p>{domainData.impactStatement || <span className="text-gray-400">Enter impact statement...</span>}</p>}
        />
      </div>
    </div>
  );
};

export default DomainCard;