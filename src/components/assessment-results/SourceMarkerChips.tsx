'use client'

/**
 * Per-finding source-marker chips.
 *
 * Renders one small chip per evidence[] entry, showing the source's initials
 * plus the finding glyph. Visually clusters to suggest convergence: a row of
 * mostly-filled (●) chips reads "concern from many sources" at a glance,
 * matching the section-opening matrix at a zoomed-in level.
 *
 * Used inline next to a domain's headline or per-item rubric entry — same
 * information as the matrix, scoped to one domain, so the reader doesn't
 * have to flip back to remember which sources fed which finding.
 */

import * as React from 'react'
import type {
  AssessmentEvidence,
  AssessmentTool,
} from '@/lib/structured-schemas'
import {
  FINDING_GLYPHS,
  FINDING_LABELS,
  FINDING_COLORS,
  initialsFor,
} from '@/lib/assessment-results/glyphs'

export interface SourceMarkerChipsProps {
  evidence: readonly AssessmentEvidence[]
  /** Tool inventory used to resolve tool_id → human-readable title. */
  tools: readonly AssessmentTool[]
  /** Compact (default) for inline use; spacious for standalone callouts. */
  size?: 'sm' | 'md'
  /** When false, evidence with finding='na' is hidden (default). */
  showNotAssessed?: boolean
  /** Optional className for parent positioning. */
  className?: string
}

export function SourceMarkerChips({
  evidence,
  tools,
  size = 'sm',
  showNotAssessed = false,
  className,
}: SourceMarkerChipsProps) {
  const items = (evidence ?? [])
    .filter((e) => (showNotAssessed ? true : e.finding !== 'na'))
    .map((e) => {
      const tool = tools.find((t) => t.id === e.tool_id)
      const title = tool?.title || e.tool_id
      const colors = FINDING_COLORS[e.finding]
      return {
        key: `${e.tool_id}:${e.finding}`,
        title: `${title} — ${FINDING_LABELS[e.finding]}${e.note ? ` · ${e.note}` : ''}`,
        glyph: FINDING_GLYPHS[e.finding],
        initials: initialsFor(title),
        bg: colors.bg,
        fg: colors.fg,
      }
    })

  if (items.length === 0) return null

  const dim = size === 'sm' ? 22 : 28
  const fontSize = size === 'sm' ? 10 : 12
  const glyphSize = size === 'sm' ? 11 : 14

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      role="list"
      aria-label="Source markers"
    >
      {items.map((item) => (
        <span
          key={item.key}
          role="listitem"
          title={item.title}
          aria-label={item.title}
          className="font-mono"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            height: dim,
            padding: '0 5px',
            borderRadius: 4,
            border: '1px solid var(--line)',
            background: item.bg,
            color: item.fg,
            fontSize,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          <span aria-hidden style={{ fontSize: glyphSize }}>{item.glyph}</span>
          <span>{item.initials}</span>
        </span>
      ))}
    </span>
  )
}

export default SourceMarkerChips
