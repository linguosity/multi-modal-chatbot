import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlossaryDrawer } from '@/components/ui/glossary-drawer';

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
}

/**
 * Component for displaying parent-friendly glossary terms
 */
export const GlossarySection: React.FC<GlossarySectionProps> = ({ 
  glossary, 
  terms = [],
  onSaveTerms 
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

  return (
    <Card className="bg-[#F8F7F4] border border-[#E6E0D6] rounded-lg shadow-sm mb-8">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-display font-medium text-foreground">
          Parent-Friendly Glossary
        </CardTitle>
        {onSaveTerms && (
          <GlossaryDrawer 
            initialTerms={displayTerms}
            onSave={onSaveTerms}
            className="h-8"
          />
        )}
      </CardHeader>
      
      <Separator className="mb-4 bg-[#E6E0D6]" />
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-6">
          This glossary provides simple explanations of technical terms used in this report to help parents and guardians understand the assessment results.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {displayTerms.map((item) => (
            <div key={item.id} className="pb-3 border-b border-[#E6E0D6]">
              <p className="font-medium text-[#5A7164] font-display mb-1">{item.term}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.definition}</p>
            </div>
          ))}
          
          {displayTerms.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              No glossary terms available. Click "Edit" to add terms.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GlossarySection;