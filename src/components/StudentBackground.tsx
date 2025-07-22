'use client';

import React from 'react';
import { InlineEdit } from 'rsuite';

interface StudentBackgroundProps {
  data: {
    [key: string]: any;
  };
  onUpdate: (key: string, value: any) => void;
}

export const StudentBackground: React.FC<StudentBackgroundProps> = ({ data, onUpdate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-center">
          <span className="font-semibold mr-2">{key}:</span>
          <InlineEdit defaultValue={value} onSave={(newValue) => onUpdate(key, newValue)} />
        </div>
      ))}
    </div>
  );
};
