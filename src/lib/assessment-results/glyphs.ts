/**
 * Visual mapping for the convergence matrix and per-finding source-marker
 * chips. Glyphs are deliberately Unicode (no images) so they print cleanly
 * at any zoom level and survive Word/PDF export. Labels are the
 * accessible-name spelled-out form for screen readers and tooltips.
 *
 * Treat this as the visual source of truth — both the matrix renderer
 * (rows × cols with cell glyphs) and the per-finding chip pull from these
 * exact constants so the two zoom levels stay consistent.
 */

import type { AssessmentFinding } from '@/lib/structured-schemas'

export const FINDING_GLYPHS: Record<AssessmentFinding, string> = {
  concern: '●',   // filled — eye reads it as "weight"
  mixed: '◐',     // half-filled — partial concern
  wnl: '○',       // hollow — null result, no flag
  strength: '◎',  // filled-in-hollow — actively above expectation
  na: '—',        // em-dash — source did not assess this domain
}

export const FINDING_LABELS: Record<AssessmentFinding, string> = {
  concern: 'Concern',
  mixed: 'Mixed / partial concern',
  wnl: 'Within expected range',
  strength: 'Strength',
  na: 'Not assessed',
}

/**
 * Two-tone palette. Background reads from a glance ("how many red cells in
 * this row?"); foreground keeps the glyph legible at small sizes. All
 * values are CSS variables defined in globals.css so the matrix and chips
 * follow the wireframe palette automatically.
 */
export const FINDING_COLORS: Record<AssessmentFinding, { bg: string; fg: string }> = {
  concern: { bg: '#fbe7da', fg: 'var(--terracotta-ink)' },
  mixed: { bg: '#fef3c7', fg: '#7a6135' },
  wnl: { bg: 'var(--paper-2)', fg: 'var(--ink-3)' },
  strength: { bg: '#e8f0df', fg: '#4e6a52' },
  na: { bg: 'transparent', fg: 'var(--ink-4)' },
}

/**
 * Compress a tool title to 2-3 character initials for the matrix column
 * header and the chip badge. Strips punctuation, collapses whitespace, and
 * picks the leading char of each word; for single-word titles, falls back
 * to the first 3 characters.
 *
 *   "Parent Communication Questionnaire" → "PCQ"
 *   "CELF-5"                              → "CELF"  (single word, first 4)
 *   "Classroom Observation"               → "CO"
 *   "GFTA-3"                              → "GFTA"
 */
export function initialsFor(title: string | undefined): string {
  if (!title) return '??'
  const cleaned = title.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) return '??'
  const words = cleaned.split(' ')
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase()
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}
