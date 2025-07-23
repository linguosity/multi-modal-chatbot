'use client';

import { useFieldDnd, FieldId } from '../lib/hooks/useFieldDnd';
import { DraggableField } from './DraggableField';
import { TemplateField } from '../types/template-types';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';

interface TemplateFieldListProps {
  fields: TemplateField[];
  setFields: (fields: TemplateField[]) => void;
  onEditField?: (field: TemplateField) => void;
  onDeleteField?: (fieldId: FieldId) => void;
  // Optional container ID for nested field groups
  containerId?: string;
  // Whether drag-and-drop is enabled
  dragDisabled?: boolean;
}

export function TemplateFieldList({
  fields,
  setFields,
  onEditField,
  onDeleteField,
  containerId,
  dragDisabled = false
}: TemplateFieldListProps) {
  const ids = fields.map(f => f.id);
  
  const { sensors, handleDragEnd, strategy, collisionDetection } = useFieldDnd(
    ids, 
    (newIds) => {
      try {
        // Reorder fields based on new ID order
        const reorderedFields = newIds.map(id => 
          fields.find(f => f.id === id)
        ).filter((field): field is TemplateField => field !== undefined);
        
        if (reorderedFields.length === fields.length) {
          setFields(reorderedFields);
        } else {
          console.warn('Field reordering failed: mismatch in field count');
        }
      } catch (error) {
        console.error('Error reordering fields:', error);
      }
    },
    containerId
  );

  // If drag is disabled, render without the DnD Provider
  if (dragDisabled) {
    return (
      <div className="space-y-2">
        {fields.map(field => (
          <DraggableField
            key={field.id}
            field={field}
            onEdit={onEditField}
            onDelete={onDeleteField}
            dragDisabled={true}
          />
        ))}
      </div>
    );
  }

  // Render with drag-and-drop functionality
  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={strategy} id={containerId}>
        <div className="space-y-2">
          {fields.map(field => (
            <DraggableField
              key={field.id}
              field={field}
              onEdit={onEditField}
              onDelete={onDeleteField}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}