/**
 * Report Context Builder
 * 
 * This system builds comprehensive report context for Claude API calls,
 * ensuring proper section ID resolution and preventing <UNKNOWN> section IDs.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { dataIntegrityGuard } from './data-integrity-guard'

export interface ReportSection {
  id: string
  title: string
  section_type: string
  section_type_id: string
  structured_data: any
  content: string
  order: number
  is_required: boolean
  is_generated: boolean
}

export interface SectionType {
  id: string
  name: string
  ai_directive: string
  schema: any
}

export interface ReportContext {
  reportId: string
  reportTitle: string
  sections: ReportSection[]
  sectionTypes: Map<string, SectionType>
  targetSectionIds: string[]
  hasCircularReferences: boolean
  metadata: {
    totalSections: number
    targetSections: number
    corruptedSections: number
    cleanedSections: number
  }
}

export interface ContextBuildResult {
  success: boolean
  context?: ReportContext
  error?: string
  warnings: string[]
}

export class ReportContextBuilder {
  private supabase: any

  constructor() {
    // Will be initialized in build method
  }

  /**
   * Builds comprehensive report context for Claude API calls
   */
  async buildReportContext(reportId: string, targetSectionIds: string[]): Promise<ContextBuildResult> {
    const warnings: string[] = []
    
    try {
      this.supabase = await createSupabaseServerClient()

      // Step 1: Fetch report basic info
      const { data: report, error: reportError } = await this.supabase
        .from('reports')
        .select('id, title, template_id')
        .eq('id', reportId)
        .single()

      if (reportError || !report) {
        return {
          success: false,
          error: `Report not found: ${reportError?.message || 'Unknown error'}`,
          warnings
        }
      }

      console.log(`🔍 [ReportContextBuilder] Building context for report: ${report.title} (${report.id})`)

      // Step 2: Fetch ALL report sections (not filtered yet)
      // Be resilient to schema differences (older DBs may not have section_type_id)
      let sections: any[] = []
      {
        const { data, error } = await this.supabase
          .from('report_sections')
          .select('*')
          .eq('report_id', reportId)
          .order('order', { ascending: true })

        if (error) {
          warnings.push(`Error fetching sections: ${error.message}`)
        } else if (data) {
          sections = data
        }
      }
      console.log(`🔍 [ReportContextBuilder] Found ${sections.length} total sections`)

      // Step 3: Fetch section types and their AI directives (schema may be missing on some DBs)
      const sectionTypesMap = new Map<string, SectionType>()
      try {
        let sectionTypesData: any[] | null = null
        // Try selecting with schema column first
        {
          const { data, error } = await this.supabase
            .from('report_section_types')
            .select('id, name, ai_directive, schema')
          if (error) {
            warnings.push(`Error fetching section types (with schema): ${error.message}`)
          } else {
            sectionTypesData = data
          }
        }
        // Fallback without schema column
        if (!sectionTypesData) {
          const { data, error } = await this.supabase
            .from('report_section_types')
            .select('id, name, ai_directive')
          if (error) {
            warnings.push(`Error fetching section types (fallback): ${error.message}`)
          } else {
            sectionTypesData = data
          }
        }
        if (sectionTypesData) {
          sectionTypesData.forEach(st => {
            sectionTypesMap.set(st.id, {
              id: st.id,
              name: st.name,
              ai_directive: st.ai_directive,
              schema: (st as any).schema
            })
          })
        }
      } catch (err) {
        warnings.push('Section types lookup failed; proceeding without type schemas')
      }

      console.log(`🔍 [ReportContextBuilder] Loaded ${sectionTypesMap.size} section types`)

      // Step 4: Validate target section IDs
      const validTargetSectionIds = this.validateTargetSectionIds(sections, targetSectionIds, warnings)

      // Step 5: Clean corrupted data and detect circular references
      let hasCircularReferences = false
      let corruptedSections = 0
      let cleanedSectionsCount = 0

      const cleanedSections = sections.map(section => {
        if (section.structured_data) {
          const cleanupResult = dataIntegrityGuard.cleanCorruptedData(section.structured_data)
          if (cleanupResult.wasCorrupted) {
            hasCircularReferences = true
            corruptedSections++
            if (cleanupResult.cleanedData) {
              cleanedSectionsCount++
              warnings.push(`Cleaned corrupted data in section: ${section.title} (${section.id})`)
            }
            return {
              ...section,
              structured_data: cleanupResult.cleanedData
            }
          }
        }
        return section
      })

      // Step 6: Build final context
      const context: ReportContext = {
        reportId: report.id,
        reportTitle: report.title,
        sections: cleanedSections,
        sectionTypes: sectionTypesMap,
        targetSectionIds: validTargetSectionIds,
        hasCircularReferences,
        metadata: {
          totalSections: sections.length,
          targetSections: validTargetSectionIds.length,
          corruptedSections,
          cleanedSections: cleanedSectionsCount
        }
      }

      console.log(`✅ [ReportContextBuilder] Context built successfully:`, {
        totalSections: context.metadata.totalSections,
        targetSections: context.metadata.targetSections,
        hasCircularReferences: context.hasCircularReferences
      })

      return {
        success: true,
        context,
        warnings
      }

    } catch (error) {
      console.error('❌ [ReportContextBuilder] Failed to build context:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings
      }
    }
  }

  /**
   * Validates target section IDs against available sections
   */
  private validateTargetSectionIds(
    sections: ReportSection[], 
    targetSectionIds: string[], 
    warnings: string[]
  ): string[] {
    const availableSectionIds = sections.map(s => s.id)
    const validSectionIds: string[] = []
    const invalidSectionIds: string[] = []

    for (const sectionId of targetSectionIds) {
      if (availableSectionIds.includes(sectionId)) {
        validSectionIds.push(sectionId)
      } else {
        invalidSectionIds.push(sectionId)
      }
    }

    if (invalidSectionIds.length > 0) {
      warnings.push(`Invalid section IDs requested: ${invalidSectionIds.join(', ')}`)
      console.warn(`⚠️ [ReportContextBuilder] Invalid section IDs:`, invalidSectionIds)
    }

    if (validSectionIds.length === 0) {
      warnings.push('No valid target sections found - Claude will not have proper context')
    }

    console.log(`🔍 [ReportContextBuilder] Section ID validation: ${validSectionIds.length}/${targetSectionIds.length} valid`)

    return validSectionIds
  }

  /**
   * Builds enhanced system prompt with complete section context
   */
  buildEnhancedSystemPrompt(context: ReportContext): string {
    const targetSections = context.sections.filter(s => context.targetSectionIds.includes(s.id))

    const sectionSummaries = targetSections.map(section => {
      const byId = (section as any).section_type_id ? context.sectionTypes.get((section as any).section_type_id) : undefined
      const byName = !byId && section.section_type
        ? Array.from(context.sectionTypes.values()).find(st => (st.name || '').toLowerCase() === (section.section_type || '').toLowerCase())
        : undefined
      const sectionType = byId || byName
      const keys = section.structured_data ? Object.keys(section.structured_data).join(', ') : 'none'
      const ai = sectionType?.ai_directive ? `\n- AI Directive: ${sectionType.ai_directive}` : ''
      return `
- ID: ${section.id}
- Title: ${section.title}
- Type: ${section.section_type}
- Required: ${section.is_required}
- Current Data Keys: ${keys}${ai}`
    }).join('\n')

    const validIdsList = targetSections.map(s => `- ${s.id} (${s.title})`).join('\n')

    return `You are an expert Speech-Language Pathologist with advanced data extraction capabilities.

CRITICAL FIELD PATH RULES:
- NEVER use "structured_data" as a field_path
- NEVER use empty or null field_path values
- Use specific field paths like "assessment_results.test_scores.wisc_v.verbal_iq"
- Validate that field_path does not match /^structured_data(\.|$)/

REPORT CONTEXT:
- Report: ${context.reportTitle} (ID: ${context.reportId})
- Total Sections: ${context.metadata.totalSections}
- Target Sections: ${context.metadata.targetSections}

AVAILABLE REPORT SECTIONS (use these EXACT IDs):
${sectionSummaries}

SECTION ID VALIDATION:
You MUST use the exact section IDs listed above. Valid section IDs are:
${validIdsList}

PROCESSING PRIORITIES:
1. Test scores and standardized assessment results
2. Demographic and background information  
3. Clinical observations and findings
4. Recommendations and service needs
5. Eligibility and diagnostic information

DATA EXTRACTION GUIDELINES:
- Extract specific, structured data points rather than prose
- Maintain data types and follow schema constraints
- Provide confidence scores based on source clarity
- Include specific source references (page numbers, timestamps)
- Flag any conflicting information across sources
- Identify missing data that would be valuable to collect

MERGE STRATEGY SELECTION:
- "replace": Use when you have definitive new information
- "append": Use for adding to lists or supplementing existing text
- "merge": Use for combining object properties without overwriting

CRITICAL: Your primary goal is to extract structured, verifiable data that enhances the assessment report while maintaining data integrity. Always use the exact section IDs provided above.`
  }

  /**
   * Gets target sections with full context
   */
  getTargetSectionsWithContext(context: ReportContext): Array<{
    id: string
    title: string
    section_type: string
    ai_directive?: string
    schema?: any
    current_data_keys: string[]
  }> {
    return context.sections
      .filter(s => context.targetSectionIds.includes(s.id))
      .map(section => {
        const byId = (section as any).section_type_id ? context.sectionTypes.get((section as any).section_type_id) : undefined
        const byName = !byId && section.section_type
          ? Array.from(context.sectionTypes.values()).find(st => (st.name || '').toLowerCase() === (section.section_type || '').toLowerCase())
          : undefined
        const sectionType = byId || byName
        return {
          id: section.id,
          title: section.title,
          section_type: section.section_type,
          ai_directive: sectionType?.ai_directive,
          schema: sectionType?.schema,
          current_data_keys: section.structured_data ? Object.keys(section.structured_data) : []
        }
      })
  }
}

// Singleton instance for global use
export const reportContextBuilder = new ReportContextBuilder()
