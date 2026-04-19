import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
// Gemini SDK for all AI processing
import { getGeminiClient, resolveModel } from '@/lib/ai/gemini-client'
import { FunctionCallingConfigMode } from '@google/genai'
import { processMultipleFiles, transcribeAudio, fileToBase64 } from '@/lib/ai/gemini-file-processor'
import { validateAndCleanFieldUpdate, dataIntegrityGuard } from '@/lib/data-integrity-guard'
import { reportContextBuilder } from '@/lib/report-context-builder'
// PDF text extraction disabled to avoid native 'canvas' dependency
import { validatePathAgainstSchema, coerceValueToSchema } from '@/lib/value-normalizer'
import { SectionSchema, ASSESSMENT_RESULTS_SECTION, ASSESSMENT_TOOLS_SECTION, VALIDITY_STATEMENT_SECTION, REASON_FOR_REFERRAL_SECTION, LANGUAGE_SAMPLE_SECTION, CONCLUSION_SECTION, RECOMMENDATIONS_SECTION, ACCOMMODATIONS_SECTION } from '@/lib/structured-schemas'
import { z } from 'zod'
import { parseWithZod } from '@/lib/ai/structured'
import { StructuredFieldPathResolver } from '@/lib/field-path-resolver'
import { emitProgress, completeProgress } from '@/lib/server/progress-stream'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Gemini client is obtained via getGeminiClient() singleton

export async function POST(request: NextRequest) {
  console.log('🚀 === AI INTAKE API ROUTE START ===')

  try {
    console.log('✅ Step 1: API route handler called successfully')
    console.log('✅ Step 2: About to parse FormData')

    const formData = await request.formData()
    console.log('✅ Step 3: FormData parsed successfully')

    const reportId = formData.get('reportId') as string
    console.log('✅ Step 4: reportId extracted:', reportId)

    const sectionIdsRaw = formData.get('sectionIds') as string || '[]'
    const operationId = (formData.get('operationId') as string | null) || null
    const sectionInfoRaw = formData.get('sectionInfo') as string | null
    const sectionSchemasRaw = formData.get('sectionSchemas') as string | null
    console.log('✅ Step 5: sectionIds raw:', sectionIdsRaw)

    const sectionIds = JSON.parse(sectionIdsRaw)
    const providedSectionInfo: Array<{ id: string; title?: string; section_type?: string }> = sectionInfoRaw ? JSON.parse(sectionInfoRaw) : []
    const providedSectionSchemas: Record<string, SectionSchema> = sectionSchemasRaw ? JSON.parse(sectionSchemasRaw) : {}
    console.log('✅ Step 6: sectionIds parsed:', sectionIds.length, 'sections')

    const replace = formData.get('replace') === 'true'
    const dryRun = formData.get('dryRun') === 'true'
    const text = formData.get('text') as string

    console.log('📝 Request data summary:', {
      reportId,
      sectionCount: sectionIds.length,
      replace,
      textLength: text?.length
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
    let broadcastChannel: any = null
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
    let fileIndex = 0
    while (formData.get(`file_${fileIndex}`)) {
      files.push(formData.get(`file_${fileIndex}`) as File)
      fileIndex++
    }

    console.log(`✅ Step 10: Found ${files.length} files`)
    // SSE milestone (upload complete)
    try { emitProgress(operationId, `✅ Updated ${(sectionIds[0] || '00000000-0000-0000-0000-000000000000')}.uploading_files`) } catch {}
    try { broadcastPublish('progress', { stage: 'uploading_files_complete' }) } catch {}
    dbLog({ stage: 'uploading_files_complete', message: 'All files parsed', event_type: 'stage' }).catch(() => {})

    let processingErrors: string[] = []

    console.log('✅ Step 11: Getting target sections with full context...')
    try { emitProgress(operationId, `📝 Processing update: ${(sectionIds[0] || '00000000-0000-0000-0000-000000000000')}.extracting_text ... replace`) } catch {}
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
      try {
        // collect source metadata for report metadata.uploadedFiles
        const metaType = f.type.startsWith('application/pdf') ? 'pdf' : (f.type.startsWith('image/') ? 'image' : (f.type.startsWith('audio/') ? 'audio' : (f.type.startsWith('text/') ? 'text' : 'document')))
        uploadedFilesMeta.push({ id: crypto.randomUUID(), name: f.name, type: metaType, size: (f as any).size, uploadDate: new Date().toISOString() })
        // Verbose per-file progress
        if (VERBOSE) {
          try { emitProgress(operationId, `📝 Processing update: ${(sectionIds[0] || '00000000-0000-0000-0000-000000000000')}.file_${f.name.replace(/[^a-z0-9_-]/gi,'_').toLowerCase()} ... replace`) } catch {}
        }
        if (f.type === 'application/pdf') {
          // Send PDF to Gemini to extract a concise, report-ready "Main Points" summary for SLP
          const arrayBuffer = await f.arrayBuffer()
          const base64Data = Buffer.from(arrayBuffer).toString('base64')

          const ai = getGeminiClient()
          const pdfModel = resolveModel()
          const pdfExtractResponse = await ai.models.generateContent({
            model: pdfModel,
            contents: [{
              role: 'user',
              parts: [
                { inlineData: { mimeType: 'application/pdf', data: base64Data } },
                { text: `Extract the MAIN POINTS from this assessment PDF for a clinical SLP report. Be concise with bulleted format.` }
              ]
            }],
            config: {
              systemInstruction: [
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
                '- Output strictly as plain text bullets suitable to pass onward (no JSON, no extra commentary).'
              ].join('\n'),
              temperature: 0.1,
              maxOutputTokens: 2000,
            }
          })

          const extractedText = pdfExtractResponse.text || ''
          const textBlock2 = { type: 'text', text: `Main Points from PDF (${f.name}):\n${extractedText}` }
          content.push(textBlock2)
          openaiContent.push(textBlock2)
        } else if (f.type.startsWith('audio/')) {
          const transcript = await transcribeAudio(f)
          const audioBlock = { type: 'text', text: `Audio transcript from ${f.name}:\n${transcript}` }
          content.push(audioBlock)
          openaiContent.push(audioBlock)
        } else if (f.type.startsWith('text/')) {
          const t = await f.text()
          const textFileBlock = { type: 'text', text: `Text content from ${f.name}:\n${t}` }
          content.push(textFileBlock)
          openaiContent.push(textFileBlock)
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
          try { emitProgress(operationId, `✅ Updated ${(sectionIds[0] || '00000000-0000-0000-0000-000000000000')}.file_${f.name.replace(/[^a-z0-9_-]/gi,'_').toLowerCase()}`) } catch {}
        }
      } catch (e) {
        processingErrors.push(`${f.name}: ${(e as Error).message}`)
        if (VERBOSE) {
          try { emitProgress(operationId, `❌ Failed to update ${(sectionIds[0] || '00000000-0000-0000-0000-000000000000')}.file_${f.name.replace(/[^a-z0-9_-]/gi,'_').toLowerCase()}`) } catch {}
        }
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
    try { emitProgress(operationId, `✅ Updated ${(sectionIds[0] || '00000000-0000-0000-0000-000000000000')}.extracting_text`) } catch {}
    try { broadcastPublish('progress', { stage: 'extracting_text_complete' }) } catch {}
    dbLog({ stage: 'extracting_text_complete', message: 'Text extraction complete', event_type: 'stage' }).catch(() => {})

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
      console.log('🤖 Step 16: Calling GPT-5 (Responses API) with required tool...')
      try { emitProgress(operationId, `📝 Processing update: ${(sectionIds[0] || '00000000-0000-0000-0000-000000000000')}.analyzing_with_ai ... replace`) } catch {}
      try { broadcastPublish('progress', { stage: 'analyzing_with_ai_start' }) } catch {}

      // Define Gemini function declarations
      const geminiTools = [{
        functionDeclarations: [{
          name: reportSchemaTool.name,
          description: reportSchemaTool.description,
          parametersJsonSchema: reportSchemaTool.input_schema,
        }]
      }]

      // Convert content to Gemini Parts
      const toGeminiPart = (part: any) => {
        if (part?.type === 'text' || part?.type === 'input_text') {
          return { text: part.text }
        }
        if (part?.type === 'image_url') {
          // Image URLs not supported inline; skip or convert
          return { text: `[Image: ${part.image_url?.url || part.image_url}]` }
        }
        return { text: typeof part === 'string' ? part : JSON.stringify(part) }
      }

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

      // Build Gemini system instruction from all system messages
      const geminiSystemInstruction = [
        systemPrompt,
        `REPORT SCHEMA (JSON, selected sections):\n${JSON.stringify(schemaPayload).slice(0, 120000)}`,
        allowedPathsText,
      ].join('\n\n')

      // Build Gemini user content parts
      const geminiUserParts = (openaiContent as any[]).map(toGeminiPart)

      const ai = getGeminiClient()
      const geminiModel = resolveModel()

      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: [{ role: 'user', parts: geminiUserParts }],
        config: {
          systemInstruction: geminiSystemInstruction,
          tools: geminiTools,
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['save_assessment_data'],
            },
          },
        },
      })

      console.log('✅ Step 16: Gemini API call returned')
      try { emitProgress(operationId, `✅ Updated ${(sectionIds[0] || '00000000-0000-0000-0000-000000000000')}.analyzing_with_ai`) } catch {}
      try { broadcastPublish('progress', { stage: 'analyzing_with_ai_complete' }) } catch {}
      console.log('✅ Step 17: Extracting tool call from response...')

      // Extract function call from Gemini response
      const candidate = (response as any).candidates?.[0]
      const responseParts = candidate?.content?.parts || []
      let fcPart = responseParts.find((p: any) => p.functionCall?.name === 'save_assessment_data')

      if (!fcPart) {
        console.warn('⚠️ Step 16: No function_call found. Attempting Structured Outputs fallback...')

        // Structured Outputs fallback via parseWithZod
        const UpdateSchema = z.object({
          section_id: z.string(),
          field_path: z.string(),
          value: z.any(),
          merge_strategy: z.enum(['replace', 'append', 'merge']).default('replace'),
          confidence: z.number().min(0).max(1).optional(),
          source_reference: z.string().optional(),
        })
        const UpdatesEnvelope = z.object({ updates: z.array(UpdateSchema) })

        const so = await parseWithZod(
          UpdatesEnvelope,
          'assessment_updates',
          [
            { role: 'system', content: `${systemPrompt}\n\nReturn only JSON with { updates: [...] } strictly matching the schema.` },
            { role: 'user', content: geminiUserParts.map((p: any) => p.text || '').join('\n\n') },
          ]
        )

        if (so.ok) {
          updates = so.data.updates
          console.log(`✅ Step 17: Parsed ${updates.length} updates via Structured Outputs fallback`)
        } else {
          // Last resort: check if response has text that contains JSON
          const responseText = response.text || ''
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
            console.error('❌ Step 16: No function_call and JSON fallback failed.')
            throw new Error('No tool call found in response from model')
          }
        }
      }

      if (fcPart && fcPart.functionCall?.args) {
        const args = fcPart.functionCall.args
        updates = (args as any).updates || []
        if (Array.isArray((args as any).domain_summary)) {
          domainSummary = (args as any).domain_summary
        }
        console.log(`✅ Step 17: Extracted ${updates.length} updates from model`)
      }
    }

    console.log('✅ Step 18: Applying updates to database...')
    const results = []
    const processSummaries = []
    const resolver = new StructuredFieldPathResolver()

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
      try { emitProgress(operationId, `📝 Processing update: ${cleanedUpdate.section_id}.${cleanedUpdate.field_path} ... ${cleanedUpdate.merge_strategy || 'replace'}`) } catch {}
      // Normalize field path to be relative to section root (model often prefixes with section key)
      cleanedUpdate.field_path = normalizeFieldPath(cleanedUpdate.field_path, sectionSchema)
      const pathCheck = validatePathAgainstSchema(sectionSchema, cleanedUpdate.field_path)
      if (!pathCheck.isValid) {
        const err = `Field path not in schema: ${cleanedUpdate.field_path}${pathCheck.errors.length ? ` (${pathCheck.errors.join('; ')})` : ''}`
        console.warn(`⚠️ Step 18.${i + 1}: ${err}`)
        results.push({ sectionId: cleanedUpdate.section_id, success: false, error: err })
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

        let updatedData = currentSection?.structured_data || {}

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
            const toolsVal = resolver.getFieldValue(updatedData, 'tools')
            if (Array.isArray(toolsVal)) {
              const normalized = toolsVal.map((t: any) => {
                if (!t || typeof t !== 'object') return t
                const measure_type = t.measure_type || t.tool_type || ''
                const purpose = t.purpose || t.description || t.qualitative_description || ''
                const date = t.administered_date || t.date || ''
                const title = t.title || t.tool_name || t.context_label || 'Observation'
                const target_population = t.target_population || ''
                return { ...t, title, administered_date: date, measure_type, purpose, target_population }
              })
              updatedData = resolver.setFieldValue(updatedData, 'tools', normalized)
            }
          }
        } catch {}

        // Persist provenance if provided
        try {
          if (update.source_reference || typeof update.confidence === 'number') {
            const prov = {
              field_path: cleanedUpdate.field_path,
              artifactId: update.source_reference as string,
              confidence: typeof update.confidence === 'number' ? update.confidence : undefined
            }
            const provKey = '__provenance'
            const currentProv = (updatedData && typeof updatedData === 'object') ? (updatedData[provKey] || []) : []
            const nextProv = Array.isArray(currentProv) ? [...currentProv, prov] : [prov]
            updatedData = { ...(updatedData || {}), [provKey]: nextProv }
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

        // If this update is a domain notes field in Assessment Results, propagate a copy into the Tools section under matching context
        try {
          const domainKeyMap: Record<string, string> = {
            'expressive_language_notes': 'Expressive',
            'receptive_language_notes': 'Receptive',
            'pragmatic_language_notes': 'Pragmatics',
            'articulation_notes': 'Articulation',
            'voice_notes': 'Voice',
            'fluency_notes': 'Fluency'
          }
          const domainKey = Object.keys(domainKeyMap).find(k => cleanedUpdate.field_path === k)
          const meta = sectionMetaById.get(cleanedUpdate.section_id)
          if (domainKey && meta && meta.section_type === 'assessment_results' && toolsSectionId && update.source_reference) {
            const { data: toolsRow } = await supabase
              .from('report_sections')
              .select('structured_data')
              .eq('id', toolsSectionId)
              .single()
            const toolsData = (toolsRow?.structured_data && typeof toolsRow.structured_data === 'object') ? toolsRow.structured_data : {}
            const list = Array.isArray(toolsData.tools) ? toolsData.tools : []
            // crude context title from source_reference
            const ref = (update.source_reference as string).toLowerCase()
            const ctxMap: Record<string, string> = {
              'lunch': 'Lunch',
              'reading circle': 'Classroom Reading Circle',
              'recess': 'Recess',
              'math': 'Math Small Group',
              'art': 'Art Class',
              'hallway': 'Hallway',
              'transition': 'Transition to Speech Room',
              'speech': 'Speech Task',
              'retell': 'Frog Story Retell'
            }
            let contextTitle = 'Observation'
            for (const k of Object.keys(ctxMap)) { if (ref.includes(k)) { contextTitle = ctxMap[k]; break } }
            let target = list.find((t: any) => (t.title || t.tool_name || '').toString().toLowerCase() === contextTitle.toLowerCase())
            if (!target) {
              target = { title: contextTitle, completed: true, tool_type: 'Observation' }
              list.push(target)
            }
            target.domain_notes = target.domain_notes || {}
            const dLabel = domainKeyMap[domainKey]
            const noteText = typeof cleanedUpdate.value === 'string' ? cleanedUpdate.value : JSON.stringify(cleanedUpdate.value)
            // append or set
            if (target.domain_notes[dLabel]) {
              const existing = target.domain_notes[dLabel]
              target.domain_notes[dLabel] = existing.includes(noteText) ? existing : `${existing} ${noteText}`.trim()
            } else {
              target.domain_notes[dLabel] = noteText
            }
            toolsData.tools = list
            await supabase
              .from('report_sections')
              .upsert({ id: toolsSectionId, report_id: reportId, title: 'Assessment Tools', section_type: 'assessment_tools', structured_data: toolsData }, { onConflict: 'id' })
          }
        } catch (e) {
          console.warn('⚠️ Propagation to tools failed:', e instanceof Error ? e.message : String(e))
        }

        if (dryRun) {
          console.log(`🟡 Step 18.${i + 1}: Dry run — skipping DB write for section ${update.section_id}`)
          results.push({ sectionId: update.section_id, fieldPath: cleanedUpdate.field_path, success: true, dryRun: true })
          processSummaries.push(update.process_summary)
        } else {
          // Upsert the database row to ensure persistence even if it did not exist previously
          const meta = sectionMetaById.get(cleanedUpdate.section_id)
          const { error } = await supabase
            .from('report_sections')
            .upsert({
              id: cleanedUpdate.section_id,
              report_id: reportId,
              title: meta?.title || cleanedUpdate.section_id,
              section_type: meta?.section_type || 'unknown',
              structured_data: updatedData
            }, { onConflict: 'id' })

          if (error) {
            console.error(`❌ Step 18.${i + 1} FAILED: Failed to update section ${update.section_id}:`, error)
            results.push({ sectionId: update.section_id, success: false, error })
            try { emitProgress(operationId, `❌ Failed to update ${cleanedUpdate.section_id}.${cleanedUpdate.field_path}`) } catch {}
            try { broadcastPublish('section_update', { sectionId: cleanedUpdate.section_id, fieldPath: cleanedUpdate.field_path, success: false }) } catch {}
            dbLog({ event_type: 'section_update', stage: 'error', section_id: cleanedUpdate.section_id, message: `Failed to update ${cleanedUpdate.field_path}`, data: { error } }).catch(() => {})
          } else {
            console.log(`✅ Step 18.${i + 1}: Updated section ${update.section_id}`)
            results.push({ sectionId: update.section_id, fieldPath: cleanedUpdate.field_path, success: true })
            processSummaries.push(update.process_summary)
            try { emitProgress(operationId, `✅ Updated ${cleanedUpdate.section_id}.${cleanedUpdate.field_path}`) } catch {}
            try { broadcastPublish('section_update', { sectionId: cleanedUpdate.section_id, fieldPath: cleanedUpdate.field_path, success: true }) } catch {}
            dbLog({ event_type: 'section_update', stage: 'success', section_id: cleanedUpdate.section_id, message: `Updated ${cleanedUpdate.field_path}` }).catch(() => {})
          }
        }
      } catch (error) {
        console.error(`❌ Step 18.${i + 1} FAILED: Error processing update for section ${update.section_id}:`, error)
        results.push({ sectionId: update.section_id, fieldPath: cleanedUpdate.field_path, success: false, error: error instanceof Error ? error.message : String(error) })
        try { emitProgress(operationId, `❌ Failed to update ${cleanedUpdate.section_id}.${cleanedUpdate.field_path}`) } catch {}
        try { broadcastPublish('section_update', { sectionId: cleanedUpdate.section_id, fieldPath: cleanedUpdate.field_path, success: false }) } catch {}
        dbLog({ event_type: 'section_update', stage: 'error', section_id: cleanedUpdate.section_id, message: `Exception updating ${cleanedUpdate.field_path}`, data: { error: error instanceof Error ? error.message : String(error) } }).catch(() => {})
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`🎉 Step 19: Processing complete: ${successful} successful, ${failed} failed`)
    console.log(`📋 Process summaries:`, processSummaries)

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
