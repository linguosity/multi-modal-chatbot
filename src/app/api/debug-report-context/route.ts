import { NextRequest, NextResponse } from 'next/server'
import { reportContextBuilder } from '@/lib/report-context-builder'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const reportId = url.searchParams.get('reportId')
    const sectionIds = url.searchParams.get('sectionIds')?.split(',') || []

    if (!reportId) {
      return NextResponse.json({
        success: false,
        error: 'reportId parameter is required'
      }, { status: 400 })
    }

    console.log(`🔍 [Debug] Building context for report: ${reportId}`)
    console.log(`🔍 [Debug] Requested section IDs: ${sectionIds.join(', ')}`)

    // Build report context
    const contextResult = await reportContextBuilder.buildReportContext(reportId, sectionIds)

    if (!contextResult.success) {
      return NextResponse.json({
        success: false,
        error: contextResult.error,
        warnings: contextResult.warnings
      }, { status: 404 })
    }

    const context = contextResult.context!

    // Build diagnostic information
    const diagnostics = {
      reportInfo: {
        id: context.reportId,
        title: context.reportTitle
      },
      sectionAnalysis: {
        totalSections: context.metadata.totalSections,
        requestedSections: sectionIds.length,
        validTargetSections: context.metadata.targetSections,
        invalidSectionIds: sectionIds.filter(id => !context.targetSectionIds.includes(id)),
        hasCircularReferences: context.hasCircularReferences,
        corruptedSections: context.metadata.corruptedSections,
        cleanedSections: context.metadata.cleanedSections
      },
      availableSections: context.sections.map(section => ({
        id: section.id,
        title: section.title,
        section_type: section.section_type,
        is_required: section.is_required,
        is_generated: section.is_generated,
        has_structured_data: !!section.structured_data,
        structured_data_keys: section.structured_data ? Object.keys(section.structured_data) : [],
        order: section.order
      })),
      targetSections: reportContextBuilder.getTargetSectionsWithContext(context),
      sectionTypes: Array.from(context.sectionTypes.entries()).map(([id, type]) => ({
        id,
        name: type.name,
        has_ai_directive: !!type.ai_directive,
        ai_directive: type.ai_directive,
        has_schema: !!type.schema
      })),
      systemPromptPreview: reportContextBuilder.buildEnhancedSystemPrompt(context).substring(0, 500) + '...',
      warnings: contextResult.warnings
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      message: `Context built successfully for ${context.metadata.targetSections} target sections`
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportId, sectionIds = [] } = body

    if (!reportId) {
      return NextResponse.json({
        success: false,
        error: 'reportId is required'
      }, { status: 400 })
    }

    // Build context and return detailed analysis
    const contextResult = await reportContextBuilder.buildReportContext(reportId, sectionIds)

    return NextResponse.json({
      success: contextResult.success,
      contextResult,
      analysis: contextResult.success ? {
        canProcessWithClaude: contextResult.context!.metadata.targetSections > 0,
        potentialIssues: [
          ...(contextResult.context!.metadata.targetSections === 0 ? ['No valid target sections - Claude will return <UNKNOWN> section IDs'] : []),
          ...(contextResult.context!.hasCircularReferences ? ['Circular references detected in data'] : []),
          ...(contextResult.warnings.length > 0 ? [`Warnings: ${contextResult.warnings.join(', ')}`] : [])
        ],
        recommendations: [
          ...(contextResult.context!.metadata.targetSections === 0 ? ['Verify section IDs exist in the report'] : []),
          ...(contextResult.context!.hasCircularReferences ? ['Run data cleanup utility'] : []),
          ...(contextResult.context!.sectionTypes.size === 0 ? ['Ensure section types are properly configured'] : [])
        ]
      } : null
    })

  } catch (error) {
    console.error('Debug POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}