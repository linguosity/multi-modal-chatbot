#!/usr/bin/env node
/**
 * One-time migration: drop *_notes prose fields from
 * report_sections.structured_data where section_type='assessment_results',
 * archiving any non-empty content into the matching domain_summary[].narrative_override.
 *
 * Safeguards (per design doc):
 *   1. Default mode is dry-run — prints what WOULD change, mutates nothing.
 *      Pass --commit to actually write.
 *   2. Even on --commit, writes a JSON snapshot of every affected row to
 *      scripts/out/assessment-results-pre-migration-<ts>.json BEFORE mutating.
 *      That file is the undo path.
 *
 * Usage:
 *   node scripts/migrate-assessment-results.mjs            # dry-run
 *   node scripts/migrate-assessment-results.mjs --commit   # snapshot + mutate
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const NOTES_TO_DOMAIN = {
  articulation_notes: 'Articulation',
  receptive_language_notes: 'Receptive Language',
  expressive_language_notes: 'Expressive Language',
  pragmatic_language_notes: 'Pragmatics',
  voice_notes: 'Voice',
  fluency_notes: 'Fluency',
}

function planMigration(structured) {
  const data = structured && typeof structured === 'object' ? structured : {}
  const archivedFields = []
  const incomingSummary = Array.isArray(data.domain_summary) ? [...data.domain_summary] : []
  // Deep-clone existing entries so we don't mutate the caller's object.
  const summary = incomingSummary.map((e) => (e && typeof e === 'object' ? { ...e } : e))

  for (const [noteKey, domainName] of Object.entries(NOTES_TO_DOMAIN)) {
    const raw = data[noteKey]
    const prose = typeof raw === 'string' ? raw.trim() : ''
    if (!prose) continue
    archivedFields.push({ from: noteKey, domain: domainName, chars: prose.length })

    const idx = summary.findIndex(
      (e) => e && typeof e === 'object' && (e.domain || '').toLowerCase() === domainName.toLowerCase(),
    )
    if (idx === -1) {
      summary.push({
        domain: domainName,
        can_do: [],
        support_needed: [],
        contexts: [],
        evidence: [],
        convergence: { level: 'single_source', agreeing_tool_ids: [] },
        narrative_override: prose,
        _auto_archived: true,
        _auto_archived_at: new Date().toISOString(),
        _auto_archived_from: noteKey,
      })
    } else {
      const existing = summary[idx]
      const existingOverride = typeof existing.narrative_override === 'string' ? existing.narrative_override.trim() : ''
      // Don't overwrite a clinician-authored override (treat any pre-existing
      // value as authoritative). Otherwise install the archived prose.
      if (existingOverride && existingOverride !== prose) {
        archivedFields.push({
          from: noteKey,
          domain: domainName,
          chars: prose.length,
          skipped: 'existing narrative_override preserved',
          archived_alongside: prose.slice(0, 200),
        })
      } else {
        summary[idx] = {
          ...existing,
          narrative_override: prose,
          _auto_archived: true,
          _auto_archived_at: new Date().toISOString(),
          _auto_archived_from: noteKey,
        }
      }
    }
  }

  const next = { ...data, domain_summary: summary }
  for (const k of Object.keys(NOTES_TO_DOMAIN)) delete next[k]
  return { next, archivedFields }
}

console.log(`\n--- assessment_results migration: ${COMMIT ? 'COMMIT MODE' : 'DRY RUN'} ---\n`)

const { data: rows, error } = await supabase
  .from('report_sections')
  .select('id, report_id, title, structured_data')
  .eq('section_type', 'assessment_results')

if (error) {
  console.error('failed to read report_sections:', error.message)
  process.exit(1)
}

console.log(`scanned ${rows.length} assessment_results rows\n`)

const planned = []
let touchedCount = 0
let totalArchived = 0

for (const row of rows) {
  const { next, archivedFields } = planMigration(row.structured_data)
  if (archivedFields.length === 0) continue
  touchedCount += 1
  totalArchived += archivedFields.length
  planned.push({
    section_id: row.id,
    report_id: row.report_id,
    title: row.title,
    before: row.structured_data,
    after: next,
    archived: archivedFields,
  })
  const fields = archivedFields.map((a) => `${a.from} (${a.chars}ch${a.skipped ? ` — ${a.skipped}` : ''})`).join(', ')
  console.log(`• section ${row.id} (report ${row.report_id}): ${fields}`)
}

console.log(`\nsummary: ${touchedCount} of ${rows.length} rows would be modified, ${totalArchived} *_notes fields archived\n`)

if (!COMMIT) {
  console.log('--- dry run complete. re-run with --commit to mutate. ---')
  process.exit(0)
}

if (touchedCount === 0) {
  console.log('--- nothing to do; exiting. ---')
  process.exit(0)
}

// Snapshot first.
const ts = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = join(__dirname, 'out')
mkdirSync(outDir, { recursive: true })
const snapshotPath = join(outDir, `assessment-results-pre-migration-${ts}.json`)
writeFileSync(snapshotPath, JSON.stringify({ ts, planned }, null, 2))
console.log(`wrote snapshot: ${snapshotPath}`)

// Apply.
let written = 0
let failed = 0
for (const p of planned) {
  const { error: upErr } = await supabase
    .from('report_sections')
    .update({ structured_data: p.after })
    .eq('id', p.section_id)
  if (upErr) {
    console.error(`✗ failed to update section ${p.section_id}: ${upErr.message}`)
    failed += 1
  } else {
    written += 1
  }
}

console.log(`\n--- commit complete: ${written} updated, ${failed} failed ---`)
console.log(`undo: restore each section.structured_data from ${snapshotPath} (planned[].before)`)
process.exit(failed > 0 ? 1 : 0)
