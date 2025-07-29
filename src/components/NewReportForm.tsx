'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReportSchema } from '@/lib/schemas/report'
import type { z } from 'zod';
type ReportType = z.infer<typeof ReportSchema>['type'];
import { ReportTemplateSchema } from '@/lib/schemas/report-template'
type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
import { useSaveFeedback } from '@/lib/context/FeedbackContext'
import { createDefaultTemplate } from '@/lib/structured-schemas'

interface NewReportFormProps {
  onReportCreated: (reportId: string) => void;
  onCancel: () => void;
}

export const NewReportForm: React.FC<NewReportFormProps> = ({ onReportCreated, onCancel }) => {
  const [type, setType] = useState<ReportType | ''>('')
  const [title, setTitle] = useState('')
  const [studentId, setStudentId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>('default');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false) // Keep for debugging if needed
  const notifySave = useSaveFeedback()

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/report-templates');
        if (!response.ok) {
          throw new Error(`Error fetching templates: ${response.statusText}`);
        }
        const data = await response.json();
        setTemplates(data);
        // Default template is already selected ('default')
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!selectedTemplateId) {
      setError('Please select a report template.');
      setLoading(false);
      return;
    }

    try {
      let requestBody;
      
      if (selectedTemplateId === 'default') {
        // Use the default template structure
        const defaultTemplate = createDefaultTemplate();
        requestBody = { 
          title, 
          studentId, 
          type, 
          sections: defaultTemplate.sections 
        };
      } else {
        // Use existing template
        requestBody = { 
          title, 
          studentId, 
          type, 
          template_id: selectedTemplateId 
        };
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create report')
      }

      const newReport = await response.json()
      
      // Show success feedback
      notifySave('Report', title)
      
      onReportCreated(newReport.id); // Call the callback with the new report ID
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loadingTemplates) {
    return <div className="p-4">Loading templates...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  // Debug logging
  console.log('Templates loaded:', templates);
  console.log('Selected template ID:', selectedTemplateId);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Create New Report</h2>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <Label htmlFor="title">Report Title</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="studentId">Student ID</Label>
          <Input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Report Type</Label>
          <Select onValueChange={(value: ReportType) => setType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial">Initial</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="triennial">Triennial</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="exit">Exit</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="template">Report Template</Label>
          <Select onValueChange={(value: string) => setSelectedTemplateId(value)} value={selectedTemplateId} defaultValue="default">
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                Default Template (Current Schemas)
              </SelectItem>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id || ''}>
                  {template.name} (Legacy)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Report'}
          </Button>
        </div>
        {/* Optional: For debugging, can be removed later */}
        {showJson && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Report JSON</h2>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify({ title, studentId, type, template_id: selectedTemplateId }, null, 2)}
            </pre>
          </div>
        )}
      </form>
    </div>
  )
}
