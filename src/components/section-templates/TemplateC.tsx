'use client'

/** Template C — eligibility / validity decision-card list with sticky progress strip. */

import React from 'react'
import { CriterionCard } from '@/components/primitives/CriterionCard'
import { Pill } from '@/components/primitives/Pill'
import { cn } from '@/lib/utils'

export interface TemplateCCriterion {
  /** Stable React key + analytics id. */
  key: string
  title: string
  definition?: string
  evidence?: string[]
  /**
   * structured_data field that holds the boolean decision for this
   * criterion. Aligns with the section schema in `structured-schemas.ts`
   * which is what the AI tool gets handed — keeping these in sync means
   * AI-extracted values land where the renderer reads them.
   */
  decisionField: string
  /** structured_data field for the free-text justification. */
  justificationField: string
}

export interface TemplateCProps {
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  criteria: TemplateCCriterion[]
  /** Label shown in the green completion pill. Defaults to "Meets criteria". */
  completePillLabel?: string
  /** Optional AI-draft callback. Wired into each card's "AI draft" button. */
  onAIDraft?: (key: string) => void
}

const asDecision = (v: unknown): boolean | null | undefined => {
  if (typeof v === 'boolean') return v
  if (v === null) return null
  return undefined
}

const asString = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined

const isDecided = (v: unknown): boolean => typeof v === 'boolean'

// Read a dot-path out of structured_data. Schema fields like
// `student_cooperation.cooperative` resolve through nested objects;
// flat fields like `is_valid` work through the same code path.
function readPath(data: Record<string, unknown>, path: string): unknown {
  const segs = path.split('.')
  let cursor: unknown = data
  for (const seg of segs) {
    if (cursor == null || typeof cursor !== 'object') return undefined
    cursor = (cursor as Record<string, unknown>)[seg]
  }
  return cursor
}

// Write a dot-path back into structured_data, immutably rebuilding the
// chain. Missing intermediate objects are created on the fly so a
// brand-new clinician edit can establish the nesting the schema expects.
function writePath(
  data: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const segs = path.split('.')
  if (segs.length === 1) return { ...data, [segs[0]]: value }
  const [head, ...rest] = segs
  const existing = data[head]
  const inner =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {}
  return { ...data, [head]: writePath(inner, rest.join('.'), value) }
}

export function TemplateC({
  data,
  onChange,
  criteria,
  completePillLabel = 'Meets criteria',
  onAIDraft,
}: TemplateCProps) {
  const setPath = (path: string, v: unknown) => onChange(writePath(data, path, v))

  const total = criteria.length
  const decided = criteria.filter((c) => isDecided(readPath(data, c.decisionField))).length
  const complete = total > 0 && decided === total

  return (
    <div className={cn('flex flex-col')}>
      {/* Sticky progress strip */}
      <div
        className="flex items-center justify-between"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          padding: '10px 16px',
          background: complete ? '#d1fae5' : '#fefce8',
          border: '1px solid',
          borderColor: complete ? '#6ee7b7' : '#fde68a',
          borderRadius: '8px 8px 0 0',
          marginBottom: -1,
          transition: 'all 0.3s',
        }}
      >
        <span
          className="font-mono font-semibold"
          style={{
            fontSize: 12,
            color: complete ? '#065f46' : '#92400e',
          }}
        >
          {decided} of {total} criteria decided
        </span>
        {complete && <Pill tone="emerald">● {completePillLabel}</Pill>}
      </div>

      <div className="flex flex-col" style={{ gap: 10, padding: 0 }}>
        {criteria.map((c, i) => (
          <CriterionCard
            key={c.key}
            number={String(i + 1).padStart(2, '0')}
            title={c.title}
            definition={c.definition}
            decision={asDecision(readPath(data, c.decisionField))}
            onDecisionChange={(v) => setPath(c.decisionField, v)}
            justification={asString(readPath(data, c.justificationField))}
            onJustificationChange={(v) => setPath(c.justificationField, v)}
            evidence={c.evidence}
            onAIDraft={onAIDraft ? () => onAIDraft(c.key) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export default TemplateC
