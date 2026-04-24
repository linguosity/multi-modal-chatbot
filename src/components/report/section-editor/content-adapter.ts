/**
 * Adapter between the prose-section storage shape (single content string,
 * possibly HTML) and the SectionTree model the editor operates on.
 *
 * v1 storage contract: save the tree back as a flat \n\n-separated plain
 * text paragraph list. Nothing downstream has to know about SectionTree
 * — autosave, search, export all keep seeing a string. Ids are ephemeral
 * per session (tmp_ prefix); they regenerate on reload. That's the
 * tradeoff — editing state doesn't persist — but it keeps the DB shape
 * unchanged and lets this integration land without a migration.
 */

import type { SectionNode, SectionNodeId, SectionTree } from './types'

function tmpId(prefix = 'tmp'): SectionNodeId {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

/** Strip HTML tags → plain text, preserving paragraph breaks. */
function stripHtml(html: string): string {
  // Replace common block closers with newlines so paragraph structure survives.
  const withBreaks = html
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre)[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
  // Drop all remaining tags and decode a minimal entity set.
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
 * Parse an existing content string into a SectionTree. First paragraph
 * becomes the topic; the rest become depth-0 points. Empty input yields
 * an empty topic and no points.
 */
export function contentToTree(content: string): SectionTree {
  const plain = stripHtml(content ?? '')
  const paragraphs = plain
    .split(/\r?\n{2,}|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  const topicText = paragraphs[0] ?? ''
  const points: SectionNode[] = paragraphs.slice(1).map((text) => ({
    id: tmpId(),
    text,
    children: [],
  }))
  return {
    id: tmpId('section'),
    topic: { id: tmpId('topic'), text: topicText },
    points,
  }
}

/**
 * Serialize a SectionTree back to the plain-text paragraph format we
 * store. Nested children flatten (depth-first) — v1 storage has no
 * hierarchy.
 */
export function treeToContent(tree: SectionTree): string {
  const parts: string[] = []
  const topic = tree.topic.text.trim()
  if (topic) parts.push(topic)
  const walk = (ns: SectionNode[]) => {
    for (const n of ns) {
      const t = n.text.trim()
      if (t) parts.push(t)
      walk(n.children)
    }
  }
  walk(tree.points)
  return parts.join('\n\n')
}
