import { z } from 'zod'
import { createEnhancedApiHandler } from '@/lib/api/enhanced-handler'
import { api } from '@/lib/api/api-helpers'
import { createTableHelpers } from '@/lib/api/database-constants'
import { ReportTemplateSchema } from '@/lib/schemas/report-template'

// Type-safe request body schema
const CreateTemplateBodySchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  groups: z.array(z.object({
    name: z.string(),
    sectionTypeIds: z.array(z.string())
  }))
})

type CreateTemplateBody = z.infer<typeof CreateTemplateBodySchema>

// Database helpers with type safety
const templatesDb = createTableHelpers('reportTemplates')

// GET /api/report-templates - Fetch all templates for authenticated user
export const GET = createEnhancedApiHandler({
  requireAuth: true,
  allowedMethods: ['GET']
})(async ({ supabase, user }) => {
  const { data: templates, error } = await templatesDb.buildSelectQuery(supabase, user.id)

  if (error) {
    console.error('Error fetching templates:', error)
    throw new Error('Failed to fetch templates')
  }

  // Transform data to match expected schema
  const transformedTemplates = templates.map(template => ({
    ...template,
    groups: template.template_structure, // Map DB field to schema field
    user_id: user.id
  }))

  // Validate each template against schema
  const validTemplates = transformedTemplates
    .map(template => {
      const result = ReportTemplateSchema.safeParse(template)
      if (!result.success) {
        console.error('Template validation failed:', result.error.flatten())
        return null
      }
      return result.data
    })
    .filter(Boolean)

  return api.ok(validTemplates, 'Templates fetched successfully')
})

// POST /api/report-templates - Create new template with type-safe validation
export const POST = createEnhancedApiHandler<CreateTemplateBody>({
  requireAuth: true,
  bodySchema: CreateTemplateBodySchema,
  allowedMethods: ['POST']
})(async ({ supabase, user }, body) => {
  const { name, description, groups } = body!

  // Validate complete template data
  const templateData = {
    name,
    description,
    groups,
    user_id: user.id
  }

  const validation = ReportTemplateSchema.safeParse(templateData)
  if (!validation.success) {
    console.error('Template validation failed:', validation.error.flatten())
    return api.validationError(validation.error)
  }

  // Insert into database using type-safe helper
  const { data: createdTemplate, error } = await templatesDb.buildInsertQuery(
    supabase,
    {
      name: validation.data.name,
      description: validation.data.description,
      template_structure: validation.data.groups, // Map schema field to DB field
    },
    user.id
  )

  if (error) {
    console.error('Database insert error:', error)
    throw new Error('Failed to create template')
  }

  // Transform response to match schema
  const responseData = {
    ...createdTemplate,
    groups: createdTemplate.template_structure,
    user_id: user.id
  }

  // Validate response data
  const responseValidation = ReportTemplateSchema.safeParse(responseData)
  if (!responseValidation.success) {
    console.error('Response validation failed:', responseValidation.error.flatten())
    throw new Error('Failed to validate created template')
  }

  return api.created(responseValidation.data, 'Template created successfully')
})