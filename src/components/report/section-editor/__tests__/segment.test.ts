/**
 * Unit tests for segment / dice / matchIds / commitProse. Spec §12.1.
 *
 * Same global-style conventions as the sibling tree-ops.test.ts.
 */

import {
  toProse,
  segment,
  dice,
  matchIds,
  isStructurePreserved,
  commitProse,
} from '../segment'
import type { SectionNode, SectionTree } from '../types'

let counter = 0
const idFactory = () => `id_${++counter}`

beforeEach(() => {
  counter = 0
})

const tree = (
  topicId: string,
  topicText: string,
  points: SectionNode[],
): SectionTree => ({
  id: 'section',
  topic: { id: topicId, text: topicText },
  points,
})

const leaf = (id: string, text: string): SectionNode => ({ id, text, children: [] })

describe('toProse', () => {
  it('joins topic + depth-first points with ". "', () => {
    const t = tree('t', 'Lucia presents with reduced intelligibility', [
      leaf('p1', 'She attends second grade'),
      leaf('p2', 'Medical history is unremarkable'),
    ])
    expect(toProse(t)).toBe(
      'Lucia presents with reduced intelligibility. She attends second grade. Medical history is unremarkable.',
    )
  })

  it('flattens nested children inline, no depth markers', () => {
    const t = tree('t', 'Topic', [
      { id: 'p1', text: 'Parent', children: [leaf('p1a', 'Child')] },
    ])
    expect(toProse(t)).toBe('Topic. Parent. Child.')
  })

  it('strips trailing punctuation from each node before joining', () => {
    const t = tree('t', 'Topic.', [leaf('p1', 'Point!'), leaf('p2', 'Another?')])
    expect(toProse(t)).toBe('Topic. Point. Another.')
  })

  it('returns empty string for an empty section', () => {
    expect(toProse(tree('t', '', []))).toBe('')
  })
})

describe('segment', () => {
  it('splits a simple two-sentence paragraph', () => {
    const out = segment('First sentence. Second sentence.')
    expect(out.length).toBe(2)
    expect(out[0]).toMatch(/First sentence/)
    expect(out[1]).toMatch(/Second sentence/)
  })

  it('keeps abbreviations like "Dr." in the same sentence', () => {
    const out = segment('Dr. Smith evaluated Lucia. The results follow.')
    expect(out.length).toBe(2)
    expect(out[0]).toMatch(/Dr\. Smith/)
  })

  it('keeps decimals / stats like "p < .05" intact', () => {
    const out = segment('Results were significant (p < .05). Further work is needed.')
    expect(out.length).toBe(2)
    expect(out[0]).toMatch(/p < \.05/)
  })

  it('returns [] for empty input', () => {
    expect(segment('')).toEqual([])
    expect(segment('   ')).toEqual([])
  })

  it('returns a single item for a single sentence with no terminator', () => {
    const out = segment('just one sentence no period')
    expect(out.length).toBe(1)
  })
})

describe('dice', () => {
  it('returns 1 for identical strings', () => {
    expect(dice('hello world', 'hello world')).toBe(1)
  })

  it('returns 1 for both empty', () => {
    expect(dice('', '')).toBe(1)
  })

  it('returns 0 for one empty', () => {
    expect(dice('hello', '')).toBe(0)
    expect(dice('', 'hello')).toBe(0)
  })

  it('returns 0 for disjoint word sets', () => {
    expect(dice('alpha beta', 'gamma delta')).toBe(0)
  })

  it('is case- and punctuation-insensitive', () => {
    expect(dice('Hello, World!', 'hello world')).toBe(1)
  })

  it('is monotonic-ish: more shared words → higher score', () => {
    const high = dice('the quick brown fox', 'the quick brown cat')
    const low = dice('the quick brown fox', 'slow green turtle')
    expect(high).toBeGreaterThan(low)
  })
})

describe('matchIds', () => {
  it('preserves ids on exact matches', () => {
    const oldFlat = [
      { id: 'a', text: 'Sentence one.' },
      { id: 'b', text: 'Sentence two.' },
    ]
    const { matched, removedIds } = matchIds(
      oldFlat,
      ['Sentence one.', 'Sentence two.'],
      idFactory,
    )
    expect(matched.map((m) => m.id)).toEqual(['a', 'b'])
    expect(matched.every((m) => !m.inserted)).toBe(true)
    expect(removedIds).toEqual([])
  })

  it('preserves id via fuzzy match for a single-word edit', () => {
    const oldFlat = [{ id: 'a', text: 'She attends Lincoln Elementary.' }]
    const { matched } = matchIds(
      oldFlat,
      ['She attends Lincoln Heights Elementary.'],
      idFactory,
    )
    expect(matched[0].id).toBe('a')
    expect(matched[0].inserted).toBe(false)
  })

  it('mints fresh ids for unrelated new sentences', () => {
    const oldFlat = [{ id: 'a', text: 'The apple is red.' }]
    const { matched, removedIds } = matchIds(oldFlat, ['Clouds roll over the hill.'], idFactory)
    expect(matched[0].inserted).toBe(true)
    expect(matched[0].id).toMatch(/^id_/)
    expect(removedIds).toEqual(['a'])
  })

  it('does not reuse an old id across multiple new sentences', () => {
    const oldFlat = [{ id: 'a', text: 'The sky is blue.' }]
    const { matched } = matchIds(
      oldFlat,
      ['The sky is blue.', 'The sky is blue.'],
      idFactory,
    )
    expect(matched[0].id).toBe('a')
    expect(matched[1].inserted).toBe(true)
  })

  it('reports removed ids when sentences are dropped', () => {
    const oldFlat = [
      { id: 'a', text: 'Keep me.' },
      { id: 'b', text: 'Drop me.' },
    ]
    const { matched, removedIds } = matchIds(oldFlat, ['Keep me.'], idFactory)
    expect(matched[0].id).toBe('a')
    expect(removedIds).toEqual(['b'])
  })

  it('tunes via threshold: high threshold forces fresh ids on heavy edits', () => {
    const oldFlat = [{ id: 'a', text: 'The quick brown fox jumps.' }]
    const loose = matchIds(oldFlat, ['brown fox slept quietly'], idFactory, 0.2)
    expect(loose.matched[0].id).toBe('a')
    counter = 0
    const strict = matchIds(oldFlat, ['brown fox slept quietly'], idFactory, 0.9)
    expect(strict.matched[0].inserted).toBe(true)
  })
})

describe('isStructurePreserved', () => {
  it('true when lengths match and ids align in order', () => {
    const old = [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ]
    const matched = [
      { id: 'a', text: 'A edited', inserted: false },
      { id: 'b', text: 'B edited', inserted: false },
    ]
    expect(isStructurePreserved(old, matched)).toBe(true)
  })

  it('false when length differs', () => {
    const old = [{ id: 'a', text: 'A' }]
    expect(
      isStructurePreserved(old, [
        { id: 'a', text: 'A', inserted: false },
        { id: 'x', text: 'X', inserted: true },
      ]),
    ).toBe(false)
  })

  it('false when order differs', () => {
    const old = [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ]
    const matched = [
      { id: 'b', text: 'B', inserted: false },
      { id: 'a', text: 'A', inserted: false },
    ]
    expect(isStructurePreserved(old, matched)).toBe(false)
  })
})

describe('commitProse — preserved branch', () => {
  it('updates text by id and keeps the tree intact', () => {
    const prev = tree('t', 'Topic stays', [
      {
        id: 'p1',
        text: 'Parent original',
        children: [leaf('p1a', 'Child original')],
      },
    ])
    const newProse = 'Topic stays. Parent edited. Child original.'
    const { next, op } = commitProse(prev, newProse, idFactory)
    expect(op).toBeNull()
    expect(next.topic.id).toBe('t')
    expect(next.topic.text).toBe('Topic stays')
    expect(next.points[0].id).toBe('p1')
    expect(next.points[0].text).toBe('Parent edited')
    // Children preserved.
    expect(next.points[0].children[0].id).toBe('p1a')
    expect(next.points[0].children[0].text).toBe('Child original')
  })
})

describe('commitProse — flattened branch', () => {
  it('rebuilds depth-0 points when a sentence is deleted', () => {
    const prev = tree('t', 'Topic', [
      leaf('p1', 'Keep me'),
      leaf('p2', 'Drop me'),
      leaf('p3', 'Also keep'),
    ])
    const { next, op } = commitProse(prev, 'Topic. Keep me. Also keep.', idFactory)
    expect(op?.kind).toBe('prose-restructure')
    expect(op?.replacedIds).toContain('p2')
    expect(op?.insertedIds).toEqual([])
    expect(next.points.map((p) => p.id)).toEqual(['p1', 'p3'])
    expect(next.points.every((p) => p.children.length === 0)).toBe(true)
  })

  it('mints fresh ids for inserted sentences', () => {
    const prev = tree('t', 'Topic', [leaf('p1', 'Only point')])
    const { next, op } = commitProse(prev, 'Topic. Only point. Brand new idea.', idFactory)
    expect(op?.kind).toBe('prose-restructure')
    expect(op?.insertedIds.length).toBe(1)
    expect(next.points.length).toBe(2)
    expect(next.points[0].id).toBe('p1')
    expect(next.points[1].id).toBe(op?.insertedIds[0])
  })

  it('loses nested children on flatten (documented tradeoff)', () => {
    const prev = tree('t', 'Topic', [
      {
        id: 'p1',
        text: 'Parent',
        children: [leaf('p1a', 'Child')],
      },
    ])
    // Insert a sentence → forces flatten branch.
    const { next } = commitProse(prev, 'Topic. Inserted. Parent. Child.', idFactory)
    // All points are depth 0 now, no children.
    expect(next.points.every((p) => p.children.length === 0)).toBe(true)
  })
})
