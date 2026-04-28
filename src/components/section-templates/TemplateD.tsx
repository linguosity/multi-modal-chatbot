'use client'

/** Template D — assessment-tools collection (compact table + expand-to-edit rows). */

import React, { useCallback, useState } from 'react'
import { ChevronRight, Plus, Sparkles, X } from 'lucide-react'
import { DateField } from '@/components/primitives/DateField'
import { FieldRow } from '@/components/primitives/FieldRow'
import { TextShort } from '@/components/primitives/TextShort'
import { cn } from '@/lib/utils'
import {
  ASSESSMENT_MEASURE_TYPES,
  ASSESSMENT_TARGET_POPULATIONS,
} from '@/lib/structured-schemas'

// Canonical assessment-tool entry — must match ASSESSMENT_TOOLS_SECTION in
// `src/lib/structured-schemas.ts`. The component reads and writes these field
// names directly so the editor and the AI route stay in sync. The previous
// version kept a divergent local shape (`name`, `type`, `date`, `population`)
// and silently corrupted the schema on every save round-trip.
export interface CanonicalTool {
  id?: string
  title?: string
  measure_type?: string
  administered_date?: string
  target_population?: string
  purpose?: string
  notes?: string
  domains_assessed?: string[]
  completed?: boolean
}

export interface TemplateDProps {
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  /** Fired when "AI extract from sources" button is clicked. */
  onAIExtract?: () => void
}

// Pill colors per measure type. Falls through to a neutral default for any
// type not listed here, so adding a new enum value never breaks rendering.
const TYPE_COLORS: Record<string, string> = {
  'Standardized Test': '#dbeafe',
  'Criterion-Referenced': '#fce7f3',
  'Informal Assessment': '#fef3c7',
  Observation: '#d1fae5',
  Interview: '#fef9c3',
  Questionnaire: '#fde68a',
  'Parent/Caregiver Report': '#fed7aa',
  'Teacher Report': '#fbcfe8',
  'Language Sample': '#ede9fe',
  'Narrative Assessment': '#e9d5ff',
  'Dynamic Assessment': '#ffedd5',
  'Records Review': '#e5e7eb',
  'Oral Mechanism Examination': '#fecaca',
  'Hearing Screening': '#bae6fd',
}

const GRID_COLUMNS = '2fr 160px 110px 160px 40px'

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Read a tool record into the canonical shape. AI-saved data is canonical
// already; legacy rows from the old template wrote `name`/`type`/`date`/
// `population`, so accept those as fallbacks but never re-emit them.
function readTool(raw: unknown, index: number): CanonicalTool {
  const t = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
  const arr = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined
  return {
    id: str(t.id) ?? `tool-${index}`,
    title: str(t.title) ?? str(t.name) ?? str(t.tool_name) ?? '',
    measure_type: str(t.measure_type) ?? str(t.type) ?? str(t.tool_type) ?? '',
    administered_date: str(t.administered_date) ?? str(t.date) ?? '',
    target_population: str(t.target_population) ?? str(t.population) ?? '',
    purpose: str(t.purpose) ?? str(t.description) ?? '',
    notes: str(t.notes) ?? '',
    domains_assessed: arr(t.domains_assessed) ?? arr(t.domains) ?? [],
    completed: typeof t.completed === 'boolean' ? t.completed : undefined,
  }
}

export function TemplateD({ data, onChange, onAIExtract }: TemplateDProps) {
  const tools: CanonicalTool[] = Array.isArray(data.tools)
    ? (data.tools as unknown[]).map(readTool)
    : []
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const setTools = useCallback(
    (next: CanonicalTool[]) => {
      onChange({ ...data, tools: next })
    },
    [data, onChange],
  )

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const update = <K extends keyof CanonicalTool>(
    id: string,
    field: K,
    val: CanonicalTool[K],
  ) => {
    setTools(
      tools.map((t) => (t.id === id ? { ...t, [field]: val } : t)),
    )
  }

  const remove = (id: string) => {
    setTools(tools.filter((t) => t.id !== id))
    setExpanded((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const addTool = () => {
    const id = newId()
    const next: CanonicalTool = {
      id,
      title: '',
      measure_type: '',
      administered_date: '',
      target_population: '',
      purpose: '',
      notes: '',
      domains_assessed: [],
    }
    setTools([...tools, next])
    setExpanded((prev) => {
      const ns = new Set(prev)
      ns.add(id)
      return ns
    })
  }

  return (
    <div
      className="bg-white overflow-hidden"
      style={{ border: '1.25px solid var(--line-2)', borderRadius: 8 }}
    >
      {/* Table header */}
      <div
        className="font-mono font-bold uppercase"
        style={{
          display: 'grid',
          gridTemplateColumns: GRID_COLUMNS,
          padding: '8px 16px',
          background: 'var(--paper-2)',
          borderBottom: '1px solid var(--line-2)',
          fontSize: 10,
          letterSpacing: '0.12em',
          color: 'var(--ink-4)',
        }}
      >
        <span>Tool Name</span>
        <span>Type</span>
        <span>Date</span>
        <span>Population</span>
        <span></span>
      </div>

      {/* Rows */}
      {tools.map((t, i) => {
        const id = t.id ?? `tool-${i}`
        const isExpanded = expanded.has(id)
        const isLast = i === tools.length - 1
        const typeLabel = t.measure_type || ''
        const pillColor = TYPE_COLORS[typeLabel] || '#f3f4f6'
        return (
          <div
            key={id}
            style={{ borderBottom: isLast ? 'none' : '1px solid #f0ede6' }}
          >
            {/* Compact row */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggle(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(id)
                }
              }}
              className="cursor-pointer items-start transition-colors"
              style={{
                display: 'grid',
                gridTemplateColumns: GRID_COLUMNS,
                padding: '10px 16px',
                background: isExpanded ? '#fefce8' : 'transparent',
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <ChevronRight
                  size={12}
                  className="transition-transform"
                  style={{
                    color: 'var(--ink-4)',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  {t.title ? (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                  ) : (
                    <span style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}>Untitled tool</span>
                  )}
                  {t.purpose && (
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        fontWeight: 400,
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                      title={t.purpose}
                    >
                      {t.purpose}
                    </span>
                  )}
                </span>
              </span>
              <span>
                {typeLabel ? (
                  <span
                    className="font-mono inline-block"
                    style={{
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontSize: 10.5,
                      background: pillColor,
                      color: 'var(--ink-2)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {typeLabel}
                  </span>
                ) : (
                  <span style={{ color: 'var(--ink-4)', fontStyle: 'italic', fontSize: 11 }}>—</span>
                )}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 12, color: 'var(--ink-3)' }}
              >
                {t.administered_date || <span style={{ color: 'var(--ink-4)' }}>—</span>}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 12, color: 'var(--ink-3)' }}
              >
                {t.target_population || <span style={{ color: 'var(--ink-4)' }}>—</span>}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(id)
                }}
                title="Remove"
                aria-label="Remove tool"
                className="border-0 bg-transparent cursor-pointer"
                style={{ color: '#d1d5db', padding: 2 }}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            {/* Expanded edit form */}
            {isExpanded && (
              <div
                style={{
                  padding: '12px 16px 16px 36px',
                  background: '#fffef7',
                  borderTop: '1px dashed var(--line-2)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FieldRow label="Tool Name">
                    <TextShort
                      value={t.title}
                      onChange={(v) => update(id, 'title', v)}
                      placeholder="e.g. CELF-5, Parent Communication Questionnaire"
                    />
                  </FieldRow>
                  <FieldRow label="Measure Type">
                    <select
                      value={t.measure_type ?? ''}
                      onChange={(e) => update(id, 'measure_type', e.target.value)}
                      className="w-full font-mono"
                      style={{
                        fontSize: 12,
                        padding: '4px 6px',
                        border: '1.25px solid #d0d0d0',
                        borderRadius: 4,
                        background: 'white',
                      }}
                    >
                      <option value="">—</option>
                      {ASSESSMENT_MEASURE_TYPES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </FieldRow>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <FieldRow label="Date Administered">
                    <DateField
                      value={t.administered_date}
                      onChange={(v) => update(id, 'administered_date', v)}
                    />
                  </FieldRow>
                  <FieldRow label="Target Population">
                    <select
                      value={t.target_population ?? ''}
                      onChange={(e) => update(id, 'target_population', e.target.value)}
                      className="w-full font-mono"
                      style={{
                        fontSize: 12,
                        padding: '4px 6px',
                        border: '1.25px solid #d0d0d0',
                        borderRadius: 4,
                        background: 'white',
                      }}
                    >
                      <option value="">—</option>
                      {ASSESSMENT_TARGET_POPULATIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </FieldRow>
                </div>
                <div style={{ marginTop: 12 }}>
                  <FieldRow label="Description (purpose)">
                    <textarea
                      value={t.purpose ?? ''}
                      onChange={(e) => update(id, 'purpose', e.target.value)}
                      placeholder={"e.g. \"The [Tool] is a [formal/informal] [tool type] that [evaluates] a [child]'s [domains].\""}
                      rows={2}
                      className="w-full font-mono resize-y"
                      style={{
                        fontSize: 12,
                        padding: '6px 8px',
                        border: '1.25px solid #d0d0d0',
                        borderRadius: 4,
                        background: 'white',
                        outline: 'none',
                      }}
                    />
                  </FieldRow>
                </div>
                <div style={{ marginTop: 12 }}>
                  <FieldRow label="Domains assessed">
                    <TextShort
                      value={(t.domains_assessed ?? []).join(', ')}
                      onChange={(v) =>
                        update(
                          id,
                          'domains_assessed',
                          v.split(',').map((s) => s.trim()).filter(Boolean),
                        )
                      }
                      placeholder="Receptive Language, Expressive Language, Articulation"
                    />
                  </FieldRow>
                </div>
                <div style={{ marginTop: 12 }}>
                  <FieldRow label="Notes (this administration)">
                    <textarea
                      value={t.notes ?? ''}
                      onChange={(e) => update(id, 'notes', e.target.value)}
                      placeholder="Who completed it, conditions, observations specific to this administration."
                      rows={2}
                      className="w-full font-mono resize-y"
                      style={{
                        fontSize: 12,
                        padding: '6px 8px',
                        border: '1.25px solid #d0d0d0',
                        borderRadius: 4,
                        background: 'white',
                        outline: 'none',
                      }}
                    />
                  </FieldRow>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--line-2)',
          background: 'var(--paper-2)',
        }}
      >
        <button
          type="button"
          onClick={addTool}
          className={cn(
            'inline-flex items-center bg-white cursor-pointer font-mono',
          )}
          style={{
            gap: 6,
            padding: '6px 12px',
            border: '1.25px solid var(--line-2)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--ink-2)',
          }}
        >
          <Plus size={12} strokeWidth={1.5} />
          Add tool
        </button>
        {onAIExtract && (
          <button
            type="button"
            onClick={onAIExtract}
            className="inline-flex items-center bg-white cursor-pointer font-mono"
            style={{
              gap: 6,
              padding: '6px 12px',
              border: '1.25px solid var(--line-2)',
              borderRadius: 6,
              fontSize: 12,
              color: '#2563eb',
            }}
          >
            <Sparkles size={11} fill="currentColor" strokeWidth={0} />
            AI extract from sources
          </button>
        )}
      </div>
    </div>
  )
}

export default TemplateD
