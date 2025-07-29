import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client';
import { ReportSchema, DEFAULT_SECTIONS, ReportSection } from '@/lib/schemas/report'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const supabase = await createRouteSupabase();

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.warn('Unauthorized attempt to fetch reports.');
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error({ error }, 'Error fetching reports from Supabase.');
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch reports' }), { status: 500 })
  }

  return NextResponse.json(reports)
}

export async function POST(request: Request) {
  const supabase = await createRouteSupabase();

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.warn('Unauthorized attempt to create report.');
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const json = await request.json()
  const { title, studentId, type, template_id, sections: providedSections } = json
  console.log({ title, studentId, type, template_id, hasProvidedSections: !!providedSections }, 'POST /api/reports received body.');

  // Basic validation
  if (!title || !studentId || !type || (!template_id && !providedSections)) {
    console.warn('Missing required fields for report creation.', { title, studentId, type, template_id, hasProvidedSections: !!providedSections });
    return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
  }

  let sections;
  
  if (providedSections) {
    // Use provided sections (from default template)
    console.log('✅ Using provided sections from default template');
    sections = providedSections;
  } else if (template_id) {
    // Fetch the template to get the structure
    const { data: templateData, error: templateError } = await supabase
      .from('report_templates')
      .select('template_structure, name')
      .eq('id', template_id)
      .single();

    if (templateError || !templateData) {
      console.error({ templateError }, `Template with id ${template_id} not found.`);
      // Fallback to default sections if template not found
      sections = Object.values(DEFAULT_SECTIONS);
    } else {
      console.log('✅ Found template:', templateData.name);
      console.log('📋 Template structure:', templateData.template_structure);
      
      // Convert template structure (groups) to flat sections array
      sections = [];
      if (templateData.template_structure && Array.isArray(templateData.template_structure)) {
        // Fetch section types to get the full section data
        const { data: sectionTypes } = await supabase
          .from('report_section_types')
          .select('*');
        
        const sectionTypeMap = {};
        if (sectionTypes) {
          sectionTypes.forEach(st => {
            sectionTypeMap[st.id] = st;
          });
        }
        
        // Convert groups to flat sections array
        templateData.template_structure.forEach((group, groupIndex) => {
          if (group.sectionTypeIds && Array.isArray(group.sectionTypeIds)) {
            group.sectionTypeIds.forEach((sectionTypeId, sectionIndex) => {
              const sectionType = sectionTypeMap[sectionTypeId];
              if (sectionType) {
                sections.push({
                  id: sectionTypeId,
                  sectionType: sectionType.name,
                  title: sectionType.default_title,
                  content: '', // Empty content for new reports
                  order: (groupIndex * 100) + sectionIndex, // Maintain order
                  isRequired: true,
                  isGenerated: false
                });
              }
            });
          }
        });
      }
      
      // Fallback to default if conversion failed
      if (sections.length === 0) {
        console.warn('⚠️ Template structure conversion failed, using default sections');
        sections = Object.values(DEFAULT_SECTIONS);
      }
    }
  } else {
    // Fallback to default sections
    sections = Object.values(DEFAULT_SECTIONS);
  }

  const newReportData = {
    id: uuidv4(),
    studentId: studentId,
    title,
    type,
    templateId: template_id || 'default',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: sections.map((section: ReportSection) => ({
      ...section,
      id: uuidv4(), // Give each section a unique ID
      content: section.content || '', // Initialize with empty content for new reports
      lastUpdated: new Date().toISOString(),
    })),
  };

  // Validate with Zod schema (optional but good practice)
  const validation = ReportSchema.safeParse(newReportData)
  if (!validation.success) {
    console.error({ validationError: validation.error }, 'Invalid report data during creation.');
    return new NextResponse(JSON.stringify({ error: 'Invalid report data', details: validation.error.flatten() }), { status: 400 })
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      id: validation.data.id,
      user_id: user.id,
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
    .select()
    .single()

  if (error) {
    console.error({ error }, 'Error creating report in Supabase.');
    return new NextResponse(JSON.stringify({ error: 'Failed to create report' }), { status: 500 })
  }

  console.log({ reportId: data.id }, 'Successfully created report.');
  return NextResponse.json(data)
}
