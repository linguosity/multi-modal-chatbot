/**
 * Outline ⇄ Prose Section Editor — pure tree operations.
 *
 * These helpers are the substrate for Enter/Tab/Backspace and drag-drop.
 * Every structural edit flattens to {@link FlatNode}[], mutates that list,
 * runs `normalizeDepths`, and re-trees. Keeping the transformations pure
 * means the UI layer never has to reason about the invariant directly.
 *
 * Generic across block kinds — operations only care about `id` and
 * `children`. Kind-specific data (paragraph text, score-card fields,
 * criterion state) rides along on the block reference inside FlatNode.
 */

import type { FlatNode, SectionBlock, SectionNodeId } from './types'

/** Depth-first flatten. Root blocks sit at depth 0. */
export function toFlat(blocks: SectionBlock[], depth = 0, out: FlatNode[] = []): FlatNode[] {
  for (const b of blocks) {
    out.push({ id: b.id, depth, block: b })
    toFlat(b.children, depth + 1, out)
  }
  return out
}

/**
 * Inverse of {@link toFlat}. Assumes the `depth` invariant holds — that no
 * row jumps more than +1 from the previous. Run {@link normalizeDepths}
 * first if you've just mutated depths.
 */
export function toTree(flat: FlatNode[]): SectionBlock[] {
  const result: SectionBlock[] = []
  const stack: Array<{ children: SectionBlock[]; depth: number }> = [
    { children: result, depth: -1 },
  ]
  for (const item of flat) {
    while (stack[stack.length - 1].depth >= item.depth) stack.pop()
    // Re-emit the block but with a fresh empty children array — the
    // stack will populate it as deeper rows arrive.
    const rebuilt: SectionBlock = { ...item.block, children: [] } as SectionBlock
    stack[stack.length - 1].children.push(rebuilt)
    stack.push({ children: rebuilt.children, depth: item.depth })
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

/** Return the block with the given id anywhere in the tree, or null. */
export function findById(blocks: SectionBlock[], id: SectionNodeId): SectionBlock | null {
  for (const b of blocks) {
    if (b.id === id) return b
    const inChild = findById(b.children, id)
    if (inChild) return inChild
  }
  return null
}

/**
 * Insert `newBlock` as an immediate sibling after `targetId`. Returns the
 * new forest. If `targetId` is not found anywhere in the tree, appends at
 * root level so no edit is ever silently lost.
 */
export function insertAfter(
  blocks: SectionBlock[],
  targetId: SectionNodeId,
  newBlock: SectionBlock,
): SectionBlock[] {
  const stepInto = (arr: SectionBlock[]): { arr: SectionBlock[]; inserted: boolean } => {
    const out: SectionBlock[] = []
    let inserted = false
    for (const b of arr) {
      if (b.id === targetId) {
        out.push({ ...b })
        out.push(newBlock)
        inserted = true
        continue
      }
      const childResult = stepInto(b.children)
      if (childResult.inserted) inserted = true
      out.push({ ...b, children: childResult.arr } as SectionBlock)
    }
    return { arr: out, inserted }
  }
  const result = stepInto(blocks)
  if (result.inserted) return result.arr
  return [...blocks, newBlock]
}

/**
 * Remove the block with `id` (and its children) from anywhere in the tree.
 * Returns the new forest. No-op if `id` is not found.
 */
export function removeBlock(blocks: SectionBlock[], id: SectionNodeId): SectionBlock[] {
  const out: SectionBlock[] = []
  for (const b of blocks) {
    if (b.id === id) continue
    out.push({ ...b, children: removeBlock(b.children, id) } as SectionBlock)
  }
  return out
}

/** Back-compat alias. */
export const removePoint = removeBlock

/**
 * Return the depth of `id` within `blocks`, counting from 0 at the root.
 * Returns -1 if not found.
 */
export function depthOf(blocks: SectionBlock[], id: SectionNodeId, depth = 0): number {
  for (const b of blocks) {
    if (b.id === id) return depth
    const inChild = depthOf(b.children, id, depth + 1)
    if (inChild !== -1) return inChild
  }
  return -1
}

/**
 * Update a block in place by id, returning a new tree with the updated
 * block. The updater receives the old block and returns a new one (same
 * kind, presumably).
 */
export function updateBlock<T extends SectionBlock>(
  blocks: SectionBlock[],
  id: SectionNodeId,
  updater: (b: T) => T,
): SectionBlock[] {
  return blocks.map((b) => {
    if (b.id === id) return updater(b as unknown as T) as unknown as SectionBlock
    return { ...b, children: updateBlock(b.children, id, updater) } as SectionBlock
  })
}
