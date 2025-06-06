import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlossaryDrawer } from '@/components/ui/glossary-drawer';
import { EditableCard } from "@/components/reports/EditableCard";

// Types for glossary terms
interface GlossaryTerm {
  id: string; 
  term: string;
  definition: string;
}

// Legacy format support
interface LegacyGlossary {
  terms: {
    [key: string]: string;
  };
}

interface GlossarySectionProps {
  // Support both new and legacy formats
  glossary?: LegacyGlossary;
  terms?: GlossaryTerm[];
  onSaveTerms?: (terms: GlossaryTerm[]) => void;
  onLockSection?: (id: string, locked: boolean) => void;
  onToggleSynthesis?: (id: string) => void;
  onSaveContent?: (id: string, content: string) => void;
  conclusion?: {
    lockStatus?: {
      parentGlossary?: boolean;
    };
  };
}

/**
 * Component for displaying parent-friendly glossary terms
 */
export const GlossarySection: React.FC<GlossarySectionProps> = ({ 
  glossary, 
  terms = [],
  onSaveTerms,
  onLockSection,
  onToggleSynthesis,
  onSaveContent,
  conclusion
}) => {
  // Convert legacy format to new format if needed
  const displayTerms: GlossaryTerm[] = terms.length > 0 
    ? terms
    : glossary && glossary.terms 
      ? Object.entries(glossary.terms).map(([term, definition], index) => ({
          id: `legacy_${index}`,
          term,
          definition
        }))
      : [];
  
  // If no terms are available in either format, render minimal UI
  if (displayTerms.length === 0 && !onSaveTerms) return null;

  // Format terms to a string for the editable content
  const formatTermsToString = (terms: GlossaryTerm[]) => {
    return terms.map(term => `${term.term}: ${term.definition}`).join('\n\n');
  };

  return (
    <EditableCard
      id="parent-glossary"
      title="Parent-Friendly Glossary"
      className="border border-amber-100 shadow-sm bg-amber-50/30 mb-8"
      headerClassName="bg-amber-50"
      isLocked={conclusion?.lockStatus?.parentGlossary}
      onLock={onLockSection}
      onToggleSynthesis={onToggleSynthesis}
      hasSynthesis={!!glossary?.synthesis}
      synthesisContent={glossary?.synthesis || ""}
      initialContent={formatTermsToString(displayTerms)}
      onSave={(content) => onSaveContent && onSaveContent('parent-glossary', content)}
      color="amber"
      viewComponent={
        <>
          <p className="text-sm text-muted-foreground mb-6">
            This glossary provides simple explanations of technical terms used in this report to help parents and guardians understand the assessment results.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {displayTerms.map((item) => (
              <div key={item.id} className="pb-3 border-b border-amber-100">
                <p className="font-medium text-amber-800 mb-1">{item.term}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{item.definition}</p>
              </div>
            ))}
            
            {displayTerms.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                No glossary terms available. Click "Edit" to add terms.
              </div>
            )}
          </div>
        </>
      }
    />
  );
};

export default GlossarySection;