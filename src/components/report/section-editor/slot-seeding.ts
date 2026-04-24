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
import { CURRENT_SCHEMA_VERSION, makeParagraph, type SectionTree } from './types'
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
 * Build a SectionTree from an AI-filled structured_data object. Returns
 * null when the section type isn't in SECTION_SCHEMAS — the caller
 * should fall back to whatever it was doing before (most likely just
 * persisting structured_data and letting the client-side editor seed
 * the tree from content lazily).
 */
export function seedTreeFromStructuredData(
  sectionType: string,
  structuredData: Record<string, unknown> | null | undefined,
  options: SeedTreeOptions = {},
): SectionTree | null {
  const schema = SECTION_SCHEMAS[sectionType]
  if (!schema) return null
  const data = structuredData ?? {}
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
