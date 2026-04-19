import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import Anthropic from '@/lib/ai/gemini-messages'
import { z } from 'zod'
import { parseWithZod } from '@/lib/ai/gemini-structured'

const anthropic = new Anthropic({})

interface GenerateAllNarrativesResult {
  results: Array<{
    sectionId: string
    sectionTitle: string
    narrative: string
    sourceMappings: any[]
    error?: string
  }>
  successful: number
  failed: number
  skipped: number
}

async function generateNarrativeForSection(
  reportId: string,
  sectionId: string,
  sectionTitle: string,
  structuredData: any,
  reportSections: any[]
): Promise<{ narrative: string; sourceMappings: any[] } | null> {
  try {
    // Validate that there's meaningful data
    const hasValidData = Object.values(structuredData).some(value => {
      if (value === null || value === undefined || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'object' && Object.keys(value).length === 0) return false
      if (typeof value === 'string' && value.trim() === '') return false
      return true
    })

    if (!hasValidData) {
      return null
    }

    // Prepare context from all sections for better narrative coherence
    const reportContext = reportSections
      .filter((s: any) => s.structured_data && Object.keys(s.structured_data).length > 0)
      .map((s: any) => ({
        sectionTitle: s.title,
        sectionType: s.section_type,
        data: s.structured_data
      }))

    // Create the clinically-informed narrative generation prompt (same as single narrative)
    const narrativePrompt = `You are an expert Speech-Language Pathologist writing a professional evaluation report section following established clinical conventions.

SECTION TO WRITE: ${sectionTitle}
STRUCTURED DATA: ${JSON.stringify(structuredData, null, 2)}

REPORT CONTEXT FOR COHERENCE:
${reportContext.map((ctx: { sectionTitle: any; data: any }) => `${ctx.sectionTitle}: ${JSON.stringify(ctx.data, null, 2)}`).join('\n\n')}

CLINICAL NARRATIVE STRUCTURE FOR "${sectionTitle}":
${sectionTitle.toLowerCase().includes('assessment') ? `
PARAGRAPH 1: Assessment tools administered, testing conditions, student cooperation
PARAGRAPH 2: Quantitative results with clinical interpretation and severity levels
PARAGRAPH 3: Qualitative observations, error patterns, and behavioral notes
PARAGRAPH 4: Functional impact and clinical significance of findings
` : sectionTitle.toLowerCase().includes('recommendation') ? `
PARAGRAPH 1: Service recommendations based on assessment findings
PARAGRAPH 2: Specific goals and intervention targets
PARAGRAPH 3: Accommodations and environmental modifications
PARAGRAPH 4: Follow-up and monitoring recommendations
` : `
PARAGRAPH 1: Introduction of key findings or concerns
PARAGRAPH 2: Detailed information and supporting evidence
PARAGRAPH 3: Clinical interpretation and significance
PARAGRAPH 4: Implications and next steps
`}

CLINICAL WRITING STANDARDS:
1. PROFESSIONAL TONE: Clinical objectivity with compassionate language
2. EVIDENCE-BASED: Reference specific scores, observations, and clinical indicators
3. STUDENT-CENTERED: Focus on strengths and needs, not just deficits
4. ACCESSIBLE LANGUAGE: Professional but understandable to parents and teachers
5. LOGICAL FLOW: Present information in order of clinical significance
6. SPECIFIC DETAILS: Include test names, scores, dates, and concrete observations
7. FUNCTIONAL FOCUS: Connect findings to real-world communication needs

SCORE REPORTING CONVENTIONS:
- Standard Scores: "achieved a standard score of 85 (16th percentile)"
- Percentiles: "performed at the 25th percentile, indicating below average skills"
- Age Equivalents: "demonstrated skills equivalent to a 4-year, 6-month level"
- Qualitative Descriptors: Use "below average," "average," "above average" ranges

CLINICAL TERMINOLOGY:
- Use professional SLP vocabulary appropriately
- Explain technical terms when necessary for parent understanding
- Maintain diagnostic accuracy and clinical precision
- Follow person-first language conventions

TENSE AND VOICE:
- Past tense for assessment activities: "was administered," "demonstrated," "exhibited"
- Present tense for current status: "continues to show," "currently demonstrates"
- Active voice when possible for clarity and engagement

IMPORTANT: For source mapping, structure your response as JSON with:
   - "narrative": the complete narrative text (as a single string)
   - "sourceMappings": array of objects with:
     - "id": unique identifier (e.g., "mapping_1", "mapping_2")
     - "text": the specific text segment from the narrative
     - "sources": array of data sources used for this text
     - "startIndex": character position where this segment starts in the narrative
     - "endIndex": character position where this segment ends in the narrative

Each source should include:
- "sectionId": "${sectionId}"
- "sectionTitle": "${sectionTitle}"
- "fieldPath": the data field path (e.g., "assessment_tools.0.standard_score")
- "fieldLabel": human-readable field name (e.g., "Standard Score")
- "value": the actual data value
- "confidence": confidence score (0.7-1.0) for how strongly this data influenced the text

Example response format:
{
  "narrative": "The student was administered the PLS-5 assessment, yielding a standard score of 85 (16th percentile), indicating below-average performance in overall language skills.",
  "sourceMappings": [
    {
      "id": "mapping_1",
      "text": "PLS-5 assessment, yielding a standard score of 85 (16th percentile)",
      "sources": [
        {
          "sectionId": "${sectionId}",
          "sectionTitle": "${sectionTitle}",
          "fieldPath": "assessment_tools.0.tool_name",
          "fieldLabel": "Assessment Tool",
          "value": "PLS-5",
          "confidence": 0.95
        }
      ],
      "startIndex": 35,
      "endIndex": 89
    }
  ]
}

Write a comprehensive, professional narrative that would be appropriate for an official SLP evaluation report.`

    // Try Structured Outputs first for strict schema adherence
    const Source = z.object({
      sectionId: z.string(),
      sectionTitle: z.string(),
      fieldPath: z.string(),
      fieldLabel: z.string(),
      value: z.any(),
      confidence: z.number().min(0).max(1).optional(),
    })
    const SourceMapping = z.object({
      id: z.string(),
      text: z.string(),
      sources: z.array(Source),
      startIndex: z.number().int().nonnegative(),
      endIndex: z.number().int().nonnegative(),
    })
    const NarrativeWithMappings = z.object({
      narrative: z.string(),
      sourceMappings: z.array(SourceMapping),
    })

    const structured = await parseWithZod(
      NarrativeWithMappings,
      'narrative_with_mappings',
      [
        {
          role: 'system',
          content:
            'You are an expert SLP. Return only JSON matching the provided schema strictly. Do not include prose outside JSON.',
        },
        { role: 'user', content: narrativePrompt },
      ]
    )

    if (structured.ok) {
      const result = structured.data
      if (!result.narrative || result.narrative.trim().length === 0) {
        throw new Error('Generated narrative is empty')
      }
      return result
    } else {
      console.warn('Structured Outputs parse failed; falling back to Claude API:', structured.error)
    }

    // Fallback: Call Anthropic API directly
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: narrativePrompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let result
    try {
      // Try to parse as JSON for source mapping
      const parsed = JSON.parse(content.text)

      // Validate the structure
      if (!parsed.narrative || typeof parsed.narrative !== 'string') {
        throw new Error('Invalid narrative structure')
      }

      if (!Array.isArray(parsed.sourceMappings)) {
        throw new Error('Invalid source mapping structure')
      }

      // Validate and clean up mappings
      const validMappings = parsed.sourceMappings
        .filter((mapping: any) => mapping.text && Array.isArray(mapping.sources))
        .map((mapping: any, index: number) => ({
          id: mapping.id || `mapping_${index + 1}_${Date.now()}`,
          text: mapping.text,
          sources: mapping.sources.filter((source: any) =>
            source.fieldPath && source.fieldLabel && source.value !== undefined
          ),
          startIndex: typeof mapping.startIndex === 'number' ? mapping.startIndex : 0,
          endIndex: typeof mapping.endIndex === 'number' ? mapping.endIndex : mapping.text?.length || 0
        }))

      result = {
        narrative: parsed.narrative,
        sourceMappings: validMappings
      }
    } catch (parseError) {
      console.warn('Failed to parse source mapping JSON, falling back to plain narrative:', parseError)
      // Fallback: treat as plain narrative
      result = {
        narrative: content.text.replace(/^```json\s*|\s*```$/g, '').trim(),
        sourceMappings: []
      }
    }

    // Final validation
    if (!result.narrative || result.narrative.trim().length === 0) {
      throw new Error('Generated narrative is empty')
    }

    return result
  } catch (error) {
    console.error(`Error generating narrative for section ${sectionId}:`, error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Generate all narratives API called')
    const { reportId } = await request.json()

    if (!reportId) {
      return NextResponse.json({ error: 'Missing required parameter: reportId' }, { status: 400 })
    }

    console.log('📊 Fetching report with all sections...')
    const supabase = await createRouteSupabase()

    // Fetch the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      console.log('❌ Report not found:', reportError)
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Fetch all sections for this report
    const { data: sections, error: sectionsError } = await supabase
      .from('report_sections')
      .select('*')
      .eq('report_id', reportId)
      .order('order', { ascending: true })

    if (sectionsError) {
      console.log('❌ Error fetching sections:', sectionsError)
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
    }

    const reportSections = sections || []

    console.log(`✅ Fetched report with ${reportSections.length} sections`)

    // Filter sections that have meaningful data (skip empty ones and Student Information)
    const sectionsToGenerate = reportSections.filter((section: any) => {
      if (section.title === 'Student Information' || section.section_type === 'student_information') {
        return false
      }

      if (!section.structured_data || typeof section.structured_data !== 'object') {
        return false
      }

      const hasData = Object.values(section.structured_data).some(value => {
        if (value === null || value === undefined || value === '') return false
        if (Array.isArray(value) && value.length === 0) return false
        if (typeof value === 'object' && Object.keys(value).length === 0) return false
        if (typeof value === 'string' && value.trim() === '') return false
        return true
      })

      return hasData
    })

    console.log(`📋 Found ${sectionsToGenerate.length} sections with data to generate narratives for`)

    const results: GenerateAllNarrativesResult['results'] = []
    let successful = 0
    let failed = 0
    let skipped = reportSections.length - sectionsToGenerate.length

    // Process sections sequentially to avoid rate limits
    for (const section of sectionsToGenerate) {
      try {
        console.log(`🔄 Generating narrative for section: ${section.title}`)

        const result = await generateNarrativeForSection(
          reportId,
          section.id,
          section.title,
          section.structured_data,
          reportSections
        )

        if (result) {
          results.push({
            sectionId: section.id,
            sectionTitle: section.title,
            narrative: result.narrative,
            sourceMappings: result.sourceMappings
          })
          successful++
          console.log(`✅ Successfully generated narrative for: ${section.title}`)
        } else {
          skipped++
          console.log(`⏭️  Skipped section (no meaningful data): ${section.title}`)
        }
      } catch (error) {
        failed++
        console.error(`❌ Failed to generate narrative for ${section.title}:`, error)
        results.push({
          sectionId: section.id,
          sectionTitle: section.title,
          narrative: '',
          sourceMappings: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Batch generation complete - Success: ${successful}, Failed: ${failed}, Skipped: ${skipped}`)

    return NextResponse.json({
      results,
      successful,
      failed,
      skipped
    } as GenerateAllNarrativesResult)

  } catch (error) {
    console.error('❌ Generate all narratives error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate narratives',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
