/**
 * Report Context Builder
 * 
 * This system builds comprehensive report context for Claude API calls,
 * ensuring proper section ID resolution and preventing <UNKNOWN> section IDs.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { dataIntegrityGuard } from './data-integrity-guard'
import {
  ASSESSMENT_MEASURE_TYPES,
  ASSESSMENT_TARGET_POPULATIONS,
  ASSESSMENT_FINDING_TYPES,
  ASSESSMENT_CONVERGENCE_LEVELS,
} from './structured-schemas'

/**
 * Reinforces section-specific extraction rules that aren't safe to leave to
 * whatever ai_directive happens to be in the database — the DB row is seeded
 * once and rarely re-migrated, so we overlay critical guidance here. Returns
 * '' when the directive in the DB already covers it.
 */
function directiveOverlayFor(sectionType: string | undefined, dbDirective: string): string {
  if (!sectionType) return ''
  const t = sectionType.toLowerCase()
  if (t === 'assessment_tools') {
    // Skip if the existing directive already names the enum — avoids stacking
    // duplicate guidance on top of an updated DB row.
    if (/measure_type\s+MUST/i.test(dbDirective)) return ''
    return (
      'ASSESSMENT TOOLS — STRICT FIELD RULES (apply per tools[] entry, in this order):\n' +
      '\n' +
      '1) id — snake_case slug derived from title (e.g. title "Parent Communication Questionnaire" ' +
      '→ id "parent_communication_questionnaire"; "CELF-5" → "celf_5"; "Classroom Observation" → ' +
      '"classroom_observation"). REQUIRED. evidence[].tool_id in assessment_results.domain_summary[] ' +
      'cites these ids — they must be stable across the report. If an entry for this tool already ' +
      'exists, REUSE its id rather than minting a new one.\n' +
      '\n' +
      '2) title — the measure\'s name (e.g. "CELF-5", "Parent Communication Questionnaire", ' +
      '"Classroom Observation"). Required.\n' +
      '\n' +
      `3) measure_type — pick ONE of: ${ASSESSMENT_MEASURE_TYPES.join(', ')}. Choose the most specific:\n` +
      '   • Parent/caregiver-completed rating scale (any numeric scale, including 0-4, Likert, ' +
      'frequency) → "Questionnaire". NOT "Standardized Test", even if numeric.\n' +
      '   • Norm-referenced published test with subtest scores → "Standardized Test".\n' +
      '   • Free-form parent narrative or interview-style write-up → "Parent/Caregiver Report".\n' +
      '   • Free-form clinician-led conversation → "Interview".\n' +
      '   • Non-standardized clinician procedure → "Informal Assessment".\n' +
      '   HARD RULE: NEVER label a parent rating scale as "Standardized Test".\n' +
      '\n' +
      '4) administered_date — REQUIRED whenever any date appears on the source. Look for "Date:", ' +
      '"Date administered:", "DOA:", or any date in the form header. Convert to ISO YYYY-MM-DD. ' +
      'Examples: "04/24/26" → "2026-04-24"; "4/24/2026" → "2026-04-24"; "April 24, 2026" → ' +
      '"2026-04-24". For 2-digit years, prefer the current decade (20YY). Leave blank ONLY when no ' +
      'date is anywhere on the source.\n' +
      '\n' +
      `5) target_population — ONE of: ${ASSESSMENT_TARGET_POPULATIONS.join(', ')}. This is the AGE ` +
      'BAND the tool is designed for, in 1-3 words. NEVER put a description of the tool here. NEVER ' +
      'put scale information, administration notes, or domains here. If the tool spans multiple ages, ' +
      'pick "General".\n' +
      '\n' +
      '6) purpose — ONE sentence describing what the tool consists of and what it evaluates, using ' +
      'this exact template:\n' +
      '   "The [title] is a [formal | informal] [tool type] that [screens | evaluates | assesses] ' +
      '[a child | an adult | a school-age student]\'s [domain1, domain2, domain3]."\n' +
      '   EXAMPLE: "The Parent Communication Questionnaire is an informal caregiver-rated screening ' +
      'tool that evaluates a child\'s receptive language, expressive language, social communication, ' +
      'and speech intelligibility."\n' +
      '   Do NOT include scoring scales, dates, or who completed it — those go in `notes`.\n' +
      '\n' +
      '7) domains_assessed — flat array of domain labels, e.g. ["Receptive Language", ' +
      '"Expressive Language", "Social Communication"].\n' +
      '\n' +
      '8) notes — clinician notes about THIS administration only (who completed it, conditions, ' +
      'notable observations). NOT a re-description of the tool — `purpose` already does that.\n' +
      '\n' +
      'PARTITION RULE: this section is the procedural inventory. NEVER write findings, scores, ' +
      'interpretations, or per-domain prose here. All findings go in assessment_results.domain_summary[].\n' +
      '\n' +
      'COVERAGE RULE: emit ONE tools[] entry for every distinct measure used — formal AND informal. ' +
      'Any uploaded parent questionnaire, caregiver interview, teacher report, classroom observation, ' +
      'language sample, oral mechanism exam, or hearing screening must appear as its own entry, even ' +
      'when no standardized test name is given.\n' +
      '\n' +
      'SHAPE RULE: emit tools as a JSON ARRAY of objects, never as an object with numeric keys. Use ' +
      'field_path "tools" with value [{...}, {...}], or field_path "tools.0" with a single tool ' +
      'object — do not wrap entries in a numeric-keyed object like {"0": {...}}.'
    )
  }
  if (t === 'assessment_results') {
    // The directive was rewritten as part of the schema migration that
    // dropped *_notes and added domain_summary[]. Use a unique signature
    // for the dedup guard so a stale DB row with old text doesn't suppress
    // the overlay.
    if (/domain_summary\s*\[\]/i.test(dbDirective)) return ''
    return (
      'ASSESSMENT RESULTS — STRICT FIELD RULES.\n' +
      '\n' +
      'This section emits TWO fields:\n' +
      '  • summary_of_results (paragraph): one cross-domain synthesis. 3-5 sentences. Lead with the ' +
      'primary-concern domain, name the strongest evidence, then briefly cite each other domain.\n' +
      '  • domain_summary[] (array): one entry PER DOMAIN.\n' +
      '\n' +
      'HARD RULE: do NOT emit per-domain prose paragraphs (no articulation_notes, no ' +
      'receptive_language_notes, no fluency_notes, etc.). Those fields no longer exist. ' +
      'Per-domain prose is generated by the renderer at view time from the rubric below — ' +
      'your job is to populate the structured rubric, not write paragraphs.\n' +
      '\n' +
      'Each domain_summary[] entry has these fields:\n' +
      '\n' +
      '  domain — one of: Articulation, Receptive Language, Expressive Language, Pragmatics, ' +
      'Fluency, Voice (or other if the source covers something else). One domain per entry.\n' +
      '\n' +
      '  can_do — array of specific strengths (each a short phrase, not a paragraph). e.g. ' +
      '["Follows everyday directions (4/4 parent rating)", "Plays cooperatively with peers"].\n' +
      '\n' +
      '  support_needed — array of specific concerns (same shape as can_do).\n' +
      '\n' +
      '  contexts — array of contexts where data was gathered. e.g. ["Home", "Classroom", ' +
      '"Outside the family"].\n' +
      '\n' +
      '  evidence — array of per-source findings. Each entry is { tool_id, finding, note? }. ' +
      'tool_id MUST match an existing assessment_tools.tools[].id (the snake_case slug). ' +
      `finding MUST be one of: ${ASSESSMENT_FINDING_TYPES.join(', ')}.\n` +
      '    • concern   = source flagged this domain as a concern\n' +
      '    • mixed     = partial / qualified concern\n' +
      '    • wnl       = within expected range (null result, no flag)\n' +
      '    • strength  = source actively identified above-expectation skill\n' +
      '    • na        = source did not assess this domain\n' +
      '  Optional `note` is ONE sentence of detail beyond the glyph — do NOT re-state the rubric.\n' +
      '\n' +
      `  convergence — REQUIRED when evidence[] has ≥1 entry. { level, agreeing_tool_ids, ` +
      `conflicting_tool_ids?, rationale? }. level MUST be one of: ${ASSESSMENT_CONVERGENCE_LEVELS.join(', ')}.\n` +
      '    • high          = ≥3 sources agree, no conflicts\n' +
      '    • moderate      = 2 sources agree, no conflicts\n' +
      '    • low           = sources disagree (rationale REQUIRED — one sentence on why and which ' +
      'to weight)\n' +
      '    • single_source = only 1 source has data on this domain\n' +
      '  agreeing_tool_ids = ids whose finding aligns with the rubric verdict. ' +
      'conflicting_tool_ids = ids whose finding disagrees. Both lists reference assessment_tools[].id.\n' +
      '\n' +
      '  narrative_override — DO NOT EMIT. This field is reserved for clinician-authored prose ' +
      'overrides. The AI must leave it blank.\n' +
      '\n' +
      'CITATION RULE: cite tools by id, never re-describe them in this section. Tool descriptions ' +
      'live in assessment_tools.tools[].purpose; this section consumes them by reference.\n' +
      '\n' +
      'SHAPE RULE: domain_summary is a JSON array. Use field_path "domain_summary" with the full ' +
      'array, or "domain_summary.0", "domain_summary.1", etc. for one entry at a time. Never wrap ' +
      'in a numeric-keyed object.'
    )
  }
  if (t === 'conclusion') {
    if (/no subtest citations/i.test(dbDirective)) return ''
    return (
      'CONCLUSION — STAND-ALONE SECTION.\n' +
      '\n' +
      'This section must read independently of Results. Many readers (parents, family members, ' +
      'review teams) read Conclusion first or forward it without the rest of the report.\n' +
      '\n' +
      'WRITE: 2-3 sentences synthesizing the headline finding at the highest altitude, plus the ' +
      'eligibility/severity verdict (when known). Use fresh wording — DO NOT copy phrases from ' +
      'summary_of_results or any *_notes field.\n' +
      '\n' +
      'DO NOT WRITE: specific subtest names, scores, ratings, percentile bands, or any citation ' +
      'that requires the reader to flip back to Results. Those live in Results. Conclusion is ' +
      'the inverted-pyramid apex; it restates the headline at a higher zoom level using its own ' +
      'language. No subtest citations.'
    )
  }
  return ''
}

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
  /** ASHA-canonical leaf names this report is scoped to. Empty array means
   *  the report has no explicit scope (legacy reports created before
   *  migration 005, or a clinician who deliberately cleared the picker).
   *  When non-empty, the AI directive uses this to constrain which
   *  domain_summary[] entries Claude is allowed to emit. */
  targetDomains: string[]
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
        .select('id, title, template_id, target_domains')
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

      // Step 6: Build final context. target_domains is sanitized against
      // ASHA leaves at write-time in /api/reports, but defensively re-filter
      // here so a stale row (pre-migration-005) doesn't surface garbage.
      const { ASHA_LEAVES } = await import('./asha-scope')
      const ashaLeafSet = new Set<string>(ASHA_LEAVES)
      const targetDomains = Array.isArray(report.target_domains)
        ? (report.target_domains as unknown[]).filter(
            (d): d is string => typeof d === 'string' && ashaLeafSet.has(d),
          )
        : []

      const context: ReportContext = {
        reportId: report.id,
        reportTitle: report.title,
        targetDomains,
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
      const dbDirective = sectionType?.ai_directive ?? ''
      const overlay = directiveOverlayFor(section.section_type, dbDirective)
      const directive = [dbDirective, overlay].filter(Boolean).join(' ')
      const ai = directive ? `\n- AI Directive: ${directive}` : ''
      return `
- ID: ${section.id}
- Title: ${section.title}
- Type: ${section.section_type}
- Required: ${section.is_required}
- Current Data Keys: ${keys}${ai}`
    }).join('\n')

    const validIdsList = targetSections.map(s => `- ${s.id} (${s.title})`).join('\n')

    // Report scope — the ASHA leaves the clinician selected for this report.
    // Empty array means no scope was set (legacy report or deliberately
    // wide-open); skip the scoping block in that case so the AI doesn't
    // see contradictory guidance.
    const scopeBlock = context.targetDomains.length > 0
      ? `
REPORT SCOPE — ASHA domains selected for this evaluation:
${context.targetDomains.map((d) => `  • ${d}`).join('\n')}

Scope rules:
- Every assessment_results.domain_summary[] entry's \`domain\` MUST be one
  of the leaves above. Do NOT emit entries for domains outside this list.
- If a source mentions a domain outside the scope, ignore that content
  rather than invent a domain_summary row for it.
- Tools that primarily target out-of-scope domains may still be inventoried
  in assessment_tools.tools[] (they were used in the eval), but their
  evidence[].tool_id citations only land on in-scope domain rows.
- The ASHA-canonical leaf names above are the ONLY allowed values for the
  \`domain\` field. Do not abbreviate or re-cast (e.g. emit "Articulation"
  not "Speech Sounds").
`
      : ''

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
${scopeBlock}
AVAILABLE REPORT SECTIONS (use these EXACT IDs):
${sectionSummaries}

SECTION ID VALIDATION:
You MUST use the exact section IDs listed above. Valid section IDs are:
${validIdsList}

PROCESSING PRIORITIES:
1. Test scores and standardized assessment results
2. Demographic and background information
3. Clinical observations and findings
4. Cross-domain SYNTHESIS — for assessment_results, you MUST emit a summary_of_results paragraph (3-5 sentences) AND a domain_summary[] entry per domain whenever any source covers that domain. domain_summary[] entries carry the structured rubric (can_do, support_needed, contexts, evidence[], convergence). DO NOT write per-domain prose paragraphs — those are deprecated; the renderer derives prose from the rubric.
5. Cross-section partition — assessment_tools is the procedural inventory only (no findings); assessment_results owns all findings; conclusion stands alone with fresh wording (no subtest citations). Cite tools by id from evidence[].tool_id rather than re-describing them.
6. Source dates — when an evidence file (questionnaire, form, scoring sheet) has a "Date:" header or any date in its header, extract it as administered_date on the corresponding tools[] entry, ISO YYYY-MM-DD.
7. Recommendations and service needs
8. Eligibility and diagnostic information

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
