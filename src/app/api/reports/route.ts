import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const reportId = url.searchParams.get('id'); // optional specific report

  const cookieStore = await import('next/headers').then(m => m.cookies());

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const supabase = await createClient(cookieStore);

  // If reportId is provided, fetch a single report
  if (reportId) {
    const { data, error } = await supabase
      .from('speech_language_reports')
      .select('*') // Return full row
      .eq('id', reportId)
      .eq('user_id', userId)
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
    .eq('user_id', userId);

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