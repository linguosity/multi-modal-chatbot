/**
 * Tree + schema → slot completion status.
 *
 * Pure function. Drives the slot-level completion percentage that the
 * UI surfaces (replacing the coarser section-level "N/M complete"
 * heuristic). Also surfaces which slots are missing vs. present vs.
 * derived, so other parts of the app — AI extraction, export
 * validation, audit trails — can work off a single computed view.
 */

import { getSlotDef, getSectionSchema, SLOT_REGISTRY, type SlotDef } from './slots'
import type { SectionBlock, SectionTree } from './types'

export type SlotStatus = 'missing' | 'present' | 'derived'

export interface SlotCompletion {
  slotId: string
  status: SlotStatus
  required: boolean
  /** The value that resolved for this slot (either authored or derived). */
  value: unknown
  /**
   * Slot ids used to derive this value. Empty for directly-filled slots
   * and for `missing` entries.
   */
  derivedFrom?: readonly string[]
}

export interface TreeValidation {
  /** One entry per slot declared in the section's schema (if any). */
  slots: SlotCompletion[]
  /** `required ∩ missing` — slots that need values before the section can be considered done. */
  missingRequired: string[]
  /** `required ∩ (present ∪ derived)` over total required. 0..1. */
  completion: number
  /** Slot ids referenced by paragraphs in the tree that aren't in any registered schema. */
  orphanedSlotIds: string[]
}

/**
 * Collect every `{slot, value}` pair anywhere in the tree. Later
 * occurrences of the same slot overwrite earlier ones — if that ever
 * becomes a real concern we can switch to "first wins" or surface it
 * as a conflict; for now last-wins matches how edits flow.
 */
function collectSlotValues(tree: SectionTree): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const walk = (blocks: SectionBlock[]) => {
    for (const b of blocks) {
      if (b.kind === 'paragraph' && b.slot) {
        // Prefer the structured value when present; fall back to the text.
        out[b.slot] = b.value !== undefined ? b.value : b.text
      }
      walk(b.children)
    }
  }
  // Topic can also be slotted (e.g., for header-style sections).
  if (tree.topic.slot) {
    out[tree.topic.slot] = tree.topic.value !== undefined ? tree.topic.value : tree.topic.text
  }
  walk(tree.blocks)
  return out
}

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string' && value.trim() === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

function tryDerive(def: SlotDef, values: Record<string, unknown>): unknown | null {
  if (!def.inferFrom) return null
  // Only attempt derivation when every input is filled. Partial inputs
  // produce false-positive completions otherwise.
  for (const input of def.inferFrom.slots) {
    if (!isFilled(values[input])) return null
  }
  const inputs: Record<string, unknown> = {}
  for (const input of def.inferFrom.slots) inputs[input] = values[input]
  const result = def.inferFrom.compute(inputs)
  return isFilled(result) ? result : null
}

/**
 * Validate a tree against the registered schema for its section type.
 * When `sectionType` doesn't match any registered schema, validator
 * returns an empty report — treats every paragraph as free-form.
 */
export function validateTree(tree: SectionTree, sectionType: string): TreeValidation {
  const schema = getSectionSchema(sectionType)
  const values = collectSlotValues(tree)

  // Orphans: any slot id referenced by the tree but not declared in any registered schema.
  const orphanedSlotIds = Object.keys(values).filter((id) => !getSlotDef(id))

  if (!schema) {
    return {
      slots: [],
      missingRequired: [],
      completion: 0,
      orphanedSlotIds,
    }
  }

  const slots: SlotCompletion[] = schema.slotIds.map((slotId) => {
    const def = getSlotDef(slotId)
    if (!def) {
      // Schema references a slot id that isn't in the registry — log-
      // worthy, but don't crash. Treat as missing.
      return { slotId, status: 'missing' as const, required: false, value: null }
    }

    if (isFilled(values[slotId])) {
      return {
        slotId,
        status: 'present' as const,
        required: !!def.required,
        value: values[slotId],
      }
    }

    const derived = tryDerive(def, values)
    if (derived !== null) {
      return {
        slotId,
        status: 'derived' as const,
        required: !!def.required,
        value: derived,
        derivedFrom: def.inferFrom?.slots,
      }
    }

    return {
      slotId,
      status: 'missing' as const,
      required: !!def.required,
      value: null,
    }
  })

  const missingRequired = slots
    .filter((s) => s.required && s.status === 'missing')
    .map((s) => s.slotId)

  const requiredTotal = slots.filter((s) => s.required).length
  const requiredFilled = slots.filter(
    (s) => s.required && (s.status === 'present' || s.status === 'derived'),
  ).length
  const completion = requiredTotal === 0 ? 1 : requiredFilled / requiredTotal

  return {
    slots,
    missingRequired,
    completion,
    orphanedSlotIds,
  }
}

/**
 * Format a slot value for inline rendering. Mirrors the coercions in
 * interpolateTokens but is driven off the slot's declared type rather
 * than runtime guessing. Use when you know the slot context.
 */
export function formatSlotValue(def: SlotDef, value: unknown): string {
  if (!isFilled(value)) return '—'
  switch (def.type) {
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'months': {
      const n = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(n)) return String(value)
      if (n < 12) return `${n} month${n === 1 ? '' : 's'}`
      const years = Math.floor(n / 12)
      const rem = n % 12
      if (rem === 0) return `${years} year${years === 1 ? '' : 's'}`
      return `${years} year${years === 1 ? '' : 's'} ${rem} month${rem === 1 ? '' : 's'}`
    }
    case 'date': {
      const d = value instanceof Date ? value : new Date(String(value))
      if (Number.isNaN(d.getTime())) return String(value)
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    }
    case 'string-array':
      return Array.isArray(value)
        ? value.length === 0
          ? '—'
          : value.map(String).join(', ')
        : String(value)
    case 'number':
      return String(value)
    case 'enum':
    case 'string':
    default:
      return String(value)
  }
}

/** Re-export for consumers that want the registry and validator together. */
export { SLOT_REGISTRY, getSlotDef, getSectionSchema }
