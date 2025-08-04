import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { createEnhancedApiHandler } from '@/lib/api/enhanced-handler'
import { api } from '@/lib/api/api-helpers'
import { createTableHelpers } from '@/lib/api/database-constants'
import { ReportSchema, DEFAULT_SECTIONS, ReportSection } from '@/lib/schemas/report'

// Type-safe request body schema
const CreateReportBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  type: z.enum(['initial', 'annual', 'triennial', 'progress', 'exit', 'consultation', 'other']),
  template_id: z.string().optional(),
  sections: z.array(z.any()).optional() // For default template sections
})

type CreateReportBody = z.infer<typeof CreateReportBodySchema>

// Database helpers with type safety
const reportsDb = createTableHelpers('reports')

// GET /api/reports - Fetch all reports for authenticated user
export const GET = createEnhancedApiHandler({
  requireAuth: true,
  allowedMethods: ['GET']
})(async ({ supabase, user }) => {
  const { data: reports, error } = await reportsDb.buildSelectQuery(supabase, user.id)

  if (error) {
    console.error('Error fetching reports:', error)
    throw new Error('Failed to fetch reports')
  }

  return api.ok(reports, 'Reports fetched successfully')
})

// POST /api/reports - Create new report with type-safe validation
export const POST = createEnhancedApiHandler<CreateReportBody>({
  requireAuth: true,
  bodySchema: CreateReportBodySchema,
  allowedMethods: ['POST']
})(async ({ supabase, user }, body) => {
  const { title, studentId, type, template_id, sections: providedSections } = body!

  // Build sections from template or use provided sections
  let sections: ReportSection[]

  if (providedSections) {
    sections = providedSections
  } else if (template_id) {
    sections = await buildSectionsFromTemplate(supabase, template_id)
  } else {
    sections = Object.values(DEFAULT_SECTIONS)
  }

  // Create report data with type safety
  const reportData = {
    id: uuidv4(),
    studentId,
    title,
    type,
    templateId: template_id || 'default',
    status: 'draft' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: sections.map((section: ReportSection) => ({
      ...section,
      id: uuidv4(),
      content: section.content || '',
      lastUpdated: new Date().toISOString(),
    })),
  }

  // Validate with Zod schema
  const validation = ReportSchema.safeParse(reportData)
  if (!validation.success) {
    console.error('Report validation failed:', validation.error.flatten())
    return api.validationError(validation.error)
  }

  // Insert into database using type-safe helper
  const { data: createdReport, error } = await reportsDb.buildInsertQuery(
    supabase,
    {
      id: validation.data.id,
      template_id: validation.data.templateId === 'default' ? null : validation.data.templateId,
      title: validation.data.title,
      type: validation.data.type,
      status: validation.data.status,
      student_id: validation.data.studentId,
      evaluator_id: validation.data.evaluatorId,
      created_at: validation.data.createdAt,
      updated_at: validation.data.updatedAt,
      sections: validation.data.sections,
      tags: validation.data.tags,
      finalized_date: validation.data.finalizedDate,
      print_version: validation.data.printVersion,
      related_assessment_ids: validation.data.relatedAssessmentIds,
      related_eligibility_ids: validation.data.relatedEligibilityIds,
    },
    user.id
  )

  if (error) {
    console.error('Database insert error:', error)
    throw new Error('Failed to create report')
  }

  return api.created(createdReport, 'Report created successfully')
})

// Helper function to build sections from template with type safety
async function buildSectionsFromTemplate(
  supabase: any, 
  templateId: string
): Promise<ReportSection[]> {
  // Fetch template with type-safe query
  const { data: templateData, error: templateError } = await supabase
    .from('report_templates')
    .select('template_structure, name')
    .eq('id', templateId)
    .single()

  if (templateError || !templateData) {
    console.warn(`Template ${templateId} not found, using default sections`)
    return Object.values(DEFAULT_SECTIONS)
  }

  // Fetch section types
  const { data: sectionTypes } = await supabase
    .from('report_section_types')
    .select('*')

  if (!sectionTypes) {
    console.warn('No section types found, using default sections')
    return Object.values(DEFAULT_SECTIONS)
  }

  // Type-safe section type mapping
  const sectionTypeMap = new Map<string, any>()
  sectionTypes.forEach((st: any) => {
    sectionTypeMap.set(st.id, st)
  })

  const sections: ReportSection[] = []

  // Convert template structure to sections with type safety
  if (Array.isArray(templateData.template_structure)) {
    templateData.template_structure.forEach((group: any, groupIndex: number) => {
      if (Array.isArray(group.sectionTypeIds)) {
        group.sectionTypeIds.forEach((sectionTypeId: string, sectionIndex: number) => {
          const sectionType = sectionTypeMap.get(sectionTypeId)
          if (sectionType) {
            sections.push({
              id: sectionTypeId,
              sectionType: sectionType.name,
              title: sectionType.default_title,
              content: '',
              order: (groupIndex * 100) + sectionIndex,
              isRequired: true,
              isGenerated: false
            })
          }
        })
      }
    })
  }

  // Fallback to default if no sections were created
  return sections.length > 0 ? sections : Object.values(DEFAULT_SECTIONS)
}