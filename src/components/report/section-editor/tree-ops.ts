/**
 * Outline ⇄ Prose Section Editor — pure tree operations.
 *
 * Spec: docs/outline-prose-editor-spec.md §7.5 (Flat list ↔ tree), §15.2.
 *
 * These helpers are the substrate for Enter/Tab/Backspace and drag-drop.
 * Every structural edit flattens to {@link FlatNode}[], mutates that list,
 * runs `normalizeDepths`, and re-trees. Keeping the transformations pure
 * means the UI layer never has to reason about the invariant directly.
 */

import type { FlatNode, SectionNode, SectionNodeId } from './types'

/** Depth-first flatten. Root points sit at depth 0. */
export function toFlat(nodes: SectionNode[], depth = 0, out: FlatNode[] = []): FlatNode[] {
  for (const n of nodes) {
    out.push({ id: n.id, text: n.text, depth })
    toFlat(n.children, depth + 1, out)
  }
  return out
}

/**
 * Inverse of {@link toFlat}. Assumes the `depth` invariant holds — that no
 * row jumps more than +1 from the previous. Run {@link normalizeDepths}
 * first if you've just mutated depths.
 */
export function toTree(flat: FlatNode[]): SectionNode[] {
  const result: SectionNode[] = []
  const stack: Array<{ children: SectionNode[]; depth: number }> = [
    { children: result, depth: -1 },
  ]
  for (const item of flat) {
    while (stack[stack.length - 1].depth >= item.depth) stack.pop()
    const node: SectionNode = { id: item.id, text: item.text, children: [] }
    stack[stack.length - 1].children.push(node)
    stack.push({ children: node.children, depth: item.depth })
  }
  return result
}

/**
 * Clamp any impossible depth jumps. After this runs, no row has a depth
 * more than one greater than its predecessor, and no row has a negative
 * depth. Mutates and returns the same list.
 */
export function normalizeDepths(flat: FlatNode[]): FlatNode[] {
  for (let i = 0; i < flat.length; i++) {
    const maxD = i === 0 ? 0 : flat[i - 1].depth + 1
    if (flat[i].depth > maxD) flat[i].depth = maxD
    if (flat[i].depth < 0) flat[i].depth = 0
  }
  return flat
}

/** Return the node with the given id anywhere in the tree, or null. */
export function findById(nodes: SectionNode[], id: SectionNodeId): SectionNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    const inChild = findById(n.children, id)
    if (inChild) return inChild
  }
  return null
}

/**
 * Insert `newNode` as an immediate sibling after `targetId`. Returns the
 * new forest. If `targetId` is not found anywhere in the tree, appends at
 * root level so no edit is ever silently lost.
 */
export function insertAfter(
  nodes: SectionNode[],
  targetId: SectionNodeId,
  newNode: SectionNode,
): SectionNode[] {
  const stepInto = (arr: SectionNode[]): { arr: SectionNode[]; inserted: boolean } => {
    const out: SectionNode[] = []
    let inserted = false
    for (const n of arr) {
      const nextChildren = n.id === targetId ? n.children : stepInto(n.children)
      if (n.id === targetId) {
        out.push({ ...n })
        out.push(newNode)
        inserted = true
        continue
      }
      if (Array.isArray(nextChildren)) {
        out.push({ ...n, children: nextChildren })
      } else {
        if (nextChildren.inserted) inserted = true
        out.push({ ...n, children: nextChildren.arr })
      }
    }
    return { arr: out, inserted }
  }
  const result = stepInto(nodes)
  if (result.inserted) return result.arr
  return [...nodes, newNode]
}

/**
 * Remove the node with `id` (and its children) from anywhere in the tree.
 * Returns the new forest. No-op if `id` is not found.
 */
export function removePoint(nodes: SectionNode[], id: SectionNodeId): SectionNode[] {
  const out: SectionNode[] = []
  for (const n of nodes) {
    if (n.id === id) continue
    out.push({ ...n, children: removePoint(n.children, id) })
  }
  return out
}

/**
 * Return the depth of `id` within `nodes`, counting from 0 at the root
 * points. Returns -1 if not found.
 */
export function depthOf(nodes: SectionNode[], id: SectionNodeId, depth = 0): number {
  for (const n of nodes) {
    if (n.id === id) return depth
    const inChild = depthOf(n.children, id, depth + 1)
    if (inChild !== -1) return inChild
  }
  return -1
}
