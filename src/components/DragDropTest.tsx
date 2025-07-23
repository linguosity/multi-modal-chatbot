'use client';

import { useState } from 'react';
import { TemplateFieldList } from './TemplateFieldList';
import { TemplateField } from '../types/template-types';

// Simple test component to verify drag-and-drop functionality
export function DragDropTest() {
  const [fields, setFields] = useState<TemplateField[]>([
    {
      id: 'field-1',
      type: 'text',
      label: 'Student Name',
      placeholder: 'Enter student name...',
      required: true
    },
    {
      id: 'field-2',
      type: 'textarea',
      label: 'Assessment Notes',
      placeholder: 'Enter assessment notes...',
      required: false
    },
    {
      id: 'field-3',
      type: 'select',
      label: 'Grade Level',
      options: ['K', '1st', '2nd', '3rd', '4th', '5th'],
      required: true
    },
    {
      id: 'field-4',
      type: 'checkbox',
      label: 'IEP Student',
      required: false
    }
  ]);

  const handleEditField = (field: TemplateField) => {
    console.log('Edit field:', field);
    // In a real implementation, this would open an edit modal
  };

  const handleDeleteField = (fieldId: string) => {
    console.log('Delete field:', fieldId);
    setFields(fields.filter(f => f.id !== fieldId));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Drag & Drop Test</h2>
      <p className="text-gray-600 mb-6">
        Try dragging the fields below to reorder them. The drag handle appears on hover.
      </p>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Template Fields</h3>
        <TemplateFieldList
          fields={fields}
          setFields={setFields}
          onEditField={handleEditField}
          onDeleteField={handleDeleteField}
        />
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Current Field Order:</h4>
        <ol className="list-decimal list-inside space-y-1">
          {fields.map((field, index) => (
            <li key={field.id} className="text-sm">
              {field.label} ({field.type})
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}