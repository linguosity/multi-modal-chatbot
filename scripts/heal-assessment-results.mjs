#!/usr/bin/env node
/**
 * One-shot heal pass for assessment_results sections.
 *
 * Runs reconcileDomainSummary on every assessment_results row and
 * unwraps/normalizes any tools[] rows on the matching assessment_tools
 * sections (same Russian-doll fix the route does at write time).
 *
 * Default mode is dry-run; pass --commit to mutate.
 *
 * Usage:
 *   node scripts/heal-assessment-results.mjs              # report only
 *   node scripts/heal-assessment-results.mjs --commit     # snapshot + mutate
 */

import { createClient } from '@supabase/supabase-js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

const COMMIT = process.argv.includes('--commit')

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// Pull the canonical reconcile + tools-unwrap helpers from the app.
const { reconcileDomainSummary } = await import('../src/lib/assessment-results/convergence.ts')

// Tools unwrap mirrors the route's logic, kept inline so this script doesn't
// reach into the route's request-time scope.
function isNumericKeyWrapper(t) {
  if (!t || typeof t !== 'object' || Array.isArray(t)) return false
  const numericKeys = Object.keys(t).filter((k) => /^\d+$/.test(k))
  if (numericKeys.length === 0) return false
  return numericKeys.some((k) => {
    const v = t[k]
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false
    return typeof v.id === 'string' || typeof v.title === 'string' || typeof v.measure_type === 'string'
  })
}
function unwrapTool(t) {
  if (!isNumericKeyWrapper(t)) return [t]
  return Object.keys(t)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => t[k])
    .filter((v) => v && typeof v === 'object')
}
function healTools(toolsVal) {
  if (toolsVal && !Array.isArray(toolsVal) && isNumericKeyWrapper(toolsVal)) {
    toolsVal = unwrapTool(toolsVal)
  }
  if (!Array.isArray(toolsVal)) return null
  const flattened = toolsVal.flatMap(unwrapTool)
  const normalized = flattened.map((t) => {
    if (!t || typeof t !== 'object') return t
    const measure_type = t.measure_type || t.tool_type || ''
    const purpose = t.purpose || t.description || t.qualitative_description || ''
    const date = t.administered_date || t.date || ''
    const title = t.title || t.tool_name || t.context_label || 'Observation'
    const target_population = t.target_population || ''
    const id =
      typeof t.id === 'string' && t.id.trim()
        ? t.id.trim()
        : (title || 'tool').toString().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'tool'
    return { ...t, id, title, administered_date: date, measure_type, purpose, target_population }
  })
  return normalized
}

console.log(`\n--- assessment-results heal: ${COMMIT ? 'COMMIT MODE' : 'DRY RUN'} ---\n`)

// Pull all assessment_results AND assessment_tools sections.
const { data: rows, error } = await supabase
  .from('report_sections')
  .select('id, report_id, title, section_type, structured_data')
  .in('section_type', ['assessment_results', 'assessment_tools'])

if (error) {
  console.error('failed to read report_sections:', error.message)
  process.exit(1)
}

const planned = []

for (const row of rows) {
  const before = row.structured_data ?? {}
  let after = before
  let touched = false
  const changes = []

  if (row.section_type === 'assessment_results' && Array.isArray(before.domain_summary)) {
    const reconciled = reconcileDomainSummary(before.domain_summary)
    if (JSON.stringify(reconciled) !== JSON.stringify(before.domain_summary)) {
      after = { ...after, domain_summary: reconciled }
      touched = true
      changes.push(`domain_summary: ${before.domain_summary.length} → ${reconciled.length}`)
    }
  }

  if (row.section_type === 'assessment_tools') {
    const healed = healTools(before.tools)
    if (healed && JSON.stringify(healed) !== JSON.stringify(before.tools)) {
      after = { ...after, tools: healed }
      touched = true
      const beforeLen = Array.isArray(before.tools) ? before.tools.length : '?'
      changes.push(`tools: ${beforeLen} → ${healed.length}`)
    }
  }

  if (touched) {
    planned.push({ section_id: row.id, report_id: row.report_id, section_type: row.section_type, changes, before, after })
    console.log(`• ${row.section_type} ${row.id} (report ${row.report_id}): ${changes.join('; ')}`)
  }
}

console.log(`\nsummary: ${planned.length} of ${rows.length} sections would be modified\n`)

if (!COMMIT) {
  console.log('--- dry run complete. re-run with --commit to mutate. ---')
  process.exit(0)
}

if (planned.length === 0) {
  console.log('--- nothing to do; exiting. ---')
  process.exit(0)
}

const ts = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = join(__dirname, 'out')
mkdirSync(outDir, { recursive: true })
const snapshotPath = join(outDir, `assessment-results-heal-${ts}.json`)
writeFileSync(snapshotPath, JSON.stringify({ ts, planned }, null, 2))
console.log(`wrote snapshot: ${snapshotPath}`)

let written = 0
let failed = 0
for (const p of planned) {
  const { error: upErr } = await supabase
    .from('report_sections')
    .update({ structured_data: p.after })
    .eq('id', p.section_id)
  if (upErr) {
    console.error(`✗ failed ${p.section_id}: ${upErr.message}`)
    failed += 1
  } else {
    written += 1
  }
}
console.log(`\n--- commit complete: ${written} updated, ${failed} failed ---`)
console.log(`undo: restore each section.structured_data from ${snapshotPath} (planned[].before)`)
process.exit(failed > 0 ? 1 : 0)
