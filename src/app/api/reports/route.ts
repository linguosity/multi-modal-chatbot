import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client';
import { DEFAULT_SECTIONS, ReportSection } from '@/lib/schemas/report'
import { v4 as uuidv4 } from 'uuid'
import { safeJsonResponse } from '@/lib/api/safe-json'

export async function GET() {
  const supabase = await createRouteSupabase();

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.warn('Unauthorized attempt to fetch reports.');
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, title, type, status, student_id, created_at, updated_at, template_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error({ error }, 'Error fetching reports from Supabase.');
    return safeJsonResponse({ error: 'Failed to fetch reports' }, { status: 500 })
  }

  // Ensure clean data without circular references
  const cleanReports = reports?.map(report => ({
    id: report.id,
    title: report.title,
    type: report.type,
    status: report.status,
    studentId: report.student_id,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    templateId: report.template_id
  })) || []

  return safeJsonResponse(cleanReports)
}

export async function POST(request: Request) {
  const supabase = await createRouteSupabase();

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.warn('Unauthorized attempt to create report.');
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const json = await request.json()
  const {
    title,
    studentId,
    type,
    template_id,
    sections: providedSections,
    target_domains: providedTargetDomains,
  } = json
  console.log({ title, studentId, type, template_id, hasProvidedSections: !!providedSections }, 'POST /api/reports received body.');

  // Basic validation
  if (!title || !studentId || !type || (!template_id && !providedSections)) {
    console.warn('Missing required fields for report creation.', { title, studentId, type, template_id, hasProvidedSections: !!providedSections });
    return safeJsonResponse({ error: 'Missing required fields' }, { status: 400 })
  }

  // Resolve the report's target_domains scope. Priority:
  //   1. Explicit target_domains passed in the request body (the new-report
  //      substep sends this when the clinician edits the picker before
  //      Create). Validated against ASHA leaves so callers can't inject
  //      arbitrary strings.
  //   2. user_settings.default_domains — the profile default the user set
  //      during onboarding step 03. Copy-on-create.
  //   3. Empty array — the empty-state UI renders the school_based_pediatric
  //      preset for clinicians who skipped onboarding entirely.
  const { ASHA_LEAVES } = await import('@/lib/asha-scope')
  const ashaLeafSet = new Set<string>(ASHA_LEAVES)
  const sanitizeDomains = (input: unknown): string[] => {
    if (!Array.isArray(input)) return []
    return input.filter((d): d is string => typeof d === 'string' && ashaLeafSet.has(d))
  }
  let targetDomains = sanitizeDomains(providedTargetDomains)
  if (targetDomains.length === 0) {
    const { data: settingsRow } = await supabase
      .from('user_settings')
      .select('default_domains')
      .eq('user_id', user.id)
      .maybeSingle()
    targetDomains = sanitizeDomains((settingsRow as any)?.default_domains)
  }

  let sections: any[];

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

      // Convert template structure (groups) to flat sections array
      sections = [];
      if (templateData.template_structure && Array.isArray(templateData.template_structure)) {
        // Fetch section types to get the full section data
        const { data: sectionTypes } = await supabase
          .from('report_section_types')
          .select('*');

        const sectionTypeMap: Record<string, any> = {};
        if (sectionTypes) {
          sectionTypes.forEach((st: any) => {
            sectionTypeMap[st.id] = st;
          });
        }

        // Convert groups to flat sections array
        templateData.template_structure.forEach((group: any, groupIndex: number) => {
          if (group.sectionTypeIds && Array.isArray(group.sectionTypeIds)) {
            group.sectionTypeIds.forEach((sectionTypeId: string, sectionIndex: number) => {
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

  // Generate report ID and section IDs
  const reportId = uuidv4();
  const now = new Date().toISOString();

  // Step 1: Insert report metadata (NO sections column)
  const { data: reportData, error: reportError } = await supabase
    .from('reports')
    .insert({
      id: reportId,
      user_id: user.id,
      template_id: template_id || null,
      title,
      type,
      status: 'draft',
      student_id: studentId,
      target_domains: targetDomains,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (reportError) {
    console.error({ error: reportError }, 'Error creating report in Supabase.');
    return safeJsonResponse({ error: 'Failed to create report' }, { status: 500 })
  }

  // Step 2: Batch INSERT sections into report_sections table
  const sectionRows = sections.map((section: any, idx: number) => ({
    id: uuidv4(),
    report_id: reportId,
    section_type: section.sectionType || section.section_type || 'other',
    title: section.title || 'Untitled Section',
    order: section.order ?? idx,
    content: section.content || '',
    structured_data: section.structured_data || null,
    is_completed: false,
    is_required: section.isRequired ?? true,
    is_generated: section.isGenerated ?? false,
    created_at: now,
    updated_at: now,
  }));

  const { error: sectionsError } = await supabase
    .from('report_sections')
    .insert(sectionRows);

  if (sectionsError) {
    console.error({ error: sectionsError }, 'Error creating report sections in Supabase.');
    // Report was created but sections failed — clean up the report
    await supabase.from('reports').delete().eq('id', reportId);
    return safeJsonResponse({ error: 'Failed to create report sections' }, { status: 500 })
  }

  console.log({ reportId: reportData.id, sectionCount: sectionRows.length }, 'Successfully created report with sections.');

  // Return clean data
  const cleanData = {
    id: reportData.id,
    title: reportData.title,
    type: reportData.type,
    status: reportData.status,
    studentId: reportData.student_id,
    createdAt: reportData.created_at,
    updatedAt: reportData.updated_at,
    templateId: reportData.template_id
  }

  return safeJsonResponse(cleanData)
}
