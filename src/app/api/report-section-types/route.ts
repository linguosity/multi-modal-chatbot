import { NextResponse } from 'next/server';
import { createRouteSupabase} from '@/lib/supabase/route-handler-client';
import { ALL_REPORT_SECTION_TYPES } from '@/lib/schemas/report-template';

export async function GET(request: Request) {
  const supabase = await createRouteSupabase();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: sectionTypes, error } = await supabase
    .from('report_section_types')
    .select('id, name, default_title, description');

  if (error) {
    console.error('Error fetching report section types:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch report section types' }), { status: 500 });
  }

  // Validate fetched data against schema
  const parsedSectionTypes = ALL_REPORT_SECTION_TYPES.safeParse(sectionTypes);

  if (!parsedSectionTypes.success) {
    console.error('Validation error for fetched section types:', parsedSectionTypes.error);
    return new NextResponse(JSON.stringify({ error: 'Failed to validate fetched section types' }), { status: 500 });
  }

  return NextResponse.json(parsedSectionTypes.data);
}
