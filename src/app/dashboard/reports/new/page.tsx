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
// If ReportSchema is a Zod schema, import its inferred type:
import type { z } from 'zod';
type ReportType = z.infer<typeof ReportSchema>['type'];
import { ReportTemplateSchema } from '@/lib/schemas/report-template'
type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
import { createBrowserSupabase } from '@/lib/supabase/browser'

export default function NewReportPage() {
  const [type, setType] = useState<ReportType | ''>('')
  const [title, setTitle] = useState('')
  const [studentId, setStudentId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabase();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/report-templates');
        if (!response.ok) {
          throw new Error(`Error fetching templates: ${response.statusText}`);
        }
        const data = await response.json();
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplateId(data[0].id); // Select the first template as default
        }
      } catch (err: any) {
        setError(err.message);
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
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, studentId, type, template_id: selectedTemplateId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create report')
      }

      const newReport = await response.json()
      router.push(`/dashboard/reports/${newReport.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingTemplates) {
    return <div className="p-6">Loading templates...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Report</h1>
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
          <Select onValueChange={(value: string) => setSelectedTemplateId(value)} value={selectedTemplateId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id || ''}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Report'}
        </Button>
        <Button type="button" onClick={() => setShowJson(!showJson)} className="ml-4">
          {showJson ? 'Hide JSON' : 'Show JSON'}
        </Button>
      </form>
      {showJson && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Report JSON</h2>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify({ title, studentId, type, template_id: selectedTemplateId }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}