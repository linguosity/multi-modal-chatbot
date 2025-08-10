import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
// Claude SDK for PDF document analysis
import Anthropic from '@anthropic-ai/sdk'
// OpenAI for GPT-5 + vision + tools
import OpenAI from 'openai'
import { processMultipleFiles, transcribeAudio, fileToBase64 } from '@/lib/file-processing'
import { validateAndCleanFieldUpdate, dataIntegrityGuard } from '@/lib/data-integrity-guard'
import { reportContextBuilder } from '@/lib/report-context-builder'
// PDF text extraction disabled to avoid native 'canvas' dependency
import { validatePathAgainstSchema, coerceValueToSchema } from '@/lib/value-normalizer'
import { SectionSchema, ASSESSMENT_RESULTS_SECTION, ASSESSMENT_TOOLS_SECTION, VALIDITY_STATEMENT_SECTION, REASON_FOR_REFERRAL_SECTION, LANGUAGE_SAMPLE_SECTION, CONCLUSION_SECTION, RECOMMENDATIONS_SECTION, ACCOMMODATIONS_SECTION } from '@/lib/structured-schemas'
import { StructuredFieldPathResolver } from '@/lib/field-path-resolver'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT || process.env.OPENAI_PROJECT_ID,
})

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
    let fileIndex = 0
    while (formData.get(`file_${fileIndex}`)) {
      files.push(formData.get(`file_${fileIndex}`) as File)
      fileIndex++
    }

    console.log(`✅ Step 10: Found ${files.length} files`)

    let processingErrors: string[] = []

    console.log('✅ Step 11: Getting target sections with full context...')
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

    for (const f of files) {
      try {
        if (f.type === 'application/pdf') {
          // Send PDF to Claude to extract a concise, report-ready "Main Points" summary for SLP
          const uploaded = await claude.beta.files.upload({ file: f })
          const pdfExtract = await claude.beta.messages.create({
            model: process.env.CLAUDE_MODEL || 'claude-opus-4-1-20250805',
            max_tokens: 2000,
            temperature: 0.1,
            system: [
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
            messages: [{
              role: 'user',
              content: [{ type: 'document', title: f.name, source: { type: 'file', file_id: uploaded.id } }]
            }]
          })
          const extractedText = pdfExtract.content
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('\n')
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
      } catch (e) {
        processingErrors.push(`${f.name}: ${(e as Error).message}`)
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

    console.log('✅ Step 15: Defining tool schema...')
    const reportSchemaTool = {
      name: "save_assessment_data",
      description: "Extracts and saves structured data from assessment information with progress summaries and provenance.",
      input_schema: {
        type: "object" as const,
        properties: {
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

      // Define tools for Responses API
      const tools: any[] = [{
        type: 'function',
        name: reportSchemaTool.name,
        description: reportSchemaTool.description,
        parameters: reportSchemaTool.input_schema,
      }]

      // Convert content to Responses API parts
      const toResponsePart = (part: any) => {
        if (part?.type === 'text' || part?.type === 'input_text') {
          return { type: 'input_text', text: part.text }
        }
        if (part?.type === 'image_url') {
          return { type: 'image_url', image_url: { url: part.image_url?.url || part.image_url } }
        }
        return { type: 'input_text', text: typeof part === 'string' ? part : JSON.stringify(part) }
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

      const input: any[] = [
        { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
        { role: 'system', content: [{ type: 'input_text', text: `REPORT SCHEMA (JSON, selected sections):\n${JSON.stringify(schemaPayload).slice(0, 120000)}` }] },
        { role: 'system', content: [{ type: 'input_text', text: allowedPathsText }] },
        { role: 'user', content: (openaiContent as any[]).map(toResponsePart) }
      ]

      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-5-2025-08-07',
        input,
        tools,
        tool_choice: {
          type: 'allowed_tools',
          mode: 'required',
          tools: [{ type: 'function', name: 'save_assessment_data' }]
        } as any,
      } as any)

      console.log('✅ Step 16: GPT-5 Responses API call returned')
      console.log('✅ Step 17: Extracting tool call from response...')

      const out: any[] = (response as any).output || []
      let fn = out.find((o: any) => o?.type === 'function_call' && o?.name === 'save_assessment_data')

      if (!fn) {
        console.warn('⚠️ Step 16: No function_call found. Attempting strict retry and JSON fallback...')

        const strictInput: any[] = [
          { role: 'system', content: [{ type: 'input_text', text: `${systemPrompt}\n\nSTRICT_TOOL_MODE: You MUST call the save_assessment_data tool and return no prose.` }] },
          { role: 'user', content: (openaiContent as any[]).map(toResponsePart) }
        ]
        const strict = await openai.responses.create({
          model: process.env.OPENAI_MODEL || 'gpt-5-2025-08-07',
          input: strictInput,
          tools,
          tool_choice: {
            type: 'allowed_tools',
            mode: 'required',
            tools: [{ type: 'function', name: 'save_assessment_data' }]
          } as any,
        } as any)

        const strictOut: any[] = (strict as any).output || []
        fn = strictOut.find((o: any) => o?.type === 'function_call' && o?.name === 'save_assessment_data')
        if (!fn) {
          const textBlocks: string[] = []
          for (const o of strictOut.length ? strictOut : out) {
            if (o?.type === 'output_text' && o?.text) textBlocks.push(o.text)
          }
          const combined = textBlocks.join('\n')
          let parsed: any = null
          try { parsed = JSON.parse(combined) } catch {
            const fence = combined.match(/```(?:json)?\n([\s\S]*?)\n```/i)
            if (fence?.[1]) { try { parsed = JSON.parse(fence[1]) } catch {} }
            if (!parsed) {
              const s = combined.indexOf('{'); const e = combined.lastIndexOf('}')
              if (s !== -1 && e !== -1 && e > s) { try { parsed = JSON.parse(combined.slice(s, e + 1)) } catch {} }
            }
          }
          if (parsed && Array.isArray(parsed.updates)) {
            updates = parsed.updates
            console.log(`✅ Step 17: Parsed ${updates.length} updates from assistant JSON fallback`)
          } else {
            console.error('❌ Step 16: No function_call and JSON fallback failed.')
            throw new Error('No tool call found in response from model')
          }
        }
      }

      if (fn && fn.arguments) {
        let args: any = {}
        try { args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments } catch { args = fn.arguments }
        updates = (args as any).updates || []
        console.log(`✅ Step 17: Extracted ${updates.length} updates from model`)
      }
    }

    console.log('✅ Step 18: Applying updates to database...')
    const results = []
    const processSummaries = []
    const resolver = new StructuredFieldPathResolver()

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
          } else {
            console.log(`✅ Step 18.${i + 1}: Updated section ${update.section_id}`)
            results.push({ sectionId: update.section_id, fieldPath: cleanedUpdate.field_path, success: true })
            processSummaries.push(update.process_summary)
          }
        }
      } catch (error) {
        console.error(`❌ Step 18.${i + 1} FAILED: Error processing update for section ${update.section_id}:`, error)
        results.push({ sectionId: update.section_id, fieldPath: cleanedUpdate.field_path, success: false, error: error instanceof Error ? error.message : String(error) })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`🎉 Step 19: Processing complete: ${successful} successful, ${failed} failed`)
    console.log(`📋 Process summaries:`, processSummaries)

    return NextResponse.json({
      success: true,
      message: dryRun ? `Preview: ${successful} updates proposed` : `Processed ${successful} updates successfully`,
      results: {
        successful,
        failed,
        processSummaries,
        updateResults: results,
        proposedUpdates: updates,
        mode: dryRun ? 'dryRun' : 'write'
      }
    })

  } catch (error) {
    console.error('❌ CRITICAL ERROR: Processing intake data failed:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
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
