"use client"

import { useEffect, useMemo, useState } from 'react'
import { getSectionSchemaForType, type SectionSchema } from '@/lib/structured-schemas'

type IntakeResult = {
  success: boolean
  results?: {
    processingSummary?: { summary: string; confidence: number; issues: string[] }
    proposedUpdates?: Array<{ section_id: string; field_path: string; value: any; merge_strategy?: string }>
    updateResults?: any[]
    successful?: number
    failed?: number
  }
  error?: string
}

function get(obj: any, path: string): any {
  if (!obj || !path) return undefined
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  let cur = obj
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

export default function IntakeDevPage() {
  const [sectionType, setSectionType] = useState('header')
  const [sectionTitle, setSectionTitle] = useState('Student Information')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [beforeJson, setBeforeJson] = useState('{}')
  const [result, setResult] = useState<IntakeResult | null>(null)
  const [diffs, setDiffs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schema: SectionSchema | null = useMemo(() => getSectionSchemaForType(sectionType) || null, [sectionType])

  useEffect(() => {
    // Default title based on section type
    const map: Record<string, string> = {
      header: 'Student Information',
      reason_for_referral: 'Reason for Referral',
      assessment_results: 'Assessment Results',
      assessment_tools: 'Assessment Tools',
      validity_statement: 'Validity Statement',
    }
    if (map[sectionType]) setSectionTitle(map[sectionType])
  }, [sectionType])

  const loadNotes = async () => {
    setError(null)
    try {
      const res = await fetch('/api/dev/load-test')
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load notes.log')
      setText(json.text || '')
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  const loadHeaderBefore = async () => {
    setError(null)
    try {
      const res = await fetch('/api/dev/load-report-header')
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load header')
      const sd = json.header?.structured_data || {}
      setBeforeJson(JSON.stringify(sd, null, 2))
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  const runIntakeDryRun = async () => {
    setError(null)
    setLoading(true)
    setResult(null)
    setDiffs([])
    try {
      const sectionId = crypto.randomUUID()
      const fd = new FormData()
      fd.append('reportId', 'dev-report')
      fd.append('sectionIds', JSON.stringify([sectionId]))
      fd.append('replace', 'false')
      fd.append('dryRun', 'true')
      fd.append('text', text)

      // Provide schema context to avoid DB dependencies
      const sectionInfo = [{ id: sectionId, title: sectionTitle, section_type: sectionType }]
      const sectionSchemas: Record<string, SectionSchema> = {}
      if (schema) sectionSchemas[sectionId] = schema
      fd.append('sectionInfo', JSON.stringify(sectionInfo))
      if (Object.keys(sectionSchemas).length > 0) {
        fd.append('sectionSchemas', JSON.stringify(sectionSchemas))
      }

      if (file) fd.append('file_0', file)

      const res = await fetch('/api/ai/process-intake', { method: 'POST', body: fd })
      const json: IntakeResult = await res.json()
      setResult(json)
      if (!json.success) {
        setError(json.error || 'Intake failed')
        return
      }

      // Compute diffs vs before
      let before: Record<string, any> = {}
      try { before = JSON.parse(beforeJson || '{}') } catch {}
      const proposed = json.results?.proposedUpdates || []
      const changes: string[] = []
      for (const u of proposed) {
        if (u.section_id !== sectionId) continue
        const prev = get(before, u.field_path)
        const next = u.value
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          changes.push(`${u.field_path}: ${JSON.stringify(prev)} -> ${JSON.stringify(next)}`)
        }
      }
      setDiffs(changes)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Intake Dry-Run Tester</h1>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">Section type</label>
        <select value={sectionType} onChange={e => setSectionType(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="header">header</option>
          <option value="reason_for_referral">reason_for_referral</option>
          <option value="assessment_results">assessment_results</option>
          <option value="assessment_tools">assessment_tools</option>
          <option value="validity_statement">validity_statement</option>
        </select>
        <input value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} className="border rounded px-2 py-1 text-sm w-64" placeholder="Section title" />
        <button onClick={loadNotes} className="text-sm rounded bg-blue-600 text-white px-3 py-1">Load notes.log</button>
        <button onClick={loadHeaderBefore} className="text-sm rounded bg-gray-700 text-white px-3 py-1">Load header (before)</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Source text</label>
          <textarea value={text} onChange={e => setText(e.target.value)} className="w-full h-40 border rounded p-2 text-sm" placeholder="Paste text to process..." />
          <div className="mt-3">
            <label className="text-sm font-medium mr-2">Optional file</label>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="mt-3">
            <button onClick={runIntakeDryRun} disabled={loading} className="rounded bg-emerald-600 text-white px-3 py-1 text-sm disabled:opacity-50">
              {loading ? 'Running...' : 'Run Dry Run'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Before structured_data (JSON)</label>
          <textarea value={beforeJson} onChange={e => setBeforeJson(e.target.value)} className="w-full h-40 border rounded p-2 text-sm" placeholder="{ }" />
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium">Proposed Updates</h2>
          <pre className="border rounded bg-gray-50 p-3 text-xs overflow-auto">{result?.results?.proposedUpdates ? JSON.stringify(result.results.proposedUpdates, null, 2) : '—'}</pre>
        </div>
        <div>
          <h2 className="text-lg font-medium">Processing Summary</h2>
          <pre className="border rounded bg-gray-50 p-3 text-xs overflow-auto">{result?.results?.processingSummary ? JSON.stringify(result.results.processingSummary, null, 2) : '—'}</pre>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium">Diff vs Before</h2>
        {diffs.length === 0 ? (
          <div className="text-sm text-gray-500">—</div>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {diffs.map((d, i) => (<li key={i} className="mb-1">{d}</li>))}
          </ul>
        )}
      </div>
    </div>
  )
}

