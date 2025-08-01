import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Validate API key on startup
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY environment variable is not set')
}


export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Generate narrative API called')
    const { reportId, sectionId, sectionTitle, structuredData, includeSourceMapping } = await request.json()

    console.log('📊 Request data:', { reportId, sectionId, sectionTitle, structuredDataKeys: Object.keys(structuredData || {}) })

    if (!reportId || !sectionId) {
      console.log('❌ Missing required parameters')
      return NextResponse.json({ error: 'Missing required parameters: reportId and sectionId are required' }, { status: 400 })
    }

    if (!structuredData || typeof structuredData !== 'object' || Object.keys(structuredData).length === 0) {
      console.log('❌ No structured data provided')
      return NextResponse.json({ error: 'No structured data provided. Please add some data to the section first.' }, { status: 400 })
    }

    // Validate that there's meaningful data
    const hasValidData = Object.values(structuredData).some(value => {
      if (value === null || value === undefined || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'object' && Object.keys(value).length === 0) return false
      if (typeof value === 'string' && value.trim() === '') return false
      return true
    })

    if (!hasValidData) {
      console.log('❌ No meaningful data found')
      return NextResponse.json({ error: 'No meaningful data found. Please add some content to the section first.' }, { status: 400 })
    }

    console.log('✅ Data validation passed')

    console.log('🔌 Creating Supabase client...')
    const supabase = await createServerSupabase()
    console.log('✅ Supabase client created')

    // Get the full report context for better narrative generation
    console.log('📖 Fetching report context...')

    // First try with sections join
    let { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        sections:report_sections(*)
      `)
      .eq('id', reportId)
      .single()

    // If join failed or no sections found, try without join (sections might be embedded)
    if (!reportError && (!report.sections || report.sections.length === 0)) {
      console.log('🔄 No sections from join, trying embedded sections...')
      const { data: reportWithoutJoin, error: simpleError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (!simpleError && reportWithoutJoin) {
        report = reportWithoutJoin
        console.log('📊 Report sections type:', typeof report.sections, Array.isArray(report.sections))
      }
    }

    if (reportError) {
      console.log('❌ Report fetch error:', reportError)
      return NextResponse.json({ error: 'Report not found: ' + reportError.message }, { status: 404 })
    }

    if (!report) {
      console.log('❌ No report data returned')
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    console.log('✅ Report context fetched:', {
      sectionsCount: report.sections?.length || 0,
      reportId: report.id,
      reportTitle: report.title,
      sections: report.sections?.map((s: any) => ({ id: s.id, title: s.title })) || []
    })

    // Find the current section
    const currentSection = report.sections?.find((s: any) => s.id === sectionId)
    if (!currentSection) {
      console.log('❌ Section not found:', {
        sectionId,
        availableSections: report.sections?.map((s: any) => s.id) || []
      })
      return NextResponse.json({
        error: 'Section not found',
        availableSections: report.sections?.map((s: any) => s.id) || [],
        requestedSectionId: sectionId
      }, { status: 404 })
    }

    // Prepare context from all sections for better narrative coherence
    const reportContext = report.sections
      .filter((s: any) => s.structured_data && Object.keys(s.structured_data).length > 0)
      .map((s: any) => ({
        sectionTitle: s.title,
        sectionType: s.section_type,
        data: s.structured_data
      }))

    // Create the clinically-informed narrative generation prompt
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

${includeSourceMapping ? `
9. IMPORTANT: For source mapping, structure your response as JSON with:
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
` : ''}

Write a comprehensive, professional narrative that would be appropriate for an official SLP evaluation report.`

    console.log('🤖 Calling Anthropic API...')
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219', // Use the standard model name
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: narrativePrompt
        }
      ]
    })
    console.log('✅ Anthropic API response received')

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let result
    if (includeSourceMapping) {
      try {
        // Try to parse as JSON for source mapping
        const parsed = JSON.parse(content.text)

        // Validate the structure
        if (!parsed.narrative || typeof parsed.narrative !== 'string') {
          throw new Error('Invalid narrative structure - narrative must be a string')
        }

        if (!Array.isArray(parsed.sourceMappings)) {
          throw new Error('Invalid source mapping structure - sourceMappings must be an array')
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
    } else {
      result = {
        narrative: content.text,
        sourceMappings: []
      }
    }

    // Final validation
    if (!result.narrative || result.narrative.trim().length === 0) {
      throw new Error('Generated narrative is empty')
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Narrative generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate narrative',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}