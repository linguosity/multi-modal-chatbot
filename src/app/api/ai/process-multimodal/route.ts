import { NextRequest, NextResponse } from 'next/server'
import { reportContextBuilder } from '@/lib/report-context-builder'
import { validateAndCleanFieldUpdate, dataIntegrityGuard } from '@/lib/data-integrity-guard'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getGeminiClient, resolveModel } from '@/lib/ai/gemini-client'
import { FunctionCallingConfigMode } from '@google/genai'
import { transcribeAudio } from '@/lib/ai/gemini-file-processor'
import { validatePathAgainstSchema, coerceValueToSchema } from '@/lib/value-normalizer'
import { SectionSchema } from '@/lib/structured-schemas'
import { z } from 'zod'
import { parseWithZod } from '@/lib/ai/structured'
import { StructuredFieldPathResolver } from '@/lib/field-path-resolver'
import type { Part } from '@google/genai'

export async function POST(request: NextRequest) {
  const processingId = generateProcessingId()
  const startTime = Date.now()

  try {
    console.log(`🚀 [MultiModal API] Starting processing: ${processingId}`)

    // Parse request
    const formData = await request.formData()
    const reportId = formData.get('reportId') as string
    const sectionIdsRaw = formData.get('sectionIds') as string || '[]'
    const sectionIds = JSON.parse(sectionIdsRaw)
    const textContent = formData.get('textContent') as string
    const replace = formData.get('replace') === 'true'

    // Parse processing options
    const optionsRaw = formData.get('processingOptions') as string
    const processingOptions = optionsRaw ? JSON.parse(optionsRaw) : {}

    console.log(`📋 [MultiModal API] Request summary:`, {
      reportId,
      sectionCount: sectionIds.length,
      hasTextContent: !!textContent,
      replace,
      processingOptions
    })

    // Validate required fields
    if (!reportId || !sectionIds || sectionIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: reportId, sectionIds',
        processingId
      }, { status: 400 })
    }

    // Build report context
    console.log(`🔍 [MultiModal API] Building report context...`)
    const contextResult = await reportContextBuilder.buildReportContext(reportId, sectionIds)

    if (!contextResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to build report context',
        details: contextResult.error,
        processingId
      }, { status: 404 })
    }

    const reportContext = contextResult.context!
    console.log(`✅ [MultiModal API] Report context built: ${reportContext.metadata.targetSections} target sections`)

    // Extract files from form data
    const files: File[] = []
    let fileIndex = 0
    while (formData.get(`file_${fileIndex}`)) {
      files.push(formData.get(`file_${fileIndex}`) as File)
      fileIndex++
    }

    console.log(`📁 [MultiModal API] Found ${files.length} files to process`)

    // Build Gemini content parts array — use native multimodal for PDFs, images, audio
    const contentParts: Part[] = []
    const processingErrors: string[] = []

    if (textContent && textContent.trim()) {
      contentParts.push({ text: `Assessment Notes:\n${textContent}` })
    }

    for (const f of files) {
      try {
        if (f.type === 'application/pdf') {
          // Send PDF as inline base64 to Gemini (native PDF understanding)
          const arrayBuffer = await f.arrayBuffer()
          const base64Data = Buffer.from(arrayBuffer).toString('base64')
          contentParts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data,
            },
          })
          contentParts.push({ text: `[Document: ${f.name}]` })
        } else if (f.type.startsWith('audio/')) {
          // Transcribe audio using Gemini native audio understanding
          const transcript = await transcribeAudio(f)
          contentParts.push({ text: `Audio transcript from ${f.name}:\n${transcript}` })
        } else if (f.type.startsWith('text/')) {
          const t = await f.text()
          contentParts.push({ text: `Text content from ${f.name}:\n${t}` })
        } else if (f.type.startsWith('image/')) {
          // Send image as inline base64 to Gemini (native vision)
          const arrayBuffer = await f.arrayBuffer()
          const base64Data = Buffer.from(arrayBuffer).toString('base64')
          contentParts.push({
            inlineData: {
              mimeType: f.type,
              data: base64Data,
            },
          })
          contentParts.push({ text: `[Image: ${f.name}]` })
        } else {
          contentParts.push({ text: `File ${f.name} of type ${f.type} received.` })
        }
      } catch (e) {
        processingErrors.push(`${f.name}: ${(e as Error).message}`)
      }
    }

    if (processingErrors.length > 0) {
      contentParts.push({ text: `Note: Some files could not be processed:\n${processingErrors.join('\n')}` })
    }

    if (contentParts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No content provided for processing',
        processingId
      }, { status: 400 })
    }

    // Add final instruction
    contentParts.push({
      text: 'Please extract relevant information and update the appropriate sections using the save_assessment_data tool. Include confidence scores and source references for each update.'
    })

    console.log(`📝 [MultiModal API] Built content array with ${contentParts.length} parts`)

    // Build system prompt
    const systemPrompt = reportContextBuilder.buildEnhancedSystemPrompt(reportContext)
    const targetSectionsWithContext = reportContextBuilder.getTargetSectionsWithContext(reportContext)
    const sectionSchemaById = new Map<string, SectionSchema | undefined>()
    for (const s of targetSectionsWithContext) {
      sectionSchemaById.set(s.id, s.schema as SectionSchema | undefined)
    }

    // Define Gemini function declaration for structured updates
    const enhancedTool = {
      name: 'save_assessment_data',
      description: 'Extracts and saves structured data from multi-modal assessment information with confidence scoring and source attribution.',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            description: 'Array of field updates to apply to the report sections',
            items: {
              type: 'object',
              properties: {
                section_id: {
                  type: 'string',
                  description: 'Exact UUID of the section to update',
                },
                field_path: {
                  type: 'string',
                  description: "Dot notation path to the field. NEVER use 'structured_data' as a field path.",
                },
                value: {
                  description: 'New value for the field',
                },
                merge_strategy: {
                  type: 'string',
                  enum: ['replace', 'append', 'merge'],
                  description: 'How to handle existing data',
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence level for this extraction (0-1)',
                },
                source_reference: {
                  type: 'string',
                  description: "Reference to source (e.g., 'document.pdf page 3')",
                },
                rationale: {
                  type: 'string',
                  description: 'Brief explanation of why this field should be updated',
                },
              },
              required: ['section_id', 'field_path', 'value', 'merge_strategy', 'confidence', 'source_reference', 'rationale'],
            },
          },
          processing_summary: {
            type: 'string',
            description: 'Summary of what was processed and key findings',
          },
          data_quality_assessment: {
            type: 'object',
            properties: {
              overall_confidence: { type: 'number' },
              source_reliability: { type: 'object' },
              conflicts_detected: { type: 'array', items: { type: 'string' } },
              missing_information: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        required: ['updates', 'processing_summary'],
      },
    }

    console.log(`🤖 [MultiModal API] Calling Gemini with tool + multimodal content...`)

    const ai = getGeminiClient()
    const model = resolveModel()

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: contentParts }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
        maxOutputTokens: 4000,
        tools: [{ functionDeclarations: [enhancedTool] }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: ['save_assessment_data'],
          },
        },
      },
    })

    console.log(`✅ [MultiModal API] Model response received`)

    // Extract function call from response
    const candidate = (response as any).candidates?.[0]
    const responseParts = candidate?.content?.parts || []
    const fcPart = responseParts.find((p: any) => p.functionCall)

    if (!fcPart?.functionCall?.args) {
      throw new Error('No tool use found in response from model')
    }

    const extractedData = fcPart.functionCall.args as any
    const updates = extractedData.updates || []

    console.log(`📊 [MultiModal API] Extracted ${updates.length} updates from model`)

    // Process updates with enhanced validation
    const supabase = await createSupabaseServerClient()
    const results: any[] = []
    const processSummaries: string[] = []
    const resolver = new StructuredFieldPathResolver()

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i]
      console.log(`📝 [MultiModal API] Processing update ${i + 1}/${updates.length} for section ${update.section_id}`)

      try {
        // Enhanced validation
        const validationResult = validateAndCleanFieldUpdate(update)
        if (!validationResult.isValid) {
          console.error(`❌ [MultiModal API] Validation failed: ${validationResult.error}`)
          results.push({
            sectionId: update.section_id,
            success: false,
            error: validationResult.error,
            confidence: update.confidence,
            sourceReference: update.source_reference
          })
          continue
        }

        const cleanedUpdate = validationResult.cleanedUpdate || update

        // Validate section ID
        if (!reportContext.targetSectionIds.includes(cleanedUpdate.section_id)) {
          console.error(`❌ [MultiModal API] Invalid section ID: ${cleanedUpdate.section_id}`)
          results.push({
            sectionId: cleanedUpdate.section_id,
            success: false,
            error: `Invalid section ID. Valid IDs: ${reportContext.targetSectionIds.join(', ')}`,
            confidence: update.confidence,
            sourceReference: update.source_reference
          })
          continue
        }

        // Validate field path against section schema
        const sectionSchema = sectionSchemaById.get(cleanedUpdate.section_id)
        const pathCheck = validatePathAgainstSchema(sectionSchema, cleanedUpdate.field_path)
        if (!pathCheck.isValid) {
          const err = `Field path not in schema: ${cleanedUpdate.field_path}${pathCheck.errors.length ? ` (${pathCheck.errors.join('; ')})` : ''}`
          console.warn(`⚠️ [MultiModal API] ${err}`)
          results.push({
            sectionId: cleanedUpdate.section_id,
            success: false,
            error: err,
            confidence: update.confidence,
            sourceReference: update.source_reference
          })
          continue
        }

        // Coerce value to expected field type
        if (pathCheck.fieldSchema) {
          cleanedUpdate.value = coerceValueToSchema(cleanedUpdate.value, pathCheck.fieldSchema)
        }

        // Get current section data
        const { data: currentSection } = await supabase
          .from('report_sections')
          .select('structured_data')
          .eq('id', cleanedUpdate.section_id)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let updatedData: any = currentSection?.structured_data || {}

        // Clean existing data
        const cleanupResult = dataIntegrityGuard.cleanCorruptedData(updatedData)
        if (cleanupResult.wasCorrupted) {
          console.warn(`⚠️ [MultiModal API] Cleaned corrupted data in section ${cleanedUpdate.section_id}`)
          updatedData = cleanupResult.cleanedData
        }

        // Apply update with schema-aware merge
        updatedData = applyFieldUpdateWithSchema(
          resolver,
          updatedData,
          cleanedUpdate.field_path,
          cleanedUpdate.value,
          cleanedUpdate.merge_strategy,
          pathCheck.fieldSchema
        )

        // Final integrity check
        updatedData = dataIntegrityGuard.preventCircularReferences(updatedData)
        if (updatedData && typeof updatedData === 'object' && updatedData.structured_data) {
          delete updatedData.structured_data
        }

        const dryRun = (processingOptions && processingOptions.dryRun === true) || false
        if (dryRun) {
          console.log(`🟡 [MultiModal API] Dry run — skipping DB write for section ${cleanedUpdate.section_id}`)
          results.push({
            sectionId: cleanedUpdate.section_id,
            success: true,
            fieldPath: cleanedUpdate.field_path,
            confidence: update.confidence,
            sourceReference: update.source_reference,
            rationale: update.rationale,
            dryRun: true
          })
          processSummaries.push(update.rationale || 'Field updated (preview)')
        } else {
          // Update database
          const { error } = await supabase
            .from('report_sections')
            .update({ structured_data: updatedData })
            .eq('id', cleanedUpdate.section_id)

          if (error) {
            console.error(`❌ [MultiModal API] Database update failed:`, error)
            results.push({
              sectionId: cleanedUpdate.section_id,
              success: false,
              error: error.message,
              confidence: update.confidence,
              sourceReference: update.source_reference
            })
          } else {
            console.log(`✅ [MultiModal API] Updated section ${cleanedUpdate.section_id}`)
            results.push({
              sectionId: cleanedUpdate.section_id,
              success: true,
              fieldPath: cleanedUpdate.field_path,
              confidence: update.confidence,
              sourceReference: update.source_reference,
              rationale: update.rationale
            })
            processSummaries.push(update.rationale || 'Field updated successfully')
          }
        }
      } catch (error) {
        console.error(`❌ [MultiModal API] Error processing update:`, error)
        results.push({
          sectionId: update.section_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          confidence: update.confidence,
          sourceReference: update.source_reference
        })
      }
    }

    const successful = results.filter((r: any) => r.success).length
    const failed = results.filter((r: any) => !r.success).length
    const totalProcessingTime = Date.now() - startTime

    console.log(`🎉 [MultiModal API] Processing complete: ${successful} successful, ${failed} failed (${totalProcessingTime}ms)`)

    // Build simple processed files summary for response
    const processedFilesSummary = files.map(f => ({
      name: f.name,
      type: f.type,
      processingMethod: 'gemini-multimodal',
      confidence: 1,
      extractedDataPoints: 0,
      annotations: 0,
      sourceReferences: 0
    }))

    // Build a concise structured processing summary for UI
    let structuredProcessingSummary: { summary: string; confidence: number; issues: string[] } | null = null
    try {
      const ProcessingSummary = z.object({
        summary: z.string(),
        confidence: z.number().min(0).max(1),
        issues: z.array(z.string()),
      })

      const successfulIds = results.filter((r: any) => r.success && r.sectionId).map((r: any) => r.sectionId as string)
      const uniqueSections = Array.from(new Set(successfulIds))
      const exampleChanges = results.filter((r: any) => r.success && r.sectionId && r.fieldPath).slice(0, 5).map((r: any) => `${r.sectionId}.${r.fieldPath}`)

      const so = await parseWithZod(
        ProcessingSummary,
        'processing_summary',
        [
          { role: 'system', content: 'Summarize changes for a clinical report intake. Return only JSON: { summary, confidence, issues }.' },
          { role: 'user', content: `Applied ${successful} updates (${failed} failed). Sections affected: ${uniqueSections.join(', ') || 'none'}\nExample changes: ${exampleChanges.join(', ') || 'n/a'}\nNotes: ${(processSummaries || []).slice(0, 5).join(' | ')}` },
        ]
      )

      structuredProcessingSummary = so.ok ? so.data : { summary: `Processed ${successful} updates`, confidence: 0.8, issues: [] }
    } catch {
      structuredProcessingSummary = { summary: `Processed ${successful} updates`, confidence: 0.8, issues: [] }
    }

    return NextResponse.json({
      success: true,
      processingId,
      results: {
        processedFiles: processedFilesSummary,
        appliedUpdates: results,
        processingErrors,
        dataQualityAssessment: extractedData.data_quality_assessment,
        updateResults: results,
        proposedUpdates: updates
      },
      metadata: {
        processingTime: totalProcessingTime,
        totalFilesProcessed: files.length,
        totalUpdatesApplied: successful,
        overallConfidence: extractedData.data_quality_assessment?.overall_confidence || 0.8,
        processingOptions
      },
      summary: {
        message: `${(processingOptions && processingOptions.dryRun) ? 'Previewed' : 'Processed'} ${files.length} files and ${(processingOptions && processingOptions.dryRun) ? 'proposed' : 'applied'} ${successful} updates successfully`,
        processingSummary: extractedData.processing_summary,
        structuredProcessingSummary,
        warnings: contextResult.warnings.concat(processingErrors)
      }
    })

  } catch (error) {
    console.error(`❌ [MultiModal API] Critical error:`, error)
    return NextResponse.json({
      success: false,
      processingId,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    }, { status: 500 })
  }
}

// Helper functions
function generateProcessingId(): string {
  return `multimodal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

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
        return resolver.setFieldValue(data, fieldPath, value)
      }
      case 'merge': {
        if (type === 'object' && typeof current === 'object' && typeof value === 'object' && !Array.isArray(current) && !Array.isArray(value)) {
          return resolver.setFieldValue(data, fieldPath, { ...current, ...value })
        }
        return resolver.setFieldValue(data, fieldPath, value)
      }
      case 'replace':
      default:
        return resolver.setFieldValue(data, fieldPath, value)
    }
  } catch {
    return data
  }
}
