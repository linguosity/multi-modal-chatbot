/**
 * Cleanup utility for fixing existing corrupted structured_data
 * 
 * This utility identifies and fixes Russian-doll patterns in existing data
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { dataIntegrityGuard } from './data-integrity-guard'

export interface CleanupReport {
  totalSections: number
  corruptedSections: number
  cleanedSections: number
  errors: string[]
  cleanupDetails: Array<{
    sectionId: string
    title: string
    issuesFound: string[]
    cleanupActions: string[]
  }>
}

export async function cleanupCorruptedStructuredData(): Promise<CleanupReport> {
  const supabase = await createSupabaseServerClient()
  
  const report: CleanupReport = {
    totalSections: 0,
    corruptedSections: 0,
    cleanedSections: 0,
    errors: [],
    cleanupDetails: []
  }

  try {
    // Fetch all report sections with structured_data
    const { data: sections, error } = await supabase
      .from('report_sections')
      .select('id, title, structured_data')
      .not('structured_data', 'is', null)

    if (error) {
      report.errors.push(`Failed to fetch sections: ${error.message}`)
      return report
    }

    report.totalSections = sections?.length || 0
    console.log(`🔍 Found ${report.totalSections} sections with structured_data`)

    if (!sections || sections.length === 0) {
      return report
    }

    // Process each section
    for (const section of sections) {
      try {
        const cleanupResult = dataIntegrityGuard.cleanCorruptedData(section.structured_data)
        
        if (cleanupResult.wasCorrupted) {
          report.corruptedSections++
          
          console.log(`🔧 Cleaning corrupted data in section ${section.id} (${section.title})`)
          console.log(`   Issues found: ${cleanupResult.issuesFound.join(', ')}`)
          
          // Update the section with cleaned data
          const { error: updateError } = await supabase
            .from('report_sections')
            .update({ structured_data: cleanupResult.cleanedData })
            .eq('id', section.id)

          if (updateError) {
            report.errors.push(`Failed to update section ${section.id}: ${updateError.message}`)
          } else {
            report.cleanedSections++
            report.cleanupDetails.push({
              sectionId: section.id,
              title: section.title,
              issuesFound: cleanupResult.issuesFound,
              cleanupActions: cleanupResult.cleanupActions
            })
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        report.errors.push(`Error processing section ${section.id}: ${errorMessage}`)
      }
    }

    console.log(`✅ Cleanup complete: ${report.cleanedSections}/${report.corruptedSections} corrupted sections cleaned`)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    report.errors.push(`Critical error during cleanup: ${errorMessage}`)
  }

  return report
}

export async function identifyCorruptedSections(): Promise<Array<{
  id: string
  title: string
  issues: string[]
}>> {
  const supabase = await createSupabaseServerClient()
  const corruptedSections: Array<{ id: string; title: string; issues: string[] }> = []

  try {
    // Fetch all sections with structured_data
    const { data: sections, error } = await supabase
      .from('report_sections')
      .select('id, title, structured_data')
      .not('structured_data', 'is', null)

    if (error || !sections) {
      console.error('Failed to fetch sections:', error)
      return corruptedSections
    }

    // Check each section for corruption
    for (const section of sections) {
      const cleanupResult = dataIntegrityGuard.cleanCorruptedData(section.structured_data)
      
      if (cleanupResult.wasCorrupted) {
        corruptedSections.push({
          id: section.id,
          title: section.title,
          issues: cleanupResult.issuesFound
        })
      }
    }

  } catch (error) {
    console.error('Error identifying corrupted sections:', error)
  }

  return corruptedSections
}

// CLI-friendly function for running cleanup
export async function runCleanupCommand(): Promise<void> {
  console.log('🚀 Starting structured_data cleanup...')
  
  const report = await cleanupCorruptedStructuredData()
  
  console.log('\n📊 Cleanup Report:')
  console.log(`   Total sections: ${report.totalSections}`)
  console.log(`   Corrupted sections found: ${report.corruptedSections}`)
  console.log(`   Successfully cleaned: ${report.cleanedSections}`)
  console.log(`   Errors: ${report.errors.length}`)
  
  if (report.errors.length > 0) {
    console.log('\n❌ Errors encountered:')
    report.errors.forEach(error => console.log(`   - ${error}`))
  }
  
  if (report.cleanupDetails.length > 0) {
    console.log('\n🔧 Cleanup details:')
    report.cleanupDetails.forEach(detail => {
      console.log(`   Section: ${detail.title} (${detail.sectionId})`)
      console.log(`   Issues: ${detail.issuesFound.join(', ')}`)
      console.log(`   Actions: ${detail.cleanupActions.join(', ')}`)
      console.log('')
    })
  }
  
  console.log('✅ Cleanup complete!')
}