import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { reportId, sectionId, mappingId, currentText, sources } = await request.json()

    if (!reportId || !sectionId || !mappingId || !currentText || !sources) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Create a focused regeneration prompt
    const regenerationPrompt = `You are an expert Speech-Language Pathologist revising a specific part of an evaluation report.

CURRENT TEXT TO REVISE:
"${currentText}"

DATA SOURCES FOR THIS TEXT:
${sources.map((source: any) => `
- ${source.sectionTitle} → ${source.fieldLabel}: ${JSON.stringify(source.value)}
  (Confidence: ${Math.round(source.confidence * 100)}%)
`).join('')}

INSTRUCTIONS:
1. Rewrite the text segment to better reflect the source data
2. Maintain professional SLP terminology and clinical tone
3. Ensure the revised text flows naturally in context
4. Keep similar length unless the data suggests otherwise
5. Be more specific and evidence-based if possible
6. Return ONLY the revised text, no additional formatting or explanation

REVISED TEXT:`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.4, // Slightly higher for variation
      messages: [
        {
          role: 'user',
          content: regenerationPrompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return NextResponse.json({
      newText: content.text.trim(),
      mappingId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Narrative section regeneration error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate narrative section' },
      { status: 500 }
    )
  }
}