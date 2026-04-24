/**
 * Unit tests for tree-ops. Spec §12.1.
 *
 * Uses the same global `describe`/`it`/`expect` style as the existing
 * `src/lib/__tests__/*.test.ts` files. Not runnable until a test runner
 * (vitest per CLAUDE.md) is installed — tracked as a follow-up.
 */

import {
  toFlat,
  toTree,
  normalizeDepths,
  findById,
  insertAfter,
  removePoint,
  depthOf,
} from '../tree-ops'
import type { FlatNode, SectionNode } from '../types'

const leaf = (id: string, text = id): SectionNode => ({ id, text, children: [] })
const branch = (id: string, text: string, children: SectionNode[]): SectionNode => ({
  id,
  text,
  children,
})

describe('toFlat / toTree', () => {
  it('round-trips a flat forest losslessly', () => {
    const forest: SectionNode[] = [leaf('a', 'A'), leaf('b', 'B'), leaf('c', 'C')]
    const flat = toFlat(forest)
    expect(flat).toEqual([
      { id: 'a', text: 'A', depth: 0 },
      { id: 'b', text: 'B', depth: 0 },
      { id: 'c', text: 'C', depth: 0 },
    ])
    expect(toTree(flat)).toEqual(forest)
  })

  it('round-trips a nested forest losslessly', () => {
    const forest: SectionNode[] = [
      branch('a', 'A', [leaf('a1', 'A1'), branch('a2', 'A2', [leaf('a2a', 'A2A')])]),
      leaf('b', 'B'),
    ]
    const flat = toFlat(forest)
    expect(flat.map((n) => [n.id, n.depth])).toEqual([
      ['a', 0],
      ['a1', 1],
      ['a2', 1],
      ['a2a', 2],
      ['b', 0],
    ])
    expect(toTree(flat)).toEqual(forest)
  })

  it('returns empty for empty input', () => {
    expect(toFlat([])).toEqual([])
    expect(toTree([])).toEqual([])
  })
})

describe('normalizeDepths', () => {
  it('leaves valid depths unchanged', () => {
    const flat: FlatNode[] = [
      { id: 'a', text: 'A', depth: 0 },
      { id: 'b', text: 'B', depth: 1 },
      { id: 'c', text: 'C', depth: 1 },
      { id: 'd', text: 'D', depth: 0 },
    ]
    const out = normalizeDepths(flat.slice())
    expect(out.map((n) => n.depth)).toEqual([0, 1, 1, 0])
  })

  it('clamps a +2 jump down to +1', () => {
    const flat: FlatNode[] = [
      { id: 'a', text: 'A', depth: 0 },
      { id: 'b', text: 'B', depth: 2 }, // invalid: +2 from previous
    ]
    normalizeDepths(flat)
    expect(flat[1].depth).toBe(1)
  })

  it('clamps first-row depth to 0', () => {
    const flat: FlatNode[] = [{ id: 'a', text: 'A', depth: 3 }]
    normalizeDepths(flat)
    expect(flat[0].depth).toBe(0)
  })

  it('clamps negative depths to 0', () => {
    const flat: FlatNode[] = [
      { id: 'a', text: 'A', depth: 0 },
      { id: 'b', text: 'B', depth: -1 },
    ]
    normalizeDepths(flat)
    expect(flat[1].depth).toBe(0)
  })
})

describe('findById', () => {
  const forest: SectionNode[] = [
    branch('a', 'A', [leaf('a1', 'A1'), branch('a2', 'A2', [leaf('a2a', 'A2A')])]),
    leaf('b', 'B'),
  ]

  it('finds root-level nodes', () => {
    expect(findById(forest, 'a')?.text).toBe('A')
    expect(findById(forest, 'b')?.text).toBe('B')
  })

  it('finds deeply nested nodes', () => {
    expect(findById(forest, 'a2a')?.text).toBe('A2A')
  })

  it('returns null for missing ids', () => {
    expect(findById(forest, 'nope')).toBeNull()
  })
})

describe('insertAfter', () => {
  it('inserts at root level', () => {
    const forest: SectionNode[] = [leaf('a'), leaf('b')]
    const out = insertAfter(forest, 'a', leaf('x'))
    expect(out.map((n) => n.id)).toEqual(['a', 'x', 'b'])
  })

  it('inserts as a sibling under a nested parent', () => {
    const forest: SectionNode[] = [branch('a', 'A', [leaf('a1'), leaf('a2')])]
    const out = insertAfter(forest, 'a1', leaf('x'))
    expect(out[0].children.map((c) => c.id)).toEqual(['a1', 'x', 'a2'])
  })

  it('appends at root if target is not found (no silent loss)', () => {
    const forest: SectionNode[] = [leaf('a')]
    const out = insertAfter(forest, 'missing', leaf('x'))
    expect(out.map((n) => n.id)).toEqual(['a', 'x'])
  })
})

describe('removePoint', () => {
  it('removes a root node', () => {
    const forest: SectionNode[] = [leaf('a'), leaf('b'), leaf('c')]
    expect(removePoint(forest, 'b').map((n) => n.id)).toEqual(['a', 'c'])
  })

  it('removes a nested node', () => {
    const forest: SectionNode[] = [branch('a', 'A', [leaf('a1'), leaf('a2')])]
    const out = removePoint(forest, 'a1')
    expect(out[0].children.map((c) => c.id)).toEqual(['a2'])
  })

  it('removes an entire subtree', () => {
    const forest: SectionNode[] = [branch('a', 'A', [branch('a1', 'A1', [leaf('a1a')])]), leaf('b')]
    const out = removePoint(forest, 'a1')
    expect(out[0].children).toEqual([])
    expect(out.map((n) => n.id)).toEqual(['a', 'b'])
  })

  it('is a no-op for missing ids', () => {
    const forest: SectionNode[] = [leaf('a')]
    expect(removePoint(forest, 'missing')).toEqual(forest)
  })
})

describe('depthOf', () => {
  const forest: SectionNode[] = [
    branch('a', 'A', [branch('a1', 'A1', [leaf('a1a')])]),
    leaf('b'),
  ]

  it('returns 0 for root nodes', () => {
    expect(depthOf(forest, 'a')).toBe(0)
    expect(depthOf(forest, 'b')).toBe(0)
  })

  it('returns the correct depth for nested nodes', () => {
    expect(depthOf(forest, 'a1')).toBe(1)
    expect(depthOf(forest, 'a1a')).toBe(2)
  })

  it('returns -1 for missing ids', () => {
    expect(depthOf(forest, 'nope')).toBe(-1)
  })
})
