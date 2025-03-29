import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface CommandDetailsCardProps {
  commandDetails: any;
  truncateText: (str: string, maxLength: number) => string;
}

/**
 * Component for displaying Claude's command details for debugging and transparency
 */
export const CommandDetailsCard: React.FC<CommandDetailsCardProps> = ({ 
  commandDetails,
  truncateText
}) => {
  if (!commandDetails) return null;

  return (
    <Card className="shadow-sm border-0 mt-6">
      <CardHeader className="bg-white border-b">
        <CardTitle className="text-lg font-medium">Tool Command Details</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
          <dt className="font-semibold">Command:</dt>
          <dd>{commandDetails.command}</dd>
          
          {commandDetails.command === 'update_key' && (
            <>
              <dt className="font-semibold">Path:</dt>
              <dd className="font-mono text-blue-600">{commandDetails.path}</dd>
              
              <dt className="font-semibold">Action:</dt>
              <dd className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                {commandDetails.action}
              </dd>
              
              <dt className="font-semibold">Value:</dt>
              <dd className="bg-gray-100 p-2 rounded text-sm font-mono overflow-auto whitespace-pre-wrap max-h-[200px]">
                {JSON.stringify(commandDetails.value, null, 2)}
              </dd>
            </>
          )}
          
          {commandDetails.command === 'str_replace' && (
            <>
              <dt className="font-semibold">Old JSON:</dt>
              <dd className="bg-gray-100 p-1 rounded text-sm font-mono overflow-auto whitespace-pre-wrap max-h-[200px]">
                {truncateText(commandDetails.old_str, 500)}
              </dd>
              
              <dt className="font-semibold">New JSON:</dt>
              <dd className="bg-gray-100 p-1 rounded text-sm font-mono overflow-auto whitespace-pre-wrap max-h-[200px]">
                {truncateText(commandDetails.new_str, 500)}
              </dd>
            </>
          )}
          
          {commandDetails.command === 'insert' && (
            <>
              <dt className="font-semibold">Position:</dt>
              <dd>{commandDetails.position || 'end'}</dd>
              
              <dt className="font-semibold">Text:</dt>
              <dd className="bg-gray-100 p-1 rounded text-sm font-mono overflow-auto whitespace-pre-wrap max-h-[200px]">
                {truncateText(commandDetails.text, 500)}
              </dd>
            </>
          )}
        </dl>
      </CardContent>
    </Card>
  );
};

export default CommandDetailsCard;