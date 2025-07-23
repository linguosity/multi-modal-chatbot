'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldId } from '../lib/hooks/useFieldDnd';
import { TemplateField } from '../types/template-types';
import { GripVertical, Edit, Trash2 } from 'lucide-react';

interface DraggableFieldProps {
  field: TemplateField;
  onEdit?: (field: TemplateField) => void;
  onDelete?: (fieldId: FieldId) => void;
  // Whether drag-and-drop is enabled
  dragDisabled?: boolean;
}

export function DraggableField({
  field,
  onEdit,
  onDelete,
  dragDisabled = false
}: DraggableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: field.id,
    disabled: dragDisabled
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`
        flex items-center gap-2 p-3 rounded-md bg-gray-50 border border-gray-200
        ${isDragging ? 'z-10 shadow-md' : ''}
      `}
    >
      {/* Drag handle */}
      {!dragDisabled && (
        <span
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab touch-none"
          aria-label="Drag handle"
          tabIndex={0}
          role="button"
        >
          <GripVertical size={16} />
        </span>
      )}

      {/* Field information */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className="font-medium truncate">{field.label}</span>
          {field.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </div>
        <div className="text-sm text-gray-500 truncate">
          {field.type}
          {field.placeholder && ` - ${field.placeholder}`}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(field)}
            className="text-gray-400 hover:text-blue-600 p-1 rounded-md hover:bg-gray-100"
            aria-label={`Edit ${field.label}`}
          >
            <Edit size={16} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(field.id)}
            className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-gray-100"
            aria-label={`Delete ${field.label}`}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}