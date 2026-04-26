'use client'

/** Template E — structured recommendation (recommendations / accommodations variants). */

import React from 'react'
import { X } from 'lucide-react'
import { FieldRow } from '@/components/primitives/FieldRow'
import { MultiSelectChips } from '@/components/primitives/MultiSelectChips'
import { SegmentedControl } from '@/components/primitives/SegmentedControl'
import { TextLong } from '@/components/primitives/TextLong'
import { cn } from '@/lib/utils'

export interface TemplateEGoal {
  domain: string
  text: string
}

export interface TemplateEProps {
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  variant: 'recommendations' | 'accommodations'
  /** Optional callback for "+ Add from goal bank" link (recommendations variant). */
  onAddFromGoalBank?: () => void
}

// ─── Narrowing helpers ────────────────────────────────────────────────

function readStringArray(data: Record<string, unknown>, key: string): string[] | undefined {
  const v = data[key]
  if (!Array.isArray(v)) return undefined
  return v.every((x) => typeof x === 'string') ? (v as string[]) : undefined
}

function readString(data: Record<string, unknown>, key: string): string | undefined {
  const v = data[key]
  return typeof v === 'string' ? v : undefined
}

function readGoals(data: Record<string, unknown>): TemplateEGoal[] | undefined {
  const v = data.goals
  if (!Array.isArray(v)) return undefined
  const out: TemplateEGoal[] = []
  for (const item of v) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as { domain?: unknown }).domain === 'string' &&
      typeof (item as { text?: unknown }).text === 'string'
    ) {
      const g = item as { domain: string; text: string }
      out.push({ domain: g.domain, text: g.text })
    }
  }
  return out
}

// ─── Constants ────────────────────────────────────────────────────────

const TESTING_ACCOMMODATIONS = [
  'Extended time',
  'Small group setting',
  'Frequent breaks',
  'Oral administration',
  'Simplified directions',
  'Visual supports',
  'Reduced-distraction environment',
  'Familiar examiner/setting',
] as const

const CLASSROOM_MODS = [
  'Preferential seating',
  'Visual supports',
  'Break down multi-step directions',
  'Provide written checklists',
  'Allow extra processing time',
  'Pre-teach vocabulary',
  'Repeat/rephrase instructions',
  'Sentence frames / starters',
] as const

const ASSISTIVE_TECH = [
  'AAC device',
  'Visual schedule',
  'Communication board',
  'Speech-generating device',
] as const

const FREQUENCY_OPTIONS = [
  { label: '1×/wk', value: '1' },
  { label: '2×/wk', value: '2' },
  { label: '3×/wk', value: '3' },
  { label: '4×/wk', value: '4' },
  { label: '5×/wk', value: '5' },
] as const

const DURATION_OPTIONS = [
  { label: '20 min', value: '20' },
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
  { label: '60 min', value: '60' },
] as const

const SETTING_OPTIONS = [
  'Individual',
  'Small group',
  'Classroom',
  'Teletherapy',
] as const

const DEFAULT_SETTING: string[] = ['Individual', 'Small group']

const DEFAULT_GOALS: TemplateEGoal[] = [
  {
    domain: 'Articulation',
    text: 'Sofia will produce /k/ and /g/ sounds in initial position of words with 80% accuracy across 3 consecutive sessions.',
  },
  {
    domain: 'Expressive Language',
    text: 'Sofia will use subject-verb-object sentence structures (e.g., "I want juice") in 4 out of 5 opportunities.',
  },
  {
    domain: 'Phonology',
    text: 'Sofia will reduce cluster reduction patterns to less than 20% occurrence in connected speech.',
  },
]

// ─── Component ────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: '#fff',
  border: '1.25px solid var(--line-2)',
  borderRadius: 8,
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
}

const CLUSTER_HEADER_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--ink-4)',
  fontWeight: 700,
  marginBottom: 10,
}

export function TemplateE({
  data,
  onChange,
  variant,
  onAddFromGoalBank,
}: TemplateEProps) {
  const set = <V,>(key: string, value: V) => {
    onChange({ ...data, [key]: value })
  }

  // All field names below match ACCOMMODATIONS_SECTION in
  // src/lib/structured-schemas.ts — the schema the AI is given. Keep
  // these aligned so AI-extracted values land where the renderer reads.
  if (variant === 'accommodations') {
    const testing = readStringArray(data, 'testing_accommodations') ?? []
    const classroom = readStringArray(data, 'classroom_modifications') ?? []
    // assistive_technology is a string in the schema, but the UI is a
    // chip multiselect — accept either shape.
    const assistive =
      readStringArray(data, 'assistive_technology') ??
      (readString(data, 'assistive_technology')
        ? [readString(data, 'assistive_technology') as string]
        : [])
    const otherSupports = readString(data, 'other_supports') ?? ''

    return (
      <div style={{ ...CARD_STYLE, gap: 16 }}>
        <FieldRow label="Testing Accommodations">
          <MultiSelectChips
            value={testing}
            onChange={(v) => set('testing_accommodations', v)}
            suggestions={[...TESTING_ACCOMMODATIONS]}
          />
        </FieldRow>
        <FieldRow label="Classroom Modifications">
          <MultiSelectChips
            value={classroom}
            onChange={(v) => set('classroom_modifications', v)}
            suggestions={[...CLASSROOM_MODS]}
          />
        </FieldRow>
        <FieldRow label="Assistive Technology">
          <MultiSelectChips
            value={assistive}
            onChange={(v) => set('assistive_technology', v)}
            suggestions={[...ASSISTIVE_TECH]}
          />
        </FieldRow>
        <FieldRow label="Other Supports">
          <TextLong
            value={otherSupports}
            onChange={(v) => set('other_supports', v)}
            placeholder="Additional supports or services…"
            rows={2}
          />
        </FieldRow>
      </div>
    )
  }

  // Recommendations variant. Field names match RECOMMENDATIONS_SECTION
  // in src/lib/structured-schemas.ts — the schema the AI is given.
  // `service_setting` is a free-form string in the schema; split on
  // common delimiters into the multi-select shape the UI expects.
  const frequency = readString(data, 'service_frequency') ?? '2'
  const duration = readString(data, 'session_duration') ?? '30'
  const settingArr = readStringArray(data, 'service_setting')
  const settingStr = readString(data, 'service_setting')
  const setting =
    settingArr ??
    (settingStr
      ? settingStr
          .split(/[,;/]|\band\b/i)
          .map((s) => s.trim())
          .filter(Boolean)
      : DEFAULT_SETTING)
  // The schema declares `goals_targets` as a single string; until the
  // schema gains a structured goal-array, surface the prose as a single
  // editable goal so the clinician can split it instead of losing it.
  const goalsFromData = readGoals(data)
  const goalsTargets = readString(data, 'goals_targets')
  const goals: TemplateEGoal[] =
    goalsFromData && goalsFromData.length > 0
      ? goalsFromData
      : goalsTargets
        ? [{ domain: 'AI-extracted', text: goalsTargets }]
        : DEFAULT_GOALS
  const usingDefaultGoals =
    (!goalsFromData || goalsFromData.length === 0) && !goalsTargets

  // Goals writes intentionally use 'goals' (a structured array key) even
  // though the AI emits prose into 'goals_targets'. Once the clinician
  // edits / splits, the structured array becomes canonical and the
  // single 'AI-extracted' card disappears.
  const removeGoal = (index: number) => {
    const next = goals.filter((_, i) => i !== index)
    set('goals', next)
  }

  const showSummary = Boolean(frequency && duration)

  return (
    <div style={{ ...CARD_STYLE, gap: 20 }}>
      {/* Service Delivery cluster */}
      <div>
        <div style={CLUSTER_HEADER_STYLE}>Service Delivery</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <FieldRow label="Frequency">
            <SegmentedControl
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onChange={(v) => set('service_frequency', v)}
            />
          </FieldRow>
          <FieldRow label="Session Duration">
            <SegmentedControl
              options={DURATION_OPTIONS}
              value={duration}
              onChange={(v) => set('session_duration', v)}
            />
          </FieldRow>
        </div>
        <div style={{ marginTop: 12 }}>
          <FieldRow label="Service Setting">
            <MultiSelectChips
              value={setting}
              onChange={(v) => set('service_setting', v)}
              suggestions={[...SETTING_OPTIONS]}
              freeAdd={false}
            />
          </FieldRow>
        </div>

        {showSummary && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'var(--tan-soft)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              className="font-mono"
              style={{ fontSize: 12, color: 'var(--ink-2)' }}
            >
              {frequency}× per week · {duration} min · {setting.join(' + ')}
            </span>
          </div>
        )}
      </div>

      {/* Hairline divider */}
      <div style={{ height: 1, background: 'var(--line-2)' }} />

      {/* Goals / Targets cluster */}
      <div>
        <div
          style={{
            ...CLUSTER_HEADER_STYLE,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Goals / Targets</span>
          <button
            type="button"
            onClick={onAddFromGoalBank}
            className={cn(
              'cursor-pointer border-0 bg-transparent font-mono',
            )}
            style={{
              fontSize: 10,
              color: '#2563eb',
              letterSpacing: '0.06em',
            }}
          >
            + Add from goal bank
          </button>
        </div>

        {goals.map((g, i) => (
          <div
            key={i}
            style={{
              padding: '12px 14px',
              border: '1px solid var(--line-2)',
              borderRadius: 8,
              marginBottom: 8,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <span
              className="font-mono"
              style={{
                padding: '3px 8px',
                borderRadius: 99,
                background: 'var(--tan-soft)',
                fontSize: 10,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                marginTop: 2,
              }}
            >
              {g.domain}
            </span>
            <div
              className="font-mono"
              style={{
                flex: 1,
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--ink)',
              }}
            >
              {g.text}
            </div>
            <button
              type="button"
              onClick={() => {
                if (usingDefaultGoals) {
                  // Materialize defaults so deletion sticks.
                  const next = DEFAULT_GOALS.filter((_, idx) => idx !== i)
                  set('goals', next)
                  return
                }
                removeGoal(i)
              }}
              aria-label={`Remove ${g.domain} goal`}
              className="border-0 bg-transparent cursor-pointer"
              style={{ color: '#d1d5db', flexShrink: 0, padding: 2 }}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TemplateE
