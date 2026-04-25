'use client'

import React from 'react'
import { FieldRow } from '@/components/primitives/FieldRow'
import { TextLong } from '@/components/primitives/TextLong'
import { MultiSelectChips } from '@/components/primitives/MultiSelectChips'
import { SegmentedControl } from '@/components/primitives/SegmentedControl'
import { AIChip, LinkedChip } from '@/components/primitives/StateChips'
import { YesNoDecision } from '@/components/primitives/YesNoDecision'
import { cn } from '@/lib/utils'

/**
 * TemplateB — narrative template with configurable fields.
 *
 * Field shapes supported (see `TemplateBField`):
 *   - text   (default): long-form prose with optional AI draft + linked source chip
 *   - yesno: bordered sub-card with binary decision and optional justification text
 *   - select: free-add chip multi-select with suggestions
 *   - chips: single-pick segmented control
 *
 * Reads/writes happen on `data[field.key]` via `set(k, v)`. Yes/No decisions
 * are persisted as `data[`${field.key}_decision`]: boolean | null` and
 * justifications (when configured) as `data[field.justificationKey]: string`.
 */

export type TemplateBField =
  | {
      key: string
      label: string
      type?: 'text'
      placeholder?: string
      rows?: number
      ai?: boolean
      linked?: string
    }
  | {
      key: string
      label: string
      type: 'yesno'
      justificationKey?: string
      justificationPlaceholder?: string
    }
  | {
      key: string
      label: string
      type: 'select'
      suggestions?: string[]
    }
  | {
      key: string
      label: string
      type: 'chips'
      options: string[]
    }

export interface TemplateBProps {
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  fields: TemplateBField[]
  /** Optional AI-draft handler invoked when an AI-marked field's draft button fires. */
  onAIDraft?: (fieldKey: string) => void
}

// ─── Narrowing helpers (TS strict, no `any`) ───────────────────────────────

const asString = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

const asYesNo = (v: unknown): boolean | null => {
  if (v === true || v === false) return v
  return null
}

// ─── Component ─────────────────────────────────────────────────────────────

export function TemplateB({ data, onChange, fields, onAIDraft }: TemplateBProps) {
  const set = (k: string, v: unknown) => onChange({ ...data, [k]: v })

  return (
    <div
      className={cn('flex flex-col')}
      style={{
        background: '#fff',
        border: '1.25px solid var(--line-2)',
        borderRadius: 8,
        padding: '20px 24px',
        gap: 16,
      }}
    >
      {fields.map((field) => {
        if (field.type === 'yesno') {
          const decisionKey = `${field.key}_decision`
          const decision = asYesNo(data[decisionKey])
          const showJustification =
            decision !== null && Boolean(field.justificationKey)
          const justificationValue = field.justificationKey
            ? asString(data[field.justificationKey])
            : undefined

          return (
            <div
              key={field.key}
              style={{
                border: '1px solid var(--line-2)',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: showJustification ? 8 : 0 }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: 'var(--ink)',
                  }}
                >
                  {field.label}
                </span>
                <YesNoDecision
                  value={decision}
                  onChange={(v) => set(decisionKey, v)}
                  size="sm"
                />
              </div>
              {showJustification && field.justificationKey && (
                <TextLong
                  value={justificationValue}
                  onChange={(v) => set(field.justificationKey!, v)}
                  placeholder={
                    field.justificationPlaceholder || 'Provide details…'
                  }
                  rows={2}
                />
              )}
            </div>
          )
        }

        if (field.type === 'select') {
          return (
            <FieldRow key={field.key} label={field.label}>
              <MultiSelectChips
                value={asStringArray(data[field.key])}
                onChange={(v) => set(field.key, v)}
                suggestions={field.suggestions || []}
              />
            </FieldRow>
          )
        }

        if (field.type === 'chips') {
          const value = asString(data[field.key]) ?? ''
          return (
            <FieldRow key={field.key} label={field.label}>
              <SegmentedControl<string>
                options={field.options}
                value={value}
                onChange={(v) => set(field.key, v)}
              />
            </FieldRow>
          )
        }

        // Default: text (long-form)
        const chips = field.linked ? (
          <LinkedChip from={field.linked} />
        ) : field.ai ? (
          <AIChip />
        ) : null

        return (
          <FieldRow key={field.key} label={field.label} chips={chips}>
            <TextLong
              value={asString(data[field.key])}
              onChange={(v) => set(field.key, v)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              onAIDraft={
                field.ai ? () => onAIDraft?.(field.key) : undefined
              }
            />
          </FieldRow>
        )
      })}
    </div>
  )
}

export default TemplateB
