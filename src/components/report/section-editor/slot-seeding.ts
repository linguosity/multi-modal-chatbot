/**
 * Bridge from the AI-filled `structured_data` shape into the editor's
 * slot-annotated SectionTree.
 *
 * Used by the server-side AI routes after they finalize
 * `structured_data` for a section. We don't change what the AI
 * extracts — the extraction pipeline already does slot-grained work
 * via field paths — we just reshape it into a tree the editor can
 * render with slot indicators, evidence links, and per-slot
 * completion.
 *
 * Unknown / missing / empty slot values are skipped rather than
 * rendered as em-dash gaps: the interpolation path handles clinician-
 * visible gaps for already-authored content, but freshly-seeded trees
 * should only show the slots that actually came back filled.
 */

import { SECTION_SCHEMAS, SLOT_REGISTRY, getSlotDef, type SlotDef } from './slots'
import {
  CURRENT_SCHEMA_VERSION,
  makeParagraph,
  makeScoreCard,
  type SectionBlock,
  type SectionTree,
} from './types'
import { formatSlotValue } from './validator'

function tmpId(prefix = 'tmp'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

/** Canonical "is this slot filled?" check shared with the validator. */
function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string' && value.trim() === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

/**
 * Compose the prose a slotted paragraph should render with. Most
 * clinical sections follow a `Label: Value` convention (matches the
 * existing `prose_template`s), which reads cleanly in both outline
 * and prose views. Booleans get a full-sentence form so "No." as a
 * standalone paragraph doesn't look like a stub.
 */
function proseForSlot(def: SlotDef, value: unknown): string {
  const formatted = formatSlotValue(def, value)
  if (def.type === 'boolean' && typeof value === 'boolean') {
    // "Family history of communication disorders: Yes."
    return `${def.label}: ${formatted}.`
  }
  return `${def.label}: ${formatted}.`
}

export interface SeedTreeOptions {
  /**
   * Optional per-slot source references. Keys are slot ids, values are
   * source tokens (file ids, evidence refs, `ai:process-intake`, etc).
   * Carried onto the generated paragraph's `source` field so evidence
   * links survive into the editor.
   */
  sources?: Record<string, string | null>
  /**
   * Optional topic text. Overrides the default schema label if provided.
   */
  topicText?: string
}

/**
 * Build a SectionTree from an AI-filled structured_data object.
 *
 * Dispatch order:
 *   1. Registered slot schema (flat slot registry) — most sections.
 *   2. Specialized nested-shape handlers for sections whose
 *      structured_data isn't flat — assessment_results, assessment_tools.
 *   3. Return null — caller preserves content as-is (lets the client
 *      seed from plaintext fallback in contentToTree).
 */
export function seedTreeFromStructuredData(
  sectionType: string,
  structuredData: Record<string, unknown> | null | undefined,
  options: SeedTreeOptions = {},
): SectionTree | null {
  const data = structuredData ?? {}

  const schema = SECTION_SCHEMAS[sectionType]
  if (schema) {
    const sources = options.sources ?? {}
    const blocks = schema.slotIds
      .map((slotId) => {
        const def = getSlotDef(slotId)
        if (!def) return null
        const value = data[slotId]
        if (!isFilled(value)) return null
        return makeParagraph(tmpId(), proseForSlot(def, value), {
          slot: slotId,
          value,
          source: sources[slotId] ?? null,
        })
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)
    return {
      id: tmpId('section'),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      topic: makeParagraph(tmpId('topic'), options.topicText ?? schema.label),
      blocks,
    }
  }

  if (sectionType === 'assessment_results') {
    return seedAssessmentResultsTree(data, options)
  }
  if (sectionType === 'assessment_tools') {
    return seedAssessmentToolsTree(data, options)
  }
  return null
}

// ─── Specialized tree builders ─────────────────────────────────────────
//
// structured_data for assessment_results / assessment_tools carries
// array-of-record shapes the flat slot registry can't represent
// (standardized_tests[], tools[]). Rather than bend the slot model to
// fit, these handlers emit the right block *kind* — score-card for
// each test, paragraphs for narrative subsections — so the editor can
// render them natively.

interface ArrayRecord {
  [k: string]: unknown
}

function asString(v: unknown): string {
  if (v === undefined || v === null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

function seedAssessmentResultsTree(
  data: Record<string, unknown>,
  options: SeedTreeOptions,
): SectionTree {
  const blocks: SectionBlock[] = []

  // Standardized tests → one score-card block each.
  const tests = Array.isArray(data.standardized_tests)
    ? (data.standardized_tests as ArrayRecord[])
    : []
  for (const t of tests) {
    if (!t || typeof t !== 'object') continue
    const card = makeScoreCard(tmpId())
    card.testName = asString(t.test_name)
    card.subtest = asString(t.subtest ?? '')
    card.standardScore = asString(t.standard_score)
    card.percentile = asString(t.percentile_rank ?? t.percentile)
    card.interpretation = asString(t.interpretation)
    card.notes = asString(t.notes ?? '')
    // Skip fully-empty cards — they read as noise.
    if (
      !card.testName &&
      !card.standardScore &&
      !card.percentile &&
      !card.interpretation &&
      !card.notes
    ) {
      continue
    }
    blocks.push(card)
  }

  // Narrative subsections: each nested object's fields become
  // "Label: Value." paragraphs. Keeps them visible and editable
  // without needing a dedicated block kind for every domain.
  const narrativeKeys = [
    { key: 'articulation_phonology', label: 'Articulation / phonology' },
    { key: 'language_skills', label: 'Language skills' },
    { key: 'voice', label: 'Voice' },
    { key: 'fluency', label: 'Fluency' },
    { key: 'pragmatics', label: 'Pragmatics' },
  ]
  for (const { key, label } of narrativeKeys) {
    const sub = data[key]
    if (!sub || typeof sub !== 'object') continue
    const entries = Object.entries(sub as Record<string, unknown>).filter(([, v]) =>
      isFilled(v),
    )
    if (entries.length === 0) continue
    // Header paragraph (plain, unslotted) introducing the subsection.
    blocks.push(makeParagraph(tmpId(), label))
    for (const [fieldKey, value] of entries) {
      const humanLabel = fieldKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      const text = `${humanLabel}: ${String(value)}.`
      blocks.push(
        makeParagraph(tmpId(), text, {
          slot: `${key}.${fieldKey}`,
          value,
          source: null,
        }),
      )
    }
  }

  return {
    id: tmpId('section'),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    topic: makeParagraph(
      tmpId('topic'),
      options.topicText ?? 'Assessment results converge on the following findings.',
    ),
    blocks,
  }
}

function seedAssessmentToolsTree(
  data: Record<string, unknown>,
  options: SeedTreeOptions,
): SectionTree {
  const blocks: SectionBlock[] = []

  // `tools` is the canonical key used by ASSESSMENT_TOOLS_SECTION;
  // each item is a measure (name, type, administered date, purpose).
  const tools = Array.isArray(data.tools) ? (data.tools as ArrayRecord[]) : []
  for (const t of tools) {
    if (!t || typeof t !== 'object') continue
    const name = asString(t.name ?? t.test_name)
    const toolType = asString(t.type)
    const purpose = asString(t.purpose)
    if (!name && !toolType && !purpose) continue
    const parts: string[] = []
    if (name) parts.push(name)
    if (toolType) parts.push(`(${toolType})`)
    if (purpose) parts.push(`— ${purpose}`)
    blocks.push(
      makeParagraph(tmpId(), parts.join(' ') + '.', {
        slot: 'tools',
        value: t,
        source: null,
      }),
    )
  }

  // Any free-form narrative lives under `narrative`.
  const narrative = asString(data.narrative)
  if (narrative) {
    blocks.push(makeParagraph(tmpId(), narrative, { slot: 'tools.narrative', value: narrative }))
  }

  return {
    id: tmpId('section'),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    topic: makeParagraph(
      tmpId('topic'),
      options.topicText ??
        'The following measures were administered to evaluate the student.',
    ),
    blocks,
  }
}

/**
 * Convenience wrapper that serializes straight to the storage string
 * the `content` column expects. Returns null when seeding isn't
 * possible (unknown section type) — caller can then leave content
 * alone and just write structured_data.
 */
export function seedContentFromStructuredData(
  sectionType: string,
  structuredData: Record<string, unknown> | null | undefined,
  options: SeedTreeOptions = {},
): string | null {
  const tree = seedTreeFromStructuredData(sectionType, structuredData, options)
  return tree ? JSON.stringify(tree) : null
}

/** Re-exported for test / debug use. */
export { SLOT_REGISTRY }
