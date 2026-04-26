'use client'

/** Template D — assessment-tools collection (compact table + expand-to-edit rows). */

import React, { useCallback, useState } from 'react'
import { ChevronRight, Plus, Sparkles, X } from 'lucide-react'
import { DateField } from '@/components/primitives/DateField'
import { FieldRow } from '@/components/primitives/FieldRow'
import { SegmentedControl } from '@/components/primitives/SegmentedControl'
import { TextShort } from '@/components/primitives/TextShort'
import { cn } from '@/lib/utils'

export interface TemplateDTool {
  id: string
  name: string
  type: string
  date: string
  population: string
}

export interface TemplateDProps {
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  /** Fired when "AI extract from sources" button is clicked. */
  onAIExtract?: () => void
}

const TOOL_TYPES = [
  'Standardized',
  'Criterion-referenced',
  'Observation',
  'Interview',
  'Narrative',
  'Dynamic',
] as const

const TYPE_COLORS: Record<string, string> = {
  Standardized: '#dbeafe',
  'Criterion-referenced': '#fce7f3',
  Observation: '#d1fae5',
  Interview: '#fef3c7',
  Narrative: '#ede9fe',
  Dynamic: '#ffedd5',
}

const GRID_COLUMNS = '2fr 130px 110px 1fr 40px'

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function TemplateD({ data, onChange, onAIExtract }: TemplateDProps) {
  // AI-emitted tool rows may lack stable `id` fields and use slightly
  // different keys than the template's local shape. Map the common
  // alternatives (`title` ← name, `measure_type` ← type, `completed`
  // ← date, `purpose` ← population) so AI-saved data renders without
  // requiring prompt-side schema enforcement.
  const tools = Array.isArray(data.tools)
    ? (data.tools as Array<Partial<TemplateDTool> & { title?: string; measure_type?: string; completed?: string; purpose?: string }>).map((t, i) => ({
        id: t.id ?? `tool-${i}`,
        name: t.name ?? t.title ?? '',
        type: t.type ?? t.measure_type ?? 'Standardized',
        date: t.date ?? t.completed ?? '',
        population: t.population ?? t.purpose ?? '',
      })) as TemplateDTool[]
    : []
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const setTools = useCallback(
    (next: TemplateDTool[]) => {
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

  const update = <K extends keyof TemplateDTool>(
    id: string,
    field: K,
    val: TemplateDTool[K],
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
    const next: TemplateDTool = {
      id,
      name: '',
      type: 'Standardized',
      date: '',
      population: '',
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
        const isExpanded = expanded.has(t.id)
        const isLast = i === tools.length - 1
        return (
          <div
            key={t.id}
            style={{ borderBottom: isLast ? 'none' : '1px solid #f0ede6' }}
          >
            {/* Compact row */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggle(t.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(t.id)
                }
              }}
              className="cursor-pointer items-center transition-colors"
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
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ChevronRight
                  size={12}
                  className="transition-transform"
                  style={{
                    color: 'var(--ink-4)',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    flexShrink: 0,
                  }}
                />
                {t.name ? (
                  t.name
                ) : (
                  <span
                    style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}
                  >
                    Untitled tool
                  </span>
                )}
              </span>
              <span>
                <span
                  className="font-mono inline-block"
                  style={{
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontSize: 10.5,
                    background: TYPE_COLORS[t.type] || '#f3f4f6',
                    color: 'var(--ink-2)',
                  }}
                >
                  {t.type}
                </span>
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 12, color: 'var(--ink-3)' }}
              >
                {t.date}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 12, color: 'var(--ink-3)' }}
              >
                {t.population}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(t.id)
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
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <FieldRow label="Tool Name">
                    <TextShort
                      value={t.name}
                      onChange={(v) => update(t.id, 'name', v)}
                      placeholder="Search tools…"
                    />
                  </FieldRow>
                  <FieldRow label="Measure Type">
                    <SegmentedControl
                      options={TOOL_TYPES}
                      value={(TOOL_TYPES as readonly string[]).includes(t.type) ? (t.type as typeof TOOL_TYPES[number]) : 'Standardized'}
                      onChange={(v) => update(t.id, 'type', v)}
                    />
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
                      value={t.date}
                      onChange={(v) => update(t.id, 'date', v)}
                    />
                  </FieldRow>
                  <FieldRow label="Target Population">
                    <TextShort
                      value={t.population}
                      onChange={(v) => update(t.id, 'population', v)}
                      placeholder="e.g. Ages 2-21"
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
