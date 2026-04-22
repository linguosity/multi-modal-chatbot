#!/usr/bin/env node
/**
 * Fidelity diagnostic — sends a PDF to Claude twice:
 *   A) the CURRENT process-intake pre-extraction prompt ("main points, concise")
 *   B) a FAITHFUL-preservation prompt ("don't summarize, preserve quotes + numbers")
 * Dumps both responses to disk and prints length + key-fact coverage.
 *
 * Usage: node scripts/compare-extraction.mjs "<path-to-pdf>"
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as dotenvConfig } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenvConfig({ path: join(__dirname, '..', '.env.local') })

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node scripts/compare-extraction.mjs <path-to-pdf>')
  process.exit(1)
}

const apiKey = process.env.ANTHROPIC_API_KEY
const model = process.env.CLAUDE_MODEL || 'claude-opus-4-7'
if (!apiKey) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1) }

const tag = (l) => `\x1b[1;36m[${l}]\x1b[0m`

// Same prompt the route uses today — concise, bullets, no long quotes, no speculation
const PROMPT_A_SYSTEM = [
  'You are an expert Speech-Language Pathologist extracting MAIN POINTS from assessment PDFs for a clinical report.',
  'Goal: produce a concise, high-signal summary tailored for SLP reporting, not a verbatim transcript.',
  'Include only the most decision-relevant details with brief page references when clear (e.g., [p.3]).',
  'Focus areas (use only those present):',
  '- Demographics: name/initials, age, grade, primary language(s)',
  '- Referral reason / concerns (parent/teacher/clinician)',
  '- Background: medical/educational/services history; hearing/vision status',
  '- Assessment tools used (e.g., CELF-Preschool-3, PLS-5, GFTA-3, language sample), forms, dates',
  '- Key scores/results: core/composite/indices, subtests, scaled/standard scores, percentiles; norms/date',
  '- Observations: attention/behavior/regulation, speech intelligibility, fluency, voice, pragmatics',
  '- Strengths and needs: expressive/receptive/pragmatics/speech sound patterns noted',
  '- Diagnostic impressions / eligibility (if stated)',
  '- Recommendations: services/frequency/setting, goals focus, accommodations, home carryover',
  'Constraints:',
  '- Be concise (bulleted). No long quotes. No speculation. No formatting beyond bullets and short headers.',
  '- Do not invent data. If a field is not present, omit it.',
  '- Output strictly as plain text bullets suitable to pass onward (no JSON, no extra commentary).',
].join('\n')

// New prompt — preserve full detail, quotes, numbers, verbatim phrasing
const PROMPT_B_SYSTEM = [
  'You are an expert Speech-Language Pathologist extracting the FULL CONTENT of an assessment PDF for downstream structured processing.',
  'Goal: preserve clinically-relevant detail faithfully. Another AI step will reduce this into structured fields — your job is NOT to summarize; it is to surface every fact.',
  'Preserve verbatim:',
  '- All proper nouns (student, parent, teacher, school, district, evaluator, test names)',
  '- All numeric values: standard scores, percentiles, confidence intervals, raw scores, standard-deviation statements, ages ("2;11"), dates',
  '- Eligibility language ("DOES NOT SUPPORT", "Ed Code 56333", criteria statements)',
  '- Direct quotes from parent/teacher/student, especially the ones that anchor clinical judgment',
  '- Language-sample utterances when present (they are evidence, not filler)',
  '- Recommendations with the exact phrasing the report uses',
  'Structure the output with short section headers that mirror the report (Reason for Referral, Background, Tools, Findings by Domain, Eligibility, Summary, Recommendations). Use bullets within each.',
  'No speculation. If a field is empty in the source, mark it as [not provided]. Aim for completeness over brevity.',
].join('\n')

const PROMPT_USER = 'Extract the content of this assessment PDF. Follow the system instructions exactly.'

async function callClaude(system, label, max_tokens = 4096) {
  const buf = await readFile(filePath)
  const base64 = buf.toString('base64')
  const t0 = Date.now()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens,
      system,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: PROMPT_USER },
        ],
      }],
    }),
  })
  const dt = Date.now() - t0
  const body = await res.json()
  console.log(`${tag(label)} HTTP ${res.status}  ${dt}ms  tokens: in=${body.usage?.input_tokens} out=${body.usage?.output_tokens}`)
  if (res.status !== 200) {
    console.log('  body:', JSON.stringify(body).slice(0, 600))
    return null
  }
  const text = (body.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
  return { text, usage: body.usage, ms: dt }
}

// Key facts from the user-supplied ground truth text of Levi's report.
// Tests how many we can find verbatim (or near-verbatim) in each extraction.
const GROUND_TRUTH_FACTS = [
  { id: 'name',           needle: /Levi Hernandez/i, label: 'Student name "Levi Hernandez"' },
  { id: 'dob',            needle: /Jan(\.|uary)? 14,? 2023|01\/14\/2023/, label: 'DOB Jan 14, 2023' },
  { id: 'age',            needle: /2;11|2 years,? 11/, label: 'Age 2;11' },
  { id: 'eval_date',      needle: /Nov(\.|ember)? 7,? 2025|11\/7\/2025|11\/07\/2025/, label: 'Eval date Nov 7, 2025' },
  { id: 'district',       needle: /Covina[- ]?Valley|CVUSD|C-VUSD/i, label: 'Covina-Valley USD' },
  { id: 'regional_center',needle: /San Gabriel Pomona Regional Center/i, label: 'Referral: San Gabriel Pomona Regional Center' },
  { id: 'evaluator',      needle: /Brandon Brewer/i, label: 'Evaluator Brandon Brewer' },
  { id: 'dayc2_recept_ss',needle: /\b116\b/, label: 'DAYC-2 Receptive SS 116' },
  { id: 'dayc2_recept_p', needle: /86th percentile|86%ile/, label: 'DAYC-2 Receptive 86th %ile' },
  { id: 'dayc2_exp_ss',   needle: /\b119\b/, label: 'DAYC-2 Expressive SS 119' },
  { id: 'dayc2_exp_p',    needle: /90th percentile|90%ile/, label: 'DAYC-2 Expressive 90th %ile' },
  { id: 'dayc2_comm',     needle: /\b120\b|91st percentile/, label: 'DAYC-2 Communication SS 120 / 91st' },
  { id: 'ed_code',        needle: /56333/, label: 'Ed Code 56333' },
  { id: 'does_not_support',needle: /DOES NOT SUPPORT|does not support eligibility|not eligible|NOT MEET/i, label: 'Eligibility: does not support' },
  { id: 'intelligibility',needle: /80%/, label: 'Intelligibility 80%' },
  { id: 'parent_quote',   needle: /fine talking/i, label: 'Parent quote: "fine talking"' },
  { id: 'spanish_quote',  needle: /How do you say/i, label: 'Student quote: "How do you say…"' },
  { id: 'dentist_role',   needle: /dentist|mirror|pretend/i, label: 'Dentist role-play observation' },
  { id: 'utterance_lever',needle: /lever/i, label: 'Language sample: "push the lever"' },
  { id: 'tools_listed',   needle: /Parent Interview.*Communication Matrix|Communication Matrix.*Parent Interview|CSBS|CDI|Play Checklist/is, label: 'Multiple tools listed' },
  { id: 'last_year',      needle: /last year/i, label: 'Temporal substitution "last year" for "yesterday"' },
  { id: 'rec_strategies', needle: /break.{0,10}down.{0,30}(direction|step)|gestures?|visual aid/i, label: 'Recommended strategies (break down, gestures, visual)' },
]

function coverage(text, facts) {
  if (!text) return { hits: [], misses: facts.map((f) => f.label), pct: 0 }
  const hits = []
  const misses = []
  for (const f of facts) {
    if (f.needle.test(text)) hits.push(f.label)
    else misses.push(f.label)
  }
  return { hits, misses, pct: Math.round((hits.length / facts.length) * 100) }
}

async function main() {
  const outDir = join(__dirname, '..', 'scripts', 'out')
  await mkdir(outDir, { recursive: true })
  const stem = basename(filePath).replace(/\.[^.]+$/, '')

  console.log(`${tag('PDF')} ${filePath}`)
  console.log(`${tag('MODEL')} ${model}\n`)

  const A = await callClaude(PROMPT_A_SYSTEM, 'A-current', 2000)
  const B = await callClaude(PROMPT_B_SYSTEM, 'B-faithful', 4096)

  if (A) {
    await writeFile(join(outDir, `${stem}.A-current.txt`), A.text)
    console.log(`${tag('A-current')} length: ${A.text.length} chars`)
  }
  if (B) {
    await writeFile(join(outDir, `${stem}.B-faithful.txt`), B.text)
    console.log(`${tag('B-faithful')} length: ${B.text.length} chars`)
  }

  console.log()

  const covA = coverage(A?.text, GROUND_TRUTH_FACTS)
  const covB = coverage(B?.text, GROUND_TRUTH_FACTS)
  console.log(`${tag('COVERAGE')} ground-truth facts recovered (${GROUND_TRUTH_FACTS.length} tested)`)
  console.log(`  A-current:  ${covA.hits.length}/${GROUND_TRUTH_FACTS.length} = ${covA.pct}%`)
  console.log(`  B-faithful: ${covB.hits.length}/${GROUND_TRUTH_FACTS.length} = ${covB.pct}%`)
  console.log()

  console.log(`${tag('A-current misses')} (${covA.misses.length})`)
  for (const m of covA.misses) console.log(`  • ${m}`)
  console.log()

  console.log(`${tag('B-faithful misses')} (${covB.misses.length})`)
  for (const m of covB.misses) console.log(`  • ${m}`)
  console.log()

  console.log(`${tag('OUT')} scripts/out/${stem}.A-current.txt  (${A?.text?.length || 0} chars)`)
  console.log(`${tag('OUT')} scripts/out/${stem}.B-faithful.txt (${B?.text?.length || 0} chars)`)
}

main().catch((err) => { console.error('FATAL', err); process.exit(1) })
