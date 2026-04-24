/**
 * Outline ⇄ Prose Section Editor — shared types.
 *
 * Spec: docs/outline-prose-editor-spec.md §3 (Data model), §4 (Component API).
 *
 * One section is a topic sentence plus a tree of point nodes. Outline and
 * prose views are two renderings of the same tree — they never diverge.
 */

export type SectionNodeId = string

export interface SectionNode {
  id: SectionNodeId
  text: string
  children: SectionNode[]
}

export interface SectionTree {
  id: SectionNodeId
  topic: { id: SectionNodeId; text: string }
  points: SectionNode[]
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
      prev: SectionNode
    }
  | {
      kind: 'move'
      nodeId: SectionNodeId
      prev: { parentId: SectionNodeId | null; index: number; depth: number }
      next: { parentId: SectionNodeId | null; index: number; depth: number }
    }
  | {
      kind: 'prose-restructure'
      replacedIds: SectionNodeId[]
      insertedIds: SectionNodeId[]
    }

/**
 * Flat representation used transiently by tree-ops for drag math,
 * Tab/Shift-Tab, and normalization. Round-trips losslessly with
 * {@link SectionNode}[] via `toFlat` / `toTree`.
 */
export interface FlatNode {
  id: SectionNodeId
  text: string
  depth: number
}
