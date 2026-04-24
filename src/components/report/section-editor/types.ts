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

export interface SectionTree {
  id: SectionNodeId
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

export function makeParagraph(id: SectionNodeId, text = ''): ParagraphBlock {
  return { kind: 'paragraph', id, text, children: [] }
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
