'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { DEFAULT_SECTIONS, REPORT_SECTION_TYPES } from '@/lib/schemas/report';

export default function NewReport() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  
  // Template options
  const templates = [
    {
      id: 'articulation',
      name: 'Articulation Evaluation',
      description: 'Comprehensive evaluation of speech sound production',
      icon: '🗣️'
    },
    {
      id: 'language',
      name: 'Language Evaluation',
      description: 'Assessment of receptive and expressive language skills',
      icon: '📝'
    },
    {
      id: 'fluency',
      name: 'Fluency Evaluation',
      description: 'Assessment of stuttering and other fluency disorders',
      icon: '⏱️'
    },
    {
      id: 'voice',
      name: 'Voice Evaluation',
      description: 'Assessment of voice quality, pitch, and resonance',
      icon: '🔊'
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Evaluation',
      description: 'Full speech and language assessment',
      icon: '📊'
    }
  ];
  
  // Available report sections based on default section templates
  const availableSections = Object.values(DEFAULT_SECTIONS).map(section => ({
    id: section.id,
    title: section.title,
    selected: true // Default to selected
  }));
  
  const [selectedSections, setSelectedSections] = useState(availableSections);
  
  // Toggle section selection
  const toggleSection = (id: string) => {
    setSelectedSections(prevSections => 
      prevSections.map(section => 
        section.id === id ? { ...section, selected: !section.selected } : section
      )
    );
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };
  
  // Handle report creation
  const handleCreateReport = () => {
    // This would connect to an API to create the report
    console.log("Creating report with:", {
      title: reportTitle,
      template: selectedTemplate,
      sections: selectedSections.filter(s => s.selected).map(s => s.id)
    });
    
    // Redirect would happen here after creation
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create New Report</h1>
        <Link href="/reports">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      {/* Step 1: Basic Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter the basic details for this report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">Report Title</label>
              <Input 
                id="title"
                placeholder="e.g., Alex Smith Initial Speech-Language Evaluation"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">Report Type</label>
              <select 
                id="type" 
                className="w-full p-2 border rounded-md"
                defaultValue=""
              >
                <option value="" disabled>Select report type</option>
                <option value="initial">Initial Evaluation</option>
                <option value="annual">Annual Review</option>
                <option value="triennial">Triennial Evaluation</option>
                <option value="exit">Exit Evaluation</option>
                <option value="progress">Progress Report</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Step 2: Select Template */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Template</CardTitle>
          <CardDescription>Choose a template as a starting point</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedTemplate === template.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Step 3: Customize Sections */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Customize Sections</CardTitle>
          <CardDescription>Select which sections to include in your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {selectedSections.map(section => (
              <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{section.title}</span>
                <div>
                  <input 
                    type="checkbox" 
                    id={`section-${section.id}`}
                    checked={section.selected}
                    onChange={() => toggleSection(section.id)}
                    className="mr-2"
                  />
                  <label htmlFor={`section-${section.id}`}>Include</label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Create Report Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleCreateReport}
          disabled={!reportTitle || !selectedTemplate}
          className="px-8"
        >
          Create Report
        </Button>
      </div>
    </div>
  );
}