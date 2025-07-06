'use client'

'use client';

import { useState, useEffect } from 'react';
import { ReportTemplateSchema } from '@/lib/schemas/report-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomModal } from '@/components/ui/custom-modal';
import { TemplateEditor } from '@/components/template-editor';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ReportTemplateSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplateSchema | undefined>(undefined);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/report-templates');
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSaveTemplate = async (templateData: ReportTemplateSchema) => {
    setError(null);
    try {
      const method = templateData.id ? 'PUT' : 'POST';
      const url = templateData.id ? `/api/report-templates/${templateData.id}` : '/api/report-templates';

      if (method === 'POST') {
        console.log('Frontend: Attempting to POST new template:', templateData);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details ? JSON.stringify(errorData.details) : errorData.error || 'Failed to save template');
      }

      const savedTemplate = await response.json();

      // If it was a POST (new template), update the editingTemplate state with the new ID
      if (method === 'POST') {
        setEditingTemplate(savedTemplate);
      }

      setMode('list');
      setEditingTemplate(undefined);
      fetchTemplates(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setMode('list');
    setEditingTemplate(undefined);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/report-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }

      fetchTemplates(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-6">Loading templates...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <TemplateEditor
        initialTemplate={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Report Templates</h1>
      <Button onClick={() => { setMode('create'); setEditingTemplate(undefined); }} className="mb-4">Create New Template</Button>

      {templates.length === 0 ? (
        <p>No templates found. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <p className="text-sm text-gray-500">{template.description || 'No description'}</p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400">Created: {new Date(template.created_at || '').toLocaleDateString()}</p>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingTemplate(template);
                    setMode('edit');
                  }}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template.id || '')}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
