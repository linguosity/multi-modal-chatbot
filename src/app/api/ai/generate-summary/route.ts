import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { reportId } = await request.json()

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    const supabase = await createRouteSupabase()

    // Fetch the report
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Extract content from sections for AI analysis
    const sectionContents = report.sections?.map((section: any) => ({
      title: section.title,
      content: section.content || '',
      lastUpdated: section.lastUpdated
    })) || []

    // Sort by last updated to focus on recent work
    const recentSections = sectionContents
      .filter(section => section.lastUpdated)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 5) // Focus on 5 most recent sections

    if (recentSections.length === 0) {
      return NextResponse.json({ 
        summary: "No recent activity on this report." 
      })
    }

    // Create prompt for AI summary
    const prompt = `You are analyzing a speech-language evaluation report to create a brief activity summary.

Report Title: ${report.title}
Student: ${report.studentName || 'Not specified'}
Status: ${report.status}

Recent sections worked on:
${recentSections.map(section => `
- ${section.title}
  Content preview: ${section.content.substring(0, 200)}...
`).join('')}

Create a single, concise sentence (max 15 words) that summarizes what was most recently worked on in this report. Focus on the specific content areas or assessment activities mentioned. Be professional and specific.

Examples of good summaries:
- "Updated assessment results for articulation and language comprehension testing"
- "Added parent concerns and developmental history information"
- "Completed eligibility determination and recommendations section"

Your summary:`

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const summary = response.content[0].type === 'text' 
      ? response.content[0].text.trim()
      : 'Recent work on evaluation sections'

    return NextResponse.json({ summary })

  } catch (error) {
    console.error('Error generating AI summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}