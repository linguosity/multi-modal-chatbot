import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReportTemplateSchema } from '@/lib/schemas/report-template';

export async function GET(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: templates, error } = await supabase
    .from('report_templates')
    .select('id, name, description, created_at, updated_at, template_structure')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching report templates:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch report templates' }), { status: 500 });
  }

  // Validate fetched data against schema (optional but good practice)
  const parsedTemplates = templates.map(template => {
    const result = ReportTemplateSchema.safeParse({
      ...template,
      groups: template.template_structure, // Map template_structure from DB to groups
      user_id: user.id // Add user_id for validation
    });
    if (!result.success) {
      console.error('Validation error for template:', result.error);
      // You might want to filter out invalid templates or handle this differently
      return null; 
    }
    return result.data;
  }).filter(Boolean);

  return NextResponse.json(parsedTemplates);
}

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  console.log('POST /api/report-templates received body:', body);

  const result = ReportTemplateSchema.safeParse({ ...body, user_id: user.id });

  if (!result.success) {
    console.error('Validation error for new template:', result.error);
    return new NextResponse(JSON.stringify({ error: 'Invalid template data', details: result.error.flatten() }), { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from('report_templates')
    .insert({
      name: result.data.name,
      description: result.data.description,
      template_structure: result.data.groups, // Store the groups array as JSONB
      user_id: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Supabase insert error for report template:', insertError);
    return new NextResponse(JSON.stringify({ error: 'Failed to create report template in DB', details: insertError.message }), { status: 500 });
  }

  console.log('Successfully inserted template into Supabase:', data);

  // Re-parse the data from DB to ensure it matches the schema, especially with DB defaults
  const createdTemplate = ReportTemplateSchema.safeParse({ 
    ...data,
    groups: data.template_structure, // Map template_structure from DB to groups
    user_id: user.id // Add user_id for validation
  });

  if (!createdTemplate.success) {
    console.error('Validation error for created template from DB:', createdTemplate.error);
    return new NextResponse(JSON.stringify({ error: 'Failed to validate created template' }), { status: 500 });
  }

  return NextResponse.json(createdTemplate.data, { status: 201 });
}