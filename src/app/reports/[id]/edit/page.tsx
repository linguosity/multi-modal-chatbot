'use client';

import React from 'react';

interface EditReportProps {
  params: {
    id: string;
  };
}

export default function EditReport({ params }: EditReportProps) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Edit Report {params.id}</h1>
      <p>This is a placeholder for the report editor.</p>
    </div>
  );
}