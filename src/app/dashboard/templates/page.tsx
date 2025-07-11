'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { ReportTemplateSchema } from '@/lib/schemas/report-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TemplateEditor from '@/components/template-editor';
import { Drawer } from '@/components/ui/Drawer';
// import { DrawerContent } from '@/components/ui/Drawer'; // Uncomment if your Drawer requires it!

type ReportTemplate = z.infer<typeof ReportTemplateSchema>;

export default function TemplatesPage() {
  console.log("TemplatesPage: Component rendered");
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | undefined>(undefined);
  const [showDrawer, setShowDrawer] = useState(false);

  console.log("TemplatesPage state: ", { loading, error, templates, showDrawer, editingTemplate });
  console.log("TemplatesPage: Component rendered");

  console.log("TemplatesPage state: ", { loading, error, templates, showDrawer, editingTemplate });
  // Diagnostic: Show current state
  console.log("TemplatesPage state:", {
    editingTemplate: undefined, showDrawer: undefined // these get updated below
  });

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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSaveTemplate = async (templateData: ReportTemplate) => {
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

      setShowDrawer(false);
      setEditingTemplate(undefined);
      fetchTemplates(); // Refresh the list
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  if (loading) {
    return <div className="p-6">Loading templates...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Report Templates</h1>
      <Button
        onClick={() => {
          console.log('Clicked "Create New Template"');
          setShowDrawer(true);
          setEditingTemplate(undefined);
        }}
        className="mb-4"
      >
        Create New Template
      </Button>

      {templates.length === 0 ? (
        <p>No templates found. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <p className="text-sm text-gray-500">
                  {template.description || 'No description'}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400">
                  Created:{' '}
                  {template.createdAt
                    ? new Date(template.createdAt).toLocaleDateString()
                    : '—'}
                </p>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      console.log('Clicked Edit for:', template);
                      setEditingTemplate(template);
                      setShowDrawer(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id || '')}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diagnostic: Test Drawer always renders content */}
      <Drawer
          isOpen={showDrawer}
          onClose={() => {
            setShowDrawer(false);
            setEditingTemplate(undefined);
          }}
        >
          <div style={{ padding: 16, background: "#f8fafc" }}>
            <div>
              <b>Drawer is open?</b> {showDrawer ? "YES" : "NO"}
            </div>
            <div>
              <b>Editing Template Name:</b> {editingTemplate?.name || <span style={{ color: "#888" }}>None</span>}
            </div>
          </div>
          <TemplateEditor
            initialTemplate={editingTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => {
              setShowDrawer(false);
              setEditingTemplate(undefined);
            }}
          />
        </Drawer>
    </div>
  );
}