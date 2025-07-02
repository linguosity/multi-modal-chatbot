import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReportTemplateSchema } from '@/lib/schemas/report-template';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: template, error } = await supabase
    .from('report_templates')
    .select('id, name, description, created_at, updated_at, template_structure')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !template) {
    console.error('Error fetching report template:', error);
    return new NextResponse(JSON.stringify({ error: 'Report template not found or unauthorized' }), { status: 404 });
  }

  const parsedTemplate = ReportTemplateSchema.safeParse({
    ...template,
    template_structure: template.template_structure, // Ensure template_structure is passed correctly
    user_id: user.id // Add user_id for validation
  });

  if (!parsedTemplate.success) {
    console.error('Validation error for fetched template:', parsedTemplate.error);
    return new NextResponse(JSON.stringify({ error: 'Failed to validate fetched template' }), { status: 500 });
  }

  return NextResponse.json(parsedTemplate.data);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();

  const result = ReportTemplateSchema.safeParse({ ...body, id, user_id: user.id });

  if (!result.success) {
    console.error('Validation error for updating template:', result.error);
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

  console.log("Attempting to update template with ID:", id, "for user:", user.id);
  console.log("Update payload:", { name: result.data.name, description: result.data.description, template_structure: result.data.groups });

  if (error || !data) {
    console.error('Error updating report template:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to update report template or not found' }), { status: 500 });
  }

  const updatedTemplate = ReportTemplateSchema.safeParse({ 
    ...data,
    template_structure: data.template_structure, // Ensure template_structure is passed correctly
    user_id: user.id // Add user_id for validation
  });

  if (!updatedTemplate.success) {
    console.error('Validation error for updated template from DB:', updatedTemplate.error);
    return new NextResponse(JSON.stringify({ error: 'Failed to validate updated template' }), { status: 500 });
  }

  return NextResponse.json(updatedTemplate.data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { error } = await supabase
    .from('report_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure user can only delete their own templates

  if (error) {
    console.error('Error deleting report template:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to delete report template' }), { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
