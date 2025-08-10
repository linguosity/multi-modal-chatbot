import { NextRequest, NextResponse } from 'next/server'
// enhancedFileProcessor removed in favor of local extraction and OpenAI adapter
import { reportContextBuilder } from '@/lib/report-context-builder'
import { validateAndCleanFieldUpdate, dataIntegrityGuard } from '@/lib/data-integrity-guard'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
// PDF text extraction disabled to avoid native 'canvas' dependency
import { transcribeAudio } from '@/lib/file-processing'
import { validatePathAgainstSchema, coerceValueToSchema } from '@/lib/value-normalizer'
import { SectionSchema } from '@/lib/structured-schemas'
import { StructuredFieldPathResolver } from '@/lib/field-path-resolver'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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

    // Build content array; upload PDFs to Claude Files for in-model parsing
    const content: any[] = []
    let processingErrors: string[] = []

    if (textContent && textContent.trim()) {
      content.push({ type: 'text', text: `Assessment Notes:\n${textContent}` })
    }
    for (const f of files) {
      try {
        if (f.type === 'application/pdf') {
          const uploaded = await anthropic.beta.files.upload({ file: f })
          content.push({
            type: 'document',
            title: f.name,
            source: { type: 'file', file_id: uploaded.id }
          })
        } else if (f.type.startsWith('audio/')) {
          const transcript = await transcribeAudio(f)
          content.push({ type: 'text', text: `Audio transcript from ${f.name}:\n${transcript}` })
        } else if (f.type.startsWith('text/')) {
          const t = await f.text()
          content.push({ type: 'text', text: `Text content from ${f.name}:\n${t}` })
        } else if (f.type.startsWith('image/')) {
          // If needed later, support file uploads for images too; for now, mark present
          content.push({ type: 'text', text: `Image provided (${f.name}). Vision analysis not enabled here.` })
        } else {
          content.push({ type: 'text', text: `File ${f.name} of type ${f.type} received.` })
        }
      } catch (e) {
        processingErrors.push(`${f.name}: ${(e as Error).message}`)
      }
    }
    if (processingErrors.length > 0) {
      content.push({ type: 'text', text: `Note: Some files could not be processed:\n${processingErrors.join('\n')}` })
    }

    if (content.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No content provided for processing',
        processingId
      }, { status: 400 })
    }

    // Add final instruction
    content.push({
      type: 'text',
      text: 'Please extract relevant information and update the appropriate sections using the save_assessment_data tool. Include confidence scores and source references for each update.'
    })

    console.log(`📝 [MultiModal API] Built content array with ${content.length} items`)

    // Build system prompt
    let systemPrompt = reportContextBuilder.buildEnhancedSystemPrompt(reportContext)
    const targetSectionsWithContext = reportContextBuilder.getTargetSectionsWithContext(reportContext)
    const sectionSchemaById = new Map<string, SectionSchema | undefined>()
    for (const s of targetSectionsWithContext) {
      sectionSchemaById.set(s.id, s.schema as SectionSchema | undefined)
    }

    // Define tool
    const enhancedTool = {
      name: "save_assessment_data",
      description: "Extracts and saves structured data from multi-modal assessment information with confidence scoring and source attribution.",
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
                  description: "Exact UUID of the section to update (must match provided section list)"
                },
                field_path: {
                  type: "string",
                  description: "Dot notation path to the field (e.g., 'assessment_results.wisc_scores.verbal_iq'). NEVER use 'structured_data' as a field path."
                },
                value: {
                  description: "New value for the field - can be string, number, boolean, array, or object"
                },
                merge_strategy: {
                  type: "string",
                  enum: ["replace", "append", "merge"],
                  description: "How to handle existing data"
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Confidence level for this extraction (0-1)"
                },
                source_reference: {
                  type: "string",
                  description: "Reference to source (e.g., 'document.pdf page 3', 'audio_transcript 2:30-3:15', 'image_analysis.jpg')"
                },
                rationale: {
                  type: "string",
                  description: "Brief explanation of why this field should be updated with this value"
                }
              },
              required: ["section_id", "field_path", "value", "merge_strategy", "confidence", "source_reference", "rationale"]
            }
          },
          processing_summary: {
            type: "string",
            description: "Summary of what was processed and key findings across all sources"
          },
          data_quality_assessment: {
            type: "object",
            properties: {
              overall_confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Overall confidence in the extracted data"
              },
              source_reliability: {
                type: "object",
                description: "Assessment of each source's reliability"
              },
              conflicts_detected: {
                type: "array",
                items: { type: "string" },
                description: "Any conflicts found between sources"
              },
              missing_information: {
                type: "array",
                items: { type: "string" },
                description: "Important information that appears to be missing"
              }
            }
          }
        },
        required: ["updates", "processing_summary"]
      }
    }

    console.log(`🤖 [MultiModal API] Calling Claude with tool + document blocks...`)

    // Call Claude with tool
    const response = await anthropic.beta.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-1-20250805',
      max_tokens: 4000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
      tools: [enhancedTool],
      tool_choice: { type: 'tool', name: 'save_assessment_data' }
    })

    console.log(`✅ [MultiModal API] Model response received`)

    // Extract tool call
    const toolCall = response.content.find(
      (block): block is { type: 'tool_use'; id: string; name: string; input: any } =>
        (block as any).type === 'tool_use'
    )

    if (!toolCall) {
      throw new Error('No tool use found in response from model')
    }

    const extractedData = toolCall.input as any
    const updates = extractedData.updates || []

    console.log(`📊 [MultiModal API] Extracted ${updates.length} updates from model`)

    // Process updates with enhanced validation
    const supabase = await createSupabaseServerClient()
    const results = []
    const processSummaries = []
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

        // Validate field path against section schema (if available)
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

        // Coerce value to expected field type when possible
        if (pathCheck.fieldSchema) {
          cleanedUpdate.value = coerceValueToSchema(cleanedUpdate.value, pathCheck.fieldSchema)
        }

        // Get current section data
        const { data: currentSection } = await supabase
          .from('report_sections')
          .select('structured_data')
          .eq('id', cleanedUpdate.section_id)
          .single()

        let updatedData = currentSection?.structured_data || {}

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

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const totalProcessingTime = Date.now() - startTime

    console.log(`🎉 [MultiModal API] Processing complete: ${successful} successful, ${failed} failed (${totalProcessingTime}ms)`)

    // Build simple processed files summary for response
    const processedFilesSummary = files.map(f => ({
      name: f.name,
      type: f.type,
      processingMethod: 'local-extract',
      confidence: 1,
      extractedDataPoints: 0,
      annotations: 0,
      sourceReferences: 0
    }))

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
