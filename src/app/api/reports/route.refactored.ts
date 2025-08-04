import { createApiHandler, createApiResponse } from '@/lib/api/base-handler'
import { BaseCrudService } from '@/lib/api/base-crud-service'
import { ReportSchema, DEFAULT_SECTIONS, ReportSection } from '@/lib/schemas/report'
import { v4 as uuidv4 } from 'uuid'

// GET /api/reports - Fetch all reports for the authenticated user
export const GET = createApiHandler({
  requireAuth: true,
  allowedMethods: ['GET']
})(async ({ supabase, user }) => {
  const crudService = new BaseCrudService(supabase, user, {
    tableName: 'reports',
    userIdField: 'user_id',
    selectFields: '*'
  })

  const reports = await crudService.findAll()
  return createApiResponse(reports, 'Reports fetched successfully')
})

// POST /api/reports - Create a new report
export const POST = createApiHandler({
  requireAuth: true,
  allowedMethods: ['POST']
})(async ({ supabase, user }, body) => {
  const { title, studentId, type, template_id, sections: providedSections } = body

  // Validation
  if (!title || !studentId || !type || (!template_id && !providedSections)) {
    throw new Error('Missing required fields: title, studentId, type, and either template_id or sections')
  }

  let sections: ReportSection[]

  if (providedSections) {
    // Use provided sections (from default template)
    sections = providedSections
  } else if (template_id) {
    sections = await buildSectionsFromTemplate(supabase, template_id)
  } else {
    // Fallback to default sections
    sections = Object.values(DEFAULT_SECTIONS)
  }

  const newReportData = {
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
  const validation = ReportSchema.safeParse(newReportData)
  if (!validation.success) {
    console.error('Invalid report data during creation:', validation.error.flatten())
    throw new Error('Invalid report data')
  }

  const crudService = new BaseCrudService(supabase, user, {
    tableName: 'reports',
    userIdField: 'user_id'
  })

  const reportData = await crudService.create({
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
  })

  return createApiResponse(reportData, 'Report created successfully', 201)
})

// Helper function to build sections from template
async function buildSectionsFromTemplate(supabase: any, templateId: string): Promise<ReportSection[]> {
  // Fetch the template
  const { data: templateData, error: templateError } = await supabase
    .from('report_templates')
    .select('template_structure, name')
    .eq('id', templateId)
    .single()

  if (templateError || !templateData) {
    console.warn(`Template with id ${templateId} not found, using default sections`)
    return Object.values(DEFAULT_SECTIONS)
  }

  // Fetch section types
  const { data: sectionTypes } = await supabase
    .from('report_section_types')
    .select('*')

  const sectionTypeMap: Record<string, any> = {}
  if (sectionTypes) {
    sectionTypes.forEach((st: any) => {
      sectionTypeMap[st.id] = st
    })
  }

  const sections: ReportSection[] = []

  // Convert template structure to sections
  if (templateData.template_structure && Array.isArray(templateData.template_structure)) {
    templateData.template_structure.forEach((group: any, groupIndex: number) => {
      if (group.sectionTypeIds && Array.isArray(group.sectionTypeIds)) {
        group.sectionTypeIds.forEach((sectionTypeId: string, sectionIndex: number) => {
          const sectionType = sectionTypeMap[sectionTypeId]
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

  // Fallback to default if conversion failed
  if (sections.length === 0) {
    console.warn('Template structure conversion failed, using default sections')
    return Object.values(DEFAULT_SECTIONS)
  }

  return sections
}