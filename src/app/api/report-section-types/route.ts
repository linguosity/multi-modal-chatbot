import { NextResponse } from 'next/server';
import { createRouteSupabase} from '@/lib/supabase/route-handler-client';
import { ALL_REPORT_SECTION_TYPES } from '@/lib/schemas/report-template';

export async function GET() {
  const supabase = await createRouteSupabase();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Try to fetch with ai_directive, fall back if column doesn't exist
  let { data: sectionTypes, error } = await supabase
    .from('report_section_types')
    .select('id, name, default_title, description, ai_directive');

  // If ai_directive column doesn't exist, try without it
  if (error && error.message?.includes('ai_directive')) {
    console.log('ai_directive column not found, fetching without it');
    const fallbackResult = await supabase
      .from('report_section_types')
      .select('id, name, default_title, description');
    
    sectionTypes = fallbackResult.data;
    error = fallbackResult.error;
    
    // Add ai_directive as undefined to match schema
    if (sectionTypes) {
      sectionTypes = sectionTypes.map(st => ({ ...st, ai_directive: undefined }));
    }
  }

  if (error) {
    console.error('Error fetching report section types:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch report section types' }), { status: 500 });
  }

  console.log('✅ Fetched section types:', sectionTypes?.length, 'items');
  console.log('📋 Section types:', sectionTypes?.map(st => ({ id: st.id, name: st.name })));

  // Validate fetched data against schema
  const parsedSectionTypes = ALL_REPORT_SECTION_TYPES.safeParse(sectionTypes);

  if (!parsedSectionTypes.success) {
    console.error('Validation error for fetched section types:', parsedSectionTypes.error);
    return new NextResponse(JSON.stringify({ error: 'Failed to validate fetched section types' }), { status: 500 });
  }

  return NextResponse.json(parsedSectionTypes.data);
}
