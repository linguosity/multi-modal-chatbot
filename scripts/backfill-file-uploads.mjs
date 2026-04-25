#!/usr/bin/env node
/**
 * One-shot backfill: copies a report's metadata.uploadedFiles entries
 * into the file_uploads table when no rows exist there yet. The
 * extracted_text is left null (the original intake didn't persist it),
 * so the source-inspector will surface filename + size only.
 *
 * Usage:
 *   node scripts/backfill-file-uploads.mjs <reportId>
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
  console.error('usage: node scripts/backfill-file-uploads.mjs <reportId>')
  process.exit(1)
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const { data: report, error: rErr } = await supabase
  .from('reports')
  .select('id, user_id, metadata')
  .eq('id', reportId)
  .single()

if (rErr || !report) {
  console.error('report not found:', rErr?.message)
  process.exit(1)
}

const metaFiles = report.metadata?.uploadedFiles ?? []
if (!Array.isArray(metaFiles) || metaFiles.length === 0) {
  console.log('no uploadedFiles in metadata — nothing to backfill')
  process.exit(0)
}

const { data: existing } = await supabase
  .from('file_uploads')
  .select('id')
  .eq('report_id', reportId)

if (existing && existing.length > 0) {
  console.log(`already has ${existing.length} file_uploads rows — refusing to backfill`)
  process.exit(0)
}

const fileTypeFromMetaType = (t) => {
  if (t === 'pdf') return 'application/pdf'
  if (t === 'audio') return 'audio/mpeg'
  if (t === 'image') return 'image/png'
  if (t === 'text') return 'text/plain'
  return 'application/octet-stream'
}

const rows = metaFiles.map((f) => ({
  id: f.id, // preserve cross-reference
  report_id: reportId,
  user_id: report.user_id,
  filename: f.name,
  file_type: fileTypeFromMetaType(f.type),
  file_size: f.size ?? null,
  storage_path: null,
  processing_status: 'completed',
  extracted_text: null,
  error_message: null,
  created_at: f.uploadDate ?? new Date().toISOString(),
}))

const { error: insErr, data: inserted } = await supabase
  .from('file_uploads')
  .insert(rows)
  .select('id, filename')

if (insErr) {
  console.error('insert failed:', insErr.message)
  process.exit(1)
}

console.log(`✅ backfilled ${inserted?.length ?? 0} file_uploads row(s):`)
for (const r of inserted ?? []) console.log(`  • ${r.filename} (${r.id})`)
