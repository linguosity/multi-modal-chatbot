#!/usr/bin/env node
/**
 * Standalone diagnostic: runs the intake file-processing path against a
 * user-supplied file. Bypasses HTTP/auth/React — we just want to see what
 * happens as the file moves through the pipeline.
 *
 * Run: node scripts/test-rtf-intake.mjs "<path-to-file>"
 */

import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { config as dotenvConfig } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// Load .env.local the way Next.js would
dotenvConfig({ path: join(__dirname, '..', '.env.local') })

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node scripts/test-rtf-intake.mjs <path-to-file>')
  process.exit(1)
}

const tag = (label) => `\x1b[1;36m[${label}]\x1b[0m`

const main = async () => {
  console.log(`${tag('READ')} ${filePath}`)
  const buf = await readFile(filePath)
  const name = basename(filePath)
  const sizeMB = (buf.length / 1024 / 1024).toFixed(2)
  console.log(`  size: ${buf.length} bytes (${sizeMB} MB)`)

  // Infer MIME the way the browser would
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const mimeByExt = { rtf: 'text/rtf', txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', html: 'text/html', pdf: 'application/pdf' }
  const type = mimeByExt[ext] || 'application/octet-stream'
  console.log(`  type:  ${type} (inferred from .${ext})`)

  // Branch logic mirrors process-intake/route.ts text branch
  console.log(`${tag('BRANCH')} checking route.ts intake branch selection...`)
  const textBranchMatches = type.startsWith('text/') || type === 'application/rtf' || /\.(txt|md|csv|html|rtf)$/i.test(name)
  console.log(`  text branch?  ${textBranchMatches}`)

  if (!textBranchMatches) {
    console.log('  → would fall to processMultipleFiles (DOCUMENT validator). Exiting.')
    return
  }

  console.log(`${tag('F.TEXT')} reading as text (simulating f.text())...`)
  const t0 = Date.now()
  const text = buf.toString('utf-8')
  const dt = Date.now() - t0
  console.log(`  took: ${dt}ms`)
  console.log(`  text length: ${text.length} chars`)
  console.log(`  first 200: ${JSON.stringify(text.slice(0, 200))}`)

  // Rough token estimate: ~4 chars per token for English prose;
  // RTF markup is denser, so ~3 chars/token is a safer estimate.
  const tokenEstRough = Math.ceil(text.length / 4)
  const tokenEstDense = Math.ceil(text.length / 3)
  console.log(`${tag('TOKENS')} rough estimate: ${tokenEstRough.toLocaleString()} (loose) / ${tokenEstDense.toLocaleString()} (dense for RTF markup)`)
  console.log(`  Claude Opus 4.7 default context:  200,000 tokens`)
  console.log(`  Claude Opus 4.7 with [1m] context: 1,000,000 tokens (premium)`)

  if (tokenEstDense > 200_000) {
    console.log(`  ⚠️ WILL EXCEED 200k token limit — Claude will reject this on the default endpoint.`)
  }
  if (tokenEstDense > 1_000_000) {
    console.log(`  ❌ WILL EXCEED even the 1M context window.`)
  }

  // Show how much of the text is RTF markup vs. actual prose
  // Strip RTF groups to estimate readable content
  const plain = text
    // Drop RTF escape groups like {\foo ...}
    .replace(/\{\\\*[^{}]*\}/g, ' ')
    // Drop RTF control words (\word or \word123)
    .replace(/\\[a-zA-Z]+-?\d*\s?/g, ' ')
    // Drop stray braces
    .replace(/[{}]/g, ' ')
    // Drop RTF-escaped literals (\' followed by hex pair)
    .replace(/\\'[0-9a-fA-F]{2}/g, ' ')
    // Drop line breaks + condense whitespace
    .replace(/\s+/g, ' ')
    .trim()

  const plainRatio = (plain.length / text.length * 100).toFixed(1)
  console.log(`${tag('STRIP')} after crude RTF→plaintext strip:`)
  console.log(`  plain text length: ${plain.length} chars (${plainRatio}% of raw RTF)`)
  console.log(`  plain token estimate: ~${Math.ceil(plain.length / 4).toLocaleString()} tokens`)
  console.log(`  first 400 of plain: ${JSON.stringify(plain.slice(0, 400))}`)
  console.log(`  last 400 of plain:  ${JSON.stringify(plain.slice(-400))}`)

  // Ping Claude with just the plain-text extract (short enough)
  const apiKey = process.env.ANTHROPIC_API_KEY
  const model = process.env.CLAUDE_MODEL || 'claude-opus-4-7'
  if (!apiKey) {
    console.log(`${tag('CLAUDE')} skipping — no ANTHROPIC_API_KEY`)
    return
  }

  // Send first ~50k chars only so we don't burn tokens
  const sample = plain.slice(0, 50_000)
  console.log(`${tag('CLAUDE')} calling ${model} with ${sample.length} chars of cleaned plaintext...`)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Extract the 5 most important facts from this SLP assessment report (name, age, tests, scores, recommendations) in concise bullets.' },
          { type: 'text', text: sample },
        ],
      }],
    }),
  })

  console.log(`  HTTP ${res.status}`)
  const body = await res.text()
  console.log(`  response (first 1500 chars):\n  ${body.slice(0, 1500)}`)
}

main().catch((err) => {
  console.error('FATAL', err)
  process.exit(1)
})
