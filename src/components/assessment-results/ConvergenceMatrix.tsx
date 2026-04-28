'use client'

/**
 * Section-opening convergence matrix.
 *
 * Rows are domains (from domain_summary[]), columns are tools that contributed
 * evidence to at least one domain. Each cell shows the source's finding for
 * that domain as a single Unicode glyph (●◐○◎—). Convergence becomes visible
 * as a pattern at a glance: a row of mostly ● across many columns is a
 * high-convergence concern; a row with one ● and the rest — is a single-
 * source finding the reader should weight cautiously.
 *
 * Designed to render statically on a printed page — pure HTML/CSS, no
 * tooltips required to decode (the legend below the matrix carries the same
 * information). Tooltips are still attached for hovering readers.
 */

import * as React from 'react'
import type {
  AssessmentDomainSummary,
  AssessmentFinding,
  AssessmentTool,
} from '@/lib/structured-schemas'
import { bucketFor, MATRIX_BUCKETS } from '@/lib/structured-schemas'
import {
  FINDING_GLYPHS,
  FINDING_LABELS,
  FINDING_COLORS,
  initialsFor,
} from '@/lib/assessment-results/glyphs'
import { withDerivedConvergence } from '@/lib/assessment-results/convergence'

export interface ConvergenceMatrixProps {
  domainSummary: readonly AssessmentDomainSummary[]
  tools: readonly AssessmentTool[]
  /** Hide the legend if a parent component already renders one. */
  showLegend?: boolean
  className?: string
}

const BUCKET_LABELS: Record<string, string> = {
  standardized: 'Standardized',
  informant_report: 'Informant',
  observation: 'Observation',
  language_sample: 'Sample',
}

/**
 * Build a Map<tool_id, Map<domain, finding>> from the per-domain evidence
 * arrays, the inversion the matrix needs. The renderer falls back to 'na'
 * when a (tool, domain) pair has no evidence entry, which is the visual
 * "this source did not assess this domain" cell.
 */
function buildCellLookup(
  domainSummary: readonly AssessmentDomainSummary[],
): Map<string, Map<string, AssessmentFinding>> {
  const out = new Map<string, Map<string, AssessmentFinding>>()
  for (const d of domainSummary ?? []) {
    for (const e of d.evidence ?? []) {
      let row = out.get(e.tool_id)
      if (!row) {
        row = new Map()
        out.set(e.tool_id, row)
      }
      row.set(d.domain, e.finding)
    }
  }
  return out
}

export function ConvergenceMatrix({
  domainSummary,
  tools,
  showLegend = true,
  className,
}: ConvergenceMatrixProps) {
  // Re-derive convergence on each entry so the matrix shows the truth even
  // when stored convergence is stale (e.g. a clinician just toggled a
  // finding glyph in the editor and the cache hasn't caught up).
  const rows = (domainSummary ?? [])
    .filter((d) => !!d?.domain)
    .map(withDerivedConvergence)
  if (rows.length === 0) return null

  const cellLookup = buildCellLookup(rows)
  const usedToolIds = new Set(cellLookup.keys())

  // Only render columns for tools that actually contributed evidence.
  // Sort by bucketFor so the same kind of source clusters visually
  // (standardized first, then informant_report, observation, language_sample,
  // then anything unrecognized).
  const bucketOrder = MATRIX_BUCKETS as readonly string[]
  const usedTools = (tools ?? [])
    .filter((t) => usedToolIds.has(t.id))
    .slice()
    .sort((a, b) => {
      const ba = bucketFor(a.measure_type) ?? 'other'
      const bb = bucketFor(b.measure_type) ?? 'other'
      const ai = bucketOrder.indexOf(ba)
      const bi = bucketOrder.indexOf(bb)
      const aOrder = ai === -1 ? bucketOrder.length : ai
      const bOrder = bi === -1 ? bucketOrder.length : bi
      if (aOrder !== bOrder) return aOrder - bOrder
      // Same bucket → alphabetical by title for a stable secondary order.
      return (a.title || a.id).localeCompare(b.title || b.id)
    })

  if (usedTools.length === 0) return null

  // Pre-compute bucket boundaries so we can render a thicker border between
  // groups (e.g. standardized | informant_report) and a small bucket-label
  // header row above each group.
  const bucketSpans: Array<{ bucket: string; start: number; end: number }> = []
  for (let i = 0; i < usedTools.length; i += 1) {
    const b = bucketFor(usedTools[i].measure_type) ?? 'other'
    const last = bucketSpans[bucketSpans.length - 1]
    if (!last || last.bucket !== b) {
      bucketSpans.push({ bucket: b, start: i, end: i })
    } else {
      last.end = i
    }
  }

  return (
    <div className={className} role="region" aria-label="Source × domain convergence matrix">
      <table
        className="font-mono"
        style={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontSize: 11,
          tableLayout: 'fixed',
          background: 'var(--card-surface)',
          border: '1px solid var(--line)',
          borderRadius: 4,
        }}
      >
        <thead>
          {/* Bucket label row — small uppercase headers above each group. */}
          <tr>
            <th
              scope="col"
              style={{
                textAlign: 'left',
                padding: '6px 10px',
                background: 'var(--paper-2)',
                borderBottom: '1px solid var(--line-2)',
                fontSize: 10,
                letterSpacing: '0.08em',
                color: 'var(--ink-4)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Domain
            </th>
            {bucketSpans.map((span) => (
              <th
                key={`bucket-${span.bucket}-${span.start}`}
                colSpan={span.end - span.start + 1}
                style={{
                  textAlign: 'center',
                  padding: '6px 4px',
                  background: 'var(--paper-2)',
                  borderBottom: '1px solid var(--line-2)',
                  borderLeft: '1.5px solid var(--line)',
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  color: 'var(--ink-4)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {BUCKET_LABELS[span.bucket] ?? span.bucket}
              </th>
            ))}
          </tr>
          {/* Per-tool initials row. */}
          <tr>
            <th
              scope="col"
              style={{
                padding: '4px 10px',
                background: 'var(--paper-2)',
                borderBottom: '1.5px solid var(--line)',
              }}
            />
            {usedTools.map((t, i) => {
              const span = bucketSpans.find((s) => i === s.start)
              return (
                <th
                  key={t.id}
                  scope="col"
                  title={t.title}
                  style={{
                    textAlign: 'center',
                    padding: '4px 6px',
                    width: 44,
                    background: 'var(--paper-2)',
                    borderBottom: '1.5px solid var(--line)',
                    borderLeft: span ? '1.5px solid var(--line)' : '1px solid var(--line-2)',
                    fontSize: 10,
                    color: 'var(--ink-2)',
                  }}
                >
                  {initialsFor(t.title)}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((d, rIdx) => {
            const isLast = rIdx === rows.length - 1
            return (
              <tr key={`${d.domain}:${rIdx}`}>
                <th
                  scope="row"
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    fontWeight: 500,
                    color: 'var(--ink)',
                    borderBottom: isLast ? 'none' : '1px solid #f0ede6',
                    fontSize: 11,
                    background: 'var(--card-surface)',
                  }}
                >
                  {d.domain}
                </th>
                {usedTools.map((t, i) => {
                  const finding = cellLookup.get(t.id)?.get(d.domain) ?? 'na'
                  const colors = FINDING_COLORS[finding]
                  const span = bucketSpans.find((s) => i === s.start)
                  const evidenceEntry = (d.evidence ?? []).find((e) => e.tool_id === t.id)
                  const titleAttr = `${t.title} · ${d.domain} · ${FINDING_LABELS[finding]}${
                    evidenceEntry?.note ? ` — ${evidenceEntry.note}` : ''
                  }`
                  return (
                    <td
                      key={`${d.domain}:${t.id}`}
                      title={titleAttr}
                      aria-label={titleAttr}
                      style={{
                        textAlign: 'center',
                        padding: '6px 4px',
                        borderBottom: isLast ? 'none' : '1px solid #f0ede6',
                        borderLeft: span ? '1.5px solid var(--line)' : '1px solid #f0ede6',
                        background: colors.bg,
                        color: colors.fg,
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      <span aria-hidden>{FINDING_GLYPHS[finding]}</span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      {showLegend && (
        <div
          className="font-mono"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 8,
            fontSize: 10,
            color: 'var(--ink-3)',
          }}
          aria-label="Legend"
        >
          {(['concern', 'mixed', 'wnl', 'strength', 'na'] as const).map((f) => (
            <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  border: '1px solid var(--line)',
                  background: FINDING_COLORS[f].bg,
                  color: FINDING_COLORS[f].fg,
                  fontSize: 12,
                  lineHeight: 1,
                }}
              >
                {FINDING_GLYPHS[f]}
              </span>
              {FINDING_LABELS[f]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default ConvergenceMatrix
