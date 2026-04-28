'use client'

/**
 * Template F — assessment_results section.
 *
 * Layout, top to bottom:
 *   1. Section-opening convergence matrix (rows = domains, cols = tools).
 *   2. summary_of_results — cross-domain headline paragraph (editable).
 *   3. One card per domain_summary[i], each showing:
 *        • domain title + verdict pill + per-finding source-marker chips
 *        • rubric: can_do / support_needed / contexts (line-edit, comma list)
 *        • either the auto-derived prose OR the clinician's narrative_override
 *        • a toggle to install / clear the override
 *
 * tools[] for the matrix and chips comes from the sibling assessment_tools
 * section via useReport(). Editing flows through onChange so saves go back
 * to the canonical schema (no field renaming on round-trip).
 */

import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { FieldRow } from '@/components/primitives/FieldRow'
import { ConvergenceMatrix } from '@/components/assessment-results/ConvergenceMatrix'
import { SourceMarkerChips } from '@/components/assessment-results/SourceMarkerChips'
import { renderDomainProse } from '@/lib/assessment-results/auto-prose'
import { reconcileDomainSummary, withDerivedConvergence } from '@/lib/assessment-results/convergence'
import { useReport } from '@/lib/context/ReportContext'
import type {
  AssessmentDomainSummary,
  AssessmentEvidence,
  AssessmentTool,
} from '@/lib/structured-schemas'
import { cn } from '@/lib/utils'

export interface TemplateFProps {
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

// ─── Narrowing ───────────────────────────────────────────────────────────

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function readDomainSummary(v: unknown): AssessmentDomainSummary[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object')
    .map((d): AssessmentDomainSummary => ({
      domain: asString(d.domain),
      can_do: asStringArray(d.can_do),
      support_needed: asStringArray(d.support_needed),
      contexts: asStringArray(d.contexts),
      evidence: Array.isArray(d.evidence)
        ? (d.evidence as unknown[])
            .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
            .map((e) => ({
              tool_id: asString(e.tool_id),
              finding: (asString(e.finding) || 'na') as AssessmentEvidence['finding'],
              note: typeof e.note === 'string' ? e.note : undefined,
            }))
        : [],
      convergence:
        d.convergence && typeof d.convergence === 'object'
          ? {
              level: (asString((d.convergence as any).level) || 'single_source') as any,
              agreeing_tool_ids: asStringArray((d.convergence as any).agreeing_tool_ids),
              conflicting_tool_ids: asStringArray((d.convergence as any).conflicting_tool_ids),
              rationale:
                typeof (d.convergence as any).rationale === 'string'
                  ? (d.convergence as any).rationale
                  : undefined,
            }
          : { level: 'single_source', agreeing_tool_ids: [] },
      narrative_override:
        typeof d.narrative_override === 'string' ? d.narrative_override : undefined,
    }))
}

function readToolsFromReport(report: { sections?: Array<{ sectionType?: string | null; structured_data?: unknown }> } | null): AssessmentTool[] {
  if (!report?.sections) return []
  const toolsSection = report.sections.find((s) => s.sectionType === 'assessment_tools')
  const sd = (toolsSection?.structured_data as { tools?: unknown }) ?? {}
  if (!Array.isArray(sd.tools)) return []
  return sd.tools
    .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
    .map(
      (t): AssessmentTool => ({
        id: asString(t.id) || asString(t.title).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown_tool',
        title: asString(t.title) || asString(t.id),
        measure_type: asString(t.measure_type) || undefined,
        administered_date: asString(t.administered_date) || undefined,
        target_population: asString(t.target_population) || undefined,
        purpose: asString(t.purpose) || undefined,
        notes: asString(t.notes) || undefined,
        domains_assessed: asStringArray(t.domains_assessed),
        completed: typeof t.completed === 'boolean' ? t.completed : undefined,
      }),
    )
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function deriveVerdict(d: AssessmentDomainSummary): {
  label: string
  bg: string
  fg: string
} {
  const strengths = (d.can_do ?? []).filter(Boolean).length
  const concerns = (d.support_needed ?? []).filter(Boolean).length
  if (strengths > 0 && concerns === 0) return { label: 'Strength', bg: '#e8f0df', fg: '#4e6a52' }
  if (concerns > 0 && strengths === 0) return { label: 'Concern', bg: '#fbe7da', fg: 'var(--terracotta-ink)' }
  if (strengths > 0 && concerns > 0) return { label: 'Mixed', bg: '#fef3c7', fg: '#7a6135' }
  return { label: '—', bg: 'var(--paper-2)', fg: 'var(--ink-3)' }
}

const inputBase: React.CSSProperties = {
  width: '100%',
  fontSize: 12,
  padding: '6px 8px',
  border: '1.25px solid var(--line-2)',
  borderRadius: 4,
  background: 'white',
  outline: 'none',
  fontFamily: 'var(--font-mono)',
}

// ─── Component ───────────────────────────────────────────────────────────

export function TemplateF({ data, onChange }: TemplateFProps) {
  const { report } = useReport() as { report: any }
  const tools = React.useMemo(() => readToolsFromReport(report), [report])

  const summary = asString(data.summary_of_results)
  // domain_summary on disk may be (a) the canonical clean shape from the
  // route's reconcile pass, (b) a malformed shape from an older run (nested
  // arrays, duplicate canonical domains), or (c) the migrated shape with
  // legacy *_notes archived into narrative_override on stub entries.
  // reconcileDomainSummary normalizes all three into the clean shape and
  // re-derives convergence; using it as the read view means every edit
  // writes back the clean form (self-heals on first interaction).
  const reconciledFromDisk = React.useMemo(
    () => reconcileDomainSummary(data.domain_summary),
    [data.domain_summary],
  )
  // Defensive fallback: if reconcile turns up empty but the disk shape had
  // entries we couldn't normalize, fall through to the loose reader so the
  // user still sees something to edit.
  const domainSummary = React.useMemo(
    () => (reconciledFromDisk.length > 0 ? reconciledFromDisk : readDomainSummary(data.domain_summary)),
    [reconciledFromDisk, data.domain_summary],
  )

  const updateSummary = (next: string) => {
    onChange({ ...data, summary_of_results: next })
  }

  const updateDomain = (index: number, patch: Partial<AssessmentDomainSummary>) => {
    const nextDomains = domainSummary.map((d, i) =>
      i === index ? withDerivedConvergence({ ...d, ...patch }) : d,
    )
    onChange({ ...data, domain_summary: nextDomains })
  }

  const clearOverride = (index: number) => {
    const nextDomains = domainSummary.map((d, i) => {
      if (i !== index) return d
      const { narrative_override: _drop, ...rest } = d as any
      return withDerivedConvergence(rest as AssessmentDomainSummary)
    })
    onChange({ ...data, domain_summary: nextDomains })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1) Convergence matrix */}
      {domainSummary.length > 0 && tools.length > 0 && (
        <ConvergenceMatrix domainSummary={domainSummary} tools={tools} />
      )}

      {/* 2) Cross-domain summary */}
      <div>
        <FieldRow label="Summary of Results">
          <textarea
            value={summary}
            onChange={(e) => updateSummary(e.target.value)}
            rows={5}
            placeholder="3–5 sentence cross-domain synthesis. Lead with the primary-concern domain; cite each other domain briefly."
            style={{ ...inputBase, fontFamily: 'inherit' }}
          />
        </FieldRow>
      </div>

      {/* 3) Per-domain cards */}
      <div className="flex flex-col gap-4">
        {domainSummary.map((d, i) => (
          <DomainCard
            key={`${d.domain || 'domain'}-${i}`}
            index={i}
            domain={d}
            tools={tools}
            onChange={(patch) => updateDomain(i, patch)}
            onClearOverride={() => clearOverride(i)}
          />
        ))}
        {domainSummary.length === 0 && (
          <div
            className="font-mono"
            style={{
              padding: 16,
              border: '1.25px dashed var(--line-2)',
              borderRadius: 6,
              background: 'var(--paper)',
              color: 'var(--ink-3)',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            No domain rows yet — run AI Intake or add a tool that covers a domain.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Domain card ─────────────────────────────────────────────────────────

interface DomainCardProps {
  index: number
  domain: AssessmentDomainSummary
  tools: AssessmentTool[]
  onChange: (patch: Partial<AssessmentDomainSummary>) => void
  onClearOverride: () => void
}

function DomainCard({ domain, tools, onChange, onClearOverride }: DomainCardProps) {
  const [open, setOpen] = React.useState(true)
  const verdict = deriveVerdict(domain)
  const autoProse = renderDomainProse({ ...domain, narrative_override: undefined }, tools)
  const override = (domain.narrative_override || '').trim()
  const proseToShow = override || autoProse

  return (
    <div
      style={{
        border: '1.25px solid var(--line-2)',
        borderRadius: 6,
        background: 'var(--card-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        className="cursor-pointer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: open ? '#fefce8' : 'transparent',
          borderBottom: open ? '1px solid var(--line-2)' : 'none',
        }}
      >
        <ChevronRight
          size={14}
          style={{
            color: 'var(--ink-4)',
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 100ms',
            flexShrink: 0,
          }}
        />
        <span
          className="font-mono"
          style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', flex: 1, minWidth: 0 }}
        >
          {domain.domain || <em style={{ color: 'var(--ink-4)' }}>Untitled domain</em>}
        </span>
        <span
          className="font-mono"
          style={{
            padding: '2px 10px',
            borderRadius: 99,
            fontSize: 10.5,
            background: verdict.bg,
            color: verdict.fg,
            border: '1px solid var(--line)',
          }}
        >
          {verdict.label}
        </span>
        <SourceMarkerChips evidence={domain.evidence ?? []} tools={tools} size="sm" />
      </div>

      {open && (
        <div style={{ padding: '14px 14px 16px 36px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Auto-prose / override preview */}
          {proseToShow && (
            <div
              style={{
                background: override ? '#fffef7' : 'var(--paper)',
                border: '1px dashed var(--line-2)',
                borderRadius: 4,
                padding: '10px 12px',
                fontSize: 12.5,
                lineHeight: 1.55,
                color: 'var(--ink)',
              }}
            >
              <div
                className="font-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-4)',
                  marginBottom: 4,
                }}
              >
                {override ? 'Clinician override' : 'Auto-generated prose'}
              </div>
              {proseToShow}
            </div>
          )}

          {/* Rubric: strengths / concerns / contexts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FieldRow label="Strengths (can_do)">
              <textarea
                value={(domain.can_do ?? []).join('\n')}
                onChange={(e) => onChange({ can_do: splitLines(e.target.value) })}
                rows={4}
                placeholder="One per line. e.g. Almost always follows everyday directions (4/4)"
                style={inputBase}
              />
            </FieldRow>
            <FieldRow label="Concerns (support_needed)">
              <textarea
                value={(domain.support_needed ?? []).join('\n')}
                onChange={(e) => onChange({ support_needed: splitLines(e.target.value) })}
                rows={4}
                placeholder="One per line. e.g. Rarely easy for unfamiliar listeners to understand (1/4)"
                style={inputBase}
              />
            </FieldRow>
          </div>

          <FieldRow label="Contexts">
            <input
              type="text"
              value={(domain.contexts ?? []).join(', ')}
              onChange={(e) =>
                onChange({
                  contexts: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="comma-separated, e.g. Home, Classroom, Outside the family"
              style={inputBase}
            />
          </FieldRow>

          {/* Override editor */}
          <div>
            <FieldRow
              label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  Narrative override
                  {override && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClearOverride()
                      }}
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        border: '1px solid var(--line)',
                        borderRadius: 3,
                        background: 'transparent',
                        color: 'var(--ink-3)',
                        cursor: 'pointer',
                      }}
                    >
                      Clear (use auto-prose)
                    </button>
                  )}
                </span>
              }
            >
              <textarea
                value={domain.narrative_override ?? ''}
                onChange={(e) => onChange({ narrative_override: e.target.value })}
                rows={3}
                placeholder="Leave blank to use auto-generated prose. Filling this overrides the auto-prose for this domain only."
                style={{ ...inputBase, fontFamily: 'inherit' }}
              />
            </FieldRow>
          </div>

          {/* Evidence read-only summary */}
          {(domain.evidence?.length ?? 0) > 0 && (
            <div
              className="font-mono"
              style={{ fontSize: 10.5, color: 'var(--ink-3)' }}
            >
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 8 }}>
                Evidence
              </span>
              <span>
                {domain.evidence!
                  .map((e) => {
                    const tool = tools.find((t) => t.id === e.tool_id)
                    return `${tool?.title || e.tool_id} → ${e.finding}${e.note ? ` (${e.note})` : ''}`
                  })
                  .join(' · ')}
              </span>
            </div>
          )}

          {/* Convergence read-only summary */}
          {domain.convergence && (
            <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 8 }}>
                Convergence
              </span>
              <span>
                {domain.convergence.level}
                {domain.convergence.agreeing_tool_ids.length > 0 &&
                  ` — agree: ${domain.convergence.agreeing_tool_ids.join(', ')}`}
                {(domain.convergence.conflicting_tool_ids?.length ?? 0) > 0 &&
                  ` · conflict: ${domain.convergence.conflicting_tool_ids!.join(', ')}`}
                {domain.convergence.rationale ? ` · ${domain.convergence.rationale}` : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default TemplateF
