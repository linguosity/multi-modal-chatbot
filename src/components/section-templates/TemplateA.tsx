'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldRow } from '@/components/primitives/FieldRow'
import { Pill } from '@/components/primitives/Pill'
import { SegmentedControl } from '@/components/primitives/SegmentedControl'
import { TextShort } from '@/components/primitives/TextShort'
import { DateField } from '@/components/primitives/DateField'
import { MultiSelectChips } from '@/components/primitives/MultiSelectChips'
import { AIChip, ComputedChip } from '@/components/primitives/StateChips'

/** Auto-filled side-rail fields produced upstream (PII, evaluator profile, etc). */
export interface TemplateAAutoFilled {
  evaluator_name?: string
  evaluator_credentials?: string
  eligibility_status?: string
  referred_by?: string
}

export interface TemplateAProps {
  /** structured_data JSON for this section */
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  /** Optional auto-filled fields (right rail). When omitted, render right lane empty/hidden. */
  autoFilled?: TemplateAAutoFilled
}

type GradeOption = 'Pre-K' | 'K' | '1' | '2' | '3' | '4' | '5'
const GRADE_OPTIONS: ReadonlyArray<GradeOption> = ['Pre-K', 'K', '1', '2', '3', '4', '5']
const LANGUAGE_SUGGESTIONS = [
  'Spanish',
  'English',
  'Mandarin',
  'Vietnamese',
  'Tagalog',
  'Korean',
  'Arabic',
]

// ─── Narrowing helpers (TS strict, no `any`) ───────────────────────────────

const asString = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

const asGrade = (v: unknown): GradeOption | undefined => {
  if (typeof v !== 'string') return undefined
  return (GRADE_OPTIONS as ReadonlyArray<string>).includes(v)
    ? (v as GradeOption)
    : undefined
}

/**
 * Returns "X years, Y months" for a YYYY-MM-DD birthdate, or null if unparseable.
 * Inclusive of partial month at end-date side; clamps months to [0, 11].
 */
function computeAge(dob: string | undefined): { years: number; months: number } | null {
  if (!dob) return null
  // Accept YYYY-MM-DD; bail on anything that doesn't look like a real date.
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - d.getFullYear()
  let months = now.getMonth() - d.getMonth()
  if (now.getDate() < d.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (years < 0) return null
  return { years, months }
}

function ageLabel(dob: string | undefined): string {
  const age = computeAge(dob)
  if (!age) return '—'
  return `${age.years} years, ${age.months} months`
}

function summaryAgeLabel(dob: string | undefined): string {
  const age = computeAge(dob)
  if (!age) return ''
  return `${age.years}y ${age.months}m`
}

// ─── Component ─────────────────────────────────────────────────────────────

export function TemplateA({ data, onChange, autoFilled }: TemplateAProps) {
  const set = <V,>(k: string, v: V) => onChange({ ...data, [k]: v })

  const firstName = asString(data.first_name)
  const lastName = asString(data.last_name)
  const dob = asString(data.date_of_birth)
  const studentId = asString(data.student_id)
  const grade = asGrade(data.grade)
  const schoolName = asString(data.school_name)
  const languages = asStringArray(data.primary_languages)
  const reportDate = asString(data.report_date)
  const evalDate = asString(data.evaluation_dates)

  const showSummary = Boolean(firstName && lastName && dob)
  const ageDisplay = ageLabel(dob)
  const summaryAge = summaryAgeLabel(dob)

  const hasAutoFilled =
    !!autoFilled &&
    Boolean(
      autoFilled.evaluator_name ||
        autoFilled.evaluator_credentials ||
        autoFilled.eligibility_status ||
        autoFilled.referred_by,
    )

  const eligibilityLabel = autoFilled?.eligibility_status ?? '● Meets criteria'

  return (
    <div className="flex flex-col">
      {showSummary && (
        <div
          className="flex flex-wrap items-center gap-2"
          style={{
            padding: '10px 16px',
            background: 'var(--tan-soft)',
            borderRadius: '8px 8px 0 0',
            border: '1px solid #d4c9ad',
            borderBottom: 'none',
          }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>
            {firstName} {lastName}
          </span>
          {summaryAge && (
            <>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--ink-3)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ·
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-2)',
                }}
              >
                {summaryAge}
              </span>
            </>
          )}
          {grade && (
            <>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--ink-3)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ·
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-2)',
                }}
              >
                {grade}
              </span>
            </>
          )}
          {languages.length > 0 && (
            <>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--ink-3)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ·
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-2)',
                }}
              >
                {languages.join(' / ')}
              </span>
            </>
          )}
        </div>
      )}

      <div
        style={{
          background: '#fff',
          border: '1.25px solid #d0d0d0',
          borderRadius: showSummary ? '0 0 8px 8px' : 8,
          padding: 0,
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: '1fr 260px',
            minHeight: 0,
          }}
        >
          {/* Left lane — manual fields */}
          <div
            className="flex flex-col"
            style={{ padding: '20px 24px', gap: 20 }}
          >
            {/* Cluster: Student Identity */}
            <div>
              <ClusterLabel>Student Identity</ClusterLabel>
              <div
                className="grid"
                style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}
              >
                <FieldRow label="First Name" required>
                  <TextShort
                    value={firstName}
                    onChange={(v) => set('first_name', v)}
                    placeholder="First name"
                  />
                </FieldRow>
                <FieldRow label="Last Name" required>
                  <TextShort
                    value={lastName}
                    onChange={(v) => set('last_name', v)}
                    placeholder="Last name"
                  />
                </FieldRow>
              </div>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <FieldRow label="Date of Birth" required>
                  <DateField
                    value={dob}
                    onChange={(v) => set('date_of_birth', v)}
                  />
                </FieldRow>
                <FieldRow label="Student ID">
                  <TextShort
                    value={studentId}
                    onChange={(v) => set('student_id', v)}
                    placeholder="ID #"
                  />
                </FieldRow>
                <FieldRow label="Age" chips={<ComputedChip />}>
                  <div
                    aria-label="Computed age"
                    style={{
                      padding: '7px 10px',
                      background: '#f9fafb',
                      border: '1px dashed #d0d0d0',
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--ink-2)',
                    }}
                  >
                    {ageDisplay}
                  </div>
                </FieldRow>
              </div>
            </div>

            <Divider />

            {/* Cluster: Schooling */}
            <div>
              <ClusterLabel>Schooling</ClusterLabel>
              <div
                className="grid"
                style={{ gridTemplateColumns: '140px 1fr', gap: 12 }}
              >
                <FieldRow label="Grade">
                  <SegmentedControl<GradeOption>
                    options={GRADE_OPTIONS}
                    value={grade ?? 'Pre-K'}
                    onChange={(v) => set('grade', v)}
                  />
                </FieldRow>
                <FieldRow label="School Name">
                  <TextShort
                    value={schoolName}
                    onChange={(v) => set('school_name', v)}
                    placeholder="School name"
                  />
                </FieldRow>
              </div>
              <div style={{ marginTop: 12 }}>
                <FieldRow label="Primary Language(s)">
                  <MultiSelectChips
                    value={languages}
                    onChange={(v) => set('primary_languages', v)}
                    suggestions={LANGUAGE_SUGGESTIONS}
                  />
                </FieldRow>
              </div>
            </div>

            <Divider />

            {/* Cluster: Evaluation Metadata */}
            <div>
              <ClusterLabel>Evaluation Metadata</ClusterLabel>
              <div
                className="grid"
                style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}
              >
                <FieldRow label="Report Date">
                  <DateField
                    value={reportDate}
                    onChange={(v) => set('report_date', v)}
                  />
                </FieldRow>
                <FieldRow label="Evaluation Date(s)">
                  <DateField
                    value={evalDate}
                    onChange={(v) => set('evaluation_dates', v)}
                  />
                </FieldRow>
              </div>
            </div>
          </div>

          {/* Right lane — auto-filled rail */}
          <div
            className="flex flex-col"
            style={{
              borderLeft: '1px dashed #e5e7eb',
              background: '#fafaf7',
              padding: '20px 16px',
              gap: 14,
            }}
          >
            <div
              className="flex items-center"
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--ink-4)',
                fontWeight: 700,
                gap: 6,
              }}
            >
              <Sparkles aria-hidden="true" className="h-2.5 w-2.5" />
              Auto-filled
            </div>

            {hasAutoFilled ? (
              <div className="flex flex-col" style={{ gap: 12 }}>
                {(autoFilled?.evaluator_name || autoFilled?.evaluator_credentials) && (
                  <div>
                    <RailLabel>Evaluator</RailLabel>
                    {autoFilled?.evaluator_name && (
                      <div
                        style={{
                          fontSize: 13,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--ink)',
                        }}
                      >
                        {autoFilled.evaluator_name}
                      </div>
                    )}
                    {autoFilled?.evaluator_credentials && (
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--ink-3)',
                        }}
                      >
                        {autoFilled.evaluator_credentials}
                      </div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <AIChip />
                    </div>
                  </div>
                )}

                {autoFilled?.eligibility_status !== undefined && (
                  <>
                    {(autoFilled?.evaluator_name || autoFilled?.evaluator_credentials) && (
                      <Divider />
                    )}
                    <div>
                      <RailLabel>Eligibility Status</RailLabel>
                      <Pill tone="terra">{eligibilityLabel}</Pill>
                      <div style={{ marginTop: 4 }}>
                        <AIChip />
                      </div>
                    </div>
                  </>
                )}

                {autoFilled?.referred_by && (
                  <>
                    {(autoFilled?.evaluator_name ||
                      autoFilled?.evaluator_credentials ||
                      autoFilled?.eligibility_status !== undefined) && <Divider />}
                    <div>
                      <RailLabel>Referred By</RailLabel>
                      <div
                        style={{
                          fontSize: 13,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--ink)',
                        }}
                      >
                        {autoFilled.referred_by}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div
                style={{
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-4)',
                  fontStyle: 'italic',
                }}
              >
                No auto-filled fields yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateA

// ─── Local atoms ───────────────────────────────────────────────────────────

function ClusterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn('font-mono')}
      style={{
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--ink-4)',
        marginBottom: 10,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  )
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        color: 'var(--ink-4)',
        fontFamily: 'var(--font-mono)',
        marginBottom: 3,
      }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#e5e7eb' }} />
}
