import { NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/supabase/route-handler-client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createRouteSupabase();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: template, error } = await supabase
    .from('report_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching template:', error);
    return new NextResponse(JSON.stringify({ error: 'Template not found' }), { status: 404 });
  }

  return NextResponse.json(template);
}