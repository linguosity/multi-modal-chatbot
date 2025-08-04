'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormField, SelectField } from '@/components/ui/form-field'
import { ReportSchema } from '@/lib/schemas/report'
import type { z } from 'zod';
type ReportType = z.infer<typeof ReportSchema>['type'];
import { ReportTemplateSchema } from '@/lib/schemas/report-template'
type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
import { useSaveFeedback } from '@/lib/context/FeedbackContext'
import { createDefaultTemplate } from '@/lib/structured-schemas'
import { useFormState, useAsyncOperation } from '@/lib/hooks'

interface NewReportFormProps {
  onReportCreated: (reportId: string) => void;
  onCancel: () => void;
}

interface FormData {
  type: ReportType | ''
  title: string
  studentId: string
  selectedTemplateId: string
}

export const NewReportForm: React.FC<NewReportFormProps> = ({ onReportCreated, onCancel }) => {
  const formState = useFormState<FormData>({
    type: '',
    title: '',
    studentId: '',
    selectedTemplateId: 'default'
  })
  
  const templateOperation = useAsyncOperation()
  const createOperation = useAsyncOperation()
  const notifySave = useSaveFeedback()
  
  // Separate state for templates since it's not part of form data
  const [templates, setTemplates] = useState<ReportTemplate[]>([])

  useEffect(() => {
    const fetchTemplates = async () => {
      const response = await fetch('/api/report-templates')
      if (!response.ok) {
        throw new Error(`Error fetching templates: ${response.statusText}`)
      }
      return response.json()
    }
    
    templateOperation.execute(fetchTemplates).then(result => {
      if (result) {
        setTemplates(Array.isArray(result) ? result : [])
      }
    })
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data } = formState
    
    if (!data.selectedTemplateId) {
      formState.setError('Please select a report template.')
      return
    }

    const createReport = async () => {
      let requestBody
      
      if (data.selectedTemplateId === 'default') {
        // Use the default template structure
        const defaultTemplate = createDefaultTemplate()
        requestBody = { 
          title: data.title, 
          studentId: data.studentId, 
          type: data.type, 
          sections: defaultTemplate.sections 
        }
      } else {
        // Use existing template
        requestBody = { 
          title: data.title, 
          studentId: data.studentId, 
          type: data.type, 
          template_id: data.selectedTemplateId 
        }
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

      return response.json()
    }

    const newReport = await createOperation.execute(createReport)
    
    if (newReport) {
      // Show success feedback
      notifySave('Report', data.title)
      onReportCreated(newReport.id)
    }
  }

  if (templateOperation.loading) {
    return <div className="p-4">Loading templates...</div>
  }

  if (templateOperation.error) {
    return <div className="p-4 text-red-500">Error: {templateOperation.error}</div>
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Create New Report</h2>
      <form onSubmit={handleCreate} className="space-y-6">
        <FormField
          label="Report Title"
          name="title"
          type="text"
          value={formState.data.title}
          onChange={(value) => formState.updateField('title', value)}
          required
          placeholder="Enter a descriptive title for this report"
          helpText="This will be displayed in the report header and file name"
          data-testid="report-title-input"
        />

        <FormField
          label="Student ID"
          name="studentId"
          type="text"
          value={formState.data.studentId}
          onChange={(value) => formState.updateField('studentId', value)}
          required
          placeholder="Enter student identifier"
          helpText="School-assigned student identification number"
          data-testid="student-id-input"
        />

        <SelectField
          label="Report Type"
          name="type"
          value={formState.data.type}
          onChange={(value) => formState.updateField('type', value as ReportType)}
          required
          placeholder="Select a report type"
          helpText="Choose the type of evaluation report you're creating"
          options={[
            { value: 'initial', label: 'Initial Evaluation' },
            { value: 'annual', label: 'Annual Review' },
            { value: 'triennial', label: 'Triennial Evaluation' },
            { value: 'progress', label: 'Progress Report' },
            { value: 'exit', label: 'Exit Evaluation' },
            { value: 'consultation', label: 'Consultation Report' },
            { value: 'other', label: 'Other' }
          ]}
          data-testid="report-type-select"
        />

        <SelectField
          label="Report Template"
          name="selectedTemplateId"
          value={formState.data.selectedTemplateId}
          onChange={(value) => formState.updateField('selectedTemplateId', value)}
          required
          helpText="Choose a template to structure your report sections"
          options={[
            { value: 'default', label: 'Default Template (Current Schemas)' },
            ...templates.map(template => ({
              value: template.id || '',
              label: `${template.name} (Legacy)`
            }))
          ]}
          data-testid="template-select"
        />
        {(formState.error || createOperation.error) && (
          <p className="text-red-500 text-sm">
            {formState.error || createOperation.error}
          </p>
        )}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createOperation.loading}>
            {createOperation.loading ? 'Creating...' : 'Create Report'}
          </Button>
        </div>
        {/* Debug info - can be removed later */}
        {process.env.NODE_ENV === 'development' && formState.isDirty && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Form State (Debug)</h2>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(formState.data, null, 2)}
            </pre>
          </div>
        )}
      </form>
    </div>
  )
}
