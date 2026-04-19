import React from 'react';
import { Plus, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AssessmentToolsDisplayProps {
  tools: string[];
  onAdd?: () => void;
}

export function AssessmentToolsDisplay({ tools, onAdd }: AssessmentToolsDisplayProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-800">Assessment Tools Used</h4>
        {onAdd && (
          <Button size="sm" onClick={onAdd} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add item
          </Button>
        )}
      </div>

      {tools.length > 0 ? (
        <div className="space-y-2">
          {tools.map((tool, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:shadow-sm transition">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100">
                <ClipboardList className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 truncate font-medium">{tool}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">No assessment tools yet</p>
          {onAdd && (
            <Button size="sm" onClick={onAdd} className="flex items-center gap-1 mx-auto">
              <Plus className="h-4 w-4" /> Add assessment item
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
