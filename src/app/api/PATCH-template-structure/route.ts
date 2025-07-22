
import { NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/supabase/route-handler-client';

// This is a temporary route to fix a specific data issue.
// It will update a report template with a default structure.

export async function POST(request: Request) {
  const supabase = await createRouteSupabase();
  const { templateId } = await request.json();

  if (!templateId) {
    return new NextResponse(JSON.stringify({ error: 'Template ID is required' }), { status: 400 });
  }

  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) {
  //   return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  // }

  // Define a default structure.
  // This is based on the hardcoded groups for the seed report, which is a sensible default.
  const defaultStructure = [
    {
      "title": "Initial Information & Background",
      "sectionTypeIds": ["4f239c6d-0159-4948-b329-3e8533240842", "d5774822-5e22-4848-abec-b373262e45b2", "f7adb4fd-5ef5-452d-952e-17c8836acffc", "3a3cad1e-649f-4290-b571-76494c2658b6"]
    },
    {
      "title": "Assessment Findings",
      "sectionTypeIds": ["70c41d89-5424-4e46-8b0e-a65e09b0969d", "6fa7d2cd-098f-44e9-b72c-a25c6ea9af3a", "8ae166a8-865a-4d10-91cc-7d26c2010b29", "b3abaabe-10bc-46f0-b3e6-8ae79c2ab27d"]
    },
    {
      "title": "Summary, Eligibility & Recommendations",
      "sectionTypeIds": ["ebddbf13-a2ec-49c1-a7bf-9219e70aa5eb", "0f9151a0-b53b-4f38-8389-fc61f3064221", "419b69a9-6308-4007-8611-4b25bef866d5", "ef3f9ea7-a16d-437a-b695-f1f732176609"]
    }
  ];

  // Update the template in the database
  const { data, error } = await supabase
    .from('report_templates')
    .update({ template_structure: defaultStructure })
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    console.error('Error updating template:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to update template', details: error }), { status: 500 });
  }

  return NextResponse.json({ message: "Template updated successfully", updatedTemplate: data });
}
