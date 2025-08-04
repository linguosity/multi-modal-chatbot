import { createApiHandler, createApiResponse } from '@/lib/api/base-handler';
import { BaseCrudService } from '@/lib/api/base-crud-service';
import { ReportTemplateSchema } from '@/lib/schemas/report-template';

export const GET = createApiHandler({
  requireAuth: true,
  allowedMethods: ['GET']
})(async ({ supabase, user }) => {
  const crudService = new BaseCrudService(supabase, user, {
    tableName: 'report_templates',
    userIdField: 'user_id',
    selectFields: 'id, name, description, created_at, updated_at, template_structure'
  });

  const templates = await crudService.findAll();

  // Transform and validate data
  const parsedTemplates = templates.map(template => {
    const result = ReportTemplateSchema.safeParse({
      ...template,
      groups: template.template_structure, // Map template_structure from DB to groups
      user_id: user.id // Add user_id for validation
    });
    
    if (!result.success) {
      console.error({ validationError: result.error, templateId: template.id }, 'Validation error for fetched template.');
      return null; 
    }
    return result.data;
  }).filter(Boolean);

  return createApiResponse(parsedTemplates, 'Templates fetched successfully');
});

export const POST = createApiHandler({
  requireAuth: true,
  validateSchema: ReportTemplateSchema,
  allowedMethods: ['POST']
})(async ({ supabase, user }, body) => {
  const crudService = new BaseCrudService(supabase, user, {
    tableName: 'report_templates',
    userIdField: 'user_id'
  });

  const templateData = await crudService.create({
    name: body.name,
    description: body.description,
    template_structure: body.groups, // Store the groups array as JSONB
  });

  // Transform response to match schema
  const createdTemplate = {
    ...templateData,
    groups: templateData.template_structure, // Map template_structure from DB to groups
    user_id: user.id
  };

  return createApiResponse(createdTemplate, 'Template created successfully', 201);
});