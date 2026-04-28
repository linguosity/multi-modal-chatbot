import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
// Primary AI: Claude Opus 4.7 via anthropic-compat. Gemini is kept only for
// audio transcription (Claude has no native audio support yet).
import Anthropic from '@/lib/ai/anthropic-compat'

/**
 * Consume a Claude response's content array and build a single string with
 * citation pages inlined after their cited text (as [p.N] or [p.N-M]).
 *
 * Requires citations to have been enabled on the source document block with
 * `citations: { enabled: true }`. Each text block may carry its own citations
 * array — we surface them as suffixes so downstream steps (the main tool-use
 * analyzer) can copy the page ref into source_reference.
 */
function inlinePageRefs(content: any[]): string {
  const parts: string[] = []
  for (const b of Array.isArray(content) ? content : []) {
    if (b?.type !== 'text') continue
    const citations = Array.isArray(b.citations) ? b.citations : []
    const pages = new Set<string>()
    for (const c of citations) {
      if (c?.type === 'page_location' && typeof c.start_page_number === 'number') {
        const s = c.start_page_number
        const e = c.end_page_number
        pages.add(s && e && s !== e ? `p.${s}-${e}` : `p.${s}`)
      }
    }
    const ref = pages.size > 0 ? ` [${Array.from(pages).join(', ')}]` : ''
    parts.push((b.text || '') + ref)
  }
  return parts.join('\n')
}
import { processMultipleFiles, transcribeAudio, fileToBase64 } from '@/lib/ai/gemini-file-processor'
import { validateAndCleanFieldUpdate, dataIntegrityGuard } from '@/lib/data-integrity-guard'
import { reportContextBuilder } from '@/lib/report-context-builder'
// PDF text extraction disabled to avoid native 'canvas' dependency
import { validatePathAgainstSchema, coerceValueToSchema } from '@/lib/value-normalizer'
import { SectionSchema, ASSESSMENT_RESULTS_SECTION, ASSESSMENT_TOOLS_SECTION, VALIDITY_STATEMENT_SECTION, REASON_FOR_REFERRAL_SECTION, LANGUAGE_SAMPLE_SECTION, CONCLUSION_SECTION, RECOMMENDATIONS_SECTION, ACCOMMODATIONS_SECTION } from '@/lib/structured-schemas'
import { reconcileDomainSummary } from '@/lib/assessment-results/convergence'
import { z } from 'zod'
import { parseWithZod } from '@/lib/ai/structured'
import { StructuredFieldPathResolver } from '@/lib/field-path-resolver'
import { seedContentFromStructuredData } from '@/components/report/section-editor/slot-seeding'
import { getSlotDef } from '@/components/report/section-editor/slots'
import { emitEvent, completeProgress } from '@/lib/server/progress-stream'
import { previewValue, type FileKind, type MergeStrategy } from '@/lib/progress-events'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { PIIRedactor, persistPIIMappings } from '@/lib/pii/redactor'

// Strip array indices and return the leaf segment of a field path.
// 'language_skills.morphology' → 'morphology'; 'tests[2].score' → 'score'.
function leafKey(path: string): string {
  const noIdx = path.replace(/\[\d+\]/g, '')
  const segs = noIdx.split('.')
  return segs[segs.length - 1] || path
}

// Friendly label for a field path. Prefers the slot registry; falls back
// to a snake_case → Title Case humanization of the leaf.
function slotLabelFor(path: string): string {
  const leaf = leafKey(path)
  const def = getSlotDef(leaf)
  if (def) return def.label
  return leaf.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function fileKindFor(mimeType: string, name: string): FileKind {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('text/') || /\.(txt|md|csv|html|rtf)$/i.test(name)) return 'note'
  return 'other'
}

// Claude client is instantiated per-request via `new Anthropic()`

export async function POST(request: NextRequest) {
  console.log('🚀 === AI INTAKE API ROUTE START ===')

  // Hoisted so the catch block at the bottom can tear down the SSE stream +
  // Supabase realtime channel even when the try body throws early.
  let operationId: string | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let broadcastChannel: any = null

  try {
    console.log('✅ Step 1: API route handler called successfully')
    console.log('✅ Step 2: About to parse FormData')

    const formData = await request.formData()
    console.log('✅ Step 3: FormData parsed successfully')

    const reportId = formData.get('reportId') as string
    console.log('✅ Step 4: reportId extracted:', reportId)

    const sectionIdsRaw = formData.get('sectionIds') as string || '[]'
    operationId = (formData.get('operationId') as string | null) || null
    const sectionInfoRaw = formData.get('sectionInfo') as string | null
    const sectionSchemasRaw = formData.get('sectionSchemas') as string | null
    console.log('✅ Step 5: sectionIds raw:', sectionIdsRaw)

    const sectionIds = JSON.parse(sectionIdsRaw)
    const providedSectionInfo: Array<{ id: string; title?: string; section_type?: string }> = sectionInfoRaw ? JSON.parse(sectionInfoRaw) : []
    const providedSectionSchemas: Record<string, SectionSchema> = sectionSchemasRaw ? JSON.parse(sectionSchemasRaw) : {}
    console.log('✅ Step 6: sectionIds parsed:', sectionIds.length, 'sections')

    const replace = formData.get('replace') === 'true'
    const dryRun = formData.get('dryRun') === 'true'
    const rawText = formData.get('text') as string

    // ── PII guard (design review §10) ─────────────────────────────────────
    // Redact PII from the user-provided context text BEFORE it reaches the
    // Claude / Gemini prompts. File-extracted text (PDF/audio) gets the same
    // treatment below as it enters the content pipeline.
    const piiRedactor = new PIIRedactor()
    const textRedaction = piiRedactor.redact(rawText || '')
    const text = textRedaction.redactedText
    try { emitEvent(operationId, { kind: 'pii', source: 'text', entitiesFound: textRedaction.entitiesFound.length }) } catch {}

    console.log('📝 Request data summary:', {
      reportId,
      sectionCount: sectionIds.length,
      replace,
      textLength: text?.length,
      piiEntitiesRedacted: textRedaction.entitiesFound.length,
    })

    console.log('✅ Step 7: Validating required fields...')
    if (!reportId || !sectionIds || sectionIds.length === 0) {
      console.log('❌ Step 7 FAILED: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: reportId, sectionIds' },
        { status: 400 }
      )
    }
    console.log('✅ Step 7: Required fields validated')

    console.log('✅ Step 8: Creating Supabase client...')
    const supabase = await createSupabaseServerClient()
    const LOG_PROGRESS = process.env.SUPABASE_PROGRESS_LOG_ENABLED === 'true'
    const dbLog = async (evt: { stage?: string; message?: string; section_id?: string | null; event_type?: string; data?: any }) => {
      if (!LOG_PROGRESS) return
      try {
        await supabase.from('progress_events').insert({
          report_id: reportId,
          section_id: evt.section_id || null,
          operation_id: operationId || null,
          event_type: evt.event_type || 'progress',
          stage: evt.stage || null,
          message: evt.message || null,
          data: evt.data || null,
        })
      } catch (e) {
        console.warn('⚠️ progress_events insert failed (non-fatal):', e instanceof Error ? e.message : String(e))
      }
    }

    // Optional Supabase Realtime broadcast (production-friendly alternative to postgres_changes)
    // Default broadcast to ON unless explicitly disabled
    const BROADCAST = process.env.SUPABASE_BROADCAST_ENABLED !== 'false'
    // broadcastChannel declared at function scope above
    let broadcastPublish: (event: string, payload: any) => void = () => {}
    if (BROADCAST && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const rt = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        broadcastChannel = rt.channel(`report:${reportId}`)
        await new Promise<void>((resolve) => {
          broadcastChannel.subscribe((status: string) => {
            if (status === 'SUBSCRIBED') resolve()
          })
        })
        broadcastPublish = (event: string, payload: any) => {
          try { broadcastChannel.send({ type: 'broadcast', event, payload }) } catch {}
        }
      } catch (e) {
        console.warn('⚠️ Realtime broadcast setup failed (non-fatal):', e instanceof Error ? e.message : String(e))
      }
    }
    console.log('✅ Step 8: Supabase client created')

    console.log('✅ Step 9: Building comprehensive report context...')

    // Build comprehensive report context with proper section resolution
    const contextResult = await reportContextBuilder.buildReportContext(reportId, sectionIds)

    if (!contextResult.success) {
      console.log('❌ Step 9 FAILED: Report context build error:', contextResult.error)
      return NextResponse.json(
        { error: 'Failed to build report context', details: contextResult.error },
        { status: 404 }
      )
    }

    const reportContext = contextResult.context!

    // Log warnings if any
    if (contextResult.warnings.length > 0) {
      console.log('⚠️ Step 9 Warnings:', contextResult.warnings)
    }

    console.log('✅ Step 9: Report context built successfully:', {
      reportTitle: reportContext.reportTitle,
      totalSections: reportContext.metadata.totalSections,
      targetSections: reportContext.metadata.targetSections,
      hasCircularReferences: reportContext.hasCircularReferences,
      corruptedSections: reportContext.metadata.corruptedSections
    })

    console.log('✅ Step 10: Processing uploaded files (Claude for PDFs, OpenAI for audio transcription)...')
    const files: File[] = []
    const uploadedFilesMeta: Array<{ id: string; name: string; type: string; size?: number; uploadDate: string; description?: string }>=[]
    /** Per-file row data destined for the `file_uploads` table. Populated as
     *  each file is processed so the source-inspector chevron can resolve
     *  citation strings back to the original file (filename + extracted_text).
     *  Mirrors `uploadedFilesMeta` index-for-index. */
    const uploadedFilesRows: Array<{
      id: string
      filename: string
      file_type: string
      file_size: number | null
      extracted_text: string | null
      processing_status: 'completed' | 'failed'
      error_message: string | null
    }> = []
    let fileIndex = 0
    while (formData.get(`file_${fileIndex}`)) {
      files.push(formData.get(`file_${fileIndex}`) as File)
      fileIndex++
    }

    console.log(`✅ Step 10: Found ${files.length} files`)
    // SSE milestone (upload complete)
    try { emitEvent(operationId, { kind: 'stage', stage: 'uploading_files', status: 'done', sectionId: sectionIds[0] }) } catch {}
    try { broadcastPublish('progress', { stage: 'uploading_files_complete' }) } catch {}
    dbLog({ stage: 'uploading_files_complete', message: 'All files parsed', event_type: 'stage' }).catch(() => {})

    const processingErrors: string[] = []

    console.log('✅ Step 11: Getting target sections with full context...')
    try { emitEvent(operationId, { kind: 'stage', stage: 'extracting_text', status: 'start', sectionId: sectionIds[0] }) } catch {}
    try { broadcastPublish('progress', { stage: 'extracting_text_start' }) } catch {}
    dbLog({ stage: 'extracting_text_start', message: 'Text extraction started', event_type: 'stage' }).catch(() => {})
    let targetSectionsWithContext = reportContextBuilder.getTargetSectionsWithContext(reportContext)
    // Fallback to client-provided sectionInfo if DB returned no sections
    const hasFallbackSections = targetSectionsWithContext.length === 0 && providedSectionInfo.length > 0
    if (hasFallbackSections) {
      targetSectionsWithContext = providedSectionInfo
        .filter(s => sectionIds.includes(s.id))
        .map(s => ({
          id: s.id,
          title: s.title || s.id,
          section_type: s.section_type || 'unknown',
          ai_directive: undefined,
          schema: providedSectionSchemas[s.id],
          current_data_keys: []
        }))
      console.log(`⚠️ Step 11: Using client-provided sectionInfo fallback with ${targetSectionsWithContext.length} sections`)
    }
    const sectionSchemaById = new Map<string, SectionSchema | undefined>()
    const sectionMetaById = new Map<string, { title: string; section_type: string }>()
    let toolsSectionId: string | null = null
    for (const s of targetSectionsWithContext) {
      // prefer provided schema if present
      let schema: SectionSchema | undefined = providedSectionSchemas[s.id] || (s.schema as SectionSchema | undefined)
      if (!schema) {
        // Fallback by section title (common defaults)
        const title = (s.title || '').toLowerCase()
        if (title.includes('assessment results')) schema = ASSESSMENT_RESULTS_SECTION
        else if (title.includes('assessment tools')) schema = ASSESSMENT_TOOLS_SECTION
        else if (title.includes('validity')) schema = VALIDITY_STATEMENT_SECTION
        else if (title.includes('reason for referral')) schema = REASON_FOR_REFERRAL_SECTION
        else if (title.includes('language sample')) schema = LANGUAGE_SAMPLE_SECTION
        else if (title.includes('conclusion')) schema = CONCLUSION_SECTION
        else if (title.includes('recommendations')) schema = RECOMMENDATIONS_SECTION
        else if (title.includes('accommodations')) schema = ACCOMMODATIONS_SECTION
      }
      sectionSchemaById.set(s.id, schema)
      sectionMetaById.set(s.id, { title: s.title || s.id, section_type: (s as any).section_type || 'unknown' })
      if (((s as any).section_type || '').toLowerCase() === 'assessment_tools' || (s.title || '').toLowerCase().includes('assessment tools')) {
        toolsSectionId = s.id
      }
    }

    console.log(`✅ Step 11: Found ${targetSectionsWithContext.length} target sections (including fallbacks if any)`) 
    if (targetSectionsWithContext.length === 0) {
      console.log('❌ Step 11 FAILED: No valid target sections found')
      return NextResponse.json(
        {
          error: 'No valid target sections found',
          details: `Requested: ${sectionIds.length}. Available: ${reportContext.sections.length}. If you intend to proceed without DB sections, include sectionInfo + sectionSchemas.`
        },
        { status: 400 }
      )
    }

    // Build a valid section ID set from resolved targets (fallback-aware)
    const validSectionIds = new Set<string>(targetSectionsWithContext.map(s => s.id))
    // As an additional guard, if for some reason the resolved targets are empty, allow the originally requested IDs
    if (validSectionIds.size === 0 && Array.isArray(sectionIds)) {
      for (const id of sectionIds) validSectionIds.add(id)
    }

    // Build Allowed Field Paths (flattened) per section from schema
    function flattenFields(fields: any[], prefix = ''): string[] {
      const out: string[] = []
      for (const f of fields || []) {
        const base = prefix ? `${prefix}.${f.key}` : `${f.key}`
        // Include the field itself
        out.push(base)
        if (f.children && Array.isArray(f.children) && f.children.length > 0) {
          const childPrefix = f.type === 'array' ? `${base}[]` : base
          out.push(...flattenFields(f.children, childPrefix))
        }
      }
      return out
    }
    const allowedPathsBySection = new Map<string, string[]>()
    for (const s of targetSectionsWithContext) {
      const schema = sectionSchemaById.get(s.id)
      if (schema?.fields?.length) {
        const paths = flattenFields(schema.fields)
        allowedPathsBySection.set(s.id, paths)
      }
    }

    console.log('✅ Step 13: Building enhanced system prompt with complete context...')
    let systemPrompt = reportContextBuilder.buildEnhancedSystemPrompt(reportContext)
    if (hasFallbackSections) {
      const extra = targetSectionsWithContext.map(s => `- ${s.id} (${s.title}) [type=${s.section_type}]`).join('\n')
      systemPrompt += `\n\nFALLBACK SECTIONS (client-provided):\n${extra}`
    }

    console.log('✅ Step 14: Building content array...')
    const content: any[] = [] // for logs and debugging
    const openaiContent: any[] = [] // for GPT-5 multimodal call

    if (text && text.trim()) {
      const textBlock = { type: 'text', text: `Assessment Notes:\n${text}` }
      content.push(textBlock)
      openaiContent.push(textBlock)
      console.log('✅ Step 14a: Added text content')
    }

    const VERBOSE = (process.env.NEXT_PUBLIC_PROGRESS_VERBOSE === 'true') || (process.env.NEXT_PUBLIC_SSE_VERBOSE === 'true')
    for (const f of files) {
      console.log(`📎 File: name="${f.name}" type="${f.type}" size=${(f.size / 1024 / 1024).toFixed(2)}MB`)
      // Stable id used for both the metadata.uploadedFiles entry and the
      // file_uploads row, so the source-inspector chevron can cross-reference.
      const fileId = crypto.randomUUID()
      let perFileExtracted: string | null = null
      try {
        // collect source metadata for report metadata.uploadedFiles
        const metaType = f.type.startsWith('application/pdf') ? 'pdf' : (f.type.startsWith('image/') ? 'image' : (f.type.startsWith('audio/') ? 'audio' : (f.type.startsWith('text/') ? 'text' : 'document')))
        uploadedFilesMeta.push({ id: fileId, name: f.name, type: metaType, size: (f as any).size, uploadDate: new Date().toISOString() })
        // Verbose per-file progress
        if (VERBOSE) {
          try { emitEvent(operationId, { kind: 'file', filename: f.name, fileKind: fileKindFor(f.type, f.name), status: 'start', sectionId: sectionIds[0] }) } catch {}
        }
        if (f.type === 'application/pdf') {
          // Send PDF to Claude to extract a concise, report-ready "Main Points"
          // summary for SLP. Pre-extraction keeps token cost down for the main
          // analysis call AND gives PII redaction text to work on.
          const arrayBuffer = await f.arrayBuffer()
          const base64Data = Buffer.from(arrayBuffer).toString('base64')

          const pdfAnthropic = new Anthropic()
          const pdfExtractResponse = await pdfAnthropic.messages.create({
            model: process.env.CLAUDE_MODEL || 'claude-opus-4-7',
            max_tokens: 8192,
            // Note: Claude Opus 4.7 doesn't accept `temperature`.
            //
            // System is passed as an array so we can mark the stable prompt
            // as cache-eligible. Prompt caching cuts repeat-call input cost
            // to ~10% and latency to ~15% — first call warms the cache, every
            // subsequent PDF in the same session (5-min TTL) is a cache hit.
            system: [
              {
                type: 'text',
                cache_control: { type: 'ephemeral' },
                text: [
                  'You are an expert Speech-Language Pathologist extracting the FULL CONTENT of an assessment PDF for downstream structured processing.',
                  'Goal: preserve clinically-relevant detail faithfully. Another AI step will reduce this into structured fields — your job is NOT to summarize; it is to surface every fact.',
                  'Preserve verbatim:',
                  '- All proper nouns (student, parent, teacher, school, district, evaluator, test names)',
                  '- All numeric values: standard scores, percentiles, confidence intervals, raw scores, standard-deviation statements, ages (e.g. "2;11"), dates',
                  '- Eligibility language (e.g. "DOES NOT SUPPORT", "Ed Code 56333", specific criteria statements)',
                  '- Direct quotes from parent / teacher / student, especially the ones that anchor clinical judgment',
                  '- Language-sample utterances when present (they are evidence, not filler)',
                  '- Recommendations with the exact phrasing the report uses',
                  'Structure the output with short section headers that mirror the report (Reason for Referral, Background, Tools, Findings by Domain, Eligibility, Summary, Recommendations). Use bullets within each.',
                  'If a field is empty in the source, mark it as [not provided]. Aim for completeness over brevity.',
                  'Do not invent data. Do not speculate. Preserve clinical caveats and any "DOES NOT SUPPORT" / "does support" statements verbatim.',
                  'Output plain text with section headers + bullets. No JSON, no commentary outside the extraction.',
                  'Citations are enabled on the source document — when you quote or paraphrase a specific passage, ground it so page references can be attached automatically.',
                ].join('\n'),
              },
            ],
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
                  // Enabling citations makes Claude's response blocks carry
                  // { type: 'page_location', start_page_number, end_page_number, cited_text }
                  // markers that inlinePageRefs() weaves into the output text as [p.N].
                  citations: { enabled: true },
                } as any,
                {
                  type: 'text',
                  text: 'Extract the content of this assessment PDF faithfully per the system instructions.',
                },
              ],
            }],
          })

          const extractedTextRaw = inlinePageRefs(pdfExtractResponse.content as any[])
          try {
            const u: any = (pdfExtractResponse as any).usage || {}
            console.log(`  💰 PDF extract usage — in:${u.input_tokens} out:${u.output_tokens} cache_write:${u.cache_creation_input_tokens || 0} cache_hit:${u.cache_read_input_tokens || 0}`)
          } catch {}
          // PII guard: redact before the text reaches the Claude/Gemini prompt.
          const { redactedText: extractedText, entitiesFound: pdfEnts } = piiRedactor.redact(extractedTextRaw)
          if (pdfEnts.length > 0) {
            try { emitEvent(operationId, { kind: 'pii', source: 'file', filename: f.name, entitiesFound: pdfEnts.length }) } catch {}
          }
          const textBlock2 = { type: 'text', text: `Main Points from PDF (${f.name}):\n${extractedText}` }
          content.push(textBlock2)
          openaiContent.push(textBlock2)
          perFileExtracted = extractedText
        } else if (f.type.startsWith('audio/')) {
          const transcriptRaw = await transcribeAudio(f)
          const { redactedText: transcript, entitiesFound: audioEnts } = piiRedactor.redact(transcriptRaw)
          if (audioEnts.length > 0) {
            try { emitEvent(operationId, { kind: 'pii', source: 'file', filename: f.name, entitiesFound: audioEnts.length }) } catch {}
          }
          const audioBlock = { type: 'text', text: `Audio transcript from ${f.name}:\n${transcript}` }
          content.push(audioBlock)
          openaiContent.push(audioBlock)
          perFileExtracted = transcript
        } else if (
          f.type.startsWith('text/') ||
          f.type === 'application/rtf' ||
          /\.(txt|md|csv|html|rtf)$/i.test(f.name)
        ) {
          // Read as text. RTF markup goes through verbatim; Claude handles it.
          const tRaw = await f.text()
          const { redactedText: t, entitiesFound: textEnts } = piiRedactor.redact(tRaw)
          if (textEnts.length > 0) {
            try { emitEvent(operationId, { kind: 'pii', source: 'file', filename: f.name, entitiesFound: textEnts.length }) } catch {}
          }
          const textFileBlock = { type: 'text', text: `Text content from ${f.name}:\n${t}` }
          content.push(textFileBlock)
          openaiContent.push(textFileBlock)
          perFileExtracted = t
        } else if (f.type.startsWith('image/')) {
          const base64 = await fileToBase64(f)
          openaiContent.push({
            type: 'image_url',
            image_url: { url: `data:${f.type};base64,${base64}` }
          })
          content.push({ type: 'text', text: `Image provided (${f.name}). Included for GPT-5 vision.` })
        } else {
          const processed = await processMultipleFiles([f])
          processed.forEach(p => {
            try {
              const decoded = Buffer.from(p.content, 'base64').toString('utf-8')
              const otherBlock = { type: 'text', text: `Content from ${p.name}:\n${decoded}` }
              content.push(otherBlock)
              openaiContent.push(otherBlock)
            } catch {
              const infoBlock = { type: 'text', text: `File ${p.name} processed; content length ${p.content.length}` }
              content.push(infoBlock)
              openaiContent.push(infoBlock)
            }
          })
        }
        if (VERBOSE) {
          try { emitEvent(operationId, { kind: 'file', filename: f.name, fileKind: fileKindFor(f.type, f.name), status: 'done', sectionId: sectionIds[0] }) } catch {}
        }
        uploadedFilesRows.push({
          id: fileId,
          filename: f.name,
          file_type: f.type || 'application/octet-stream',
          file_size: typeof (f as any).size === 'number' ? (f as any).size : null,
          extracted_text: perFileExtracted,
          processing_status: 'completed',
          error_message: null,
        })
      } catch (e) {
        const err = e as Error
        processingErrors.push(`${f.name}: ${err.message}`)
        console.error(`❌ File processing failed for ${f.name}:`, err.message)
        if (err.stack) console.error(err.stack.split('\n').slice(0, 5).join('\n'))
        if (VERBOSE) {
          try { emitEvent(operationId, { kind: 'file', filename: f.name, fileKind: fileKindFor(f.type, f.name), status: 'failed', sectionId: sectionIds[0] }) } catch {}
        }
        uploadedFilesRows.push({
          id: fileId,
          filename: f.name,
          file_type: f.type || 'application/octet-stream',
          file_size: typeof (f as any).size === 'number' ? (f as any).size : null,
          extracted_text: perFileExtracted,
          processing_status: 'failed',
          error_message: err.message?.slice(0, 500) ?? 'unknown error',
        })
      }
    }

    if (processingErrors.length > 0) {
      content.push({ type: 'text', text: `Note: Some files could not be processed:\n${processingErrors.join('\n')}` })
      console.log(`⚠️ Step 14c: Added ${processingErrors.length} processing error notes`)
    }

    if (content.length === 0) {
      console.log('❌ Step 14 FAILED: No content provided for processing')
      return NextResponse.json({ error: 'No content provided for processing' }, { status: 400 })
    }

    const instruction = { type: 'text', text: 'Please extract relevant information and update the appropriate sections using the save_assessment_data tool. Include a brief process_summary for each update that describes what was extracted and updated. If tool calling is unavailable for any reason, return ONLY raw JSON matching the tool input schema: {"updates": [...]} with no extra prose.' }
    content.push(instruction)
    openaiContent.push(instruction)

    console.log(`✅ Step 14: Content array built with ${content.length} items`)
    try { emitEvent(operationId, { kind: 'stage', stage: 'extracting_text', status: 'done', sectionId: sectionIds[0] }) } catch {}
    try { broadcastPublish('progress', { stage: 'extracting_text_complete' }) } catch {}
    dbLog({ stage: 'extracting_text_complete', message: 'Text extraction complete', event_type: 'stage' }).catch(() => {})

    // ── Persist PII mappings (design review §10) ─────────────────────────
    // Runs fire-and-forget; the redactor has already rewritten the prompts
    // so the LLM request proceeds regardless of whether persistence succeeds.
    const allRedactedEntities = piiRedactor.listAllMappings().map((m) => ({
      type: m.type,
      detectedValue: m.detectedValue,
      token: m.token,
      action: (m.type === 'DOB' || m.type === 'DATE') ? 'semantic' as const
            : (m.type === 'ADDRESS' || m.type === 'PHONE' || m.type === 'EMAIL' || m.type === 'MRN' || m.type === 'SSN') ? 'remove' as const
            : 'replace' as const,
      confidence: 0.9,
      needsReview: false,
    }))
    if (allRedactedEntities.length > 0) {
      persistPIIMappings(supabase, reportId, allRedactedEntities).then((res) => {
        if (res.ok) console.log(`✅ PII: persisted ${res.persisted} mappings`)
        else if (res.error === 'table_missing') {
          console.warn('⚠️ PII: pii_mappings table missing — apply migration 004_pii_mappings.sql')
        }
      }).catch(() => {})
    }

    console.log('✅ Step 15: Defining tool schema...')
    const reportSchemaTool = {
      name: "save_assessment_data",
      description: "Extracts and saves structured data with a domain-first summary (can_do/support_needed), clear tool categorization, and provenance.",
      input_schema: {
        type: "object" as const,
        properties: {
          domain_summary: {
            type: "array",
            description: "Domain-first summary for Assessment Results (preferred)",
            items: {
              type: "object",
              properties: {
                domain: { type: "string" },
                can_do: { type: "array", items: { type: "string" } },
                support_needed: { type: "array", items: { type: "string" } },
                contexts: { type: "array", items: { type: "string" } },
                sources: { type: "array", items: { type: "string" } }
              },
              required: ["domain"]
            }
          },
          updates: {
            type: "array",
            description: "Array of field updates to apply to the report sections",
            items: {
              type: "object",
              properties: {
                section_id: {
                  type: "string",
                  description: "ID of the section to update"
                },
                field_path: {
                  type: "string",
                  description: "Dot notation path to the field RELATIVE to the section root (e.g., 'assessment_items.0.title' or 'voice_notes'). Do NOT prefix with the section key. NEVER use 'structured_data' as a field path."
                },
                value: {
                  description: "New value for the field"
                },
                merge_strategy: {
                  type: "string",
                  enum: ["replace", "append", "merge"],
                  description: "How to handle existing data"
                },
                source_reference: {
                  type: "string",
                  description: "Provenance string, e.g., 'celf_prek.pdf p.4' or 'frog_story.txt lines 1–17'"
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Extraction confidence (0-1)"
                },
                process_summary: {
                  type: "string",
                  description: "Brief summary of what was extracted/updated for user notification"
                }
              },
              required: ["section_id", "field_path", "value", "merge_strategy", "process_summary"]
            }
          },
        },
        required: ["updates"]
      }
    }

    // Step 16/17: Either use client-provided updates or call model
    let updates: any[] = []
    let domainSummary: any[] | undefined
    const applyUpdatesRaw = formData.get('applyUpdates') as string | null
    if (applyUpdatesRaw) {
      try {
        updates = JSON.parse(applyUpdatesRaw)
        console.log(`🟡 Step 16: Using client-provided updates (${updates.length})`)
      } catch (e) {
        return NextResponse.json({ error: 'Invalid applyUpdates JSON' }, { status: 400 })
      }
    } else {
      console.log('🤖 Step 16: Calling Claude Opus 4.7 with forced tool...')
      try { emitEvent(operationId, { kind: 'stage', stage: 'analyzing_with_ai', status: 'start', sectionId: sectionIds[0] }) } catch {}
      try { broadcastPublish('progress', { stage: 'analyzing_with_ai_start' }) } catch {}

      // Compose Report Schema JSON (selected sections only) to provide full structural context
      const schemaPayload: any = []
      for (const s of targetSectionsWithContext) {
        const schema = sectionSchemaById.get(s.id)
        if (schema) {
          schemaPayload.push({ section_id: s.id, title: s.title, schema })
        } else {
          schemaPayload.push({ section_id: s.id, title: s.title, schema: null })
        }
      }

      // Compose an Allowed Field Paths guidance block to reduce invalid field_path proposals
      let allowedPathsText = 'ALLOWED FIELD PATHS\nUse ONLY the exact field paths listed per section. If a section is not listed or has no paths, skip structured updates for it. Do NOT invent field names.\n\n'
      for (const s of targetSectionsWithContext) {
        const paths = allowedPathsBySection.get(s.id)
        if (paths && paths.length) {
          // Limit extremely long lists to keep tokens in check
          const MAX = 120
          const show = paths.slice(0, MAX)
          const more = paths.length > MAX ? `\n  ... and ${paths.length - MAX} more` : ''
          allowedPathsText += `Section ${s.id} (${s.title}):\n  - ${show.join('\n  - ')}${more}\n\n`
        } else {
          allowedPathsText += `Section ${s.id} (${s.title}):\n  - (no structured schema provided; skip structured updates for this section)\n\n`
        }
      }

      // Split the system instruction so we can cache the stable piece.
      // `systemPrompt` is the deployment-wide SLP role/constraints — same on
      // every call, so it's a cache-hit candidate. The report schema payload
      // and allowed-paths block are per-report and stay uncached. Cache reads
      // are ~10% of cold-call cost; the 5-min TTL is enough to span a typical
      // SLP session where multiple sources get analyzed back-to-back.
      const systemBlocks: any[] = [
        {
          type: 'text',
          cache_control: { type: 'ephemeral' },
          text: systemPrompt
            + '\n\nWhen you emit a field update, set `source_reference` to "<filename> <page-marker>". '
            + 'The filename is the one printed in the "Main Points from PDF (<name>):" header just above '
            + 'each file\'s extracted text — copy it verbatim. The page marker is the [p.N] / [p.N-M] '
            + 'token from the surrounding extracted content. Example: '
            + '"celf_prek.pdf p.4" or "Levi.pdf p.2-3". If the value spans multiple files, pick the '
            + 'primary one. The clinician\'s UI parses the filename to link the citation back to the '
            + 'uploaded source — page-only references break the link.',
        },
        {
          type: 'text',
          text: `REPORT SCHEMA (JSON, selected sections):\n${JSON.stringify(schemaPayload).slice(0, 120000)}`,
        },
        {
          type: 'text',
          text: allowedPathsText,
        },
      ]

      // Convert our internal content array → Anthropic content blocks.
      // Text and image_url blocks are normalized; already-Anthropic blocks pass through.
      const toClaudePart = (part: any) => {
        if (part?.type === 'text' || part?.type === 'input_text') {
          return { type: 'text', text: part.text }
        }
        if (part?.type === 'image_url') {
          const url = typeof part.image_url === 'string' ? part.image_url : (part.image_url?.url || '')
          const m = typeof url === 'string' ? url.match(/^data:([^;]+);base64,(.+)$/) : null
          if (m) return { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } }
          return { type: 'text', text: `[Image URL: ${url}]` }
        }
        if (part?.type === 'image' || part?.type === 'document') return part
        return { type: 'text', text: typeof part === 'string' ? part : JSON.stringify(part) }
      }
      const claudeUserContent = (openaiContent as any[]).map(toClaudePart)

      const anthropic = new Anthropic()
      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-opus-4-7',
        // Opus 4.7 supports up to 32k output tokens. A full SLP report
        // extraction emits 40+ structured updates; each has 5-7 JSON fields
        // plus prose values. 8192 truncated mid-tool-use on a real 12-section
        // report — switching to 16384 leaves ~2x headroom.
        max_tokens: 16384,
        system: systemBlocks,
        messages: [{ role: 'user', content: claudeUserContent as any }],
        // cache_control on the tool marks the entire tools array as cacheable.
        // Cache key also includes the tool_choice, so forced-tool calls cache
        // separately from auto calls.
        tools: [{ ...reportSchemaTool, cache_control: { type: 'ephemeral' } }],
        tool_choice: { type: 'tool', name: 'save_assessment_data' },
      })

      console.log('✅ Step 16: Claude API call returned')
      try {
        const u: any = (response as any).usage || {}
        const sr: any = (response as any).stop_reason
        console.log(`  💰 Main call usage — in:${u.input_tokens} out:${u.output_tokens} cache_write:${u.cache_creation_input_tokens || 0} cache_hit:${u.cache_read_input_tokens || 0} stop:${sr}`)
        if (sr === 'max_tokens') {
          console.warn('  ⚠️ stop_reason=max_tokens — response was truncated; bump max_tokens if this recurs')
        }
      } catch {}
      try { emitEvent(operationId, { kind: 'stage', stage: 'analyzing_with_ai', status: 'done', sectionId: sectionIds[0] }) } catch {}
      try { broadcastPublish('progress', { stage: 'analyzing_with_ai_complete' }) } catch {}
      console.log('✅ Step 17: Extracting tool_use block from response...')

      // Claude returns a content array; find the forced tool_use block.
      const toolBlock: any = (response.content as any[]).find(
        (b: any) => b?.type === 'tool_use' && b?.name === 'save_assessment_data'
      )

      if (!toolBlock) {
        console.warn('⚠️ Step 16: No tool_use block found. Attempting Structured Outputs fallback...')

        // Structured Outputs fallback via parseWithZod (also Claude-backed)
        const UpdateSchema = z.object({
          section_id: z.string(),
          field_path: z.string(),
          value: z.any(),
          merge_strategy: z.enum(['replace', 'append', 'merge']).default('replace'),
          confidence: z.number().min(0).max(1).optional(),
          source_reference: z.string().optional(),
        })
        const UpdatesEnvelope = z.object({ updates: z.array(UpdateSchema) })

        // parseWithZod is text-only — flatten content blocks to text.
        const fallbackUserText = (openaiContent as any[])
          .map((p: any) =>
            p?.type === 'text' || p?.type === 'input_text'
              ? p.text
              : p?.type === 'image_url'
                ? `[Image: ${p.image_url?.url || p.image_url}]`
                : ''
          )
          .filter(Boolean)
          .join('\n\n')

        const so = await parseWithZod(
          UpdatesEnvelope,
          'assessment_updates',
          [
            { role: 'system', content: `${systemPrompt}\n\nReturn only JSON with { updates: [...] } strictly matching the schema.` },
            { role: 'user', content: fallbackUserText },
          ]
        )

        if (so.ok) {
          updates = so.data.updates
          console.log(`✅ Step 17: Parsed ${updates.length} updates via Structured Outputs fallback`)
        } else {
          // Last resort: look for JSON in any text block of the primary response
          const responseText = (response.content as any[])
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('\n')
          let parsed: any = null
          try { parsed = JSON.parse(responseText) } catch {
            const fence = responseText.match(/```(?:json)?\n([\s\S]*?)\n```/i)
            if (fence?.[1]) { try { parsed = JSON.parse(fence[1]) } catch {} }
            if (!parsed) {
              const s = responseText.indexOf('{'); const e = responseText.lastIndexOf('}')
              if (s !== -1 && e !== -1 && e > s) { try { parsed = JSON.parse(responseText.slice(s, e + 1)) } catch {} }
            }
          }
          if (parsed && Array.isArray(parsed.updates)) {
            updates = parsed.updates
            console.log(`✅ Step 17: Parsed ${updates.length} updates from text JSON fallback`)
          } else {
            console.error('❌ Step 16: No tool_use and JSON fallback failed.')
            throw new Error('No tool call found in response from model')
          }
        }
      }

      if (toolBlock && toolBlock.input) {
        updates = toolBlock.input.updates || []
        if (Array.isArray(toolBlock.input.domain_summary)) {
          domainSummary = toolBlock.input.domain_summary
        }
        console.log(`✅ Step 17: Extracted ${updates.length} updates from Claude`)
      }
    }

    console.log('✅ Step 18: Applying updates to database...')
    const results = []
    const processSummaries = []
    const resolver = new StructuredFieldPathResolver()

    // Collect per-section source refs keyed by slot id so the
    // generated SectionTree preserves evidence links on each slotted
    // paragraph. Only top-level field paths that match a registered
    // slot id are tracked — nested / array paths stay as
    // structured_data updates and aren't surfaced in the tree.
    const sourcesBySection: Record<string, Record<string, string | null>> = {}

    // If domain_summary provided, upsert into Assessment Results section before granular updates
    // Respect dryRun: do not write to DB during preview-only runs
    if (!dryRun && domainSummary && domainSummary.length > 0) {
      try {
        const resultsSection = targetSectionsWithContext.find(s => (s as any).section_type === 'assessment_results' || ((s.title || '').toLowerCase().includes('assessment results')))
        if (resultsSection) {
          const { data: current } = await supabase
            .from('report_sections')
            .select('structured_data')
            .eq('id', (resultsSection as any).id || resultsSection.id)
            .single()
          const currentSd = (current?.structured_data && typeof current.structured_data === 'object') ? current.structured_data : {}
          const nextSd = { ...currentSd, domain_summary: domainSummary }
          const { error: dsErr } = await supabase
            .from('report_sections')
            .upsert({
              id: (resultsSection as any).id || resultsSection.id,
              report_id: reportId,
              title: resultsSection.title,
              section_type: (resultsSection as any).section_type || 'assessment_results',
              structured_data: nextSd
            }, { onConflict: 'id' })
          if (dsErr) {
            console.warn('⚠️ Failed to upsert domain_summary:', dsErr.message)
          } else {
            console.log('✅ Upserted domain_summary into Assessment Results')
          }
        }
      } catch (e) {
        console.warn('⚠️ Error handling domain_summary:', e instanceof Error ? e.message : String(e))
      }
    }

    // Helper: normalize field path by stripping section key prefixes
    function normalizeFieldPath(rawPath: string, sectionSchema?: SectionSchema): string {
      if (!rawPath) return rawPath
      let p = rawPath.trim()
      // Strip common known section prefixes from model outputs
      const knownPrefixes = [
        'assessment_results.',
        'assessment_tools.',
        'validity_statement.',
        'reason_for_referral.',
        'language_sample.',
        'conclusion.',
        'recommendations.',
        'accommodations.',
        'header.',
        'student_information.'
      ]
      for (const kp of knownPrefixes) {
        if (p.startsWith(kp)) { p = p.slice(kp.length); break }
      }
      const sk = sectionSchema?.key
      if (sk && p.startsWith(sk + '.')) {
        p = p.slice(sk.length + 1)
      }
      // Prevent accidental structured_data nesting
      if (p.startsWith('structured_data.')) {
        p = p.replace(/^structured_data\./, '')
      }
      if (p === 'structured_data') p = ''
      return p
    }

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i]
      console.log(`📝 Step 18.${i + 1}: Processing update for section ${update.section_id}`)

      // CRITICAL FIX: Validate and clean field update to prevent Russian-doll issue
      const validationResult = validateAndCleanFieldUpdate(update)
      if (!validationResult.isValid) {
        console.error(`❌ Step 18.${i + 1} FAILED: Field update validation failed: ${validationResult.error}`)
        results.push({ sectionId: update.section_id, success: false, error: validationResult.error })
        continue
      }

      // Use cleaned update if data was corrupted
      const cleanedUpdate = validationResult.cleanedUpdate || update

      // Validate that the section ID is one we sent to Claude
      if (!validSectionIds.has(cleanedUpdate.section_id)) {
        console.log(`⚠️ Step 18.${i + 1}: Model returned invalid section ID ${cleanedUpdate.section_id}, skipping`)
        const validList = Array.from(validSectionIds)
        console.log(`   Valid section IDs: ${validList.join(', ')}`)
        results.push({
          sectionId: cleanedUpdate.section_id,
          success: false,
          error: `Invalid section ID. Valid IDs: ${Array.from(validSectionIds).join(', ')}`
        })
        continue
      }

      // Validate field path against section schema (if available)
      const sectionSchema = sectionSchemaById.get(cleanedUpdate.section_id)
      // SSE: emit per-field start
      try {
        emitEvent(operationId, {
          kind: 'field',
          sectionId: cleanedUpdate.section_id,
          sectionLabel: sectionMetaById.get(cleanedUpdate.section_id)?.title,
          fieldPath: cleanedUpdate.field_path,
          slotLabel: slotLabelFor(cleanedUpdate.field_path),
          valuePreview: previewValue(cleanedUpdate.value),
          mergeStrategy: ((cleanedUpdate.merge_strategy ?? 'replace') as MergeStrategy),
          status: 'pending',
        })
      } catch {}
      // Normalize field path to be relative to section root (model often prefixes with section key)
      cleanedUpdate.field_path = normalizeFieldPath(cleanedUpdate.field_path, sectionSchema)
      const pathCheck = validatePathAgainstSchema(sectionSchema, cleanedUpdate.field_path)
      if (!pathCheck.isValid) {
        const err = `Field path not in schema: ${cleanedUpdate.field_path}${pathCheck.errors.length ? ` (${pathCheck.errors.join('; ')})` : ''}`
        console.warn(`⚠️ Step 18.${i + 1}: ${err}`)
        results.push({ sectionId: cleanedUpdate.section_id, success: false, error: err })
        // Pair the earlier `pending` event so the toast doesn't stick.
        try {
          emitEvent(operationId, {
            kind: 'field',
            sectionId: cleanedUpdate.section_id,
            sectionLabel: sectionMetaById.get(cleanedUpdate.section_id)?.title,
            fieldPath: cleanedUpdate.field_path,
            slotLabel: slotLabelFor(cleanedUpdate.field_path),
            mergeStrategy: ((cleanedUpdate.merge_strategy ?? 'replace') as MergeStrategy),
            status: 'failed',
            error: err,
          })
        } catch {}
        continue
      }

      // Coerce value to expected field type when possible
      if (pathCheck.fieldSchema) {
        cleanedUpdate.value = coerceValueToSchema(cleanedUpdate.value, pathCheck.fieldSchema)
      }

      try {
        // Ensure a row exists in report_sections (create if missing)
        const { data: currentSection } = await supabase
          .from('report_sections')
          .select('id, structured_data')
          .eq('id', cleanedUpdate.section_id)
          .single()

        if (!currentSection) {
          const meta = sectionMetaById.get(cleanedUpdate.section_id)
          const fallbackTitle = meta?.title || cleanedUpdate.section_id
          const fallbackType = meta?.section_type || 'unknown'
          const { error: insErr } = await supabase
            .from('report_sections')
            .insert({
              id: cleanedUpdate.section_id,
              report_id: reportId,
              title: fallbackTitle,
              section_type: fallbackType,
              structured_data: {}
            })
          if (insErr) {
            console.warn(`⚠️ Step 18.${i + 1}: Could not pre-create report_sections row (may already exist):`, insErr.message)
          } else {
            console.log(`🆕 Step 18.${i + 1}: Created report_sections row for section ${cleanedUpdate.section_id}`)
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let updatedData: any = currentSection?.structured_data || {}

        // Clean existing data to prevent circular references
        const cleanupResult = dataIntegrityGuard.cleanCorruptedData(updatedData)
        if (cleanupResult.wasCorrupted) {
          console.warn(`⚠️ Step 18.${i + 1}: Cleaned corrupted data in section ${cleanedUpdate.section_id}:`, cleanupResult.issuesFound)
          updatedData = cleanupResult.cleanedData
        }

        // Apply the update based on merge strategy
        // Apply update using schema-aware merge
        updatedData = applyFieldUpdateWithSchema(
          resolver,
          updatedData,
          cleanedUpdate.field_path,
          cleanedUpdate.value,
          replace ? 'replace' : cleanedUpdate.merge_strategy,
          pathCheck.fieldSchema
        )

        // If we updated assessment_tools.tools, normalize tool entries to preferred fields
        try {
          const meta = sectionMetaById.get(cleanedUpdate.section_id)
          const sectionType = meta?.section_type || sectionSchema?.key
          if (sectionType === 'assessment_tools' && cleanedUpdate.field_path.startsWith('tools')) {
            // Unwrap Russian-doll payloads: Claude sometimes emits the tools
            // array as `{ "0": <tool>, "1": <tool> }` (object with numeric
            // string keys) instead of `[ <tool>, <tool> ]`. The array
            // coercion above wraps that whole object as `[ {"0": ...} ]`,
            // so each "tool" is really a wrapper containing one numeric
            // key. Detect and flatten.
            const isNumericKeyWrapper = (t: any): boolean => {
              if (!t || typeof t !== 'object' || Array.isArray(t)) return false
              const numericKeys = Object.keys(t).filter((k) => /^\d+$/.test(k))
              if (numericKeys.length === 0) return false
              // If ANY numeric-string key holds a tool-shaped object (id /
              // title / measure_type), treat the parent as a wrapper. The
              // sibling fields (`title: "Observation"` etc.) are the
              // normalizer's placeholder-default injection — we want to drop
              // them, not let them suppress unwrap.
              return numericKeys.some((k) => {
                const v = t[k]
                if (!v || typeof v !== 'object' || Array.isArray(v)) return false
                const vv = v as Record<string, unknown>
                return (
                  typeof vv.id === 'string' ||
                  typeof vv.title === 'string' ||
                  typeof vv.measure_type === 'string'
                )
              })
            }
            const unwrap = (t: any): any[] => {
              if (!isNumericKeyWrapper(t)) return [t]
              const ordered = Object.keys(t)
                .filter(k => /^\d+$/.test(k))
                .sort((a, b) => Number(a) - Number(b))
                .map(k => t[k])
                .filter(v => v && typeof v === 'object')
              return ordered.length > 0 ? ordered : [t]
            }

            let toolsVal = resolver.getFieldValue(updatedData, 'tools')
            if (toolsVal && !Array.isArray(toolsVal) && typeof toolsVal === 'object' && isNumericKeyWrapper(toolsVal)) {
              toolsVal = unwrap(toolsVal)
            }
            if (Array.isArray(toolsVal)) {
              const flattened = toolsVal.flatMap(unwrap)
              const normalized = flattened.map((t: any) => {
                if (!t || typeof t !== 'object') return t
                const measure_type = t.measure_type || t.tool_type || ''
                const purpose = t.purpose || t.description || t.qualitative_description || ''
                const date = t.administered_date || t.date || ''
                const title = t.title || t.tool_name || t.context_label || 'Observation'
                const target_population = t.target_population || ''
                // Backfill `id` from title if Claude forgot to emit one — the
                // matrix and evidence[].tool_id citations need a stable slug
                // to function. Strip non-alnum, collapse runs, lowercase.
                const id = typeof t.id === 'string' && t.id.trim()
                  ? t.id.trim()
                  : (title || 'tool')
                      .toString()
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '_')
                      .replace(/^_+|_+$/g, '') || 'tool'
                return { ...t, id, title, administered_date: date, measure_type, purpose, target_population }
              })
              updatedData = resolver.setFieldValue(updatedData, 'tools', normalized)
            }
          }
        } catch {}

        // Assessment results: reconcile domain_summary[] after every update
        // touching that field. Flattens nested arrays, merges duplicate
        // canonical-domain rows (so adding a second source appends evidence
        // rather than creating a parallel row), and re-derives convergence.
        // Idempotent — safe to run on every update.
        try {
          const meta = sectionMetaById.get(cleanedUpdate.section_id)
          const sectionType = meta?.section_type || sectionSchema?.key
          if (
            sectionType === 'assessment_results' &&
            cleanedUpdate.field_path.startsWith('domain_summary')
          ) {
            const dsVal = resolver.getFieldValue(updatedData, 'domain_summary')
            const reconciled = reconcileDomainSummary(dsVal)
            updatedData = resolver.setFieldValue(updatedData, 'domain_summary', reconciled)
          }
        } catch (e) {
          console.warn('⚠️ domain_summary reconcile failed:', e instanceof Error ? e.message : String(e))
        }

        // Persist provenance if provided.
        //
        // Parse page references out of the source_reference string so the
        // UI chip can show "{file} p.4" instead of a raw "p.4" doubled
        // with the artifactId. If source_reference was just a page marker
        // (no filename, common when only one file was uploaded), fall back
        // to the first uploaded file's name.
        //
        // Dedup: drop any existing entry that matches the new one on
        // (field_path, artifactId, page). Also collapse same-(path,artifact,page)
        // duplicates accumulated across earlier runs — re-running the same
        // PDF used to multiply provenance entries indefinitely.
        try {
          if (update.source_reference || typeof update.confidence === 'number') {
            const refStr = String(update.source_reference || '').trim()
            const pageMatch = refStr.match(/p\.\s?(\d+)(?:\s?-\s?\d+)?/i)
            const pageNum = pageMatch ? parseInt(pageMatch[1], 10) : undefined
            let artifactId = refStr
              .replace(/\s*\[?p\.\s?\d+(?:-\d+)?\]?\s*/gi, '')
              .replace(/^[\s,;:\-·]+|[\s,;:\-·]+$/g, '')
              .trim()
            if (!artifactId) artifactId = files[0]?.name || 'source'
            const prov: Record<string, unknown> = {
              field_path: cleanedUpdate.field_path,
              artifactId,
              confidence: typeof update.confidence === 'number' ? update.confidence : undefined,
            }
            if (pageNum) prov.page = pageNum
            const provKey = '__provenance'
            const provKeyOf = (p: Record<string, unknown>) =>
              `${p.field_path ?? ''}::${p.artifactId ?? ''}::${p.page ?? ''}`
            const newKey = provKeyOf(prov)
            const currentProv = (updatedData && typeof updatedData === 'object') ? (updatedData[provKey] || []) : []
            const seen = new Set<string>()
            const dedupedExisting = (Array.isArray(currentProv) ? currentProv : [])
              .filter((p: any) => {
                if (!p || typeof p !== 'object') return false
                const k = provKeyOf(p as Record<string, unknown>)
                if (k === newKey) return false           // drop earlier dupes; replace below
                if (seen.has(k)) return false            // collapse legacy duplicates
                seen.add(k)
                return true
              })
            updatedData = { ...(updatedData || {}), [provKey]: [...dedupedExisting, prov] }
          }
        } catch {}

        // Debug: log a snippet of the updated value for verification
        try {
          const sample = resolver.getFieldValue(updatedData, cleanedUpdate.field_path)
          const preview = typeof sample === 'string' ? sample.slice(0, 120) : JSON.stringify(sample)?.slice(0, 120)
          console.log(`🔎 Step 18.${i + 1}: Post-merge value preview for ${cleanedUpdate.field_path}:`, preview)
        } catch {}

        // CRITICAL: Final cleanup to ensure no structured_data nesting before database write
        updatedData = dataIntegrityGuard.preventCircularReferences(updatedData)

        // Belt-and-suspenders: Remove any nested structured_data keys
        if (updatedData && typeof updatedData === 'object' && updatedData.structured_data) {
          console.warn(`⚠️ Step 18.${i + 1}: Removing nested structured_data before database write`)
          delete updatedData.structured_data
        }

        // Cross-section propagation removed (2026-04-27). The previous logic
        // mirrored every assessment_results domain note into a manufactured
        // "Observation" entry on assessment_tools.tools[], which duplicated
        // data the UI already shows in assessment_results and created spurious
        // tool entries with no real measure type. Join at render time instead.

        if (dryRun) {
          console.log(`🟡 Step 18.${i + 1}: Dry run — skipping DB write for section ${update.section_id}`)
          results.push({ sectionId: update.section_id, fieldPath: cleanedUpdate.field_path, success: true, dryRun: true })
          processSummaries.push(update.process_summary)
        } else {
          // Upsert the database row to ensure persistence even if it did not exist previously
          const meta = sectionMetaById.get(cleanedUpdate.section_id)

          // Track the source ref for this field if it maps cleanly onto
          // a registered slot. The resulting tree's paragraph will
          // carry `source` so the editor can surface evidence-of-fill
          // once we wire the UI for it.
          if (cleanedUpdate.source_reference && cleanedUpdate.field_path) {
            const slotSources =
              sourcesBySection[cleanedUpdate.section_id] ??
              (sourcesBySection[cleanedUpdate.section_id] = {})
            slotSources[cleanedUpdate.field_path] = cleanedUpdate.source_reference
          }

          // Derive the slot-annotated SectionTree from the now-current
          // structured_data and serialize it to `content`. Schema-backed
          // section types (heading / family_background / etc.) go
          // through the flat slot registry; assessment_results and
          // assessment_tools go through specialized handlers that emit
          // score-card blocks for nested test records. For anything
          // else, seedContentFromStructuredData returns null and we
          // leave `content` alone.
          const sectionType = meta?.section_type || 'unknown'
          const generatedContent = seedContentFromStructuredData(
            sectionType,
            updatedData as Record<string, unknown>,
            {
              sources: sourcesBySection[cleanedUpdate.section_id],
              topicText: meta?.title,
            },
          )

          const upsertRow: Record<string, unknown> = {
            id: cleanedUpdate.section_id,
            report_id: reportId,
            title: meta?.title || cleanedUpdate.section_id,
            section_type: sectionType,
            structured_data: updatedData,
          }
          if (generatedContent) upsertRow.content = generatedContent

          const { error } = await supabase
            .from('report_sections')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .upsert(upsertRow as any, { onConflict: 'id' })

          if (error) {
            console.error(`❌ Step 18.${i + 1} FAILED: Failed to update section ${update.section_id}:`, error)
            results.push({ sectionId: update.section_id, success: false, error })
            try {
              emitEvent(operationId, {
                kind: 'field',
                sectionId: cleanedUpdate.section_id,
                sectionLabel: sectionMetaById.get(cleanedUpdate.section_id)?.title,
                fieldPath: cleanedUpdate.field_path,
                slotLabel: slotLabelFor(cleanedUpdate.field_path),
                mergeStrategy: ((cleanedUpdate.merge_strategy ?? 'replace') as MergeStrategy),
                status: 'failed',
                error: error?.message,
              })
            } catch {}
            try { broadcastPublish('section_update', { sectionId: cleanedUpdate.section_id, fieldPath: cleanedUpdate.field_path, success: false }) } catch {}
            dbLog({ event_type: 'section_update', stage: 'error', section_id: cleanedUpdate.section_id, message: `Failed to update ${cleanedUpdate.field_path}`, data: { error } }).catch(() => {})
          } else {
            console.log(`✅ Step 18.${i + 1}: Updated section ${update.section_id}`)
            results.push({ sectionId: update.section_id, fieldPath: cleanedUpdate.field_path, success: true })
            processSummaries.push(update.process_summary)
            try {
              emitEvent(operationId, {
                kind: 'field',
                sectionId: cleanedUpdate.section_id,
                sectionLabel: sectionMetaById.get(cleanedUpdate.section_id)?.title,
                fieldPath: cleanedUpdate.field_path,
                slotLabel: slotLabelFor(cleanedUpdate.field_path),
                valuePreview: previewValue(cleanedUpdate.value),
                mergeStrategy: ((cleanedUpdate.merge_strategy ?? 'replace') as MergeStrategy),
                status: 'applied',
              })
            } catch {}
            try { broadcastPublish('section_update', { sectionId: cleanedUpdate.section_id, fieldPath: cleanedUpdate.field_path, success: true }) } catch {}
            dbLog({ event_type: 'section_update', stage: 'success', section_id: cleanedUpdate.section_id, message: `Updated ${cleanedUpdate.field_path}` }).catch(() => {})
          }
        }
      } catch (error) {
        console.error(`❌ Step 18.${i + 1} FAILED: Error processing update for section ${update.section_id}:`, error)
        results.push({ sectionId: update.section_id, fieldPath: cleanedUpdate.field_path, success: false, error: error instanceof Error ? error.message : String(error) })
        try {
          emitEvent(operationId, {
            kind: 'field',
            sectionId: cleanedUpdate.section_id,
            sectionLabel: sectionMetaById.get(cleanedUpdate.section_id)?.title,
            fieldPath: cleanedUpdate.field_path,
            slotLabel: slotLabelFor(cleanedUpdate.field_path),
            mergeStrategy: ((cleanedUpdate.merge_strategy ?? 'replace') as MergeStrategy),
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          })
        } catch {}
        try { broadcastPublish('section_update', { sectionId: cleanedUpdate.section_id, fieldPath: cleanedUpdate.field_path, success: false }) } catch {}
        dbLog({ event_type: 'section_update', stage: 'error', section_id: cleanedUpdate.section_id, message: `Exception updating ${cleanedUpdate.field_path}`, data: { error: error instanceof Error ? error.message : String(error) } }).catch(() => {})
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`🎉 Step 19: Processing complete: ${successful} successful, ${failed} failed`)
    console.log(`📋 Process summaries:`, processSummaries)

    // Persist file_uploads rows so the source-inspector can resolve
    // citation strings back to the original file (filename + extracted_text).
    // Best-effort; failure here doesn't block the metadata path below.
    if (uploadedFilesRows.length > 0) {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser()
        const userId = userData?.user?.id ?? null
        if (userErr || !userId) {
          console.warn('⚠️ file_uploads persist skipped: no authenticated user')
        } else {
          const rows = uploadedFilesRows.map((r) => ({
            id: r.id,
            report_id: reportId,
            user_id: userId,
            filename: r.filename,
            file_type: r.file_type,
            file_size: r.file_size,
            storage_path: null,
            processing_status: r.processing_status,
            extracted_text: r.extracted_text,
            error_message: r.error_message,
          }))
          const { error: insErr } = await supabase.from('file_uploads').insert(rows)
          if (insErr) {
            console.warn('⚠️ Failed to persist file_uploads rows:', insErr.message)
          } else {
            console.log(`📁 Persisted ${rows.length} file_uploads row(s)`)
          }
        }
      } catch (e) {
        console.warn('⚠️ Unexpected error persisting file_uploads:', e instanceof Error ? e.message : String(e))
      }
    }

    // Persist uploaded files and activity timeline to report metadata (best-effort)
    try {
      const { data: reportRow } = await supabase
        .from('reports')
        .select('id, metadata')
        .eq('id', reportId)
        .single()
      const prevMeta = (reportRow?.metadata && typeof reportRow.metadata === 'object') ? reportRow.metadata as any : {}
      const prevFiles = Array.isArray(prevMeta.uploadedFiles) ? prevMeta.uploadedFiles : []
      const mergedFiles = [...prevFiles, ...uploadedFilesMeta]
      const activity = Array.isArray(prevMeta.activity) ? prevMeta.activity : []

      // Only record activity when we have meaningful process summaries and not in dry-run mode
      const nonEmptySummaries = (processSummaries || []).filter((s: any) => typeof s === 'string' && s.trim().length > 0)
      if (!dryRun && nonEmptySummaries.length > 0) {
        // Build section titles for successful updates
        try {
          const idToTitle = new Map<string, string>()
          for (const s of targetSectionsWithContext) {
            const sid = (s as any).id || (s as any).section_id || s.id
            const title = (s as any).title || 'Untitled'
            if (sid) idToTitle.set(String(sid), String(title))
          }
          const successfulIds = results.filter((r: any) => r?.success && r.sectionId).map((r: any) => r.sectionId)
          const sectionTitles = Array.from(new Set(successfulIds.map((sid: string) => idToTitle.get(sid) || sid)))
          activity.push({ id: crypto.randomUUID(), type: 'ai_intake', timestamp: new Date().toISOString(), sectionTitles, summaries: nonEmptySummaries })
        } catch {
          // Fallback: still push minimal with summaries only
          activity.push({ id: crypto.randomUUID(), type: 'ai_intake', timestamp: new Date().toISOString(), summaries: nonEmptySummaries })
        }
      }
      await supabase
        .from('reports')
        .update({ metadata: { ...prevMeta, uploadedFiles: mergedFiles, activity } })
        .eq('id', reportId)
      dbLog({ stage: 'metadata_persisted', message: 'uploadedFiles/activity persisted', event_type: 'stage' }).catch(() => {})
    } catch (e) {
      console.warn('⚠️ Failed to persist metadata (uploadedFiles/activity):', e instanceof Error ? e.message : String(e))
      dbLog({ stage: 'metadata_persist_error', message: (e as Error)?.message || 'persist failed', event_type: 'stage' }).catch(() => {})
    }

    // Build a concise processing summary for UI
    let processingSummary: { summary: string; confidence: number; issues: string[] } | null = null
    try {
      const ProcessingSummary = z.object({
        summary: z.string(),
        confidence: z.number().min(0).max(1),
        issues: z.array(z.string()),
      })

      const successfulIds = results.filter((r: any) => r?.success && r.sectionId).map((r: any) => r.sectionId)
      const uniqueSections = Array.from(new Set(successfulIds))
      const exampleChanges = (updates || []).slice(0, 5).map((u: any) => `${u.section_id}.${u.field_path}`)

      const so = await parseWithZod(
        ProcessingSummary,
        'processing_summary',
        [
          { role: 'system', content: 'Summarize changes for a clinical report intake. Return only JSON: { summary, confidence, issues }.' },
          { role: 'user', content: `Applied ${successful} updates (${failed} failed). Sections affected: ${uniqueSections.join(', ') || 'none'}\nExample changes: ${exampleChanges.join(', ') || 'n/a'}\nNotes: ${(processSummaries || []).slice(0, 5).join(' | ')}` },
        ]
      )

      if (so.ok) processingSummary = so.data
      else processingSummary = { summary: (dryRun ? `Previewed ${successful} updates` : `Processed ${successful} updates`), confidence: 0.8, issues: [] }
    } catch {
      processingSummary = { summary: (dryRun ? `Previewed ${successful} updates` : `Processed ${successful} updates`), confidence: 0.8, issues: [] }
    }

    const response = NextResponse.json({
      success: true,
      message: dryRun ? `Preview: ${successful} updates proposed` : `Processed ${successful} updates successfully`,
      results: {
        successful,
        failed,
        processSummaries,
        processingSummary,
        updateResults: results,
        proposedUpdates: updates,
        mode: dryRun ? 'dryRun' : 'write'
      }
    })
    try { completeProgress(operationId) } catch {}
    dbLog({ stage: 'complete', message: `Processed ${successful} updates, ${failed} failed`, event_type: 'complete' }).catch(() => {})
    try { if (broadcastChannel) await broadcastChannel.unsubscribe() } catch {}
    return response

  } catch (error) {
    console.error('❌ CRITICAL ERROR: Processing intake data failed:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    const errorResponse = NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
    try { completeProgress(operationId) } catch {}
    try { if (broadcastChannel) await broadcastChannel.unsubscribe() } catch {}
    return errorResponse
  }
}

// Helper functions for nested object manipulation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.')
  const result = { ...obj }
  let current = result

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    } else {
      current[key] = { ...current[key] }
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
  return result
}

// Schema-aware merge helper
function applyFieldUpdateWithSchema(
  resolver: StructuredFieldPathResolver,
  data: any,
  fieldPath: string,
  value: any,
  strategy: 'replace' | 'append' | 'merge',
  fieldSchema?: any
): any {
  try {
    const current = resolver.getFieldValue(data, fieldPath)
    const type = fieldSchema?.type as string | undefined

    switch (strategy) {
      case 'append': {
        if (type === 'array') {
          const next = Array.isArray(current) ? [...current, value] : [value]
          return resolver.setFieldValue(data, fieldPath, next)
        }
        if (type === 'string' || type === 'paragraph' || typeof current === 'string') {
          const next = [current, value].filter(v => v != null && v !== '').join(' ').trim()
          return resolver.setFieldValue(data, fieldPath, next)
        }
        // Fallback to replace
        return resolver.setFieldValue(data, fieldPath, value)
      }
      case 'merge': {
        if (type === 'object' && typeof current === 'object' && typeof value === 'object' && !Array.isArray(current) && !Array.isArray(value)) {
          return resolver.setFieldValue(data, fieldPath, { ...current, ...value })
        }
        // Fallbacks: arrays/strings -> replace
        return resolver.setFieldValue(data, fieldPath, value)
      }
      case 'replace':
      default:
        return resolver.setFieldValue(data, fieldPath, value)
    }
  } catch {
    // Fall back to naive setter if resolver fails
    return setNestedValue(data, fieldPath, value)
  }
}
