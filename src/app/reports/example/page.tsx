'use client';

import React, { useState } from 'react';
import { EditModeProvider } from '@/components/contexts/edit-mode-context';
import { EditableCard } from '@/components/reports/EditableCard';
import { EditableCardWithContext } from '@/components/reports/EditableCardWithContext';
import { GlobalEditModeToggle } from '@/components/reports/GlobalEditModeToggle';
import { ToggleEditCard } from '@/components/reports/ToggleEditCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sampleReportData = {
  title: 'Sample Speech and Language Assessment Report',
  patientName: 'John Doe',
  sections: [
    {
      id: 'background',
      title: 'Background Information',
      content: 'John is a 7-year-old boy who was referred for a speech and language assessment due to concerns about his articulation skills and language development.'
    },
    {
      id: 'assessment',
      title: 'Assessment Results',
      content: 'Standardized testing was conducted using the Clinical Evaluation of Language Fundamentals (CELF-5). John scored within the below average range for his age in both receptive and expressive language domains.'
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      content: 'Based on the assessment results, it is recommended that John receive speech therapy services twice weekly to address his articulation errors and language delays.'
    }
  ]
};

export default function ExampleReportPage() {
  const [reportData, setReportData] = useState(sampleReportData);

  const handleSectionSave = (sectionId: string, content: string) => {
    setReportData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, content } : section
      )
    }));
  };

  const handleSaveAll = async () => {
    // In a real app, this would save to an API
    return new Promise<void>(resolve => {
      // Simulate API delay
      setTimeout(() => {
        console.log('All changes saved!', reportData);
        resolve();
      }, 1000);
    });
  };

  return (
    <EditModeProvider>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{reportData.title}</h1>
          <GlobalEditModeToggle onSaveAll={handleSaveAll} />
        </div>
        
        <div className="flex gap-4 mb-8">
          <div className="px-4 py-2 bg-blue-50 rounded">
            <span className="font-medium">Patient:</span> {reportData.patientName}
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded">
            <span className="font-medium">Date:</span> {new Date().toLocaleDateString()}
          </div>
        </div>

        <Tabs defaultValue="context">
          <TabsList className="mb-6">
            <TabsTrigger value="context">Context-based Cards</TabsTrigger>
            <TabsTrigger value="toggle">Toggle-based Cards</TabsTrigger>
            <TabsTrigger value="button">Button-based Cards</TabsTrigger>
          </TabsList>
          
          <TabsContent value="context" className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Context-based Edit Mode</h2>
            {reportData.sections.map((section) => (
              <EditableCardWithContext
                key={section.id}
                id={section.id}
                title={section.title}
                initialContent={section.content}
                onSave={(content) => handleSectionSave(section.id, content)}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="toggle" className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Toggle-based Edit Mode</h2>
            {reportData.sections.map((section) => (
              <ToggleEditCard
                key={section.id}
                title={section.title}
                initialContent={section.content}
                onSave={(content) => handleSectionSave(section.id, content)}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="button" className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Button-based Edit Mode</h2>
            {reportData.sections.map((section) => (
              <EditableCard
                key={section.id}
                title={section.title}
                initialContent={section.content}
                onSave={(content) => handleSectionSave(section.id, content)}
              />
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-8 pt-8 border-t">
          <h2 className="text-xl font-semibold mb-4">Simple Card Example (No Context)</h2>
          <EditableCard
            title="Notes"
            initialContent="This is a simple editable card without the global context."
          />
        </div>
      </div>
    </EditModeProvider>
  );
}