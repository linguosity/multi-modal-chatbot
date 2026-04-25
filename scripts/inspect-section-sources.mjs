#!/usr/bin/env node
/**
 * Inspect the slot-annotated SectionTree stored on each report_section's
 * `content` column for a given report. Reports which paragraphs carry
 * `source` references and lists them — the data the SourceInspector
 * panel will see when the chevron is clicked.
 *
 * Usage:
 *   node scripts/inspect-section-sources.mjs <reportId>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const reportId = process.argv[2]
if (!reportId) {
  console.error('usage: node scripts/inspect-section-sources.mjs <reportId>')
  process.exit(1)
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const { data: sections, error } = await supabase
  .from('report_sections')
  .select('id, title, section_type, content')
  .eq('report_id', reportId)
  .order('order', { ascending: true })

if (error) {
  console.error('query failed:', error.message)
  process.exit(1)
}

let totalParagraphs = 0
let withSlot = 0
let withSource = 0
const allSources = new Set()

for (const s of sections ?? []) {
  let tree = null
  try {
    tree = s.content ? JSON.parse(s.content) : null
  } catch {
    // legacy plaintext content
  }
  if (!tree || typeof tree !== 'object' || !Array.isArray(tree.blocks)) {
    console.log(`\n── ${s.title} (${s.section_type})`)
    console.log('   ⚠ content is not a tree (legacy plaintext or empty)')
    continue
  }

  const para = []
  const walk = (blocks) => {
    for (const b of blocks) {
      if (b.kind === 'paragraph') para.push(b)
      if (b.children) walk(b.children)
    }
  }
  walk(tree.blocks)
  if (tree.topic) para.push(tree.topic)

  const slotted = para.filter((p) => p.slot)
  const sourced = para.filter((p) => p.source)
  totalParagraphs += para.length
  withSlot += slotted.length
  withSource += sourced.length
  for (const p of sourced) allSources.add(p.source)

  console.log(`\n── ${s.title} (${s.section_type})`)
  console.log(`   paragraphs: ${para.length}  slot-annotated: ${slotted.length}  source-annotated: ${sourced.length}`)
  for (const p of sourced) {
    const text = (p.text || '').slice(0, 60).replace(/\n/g, ' ')
    console.log(`   • [${p.slot ?? '—'}] "${text}${p.text?.length > 60 ? '…' : ''}"`)
    console.log(`       source: ${p.source}`)
  }
}

console.log('\n══ summary ══')
console.log(`  sections inspected:        ${sections?.length ?? 0}`)
console.log(`  paragraphs total:          ${totalParagraphs}`)
console.log(`  paragraphs with slot:      ${withSlot}`)
console.log(`  paragraphs with source:    ${withSource}`)
console.log(`  distinct source values:    ${allSources.size}`)
if (allSources.size > 0) {
  console.log('\n  source values:')
  for (const v of allSources) console.log(`    ${v}`)
}
