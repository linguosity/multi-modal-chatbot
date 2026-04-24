/**
 * Outline ⇄ Prose Section Editor — shared types.
 *
 * Unified block model. A section is a topic paragraph plus a tree of
 * blocks. Blocks are kind-discriminated:
 *
 *   • paragraph  — free text. The default. Outline shows as a numbered
 *                  point; prose shows as its own <p>.
 *   • score-card — a standardized test result (test name, standard
 *                  score, percentile, interpretation). Outline shows as
 *                  a compact labeled form; prose generates a sentence.
 *   • criterion  — a checklist item (label, met boolean, justification).
 *                  Outline shows the label with a ☐/☑ toggle; prose
 *                  generates a sentence.
 *
 * All blocks carry stable ids and a `children` array so the outline's
 * tree operations (Tab/Shift-Tab, drag, normalize) work identically
 * regardless of kind.
 */

export type SectionNodeId = string

export type BlockKind = 'paragraph' | 'score-card' | 'criterion'

interface BlockBase {
  id: SectionNodeId
  children: SectionBlock[]
}

export interface ParagraphBlock extends BlockBase {
  kind: 'paragraph'
  text: string
  /**
   * Canonical slot id this paragraph fills (see `slots.ts`). Optional —
   * free-form paragraphs without an assigned slot are the default, a
   * first-class state, not a bug. The clinician never sees this field;
   * it guides AI extraction and validation only.
   */
  slot?: string
  /**
   * Structured value behind the prose, when the slot has a richer
   * representation than the text (e.g. `{ months: 14 }` behind
   * "First words emerged around 14 months"). Treated as a stale
   * extraction hint once the clinician edits `text`; reconciliation
   * with a type-aware parser is a follow-up.
   */
  value?: unknown
  /**
   * Where the value came from — a Supabase file id, evidence chip id,
   * "ai:process-intake", or "user". Null when user-authored without
   * upstream evidence.
   */
  source?: string | null
}

export interface ScoreCardBlock extends BlockBase {
  kind: 'score-card'
  testName: string
  subtest: string
  /** Free-string to allow dashes, ranges, etc. Display code parses as needed. */
  standardScore: string
  percentile: string
  interpretation: string
  notes: string
}

export interface CriterionBlock extends BlockBase {
  kind: 'criterion'
  label: string
  /** null = not yet evaluated; true / false once decided. */
  met: boolean | null
  justification: string
}

export type SectionBlock = ParagraphBlock | ScoreCardBlock | CriterionBlock

/**
 * Current schema version for freshly-authored trees. Bump when the
 * slot registry or block model changes in a backward-incompatible way.
 * Trees authored under an older version should still load (see
 * content-adapter.normalizeTree) — the renderer falls back to treating
 * unknown slot ids as free-form text. Old reports never auto-migrate;
 * offer migration at a natural boundary (e.g. "this report uses an
 * older template, update?") so the clinician has control.
 */
export const CURRENT_SCHEMA_VERSION = 1

export interface SectionTree {
  id: SectionNodeId
  /** Defaults to CURRENT_SCHEMA_VERSION for new trees; preserved verbatim for older ones. */
  schemaVersion?: number
  topic: ParagraphBlock
  blocks: SectionBlock[]
}

export type SectionEditorMode = 'outline' | 'prose'

export type EditOp =
  | {
      kind: 'text-edit'
      nodeId: SectionNodeId
      prev: string
      next: string
    }
  | {
      kind: 'insert'
      nodeId: SectionNodeId
      parentId: SectionNodeId | null
      index: number
    }
  | {
      kind: 'delete'
      nodeId: SectionNodeId
      prev: SectionBlock
    }
  | {
      kind: 'move'
      nodeId: SectionNodeId
      prev: { parentId: SectionNodeId | null; index: number; depth: number }
      next: { parentId: SectionNodeId | null; index: number; depth: number }
    }

/**
 * Flat representation used transiently by tree-ops for drag math,
 * Tab/Shift-Tab, and normalization. The original block is carried so
 * toTree can reconstitute kind-specific data after a depth mutation.
 */
export interface FlatNode {
  id: SectionNodeId
  depth: number
  block: SectionBlock
}

// ── Block factories ───────────────────────────────────────────────────

export function makeParagraph(
  id: SectionNodeId,
  text = '',
  opts: { slot?: string; value?: unknown; source?: string | null } = {},
): ParagraphBlock {
  return {
    kind: 'paragraph',
    id,
    text,
    children: [],
    ...(opts.slot !== undefined ? { slot: opts.slot } : {}),
    ...(opts.value !== undefined ? { value: opts.value } : {}),
    ...(opts.source !== undefined ? { source: opts.source } : {}),
  }
}

export function makeScoreCard(id: SectionNodeId): ScoreCardBlock {
  return {
    kind: 'score-card',
    id,
    testName: '',
    subtest: '',
    standardScore: '',
    percentile: '',
    interpretation: '',
    notes: '',
    children: [],
  }
}

export function makeCriterion(id: SectionNodeId, label = ''): CriterionBlock {
  return {
    kind: 'criterion',
    id,
    label,
    met: null,
    justification: '',
    children: [],
  }
}

// ── Kind guards ───────────────────────────────────────────────────────

export function isParagraph(b: SectionBlock): b is ParagraphBlock {
  return b.kind === 'paragraph'
}
export function isScoreCard(b: SectionBlock): b is ScoreCardBlock {
  return b.kind === 'score-card'
}
export function isCriterion(b: SectionBlock): b is CriterionBlock {
  return b.kind === 'criterion'
}

/**
 * Back-compat alias. Most existing callers were written when every
 * block was a paragraph. New code should prefer `SectionBlock` and
 * narrow via `isParagraph` where text access is needed.
 */
export type SectionNode = SectionBlock
