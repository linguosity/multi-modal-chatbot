'use client'

import React, { useState } from 'react'
import { InlineEdit, Input } from 'rsuite'
import { DataPoint, ReportSection } from '@/lib/schemas/report'
import { Button } from '@/components/ui/button'
import { Trash2, Plus } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface DataPointRendererProps {
  dataPoint: DataPoint;
  index: number;
  section: ReportSection;
  onUpdateSection: (updatedSection: ReportSection) => void;
  level?: number; // For indentation
}

const DataPointRenderer: React.FC<DataPointRendererProps> = ({
  dataPoint,
  index,
  section,
  onUpdateSection,
  level = 0,
}) => {
  const isString = typeof dataPoint === 'string';
  const currentPoints = section.points || [];

  const handleUpdatePoint = (newValue: string | DataPoint, pointIndex: number, isNestedUpdate = false) => {
    let updatedPoints: DataPoint[];

    if (isNestedUpdate) {
      // This path is for updates coming from a nested DataPointRenderer
      // We need to find and update the specific nested point
      updatedPoints = currentPoints.map((dp, i) => {
        if (i === index && !isString && typeof dp !== 'string') {
          // Assuming newValue is the updated nested DataPoint object
          return newValue as DataPoint;
        }
        return dp;
      });
    } else {
      // This path is for updates to the current level's dataPoint
      updatedPoints = currentPoints.map((dp, i) => {
        if (i === pointIndex) {
          return newValue;
        }
        return dp;
      });
    }
    onUpdateSection({ ...section, points: updatedPoints });
  };

  const handleDeletePoint = (pointIndex: number) => {
    const updatedPoints = currentPoints.filter((_, i) => i !== pointIndex);
    onUpdateSection({ ...section, points: updatedPoints });
  };

  const handleAddChildPoint = (parentIndex: number) => {
    const newChild: DataPoint = { heading: 'New Sub-point', points: [] };
    const updatedPoints = currentPoints.map((dp, i) => {
      if (i === parentIndex && !isString && typeof dp !== 'string') {
        return { ...dp, points: [...(dp.points || []), newChild] };
      }
      return dp;
    });
    onUpdateSection({ ...section, points: updatedPoints });
  };

  const handleUpdateHeading = (newHeading: string) => {
    if (!isString && typeof dataPoint !== 'string') {
      handleUpdatePoint({ ...dataPoint, heading: newHeading }, index);
    }
  };

  const handleUpdateChildPoints = (updatedChildPoints: DataPoint[]) => {
    if (!isString && typeof dataPoint !== 'string') {
      handleUpdatePoint({ ...dataPoint, points: updatedChildPoints }, index, true);
    }
  };

  const paddingLeft = `${level * 20}px`; // Indentation based on level

  return (
    <li style={{ paddingLeft }} className="flex items-start group relative">
      <div className="flex-grow">
        {isString ? (
          <InlineEdit
            defaultValue={dataPoint as string}
            showControls={false}
            stateOnBlur="save"
            onSave={(v) => handleUpdatePoint(String(v ?? ''), index)}
          >
            <Input />
          </InlineEdit>
        ) : (
          <div className="flex items-center">
            <InlineEdit
              defaultValue={dataPoint.heading}
              showControls={false}
              stateOnBlur="save"
              onSave={handleUpdateHeading}
            >
              <Input />
            </InlineEdit>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddChildPoint(index)}
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDeletePoint(index)}
        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
      {!isString && dataPoint.points && dataPoint.points.length > 0 && (
        <ul className="space-y-1 w-full">
          {dataPoint.points.map((childPoint, childIndex) => (
            <DataPointRenderer
              key={uuidv4()} // Use uuid for key as index can change with deletion
              dataPoint={childPoint}
              index={childIndex}
              section={section} // Pass the original section down
              onUpdateSection={onUpdateSection} // Pass the original update function down
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default DataPointRenderer;
