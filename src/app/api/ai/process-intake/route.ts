import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface ProcessIntakeRequest {
  data: string | Record<string, unknown>
  type: 'structured' | 'unstructured'
  reportId: string
}

export async function POST(request: NextRequest) {
  try {
    const { data, type, reportId }: ProcessIntakeRequest = await request.json()
    
    if (!data || !type || !reportId) {
      return NextResponse.json(
        { error: 'Missing required fields: data, type, reportId' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Get the current report to understand its structure
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*, sections(*)')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Process the data based on type
    let processedSections: Array<{
      sectionId: string
      extractedData: Record<string, unknown>
      confidence: number
    }> = []

    if (type === 'unstructured') {
      // Parse unstructured text and extract relevant information
      processedSections = await processUnstructuredData(data as string, report.sections)
    } else {
      // Process structured data
      processedSections = await processStructuredData(data as Record<string, unknown>, report.sections)
    }

    // Update the report sections with extracted data
    const updatePromises = processedSections.map(async ({ sectionId, extractedData }) => {
      const { error } = await supabase
        .from('report_sections')
        .update({
          structured_data: extractedData,
          last_updated: new Date().toISOString()
        })
        .eq('id', sectionId)

      return { sectionId, success: !error, error }
    })

    const results = await Promise.all(updatePromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success)

    // Get section titles for better UX
    const sectionsWithTitles = await Promise.all(
      processedSections.map(async (s) => {
        const { data: section } = await supabase
          .from('report_sections')
          .select('title')
          .eq('id', s.sectionId)
          .single()
        
        return {
          sectionId: s.sectionId,
          title: section?.title || 'Unknown Section',
          confidence: s.confidence,
          extractedFields: Object.keys(s.extractedData)
        }
      })
    )

    return NextResponse.json({
      success: true,
      message: `Processed ${successful} sections successfully`,
      results: {
        successful,
        failed: failed.length,
        sections: sectionsWithTitles
      }
    })

  } catch (error) {
    console.error('Error processing intake data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processUnstructuredData(
  text: string, 
  sections: any[]
): Promise<Array<{ sectionId: string; extractedData: Record<string, unknown>; confidence: number }>> {
  const results: Array<{ sectionId: string; extractedData: Record<string, unknown>; confidence: number }> = []
  
  // Simple text parsing logic - in a real implementation, this would use AI
  const lowerText = text.toLowerCase()
  
  for (const section of sections) {
    let extractedData: Record<string, unknown> = {}
    let confidence = 0
    
    switch (section.section_type) {
      case 'student_information':
        // Extract student information
        const nameMatch = text.match(/(?:student|child|client)(?:\s+name)?:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
        const ageMatch = text.match(/(?:age|years?\s+old):?\s*(\d+)/i)
        const gradeMatch = text.match(/grade:?\s*(K|[0-9]|1[0-2]|kindergarten|preschool)/i)
        
        if (nameMatch) {
          const fullName = nameMatch[1].trim()
          const nameParts = fullName.split(' ')
          extractedData.first_name = nameParts[0]
          extractedData.last_name = nameParts.slice(1).join(' ')
          confidence += 30
        }
        
        if (ageMatch) {
          extractedData.age = ageMatch[1]
          confidence += 20
        }
        
        if (gradeMatch) {
          extractedData.grade = gradeMatch[1]
          confidence += 20
        }
        
        // Extract languages
        if (lowerText.includes('english') || lowerText.includes('spanish')) {
          const languages = []
          if (lowerText.includes('english')) languages.push('English')
          if (lowerText.includes('spanish')) languages.push('Spanish')
          extractedData.primary_languages = languages.join(', ')
          confidence += 15
        }
        
        break
        
      case 'family_background':
        // Extract family information
        if (lowerText.includes('parent') || lowerText.includes('mother') || lowerText.includes('father')) {
          extractedData.family_structure = 'Lives with parents'
          confidence += 25
        }
        
        if (lowerText.includes('sibling')) {
          extractedData.siblings = 'Has siblings'
          confidence += 15
        }
        
        // Extract languages spoken at home
        const homeLanguageMatch = text.match(/(?:languages?\s+spoken\s+(?:in\s+)?(?:the\s+)?home|home\s+language):?\s*([^.]+)/i)
        if (homeLanguageMatch) {
          extractedData.home_languages = homeLanguageMatch[1].trim()
          confidence += 20
        }
        
        break
        
      case 'health_developmental_history':
        // Extract health information
        if (lowerText.includes('birth') || lowerText.includes('gestation')) {
          extractedData.birth_history = 'Information available in assessment notes'
          confidence += 20
        }
        
        if (lowerText.includes('milestone') || lowerText.includes('development')) {
          extractedData.developmental_milestones = 'Information available in assessment notes'
          confidence += 20
        }
        
        if (lowerText.includes('medication') || lowerText.includes('allerg')) {
          extractedData.medical_information = 'Medical information documented'
          confidence += 15
        }
        
        break
        
      case 'reason_for_referral':
        // Extract referral reasons
        if (lowerText.includes('speech') || lowerText.includes('language')) {
          extractedData.primary_concerns = 'Speech and language concerns'
          confidence += 30
        }
        
        if (lowerText.includes('referr')) {
          const referralMatch = text.match(/(?:referred|referral)(?:\s+by|\s+from)?:?\s*([^.]+)/i)
          if (referralMatch) {
            extractedData.referral_source = referralMatch[1].trim()
            confidence += 25
          }
        }
        
        break
    }
    
    if (Object.keys(extractedData).length > 0) {
      results.push({
        sectionId: section.id,
        extractedData,
        confidence: Math.min(confidence, 100)
      })
    }
  }
  
  return results
}

async function processStructuredData(
  data: Record<string, unknown>,
  sections: any[]
): Promise<Array<{ sectionId: string; extractedData: Record<string, unknown>; confidence: number }>> {
  const results: Array<{ sectionId: string; extractedData: Record<string, unknown>; confidence: number }> = []
  
  // Map structured data to appropriate sections
  for (const section of sections) {
    let extractedData: Record<string, unknown> = {}
    let confidence = 100 // Structured data has high confidence
    
    switch (section.section_type) {
      case 'student_information':
        if (data.studentName) {
          const nameParts = (data.studentName as string).split(' ')
          extractedData.first_name = nameParts[0]
          extractedData.last_name = nameParts.slice(1).join(' ')
        }
        if (data.assessmentDate) extractedData.evaluation_dates = data.assessmentDate
        break
        
      case 'health_developmental_history':
        if (data.observations) extractedData.clinical_observations = data.observations
        break
    }
    
    if (Object.keys(extractedData).length > 0) {
      results.push({
        sectionId: section.id,
        extractedData,
        confidence
      })
    }
  }
  
  return results
}