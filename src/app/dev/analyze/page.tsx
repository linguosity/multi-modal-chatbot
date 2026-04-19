"use client"

import { useState } from 'react'

type AnalyzeResponse = {
  success: boolean
  sectionKey: string
  values?: Record<string, any>
  provenance?: any
  error?: string
}

export default function AnalyzeDevPage() {
  const [sectionKey, setSectionKey] = useState('header')
  const [sourceText, setSourceText] = useState('')
  const [beforeJson, setBeforeJson] = useState<string>('')
  const [afterValues, setAfterValues] = useState<Record<string, any> | null>(null)
  const [diff, setDiff] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [afterValuesMap, setAfterValuesMap] = useState<Record<string, any>>({})
  const [diffMap, setDiffMap] = useState<Record<string, string[]>>({})
  const sectionsList = ['header', 'reason_for_referral', 'assessment_results'] as const

  const loadNotes = async () => {
    setError(null)
    const res = await fetch('/api/dev/load-test')
    const json = await res.json()
    if (!json.success) { setError(json.error || 'Failed to load notes.log'); return }
    setSourceText(json.text || '')
  }

  const loadHeader = async () => {
    setError(null)
    const res = await fetch('/api/dev/load-report-header')
    const json = await res.json()
    if (!json.success) { setError(json.error || 'Failed to load header'); return }
    if (json.header?.structured_data) {
      setBeforeJson(JSON.stringify(json.header.structured_data, null, 2))
    } else {
      setBeforeJson(JSON.stringify({ first_name: '', last_name: '', evaluation_dates: '', evaluator_name: '', evaluator_credentials: '' }, null, 2))
    }
  }

  const runAnalyze = async () => {
    setError(null)
    setLoading(true)
    setAfterValues(null)
    setDiff([])
    try {
      const body = {
        sectionKey,
        sources: [
          { type: 'text', artifactId: 'dev-source', text: sourceText || '' }
        ]
      }
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json: AnalyzeResponse = await res.json()
      if (!json.success) { setError(json.error || 'Analyze failed'); return }
      setAfterValues(json.values || null)

      // Compute simple diff vs before
      let before: Record<string, any> = {}
      try { before = JSON.parse(beforeJson || '{}') } catch {}
      const changes: string[] = []
      const keys = Array.from(new Set([
        ...Object.keys(before || {}),
        ...Object.keys(json.values || {})
      ]))
      for (const k of keys) {
        const b = (before as any)[k]
        const a = (json.values as any)?.[k]
        if (JSON.stringify(b) !== JSON.stringify(a)) {
          changes.push(`${k}: ${JSON.stringify(b)} -> ${JSON.stringify(a)}`)
        }
      }
      setDiff(changes)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const runPresetHeader = async () => {
    setError(null)
    setSectionKey('header')
    await loadNotes()
    await loadHeader()
    await runAnalyze()
  }

  const loadAllBefore = async () => {
    setError(null)
    try {
      const res = await fetch('/api/dev/load-report-sections')
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load sections')
      const header = (json.sections || []).find((s: any) => s.sectionType === 'heading' || (s.title || '').toLowerCase().includes('student information'))
      if (header) setBeforeJson(JSON.stringify(header.structured_data || {}, null, 2))
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  const runAnalyzeFor = async (sk: string, before: any) => {
    const body = {
      sectionKey: sk,
      sources: [ { type: 'text', artifactId: 'dev-source', text: sourceText || '' } ]
    }
    const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json: any = await res.json()
    if (!json.success) throw new Error(json.error || 'Analyze failed')
    const values = json.values || {}
    const keys = Array.from(new Set([ ...Object.keys(before || {}), ...Object.keys(values || {}) ]))
    const changes: string[] = []
    for (const k of keys) {
      const b = (before as any)[k]
      const a = (values as any)[k]
      if (JSON.stringify(b) !== JSON.stringify(a)) changes.push(`${k}: ${JSON.stringify(b)} -> ${JSON.stringify(a)}`)
    }
    return { values, changes }
  }

  const runAnalyzeAll = async () => {
    setError(null)
    setLoading(true)
    setAfterValuesMap({})
    setDiffMap({})
    try {
      // Load before data for header (others default to empty unless you paste it in the left panel)
      let beforeHeader: any = {}
      try { beforeHeader = JSON.parse(beforeJson || '{}') } catch {}
      const results: Record<string, any> = {}
      const diffs: Record<string, string[]> = {}
      for (const sk of sectionsList) {
        const before = sk === 'header' ? beforeHeader : {}
        const { values, changes } = await runAnalyzeFor(sk, before)
        results[sk] = values
        diffs[sk] = changes
      }
      setAfterValuesMap(results)
      setDiffMap(diffs)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Analyze Debug</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium">Section</label>
        <select value={sectionKey} onChange={e => setSectionKey(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="header">header (Student Information)</option>
          <option value="reason_for_referral">reason_for_referral</option>
          <option value="assessment_results">assessment_results</option>
        </select>
        <button onClick={loadNotes} className="text-sm rounded bg-blue-600 text-white px-3 py-1">Load notes.log</button>
        <button onClick={loadHeader} className="text-sm rounded bg-gray-700 text-white px-3 py-1">Load header from test JSON</button>
        <button onClick={runPresetHeader} className="text-sm rounded bg-purple-600 text-white px-3 py-1">Preset: Header + Analyze</button>
        <button onClick={loadAllBefore} className="text-sm rounded bg-gray-800 text-white px-3 py-1">Load all (before)</button>
        <button onClick={runAnalyzeAll} disabled={loading} className="text-sm rounded bg-emerald-700 text-white px-3 py-1 disabled:opacity-50">{loading ? 'Analyzing…' : 'Analyze All'}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Source text</label>
          <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} className="w-full h-52 border rounded p-2 text-sm" placeholder="Paste text to analyze..." />
          <div className="mt-2">
            <button onClick={runAnalyze} disabled={loading} className="rounded bg-emerald-600 text-white px-3 py-1 text-sm disabled:opacity-50">
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Before structured_data (JSON)</label>
          <textarea value={beforeJson} onChange={e => setBeforeJson(e.target.value)} className="w-full h-52 border rounded p-2 text-sm" placeholder='{"evaluation_dates": "", ...}' />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-lg font-medium">After (values)</h2>
          <pre className="border rounded bg-gray-50 p-3 text-xs overflow-auto">{afterValues ? JSON.stringify(afterValues, null, 2) : '—'}</pre>
        </div>
        <div>
          <h2 className="text-lg font-medium">Diff</h2>
          {diff.length === 0 ? (
            <div className="text-sm text-gray-500">—</div>
          ) : (
            <ul className="text-sm list-disc pl-5">
              {diff.map((d, i) => (<li key={i} className="mb-1">{d}</li>))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-lg font-medium">All Sections (After)</h2>
          <pre className="border rounded bg-gray-50 p-3 text-xs overflow-auto">{Object.keys(afterValuesMap).length ? JSON.stringify(afterValuesMap, null, 2) : '—'}</pre>
          <h3 className="mt-3 font-medium">All Sections (Diff)</h3>
          <pre className="border rounded bg-gray-50 p-3 text-xs overflow-auto">{Object.keys(diffMap).length ? JSON.stringify(diffMap, null, 2) : '—'}</pre>
        </div>
      </div>
    </div>
  )
}
