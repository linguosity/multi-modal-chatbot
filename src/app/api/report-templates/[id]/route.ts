import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReportTemplateSchema } from '@/lib/schemas/report-template';
import logger from '@/lib/logger';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    logger.warn('Unauthorized attempt to fetch report template by ID.');
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: template, error } = await supabase
    .from('report_templates')
    .select('id, name, description, created_at, updated_at, template_structure')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !template) {
    logger.error({ error, templateId: id }, 'Error fetching report template by ID.');
    return new NextResponse(JSON.stringify({ error: 'Report template not found or unauthorized' }), { status: 404 });
  }

  const parsedTemplate = ReportTemplateSchema.safeParse({
    ...template,
    groups: template.template_structure, // Map template_structure from DB to groups
    user_id: user.id // Add user_id for validation
  });

  if (!parsedTemplate.success) {
    logger.error({ validationError: parsedTemplate.error, templateId: id }, 'Validation error for fetched template by ID.');
    return new NextResponse(JSON.stringify({ error: 'Failed to validate fetched template' }), { status: 500 });
  }

  return NextResponse.json(parsedTemplate.data);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    logger.warn('Unauthorized attempt to update report template.');
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  logger.info({ body, templateId: id }, 'PUT /api/report-templates/[id] received body.');

  const result = ReportTemplateSchema.safeParse({ ...body, id, user_id: user.id });

  if (!result.success) {
    logger.error({ validationError: result.error, templateId: id }, 'Validation error for updating template.');
    return new NextResponse(JSON.stringify({ error: 'Invalid template data', details: result.error.flatten() }), { status: 400 });
  }

  const { data, error } = await supabase
    .from('report_templates')
    .update({
      name: result.data.name,
      description: result.data.description,
      template_structure: result.data.groups, // Store the groups array as JSONB
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only update their own templates
    .select()
    .single();

  logger.info({ templateId: id, userId: user.id }, "Attempting to update template.");
  logger.info({ updatePayload: { name: result.data.name, description: result.data.description, template_structure: result.data.groups } }, "Update payload:");

  if (error || !data) {
    logger.error({ error, templateId: id }, 'Error updating report template.');
    return new NextResponse(JSON.stringify({ error: 'Failed to update report template or not found' }), { status: 500 });
  }

  const updatedTemplate = ReportTemplateSchema.safeParse({ 
    ...data,
    groups: data.template_structure, // Map template_structure from DB to groups
    user_id: user.id // Add user_id for validation
  });

  if (!updatedTemplate.success) {
    logger.error({ validationError: updatedTemplate.error, templateData: data }, 'Validation error for updated template from DB.');
    return new NextResponse(JSON.stringify({ error: 'Failed to validate updated template' }), { status: 500 });
  }

  return NextResponse.json(updatedTemplate.data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    logger.warn('Unauthorized attempt to delete report template.');
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { error } = await supabase
    .from('report_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure user can only delete their own templates

  if (error) {
    logger.error({ error, templateId: id }, 'Error deleting report template.');
    return new NextResponse(JSON.stringify({ error: 'Failed to delete report template' }), { status: 500 });
  }

  logger.info({ templateId: id }, 'Successfully deleted report template.');
  return new NextResponse(null, { status: 204 });
}
