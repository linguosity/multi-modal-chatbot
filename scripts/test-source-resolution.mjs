#!/usr/bin/env node
/**
 * Reproduces the SourceInspector's resolution path for every
 * source-annotated paragraph in a real report. For each paragraph,
 * runs parseSource → either fetches the matching file_uploads row by
 * filename, or falls back to the single-file inference. Reports the
 * branch the UI would render for each citation.
 *
 * This is the closest we can get to "click every chevron and see what
 * happens" from the command line.
 *
 * Usage:
 *   node scripts/test-source-resolution.mjs <reportId>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const reportId = process.argv[2]
if (!reportId) {
  console.error('usage: node scripts/test-source-resolution.mjs <reportId>')
  process.exit(1)
}

// Mirror src/components/report/section-editor/SourceInspector.tsx
const FILE_EXT_RE = /([A-Za-z0-9_\-.\s]+?\.(?:pdf|txt|md|png|jpg|jpeg|webp|gif|mp3|m4a|wav|aac|ogg|flac))/i

function parseSource(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return { kind: 'unknown', raw }
  if (trimmed.startsWith('ai:') || trimmed === 'ai') return { kind: 'ai', raw: trimmed }
  if (trimmed === 'user' || trimmed.startsWith('user:')) return { kind: 'user', raw: trimmed }
  const m = trimmed.match(FILE_EXT_RE)
  if (m) {
    const filename = m[1].trim()
    const after = trimmed.slice((m.index ?? 0) + m[1].length).trim()
    return { kind: 'file', filename, marker: after || undefined, raw: trimmed }
  }
  return { kind: 'unknown', raw: trimmed }
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

// ── Collect every source from the tree ──────────────────────────────────
const { data: sections, error: secErr } = await supabase
  .from('report_sections')
  .select('id, title, content')
  .eq('report_id', reportId)

if (secErr) {
  console.error('section query failed:', secErr.message)
  process.exit(1)
}

const citations = [] // { sectionTitle, slot, source, text }
for (const s of sections ?? []) {
  let tree = null
  try { tree = s.content ? JSON.parse(s.content) : null } catch {}
  if (!tree?.blocks) continue
  const walk = (blocks) => {
    for (const b of blocks) {
      if (b.kind === 'paragraph' && b.source) {
        citations.push({
          sectionTitle: s.title,
          slot: b.slot,
          source: b.source,
          text: (b.text || '').slice(0, 80),
        })
      }
      if (b.children) walk(b.children)
    }
  }
  walk(tree.blocks)
  if (tree.topic?.source) {
    citations.push({
      sectionTitle: s.title,
      slot: tree.topic.slot,
      source: tree.topic.source,
      text: (tree.topic.text || '').slice(0, 80),
    })
  }
}

console.log(`Found ${citations.length} citations across ${sections?.length ?? 0} sections.\n`)

// ── Pre-fetch file_uploads for fallback ─────────────────────────────────
const { data: files, error: filesErr } = await supabase
  .from('file_uploads')
  .select('id, filename, file_type, file_size, extracted_text')
  .eq('report_id', reportId)

if (filesErr) {
  console.error('file query failed:', filesErr.message)
  process.exit(1)
}

console.log(`Files on report: ${files?.length ?? 0}`)
for (const f of files ?? []) {
  console.log(`  • ${f.filename} (${f.file_type}, ${f.file_size ?? '?'} B, extracted_text ${f.extracted_text ? `${f.extracted_text.length} chars` : 'null'})`)
}
console.log()

// ── Walk every citation through the resolution logic ────────────────────
const tally = { file_direct: 0, file_inferred: 0, ai: 0, user: 0, unknown: 0, missing_file: 0 }

for (const c of citations) {
  const parsed = parseSource(c.source)
  let render = ''

  if (parsed.kind === 'ai') {
    tally.ai++
    render = `→ render: AI provenance label (operation="${parsed.raw.replace(/^ai:?/, '') || 'unknown'}")`
  } else if (parsed.kind === 'user') {
    tally.user++
    render = `→ render: clinician edit note`
  } else if (parsed.kind === 'file') {
    const match = files?.find(
      (f) => f.filename.toLowerCase() === parsed.filename.toLowerCase(),
    )
    if (match) {
      tally.file_direct++
      render = `→ render: file evidence "${match.filename}", marker="${parsed.marker ?? ''}"`
    } else {
      tally.missing_file++
      render = `→ render: cited filename "${parsed.filename}" not found on report (will show "no matching file")`
    }
  } else {
    // unknown — fall back to single-file inference
    if (files && files.length === 1) {
      tally.file_inferred++
      render = `→ render: INFERRED file "${files[0].filename}", page marker="${parsed.raw}"`
    } else {
      tally.unknown++
      render = `→ render: unrecognized provenance (${files?.length ?? 0} files on report → no inference)`
    }
  }

  console.log(`[${c.sectionTitle} / ${c.slot ?? '—'}] source="${c.source}"`)
  console.log(`  text: "${c.text}${c.text.length === 80 ? '…' : ''}"`)
  console.log(`  parse: kind=${parsed.kind}${parsed.kind === 'file' ? ` filename="${parsed.filename}" marker="${parsed.marker ?? ''}"` : ''}`)
  console.log(`  ${render}`)
  console.log()
}

console.log('══ render-branch tally ══')
for (const [k, v] of Object.entries(tally)) {
  console.log(`  ${k.padEnd(15)} ${v}`)
}
const resolved = tally.file_direct + tally.file_inferred + tally.ai + tally.user
const broken = tally.unknown + tally.missing_file
console.log(`  ${'resolved'.padEnd(15)} ${resolved} / ${citations.length}`)
console.log(`  ${'unresolved'.padEnd(15)} ${broken} / ${citations.length}`)
