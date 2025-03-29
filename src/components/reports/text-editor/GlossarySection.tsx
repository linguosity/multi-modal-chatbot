import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface GlossarySectionProps {
  glossary?: {
    terms: {
      [key: string]: string;
    };
  };
}

/**
 * Component for displaying parent-friendly glossary terms
 */
export const GlossarySection: React.FC<GlossarySectionProps> = ({ glossary }) => {
  if (!glossary || !glossary.terms || Object.keys(glossary.terms).length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-200">Parent-Friendly Glossary</h3>
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="py-2 px-3 bg-gray-50">
          <CardTitle className="text-sm font-medium text-gray-800">Technical Terms Explained</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(glossary.terms).map(([term, definition]) => (
              <div key={term} className="bg-gray-50 p-3 rounded-md">
                <dt className="font-semibold text-sm mb-1 text-gray-800">{term}</dt>
                <dd className="text-xs text-gray-700">{definition}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlossarySection;