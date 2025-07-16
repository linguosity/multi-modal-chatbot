'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { ReportTemplateSchema } from '@/lib/schemas/report-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TemplateEditor from '@/components/template-editor';
import { Drawer } from '@/components/ui/Drawer';
import { AnimatePresence } from 'framer-motion';

type ReportTemplate = z.infer<typeof ReportTemplateSchema>;

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | undefined>(undefined);
  const [showDrawer, setShowDrawer] = useState(false);

  // Load all templates on mount
  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/report-templates');
      if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
      const data = await response.json();
      setTemplates(data);
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Save a new or edited template
  const handleSaveTemplate = async (templateData: ReportTemplate) => {
    setError(null);
    try {
      const method = templateData.id ? 'PUT' : 'POST';
      const url = templateData.id ? `/api/report-templates/${templateData.id}` : '/api/report-templates';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details ? JSON.stringify(errorData.details) : errorData.error || 'Failed to save template');
      }

      setShowDrawer(false);
      setEditingTemplate(undefined);
      fetchTemplates(); // Refresh
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Delete a template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) return;

    setError(null);
    try {
      const response = await fetch(`/api/report-templates/${templateId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }
      fetchTemplates();
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleCreateNewTemplate = () => {
    console.log('🆕 handleCreateNewTemplate: Creating NEW template (no initialTemplate)');
    // For new templates, pass undefined so the template editor knows it's creating new
    setEditingTemplate(undefined);
    setShowDrawer(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Report Templates</h1>
      <Button
        onClick={handleCreateNewTemplate}
        className="mb-4"
      >
        Create New Template
      </Button>

      {loading ? (
        <div className="p-6">Loading templates...</div>
      ) : error ? (
        <div className="p-6 text-red-500">Error: {error}</div>
      ) : templates.length === 0 ? (
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
                <p className="text-xs text-gray-400">
                  Created:{' '}
                  {template.created_at
                    ? new Date(template.created_at).toLocaleDateString()
                    : '—'}
                </p>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
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

      <AnimatePresence>
        {showDrawer && (
          <Drawer
            isOpen={showDrawer}
            onClose={() => {
              setShowDrawer(false);
              setEditingTemplate(undefined);
            }}
          >
            <TemplateEditor
              initialTemplate={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setShowDrawer(false);
                setEditingTemplate(undefined);
              }}
            />
          </Drawer>
        )}
      </AnimatePresence>
    </div>
  );
}