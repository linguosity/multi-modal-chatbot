'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, ArrowRight } from 'lucide-react'
import { ReportSchema } from '@/lib/schemas/report'
import type { z } from 'zod'
type ReportType = z.infer<typeof ReportSchema>['type']
import { ReportTemplateSchema } from '@/lib/schemas/report-template'
type ReportTemplate = z.infer<typeof ReportTemplateSchema>
import { createDefaultTemplate } from '@/lib/structured-schemas'

export default function NewReportPage() {
  const [type, setType] = useState<ReportType | ''>('')
  const [title, setTitle] = useState('')
  const [studentId, setStudentId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>('default')
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/report-templates')
        if (!response.ok) {
          throw new Error(`Error fetching templates: ${response.statusText}`)
        }
        const data = await response.json()
        setTemplates(Array.isArray(data) ? data : [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoadingTemplates(false)
      }
    }
    fetchTemplates()
  }, [])

  const handleCreate = async (e: React.MouseEvent, useAI: boolean = false) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!selectedTemplateId) {
      setError('Please select a report template.')
      setLoading(false)
      return
    }

    try {
      let requestBody: Record<string, unknown>

      if (selectedTemplateId === 'default') {
        const defaultTemplate = createDefaultTemplate()
        requestBody = {
          title,
          studentId,
          type,
          sections: defaultTemplate.sections,
        }
      } else {
        requestBody = {
          title,
          studentId,
          type,
          template_id: selectedTemplateId,
        }
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create report')
      }

      const newReport = await response.json()
      const redirectUrl = useAI
        ? `/dashboard/reports/${newReport.id}?ai=1`
        : `/dashboard/reports/${newReport.id}`
      router.push(redirectUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loadingTemplates) {
    return (
      <div className="min-h-screen bg-[var(--paper)] p-8">
        <div className="wf-sm">Loading templates…</div>
      </div>
    )
  }

  const isFormValid = title.trim() && studentId.trim() && type && selectedTemplateId

  return (
    <div className="min-h-screen bg-[var(--paper)] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-1 mb-8">
          <div className="wf-label">New report</div>
          <h1 className="wf-heading" style={{ fontSize: 30 }}>Start a new evaluation.</h1>
          <p className="wf-sm">Name the report, then choose whether to start with AI or fill sections manually.</p>
        </div>

        {/* Form card */}
        <div className="wf-box p-6 mb-6">
          <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title" className="wf-label bold">Report title</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Annual SLP Evaluation — Q1 2026"
                  className="border-[var(--line)] rounded-[3px] bg-[var(--card-surface)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="studentId" className="wf-label bold">Student ID</Label>
                <Input
                  id="studentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g., STU-12345"
                  className="border-[var(--line)] rounded-[3px] bg-[var(--card-surface)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type" className="wf-label bold">Report type</Label>
                <Select onValueChange={(value: ReportType) => setType(value)} value={type}>
                  <SelectTrigger className="w-full border-[var(--line)] rounded-[3px] bg-[var(--card-surface)]" style={{ fontFamily: 'var(--font-mono)' }}>
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="template" className="wf-label bold">Template</Label>
                <Select
                  onValueChange={(value: string) => setSelectedTemplateId(value)}
                  value={selectedTemplateId}
                  defaultValue="default"
                >
                  <SelectTrigger className="w-full border-[var(--line)] rounded-[3px] bg-[var(--card-surface)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default · CA SLP Initial</SelectItem>
                    {Array.isArray(templates) && templates.map(template => (
                      <SelectItem key={template.id} value={template.id || ''}>
                        {template.name} (Legacy)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="wf-box terra">
                <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--terracotta-ink)' }}>{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Two-path CTAs */}
        {isFormValid && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI path — primary */}
            <div className="wf-box relative overflow-hidden" style={{ background: '#fbe7da', borderColor: 'var(--terracotta-ink)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" style={{ color: 'var(--terracotta-ink)' }} />
                  <div className="flex flex-col">
                    <div className="wf-heading" style={{ fontSize: 18 }}>Start with AI</div>
                    <span className="wf-pill terra" style={{ alignSelf: 'flex-start' }}>Recommended</span>
                  </div>
                </div>
              </div>
              <p className="text-xs mb-5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', lineHeight: 1.55 }}>
                Drop in clinical notes, PDFs, audio, or images. Linguosity reads each source, classifies it by section, and fills the skeleton.
              </p>
              <button
                onClick={(e) => handleCreate(e, true)}
                disabled={loading}
                className="wf-btn primary w-full justify-center"
              >
                {loading ? 'Creating…' : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Start with AI
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Manual path — secondary */}
            <div className="wf-box">
              <div className="flex items-center gap-2 mb-3">
                <div className="wf-heading" style={{ fontSize: 18 }}>Fill manually</div>
              </div>
              <p className="text-xs mb-5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', lineHeight: 1.55 }}>
                Build the report section by section. Full control over every detail — no AI pre-fill.
              </p>
              <button
                onClick={(e) => handleCreate(e, false)}
                disabled={loading}
                className="wf-btn w-full justify-center"
              >
                Fill manually
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
