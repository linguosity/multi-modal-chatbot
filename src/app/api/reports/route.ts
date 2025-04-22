import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reportId = url.searchParams.get('id'); // optional specific report
  const userId = url.searchParams.get('userId'); // optional for backward compatibility
  
  // Initialize server-side Supabase client
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  
  // Get user ID from the session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Use authenticated user ID (or fall back to query param for backward compatibility)
  const authenticatedUserId = user.id;

  // If reportId is provided, fetch a single report
  if (reportId) {
    const { data, error } = await supabase
      .from('speech_language_reports')
      .select('*') // Return full row
      .eq('id', reportId)
      .eq('user_id', authenticatedUserId)
      .single();

    if (error) {
      console.error("Error fetching report by ID:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enhanced logging for better visibility of nested structures
    console.log("Fetched report (by ID) - Structure check:", {
      hasId: Boolean(data?.id),
      hasUserId: Boolean(data?.user_id),
      hasReport: Boolean(data?.report),
      reportType: typeof data?.report,
      reportHasHeader: Boolean(data?.report?.header),
      reportHasStudentInfo: Boolean(data?.report?.header?.studentInformation),
      studentInfoFields: data?.report?.header?.studentInformation ? 
        Object.keys(data.report.header.studentInformation) : []
    });
    
    // Full data dump for complete visibility
    console.log("Fetched report JSON:", JSON.stringify(data, null, 2));
    return NextResponse.json(data); // Return the full row, not just the report field
  }

  // Otherwise fetch all reports for the user (list view)
  const { data, error } = await supabase
    .from('speech_language_reports')
    .select('id, report')
    .eq('user_id', authenticatedUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data.map(entry => ({
    id: entry.id,
    title: entry.report?.header?.studentInformation?.fullName ?? 'Untitled',
    type: 'speech-language',
    createDate: entry.report?.metadata?.createdAt ?? '',
    updateDate: entry.report?.metadata?.lastUpdated ?? '',
    studentName: entry.report?.header?.studentInformation?.fullName ?? '',
    studentAge: entry.report?.header?.studentInformation?.age ?? ''
  }));

  return NextResponse.json(result);
}