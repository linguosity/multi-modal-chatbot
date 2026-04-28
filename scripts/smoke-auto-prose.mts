import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const { renderDomainProse } = await import('../src/lib/assessment-results/auto-prose.ts')

const { data: results } = await s
  .from('report_sections')
  .select('structured_data')
  .eq('id', 'e301a6c1-1e73-4764-af8b-86b7c197a913')
  .single()
const { data: toolsRow } = await s
  .from('report_sections')
  .select('structured_data')
  .eq('section_type', 'assessment_tools')
  .eq('report_id', 'a3b92ffb-0918-43ff-b529-901571aa09ca')
  .single()

const summary = (results as any)?.structured_data?.domain_summary || []
const tools = (toolsRow as any)?.structured_data?.tools || []

console.log('--- AI-emitted entries (no override) ---')
for (const d of summary.filter((e: any) => !e._auto_archived)) {
  const p = renderDomainProse(d, tools)
  console.log(`\n[${d.domain}]\n${p || '(empty rubric, suppressed)'}`)
}

console.log('\n\n--- Migrated entries (override path) ---')
for (const d of summary.filter((e: any) => e._auto_archived)) {
  const p = renderDomainProse(d, tools)
  const trimmed = p.length > 280 ? p.slice(0, 280) + '…' : p
  console.log(`\n[${d.domain} — from ${d._auto_archived_from}]\n${trimmed}`)
}
