import React from 'react';

interface AssessmentToolsDisplayProps {
  tools: string[];
}

export function AssessmentToolsDisplay({ tools }: AssessmentToolsDisplayProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-lg font-semibold text-gray-800">Assessment Tools Used</h4>
      {tools.length > 0 ? (
        <ul className="list-disc pl-5 space-y-1">
          {tools.map((tool, index) => (
            <li key={index} className="text-gray-700 text-sm">
              {tool}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No assessment tools listed yet.</p>
      )}
    </div>
  );
}
