/**
 * Adapter between the per-section storage shape and the SectionTree
 * model the editor operates on.
 *
 * Storage strategy:
 *   • Try JSON.parse first — if the stored content is a serialized
 *     SectionTree, load it as-is. Ids survive, card blocks (score, criterion)
 *     keep their fields.
 *   • Fall back to plain-text paragraph splitting for any content that
 *     isn't valid JSON (including all HTML and legacy Tiptap output).
 *     First paragraph becomes the topic; remainder become paragraph
 *     blocks. Cards in this case start fresh next time.
 *
 * On save we always emit JSON — so once a section is edited through the
 * new editor, it round-trips losslessly on reload.
 */

import type { ParagraphBlock, SectionBlock, SectionNodeId, SectionTree } from './types'
import { makeParagraph } from './types'

function tmpId(prefix = 'tmp'): SectionNodeId {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

/**
 * Replace {token} placeholders in `content` with values from `ctx`.
 *
 * Coercions:
 *   • missing / null / empty string → `—` (em dash). Cleaner for a
 *     clinical report than raw `{token}` markup; the field is still
 *     visibly a gap the clinician can fill by typing.
 *   • boolean → `Yes` / `No`. Prose reports read unnaturally as
 *     `false.` — and the numeric/JSON truthiness isn't meaningful to
 *     the reader anyway.
 *   • array of strings → comma-joined; empty array → em dash.
 *   • nested object → em dash (not renderable as inline text).
 *   • everything else → `String(value)`.
 *
 * One-shot substitution: once this runs and the clinician saves, the
 * resolved values become the stored content. The original `{token}`
 * is lost from that row. Documented tradeoff — fine for intake-style
 * reports, worse for living records where upstream data (DOB, etc.)
 * might change after. A future token-preserving decoration layer can
 * undo this if the team ever needs re-interpolation on demographic
 * updates.
 */
const MISSING_TOKEN = '—'

export function interpolateTokens(
  content: string,
  ctx: Record<string, unknown> | null | undefined,
): string {
  if (!content) return content
  return content.replace(/\{([^{}\s]+)\}/g, (_match, rawKey: string) => {
    const key = rawKey.trim()
    const value = ctx?.[key]
    if (value === undefined || value === null || value === '') return MISSING_TOKEN
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) {
      return value.length === 0 ? MISSING_TOKEN : value.map(String).join(', ')
    }
    if (typeof value === 'object') return MISSING_TOKEN
    return String(value)
  })
}

/** Strip HTML tags → plain text, preserving paragraph breaks. */
function stripHtml(html: string): string {
  const withBreaks = html
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre)[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
  return withBreaks
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * Basic structural sanity check that a parsed JSON value matches the
 * SectionTree shape. Guards against committing garbage back to state
 * when `content` happens to be valid JSON but isn't ours.
 */
function looksLikeSectionTree(value: unknown): value is SectionTree {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (!v.topic || typeof v.topic !== 'object') return false
  const topic = v.topic as Record<string, unknown>
  if (typeof topic.id !== 'string') return false
  if (topic.kind !== 'paragraph' && !('text' in topic)) return false
  if (!Array.isArray(v.blocks)) return false
  return true
}

/**
 * Normalize an older or partial tree into the current shape. Paragraph
 * blocks without a `kind` tag (from an earlier spike) get tagged; any
 * unknown kinds get coerced back to paragraphs to avoid render crashes.
 */
function normalizeBlock(raw: unknown): SectionBlock {
  if (!raw || typeof raw !== 'object') return makeParagraph(tmpId())
  const b = raw as Record<string, unknown>
  const id = typeof b.id === 'string' ? b.id : tmpId()
  const children = Array.isArray(b.children)
    ? (b.children as unknown[]).map(normalizeBlock)
    : []
  const kind = b.kind
  if (kind === 'score-card') {
    return {
      kind: 'score-card',
      id,
      testName: str(b.testName),
      subtest: str(b.subtest),
      standardScore: str(b.standardScore),
      percentile: str(b.percentile),
      interpretation: str(b.interpretation),
      notes: str(b.notes),
      children,
    }
  }
  if (kind === 'criterion') {
    const met = b.met === true || b.met === false ? b.met : null
    return {
      kind: 'criterion',
      id,
      label: str(b.label),
      met,
      justification: str(b.justification),
      children,
    }
  }
  // Default: paragraph. Also covers legacy {id, text, children} rows.
  return {
    kind: 'paragraph',
    id,
    text: str(b.text),
    children,
  }
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function normalizeTree(raw: SectionTree): SectionTree {
  const topicRaw = raw.topic as unknown as Record<string, unknown>
  const topic: ParagraphBlock = {
    kind: 'paragraph',
    id: typeof topicRaw.id === 'string' ? topicRaw.id : tmpId('topic'),
    text: str(topicRaw.text),
    children: [],
  }
  return {
    id: typeof raw.id === 'string' ? raw.id : tmpId('section'),
    topic,
    blocks: (raw.blocks as unknown[]).map(normalizeBlock),
  }
}

/**
 * Segment a single paragraph into sentences. Uses Intl.Segmenter where
 * available (modern browsers + Node ≥ 16); falls back to a regex split
 * on terminator + whitespace + capital letter. Only used as a safety
 * net for legacy / AI-generated content that arrives as one long
 * period-separated blob — so the outline view shows real points
 * instead of a single-paragraph dump.
 */
function splitSentences(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  const SegmenterCtor = (typeof Intl !== 'undefined' &&
    (Intl as unknown as { Segmenter?: unknown }).Segmenter) as
    | (new (locale?: string, opts?: object) => {
        segment: (s: string) => Iterable<{ segment: string }>
      })
    | undefined
  if (SegmenterCtor) {
    const seg = new SegmenterCtor('en', { granularity: 'sentence' })
    const out: string[] = []
    for (const piece of seg.segment(trimmed)) {
      const s = piece.segment.trim()
      if (s) out.push(s)
    }
    return out
  }
  return trimmed
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Parse an existing content string into a SectionTree. JSON first —
 * fall back to paragraph splitting on any parse failure or shape
 * mismatch. When the content has no paragraph breaks at all (common
 * for legacy content that was produced by the old template-joined
 * path), fall through further into sentence splitting so the outline
 * view renders as multiple points rather than one long line.
 */
export function contentToTree(content: string): SectionTree {
  const trimmed = (content ?? '').trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (looksLikeSectionTree(parsed)) {
        return normalizeTree(parsed)
      }
    } catch {
      // fall through to plain-text path
    }
  }

  const plain = stripHtml(content ?? '')
  let paragraphs = plain
    .split(/\r?\n{2,}|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  // Legacy / AI-generated blob with no paragraph breaks: rescue the
  // outline view by sentence-splitting. Only triggers when the whole
  // content came back as one paragraph AND that paragraph has multiple
  // sentences. User-authored single paragraphs stay intact.
  if (paragraphs.length === 1) {
    const sentences = splitSentences(paragraphs[0])
    if (sentences.length > 1) paragraphs = sentences
  }

  const topicText = paragraphs[0] ?? ''
  const blocks: SectionBlock[] = paragraphs.slice(1).map((text) => makeParagraph(tmpId(), text))
  const topic: ParagraphBlock = {
    kind: 'paragraph',
    id: tmpId('topic'),
    text: topicText,
    children: [],
  }
  return {
    id: tmpId('section'),
    topic,
    blocks,
  }
}

/**
 * Serialize a SectionTree back to the storage string. Emits JSON so
 * card blocks round-trip on reload. Text-only consumers that don't
 * understand the shape should fall back to `treeToPlainText`.
 */
export function treeToContent(tree: SectionTree): string {
  return JSON.stringify(tree)
}

/**
 * Human-readable text export of a section tree — used by any consumer
 * that wants the section as one flat readable block (autosave diff,
 * debug views, search indexing). Cards flatten to generated sentences.
 */
export function treeToPlainText(tree: SectionTree): string {
  const parts: string[] = []
  const topic = tree.topic.text.trim()
  if (topic) parts.push(topic)
  const walk = (ns: SectionBlock[]) => {
    for (const n of ns) {
      const line = blockToPlain(n)
      if (line) parts.push(line)
      walk(n.children)
    }
  }
  walk(tree.blocks)
  return parts.join('\n\n')
}

function blockToPlain(b: SectionBlock): string {
  if (b.kind === 'paragraph') return b.text.trim()
  if (b.kind === 'score-card') {
    const name = b.testName || 'Test'
    const score = b.standardScore ? `standard score ${b.standardScore}` : ''
    const pct = b.percentile ? `${b.percentile}th percentile` : ''
    const figures = [score, pct].filter(Boolean).join(', ')
    const interp = b.interpretation ? `. ${b.interpretation.trim()}` : ''
    const notes = b.notes ? `. ${b.notes.trim()}` : ''
    return `${name}${figures ? ': ' + figures : ''}${interp}${notes}.`.replace(/\.+/g, '.')
  }
  const met = b.met === true ? 'Met' : b.met === false ? 'Not met' : 'Not evaluated'
  const label = b.label.trim() || '(unnamed criterion)'
  const just = b.justification ? ` — ${b.justification.trim()}` : ''
  return `${met}: ${label}${just}.`
}
