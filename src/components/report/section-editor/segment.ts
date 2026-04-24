/**
 * Outline ⇄ Prose Section Editor — prose ⇄ tree sync.
 *
 * Spec: docs/outline-prose-editor-spec.md §5.2 (Prose render), §7.2–§7.3
 * (Prose → model), §15.3.
 *
 * Design claim: one source of truth, two renderings. Outline → prose is a
 * trivial depth-first join; prose → outline is where all the subtlety is
 * (sentence segmentation + ID-stable matching + preserved vs flattened
 * structural branches).
 */

import type {
  EditOp,
  SectionNode,
  SectionNodeId,
  SectionTree,
} from './types'

/**
 * Outline → prose: depth-first traversal joined with ". ". Terminal
 * punctuation on each node is stripped then re-added uniformly so the
 * paragraph reads clean regardless of how the user punctuated individual
 * points in outline.
 */
export function toProse(section: SectionTree): string {
  const collect = (nodes: SectionNode[]): string[] =>
    nodes.flatMap((n) => [n.text, ...collect(n.children)])
  const parts = [section.topic.text, ...collect(section.points)]
    .map((s) => s.trim().replace(/[.!?\s]+$/, ''))
    .filter(Boolean)
  return parts.length ? parts.join('. ') + '.' : ''
}

/**
 * Segment a paragraph into sentences using `Intl.Segmenter` where
 * available (modern browsers, Node ≥16). Falls back to a reasonable
 * regex split for environments without it. Guards against the classic
 * period-split traps: abbreviations (`Dr.`, `e.g.`, `et al.`), decimals
 * (`p < .05`, `1.5 SD`), and assessment names with internal periods.
 */
export function segment(paragraph: string): string[] {
  const text = paragraph.trim()
  if (!text) return []

  const G =
    typeof Intl !== 'undefined' &&
    (Intl as unknown as { Segmenter?: unknown }).Segmenter
      ? (Intl as unknown as { Segmenter: new (locale?: string, opts?: object) => {
          segment: (s: string) => Iterable<{ segment: string; isWordLike?: boolean }>
        } }).Segmenter
      : null

  if (G) {
    const seg = new G('en', { granularity: 'sentence' })
    const out: string[] = []
    for (const piece of seg.segment(text)) {
      const s = piece.segment.trim()
      if (s) out.push(s)
    }
    return out
  }

  // Fallback. Splits on sentence terminator followed by whitespace and
  // a capital letter. Imperfect, but only used where Intl.Segmenter is
  // unavailable — which in practice is never in supported browsers.
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Dice coefficient on word-unigram sets. Returns 1 for identical bags,
 * 0 for disjoint, monotonic in between. Case-insensitive; punctuation
 * collapsed to whitespace before tokenizing.
 */
export function dice(a: string, b: string): number {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  const sa = new Set(norm(a))
  const sb = new Set(norm(b))
  if (!sa.size && !sb.size) return 1
  if (!sa.size || !sb.size) return 0
  let inter = 0
  sa.forEach((w) => {
    if (sb.has(w)) inter++
  })
  return (2 * inter) / (sa.size + sb.size)
}

export interface MatchedSentence {
  id: SectionNodeId
  text: string
  /** True if this is a fresh-minted id (no old sentence matched). */
  inserted: boolean
}

export interface MatchResult {
  matched: MatchedSentence[]
  /** Old node ids that had no corresponding new sentence. */
  removedIds: SectionNodeId[]
}

/**
 * Two-pass ID matching. Pass 1 exact-equal (preserves ids for untouched
 * sentences). Pass 2 Dice ≥ `threshold` (preserves ids for lightly
 * edited sentences). Unmatched new sentences get fresh ids from
 * `idFactory`; unmatched old ids are reported as removed.
 */
export function matchIds(
  oldFlat: { id: SectionNodeId; text: string }[],
  newSentences: string[],
  idFactory: () => SectionNodeId,
  threshold = 0.3,
): MatchResult {
  const used = new Set<SectionNodeId>()
  const matched: MatchedSentence[] = new Array(newSentences.length)

  // Pass 1: exact matches.
  for (let i = 0; i < newSentences.length; i++) {
    const s = newSentences[i].trim()
    const hit = oldFlat.find((o) => !used.has(o.id) && o.text.trim() === s)
    if (hit) {
      used.add(hit.id)
      matched[i] = { id: hit.id, text: s, inserted: false }
    }
  }

  // Pass 2: fuzzy matches among what's left, best-first.
  for (let i = 0; i < newSentences.length; i++) {
    if (matched[i]) continue
    const s = newSentences[i]
    let bestId: SectionNodeId | null = null
    let bestScore = 0
    for (const o of oldFlat) {
      if (used.has(o.id)) continue
      const score = dice(s, o.text)
      if (score > bestScore) {
        bestScore = score
        bestId = o.id
      }
    }
    if (bestId && bestScore >= threshold) {
      used.add(bestId)
      matched[i] = { id: bestId, text: s.trim(), inserted: false }
    } else {
      matched[i] = { id: idFactory(), text: s.trim(), inserted: true }
    }
  }

  const removedIds = oldFlat.filter((o) => !used.has(o.id)).map((o) => o.id)
  return { matched, removedIds }
}

/**
 * Flatten the full section tree depth-first (topic prepended) into
 * `[{id, text}, ...]`. Only used by `commitProse` for matching.
 */
function flattenForMatch(section: SectionTree): { id: SectionNodeId; text: string }[] {
  const out: { id: SectionNodeId; text: string }[] = [
    { id: section.topic.id, text: section.topic.text },
  ]
  const walk = (ns: SectionNode[]) => {
    for (const n of ns) {
      out.push({ id: n.id, text: n.text })
      walk(n.children)
    }
  }
  walk(section.points)
  return out
}

/**
 * Structure-preservation detection (spec §7.3). True iff matched length
 * equals old length AND every matched id is at the same index as its
 * original — i.e. nothing was inserted, removed, or reordered.
 */
export function isStructurePreserved(
  oldFlat: { id: SectionNodeId; text: string }[],
  matched: MatchedSentence[],
): boolean {
  if (matched.length !== oldFlat.length) return false
  for (let i = 0; i < matched.length; i++) {
    if (matched[i].id !== oldFlat[i].id) return false
  }
  return true
}

export interface ProseCommitResult {
  next: SectionTree
  /**
   * Null when structure was preserved (only text changed). Populated with
   * a prose-restructure op otherwise, listing the ids that were dropped
   * and the ones that were freshly minted.
   */
  op: Extract<EditOp, { kind: 'prose-restructure' }> | null
}

/**
 * Commit a prose edit back to a section tree.
 *
 * Preserved case (length and id order unchanged): walk the existing tree
 * and update text by id. `children` arrays are kept. No op emitted.
 *
 * Flattened case (anything else): rebuild with `topic = matched[0]` and
 * points = depth-0 nodes from `matched.slice(1)`. Nested structure is
 * lost — this is the documented tradeoff (spec §7.2). Restructuring
 * happens in outline mode.
 */
export function commitProse(
  prev: SectionTree,
  newParagraph: string,
  idFactory: () => SectionNodeId,
  threshold = 0.3,
): ProseCommitResult {
  const oldFlat = flattenForMatch(prev)
  const sentences = segment(newParagraph)
  const { matched, removedIds } = matchIds(oldFlat, sentences, idFactory, threshold)

  if (isStructurePreserved(oldFlat, matched)) {
    // Text-only changes. Walk the existing tree and update by id.
    const byId = new Map(matched.map((m) => [m.id, m.text]))
    const walk = (ns: SectionNode[]): SectionNode[] =>
      ns.map((n) => ({
        id: n.id,
        text: byId.has(n.id) ? (byId.get(n.id) as string) : n.text,
        children: walk(n.children),
      }))
    return {
      next: {
        id: prev.id,
        topic: {
          id: prev.topic.id,
          text: byId.has(prev.topic.id) ? (byId.get(prev.topic.id) as string) : prev.topic.text,
        },
        points: walk(prev.points),
      },
      op: null,
    }
  }

  // Flattened rebuild. First matched sentence becomes the topic; the
  // rest become depth-0 points without children.
  const first = matched[0]
  const topicId = first ? first.id : idFactory()
  const topicText = first ? first.text : ''
  const points: SectionNode[] = matched.slice(1).map((m) => ({
    id: m.id,
    text: m.text,
    children: [],
  }))

  const insertedIds = matched.filter((m) => m.inserted).map((m) => m.id)

  return {
    next: {
      id: prev.id,
      topic: { id: topicId, text: topicText },
      points,
    },
    op: {
      kind: 'prose-restructure',
      replacedIds: removedIds,
      insertedIds,
    },
  }
}
