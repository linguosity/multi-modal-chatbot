'use client'

/** Template C — eligibility / validity decision-card list with sticky progress strip. */

import React from 'react'
import { CriterionCard } from '@/components/primitives/CriterionCard'
import { Pill } from '@/components/primitives/Pill'
import { cn } from '@/lib/utils'

export interface TemplateCCriterion {
  key: string
  title: string
  definition?: string
  evidence?: string[]
  /**
   * Alternate structured_data keys the AI commonly emits for this
   * criterion's decision (boolean). Read order: `${key}_decision` first,
   * then each alias. The AI tends to drift from the canonical
   * `${key}_decision` convention (e.g. emits `speech_criteria` instead of
   * `speech_impairment_decision`); aliases let the template recover the
   * value without requiring prompt-side schema enforcement.
   */
  decisionAliases?: string[]
  /** Same for the justification text. */
  justificationAliases?: string[]
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

const readFirst = (data: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) {
    const v = data[k]
    if (v !== undefined && v !== null) return v
  }
  return undefined
}

export function TemplateC({
  data,
  onChange,
  criteria,
  completePillLabel = 'Meets criteria',
  onAIDraft,
}: TemplateCProps) {
  const set = (k: string, v: unknown) => onChange({ ...data, [k]: v })

  const decisionFor = (c: TemplateCCriterion) =>
    readFirst(data, [`${c.key}_decision`, ...(c.decisionAliases ?? [])])
  const justificationFor = (c: TemplateCCriterion) =>
    readFirst(data, [`${c.key}_justification`, ...(c.justificationAliases ?? [])])

  const total = criteria.length
  const decided = criteria.filter((c) => isDecided(decisionFor(c))).length
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
        {criteria.map((c, i) => {
          const decisionKey = `${c.key}_decision`
          const justificationKey = `${c.key}_justification`
          return (
            <CriterionCard
              key={c.key}
              number={String(i + 1).padStart(2, '0')}
              title={c.title}
              definition={c.definition}
              decision={asDecision(decisionFor(c))}
              onDecisionChange={(v) => set(decisionKey, v)}
              justification={asString(justificationFor(c))}
              onJustificationChange={(v) => set(justificationKey, v)}
              evidence={c.evidence}
              onAIDraft={onAIDraft ? () => onAIDraft(c.key) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

export default TemplateC
