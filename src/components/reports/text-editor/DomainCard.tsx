import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DomainSection } from '@/types/reportTypes';

interface DomainCardProps {
  domain: string;
  domainData: DomainSection;
  onAddToolToGlobal?: (tool: string) => void;
}

/**
 * Component for displaying a language domain card with its strengths, needs, and tools
 */
export const DomainCard: React.FC<DomainCardProps> = ({ domain, domainData, onAddToolToGlobal }) => {
  const hasConcern = domainData.isConcern;
  
  return (
    <Card 
      id={`domain-${domain}`}
      className={`border shadow-sm ${hasConcern 
        ? 'border-amber-200 bg-amber-50/30' 
        : 'border-green-100 bg-green-50/30'
      }`}
    >
      <CardHeader className={`py-2 px-3 flex flex-row justify-between items-center ${hasConcern 
          ? 'bg-amber-50' 
          : 'bg-green-50'
        }`}
      >
        <CardTitle className={`text-sm font-medium ${hasConcern 
            ? 'text-amber-800' 
            : 'text-green-800'
          }`}
        >
          {domain.charAt(0).toUpperCase() + domain.slice(1)} Language
        </CardTitle>
        {domainData.isConcern !== undefined && (
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            domainData.isConcern
              ? 'bg-amber-100 text-amber-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {domainData.isConcern ? 'Area of Concern' : 'No Concern'}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {domainData.topicSentence && (
          <div className="mb-2">
            <p className="font-medium">{domainData.topicSentence}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-2">
          {domainData.strengths && domainData.strengths.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold mb-1 text-gray-600">Strengths</h5>
              <ul className="list-disc pl-4 space-y-0.5">
                {domainData.strengths.map((item, index) => (
                  <li key={index} className="text-gray-800">{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {domainData.needs && domainData.needs.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold mb-1 text-gray-600">Needs</h5>
              <ul className="list-disc pl-4 space-y-0.5">
                {domainData.needs.map((item, index) => (
                  <li key={index} className="text-gray-800">{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {domainData.impactStatement && (
            <div>
              <h5 className="text-xs font-semibold mb-1 text-gray-600">Educational Impact</h5>
              <p className="text-gray-800">{domainData.impactStatement}</p>
            </div>
          )}
          
          {/* Domain-specific assessment tools */}
          {domainData.assessmentTools && domainData.assessmentTools.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <h5 className="text-xs font-semibold mb-1 text-gray-600">Assessment Tools</h5>
              <ul className="list-disc pl-4 space-y-2">
                {domainData.assessmentTools.map((tool, index) => {
                  // Extract additional information if available (assuming format like "Tool Name (SST-4)")
                  const nameMatch = tool.match(/(.*?)\s*(?:\(([^)]+)\))?$/);
                  const fullName = nameMatch ? nameMatch[1].trim() : tool;
                  const shortName = nameMatch && nameMatch[2] ? nameMatch[2].trim() : '';
                  
                  // Basic tool info extraction
                  let toolInfo = '';
                  if (tool.toLowerCase().includes('sst-4') || tool.toLowerCase().includes('stuttering severity instrument')) {
                    toolInfo = 'Assesses stuttering severity on a standardized scale. Appropriate for children and adults.';
                  } else if (tool.toLowerCase().includes('celf-5') || tool.toLowerCase().includes('clinical evaluation of language fundamentals')) {
                    toolInfo = 'Assesses language skills across multiple domains. Ages 5-21 years.';
                  } else if (tool.toLowerCase().includes('gfta-3') || tool.toLowerCase().includes('goldman-fristoe')) {
                    toolInfo = 'Measures articulation of consonant sounds. Ages 2-21 years.';
                  }
                  
                  return (
                    <li key={index} className="text-gray-800">
                      <div className="font-medium">{fullName}</div>
                      {shortName && <div className="text-xs text-gray-500 mt-0.5">({shortName})</div>}
                      {toolInfo && <div className="text-xs text-gray-600 mt-1 italic">{toolInfo}</div>}
                      {onAddToolToGlobal && (
                        <button 
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToolToGlobal(tool);
                          }}
                        >
                          {onAddToolToGlobal ? "+ Add to global list" : "✓ In global list"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DomainCard;