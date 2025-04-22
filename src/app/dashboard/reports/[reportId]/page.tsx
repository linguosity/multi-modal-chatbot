'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient, requireAuth } from '@/lib/supabase/server';
import type { Database } from '@/types/supabaseTypes';
import React from 'react';
import ReportEditor from '@/components/reports/ReportEditor';

export default async function ReportDetailPage({
  params,
}: {
  params: { reportId: string };
}) {
  const reportId = params.reportId;
  
  // Use our helper function that checks both authentication methods
  // This will automatically redirect to /auth if not logged in
  const cookieStore = await cookies();
  const user = await requireAuth(cookieStore);
  
  // If we made it here, we're authenticated
  const supabase = await createClient(cookieStore);
  
  // 3. Check if this is a new report
  if (reportId === 'new') {
    // For client component rendering with isNewReport prop
    return (
      <div className="report-editor-container">
        <ReportEditor reportId="new" />
      </div>
    );
  }
  
  // 4. Fetch the specific report & verify it belongs to this user
  const { data: report, error: fetchError } = await supabase
    .from('speech_language_reports')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single();
  
  if (fetchError || !report) {
    // Handle missing report or unauthorized access
    console.error('Error fetching report:', fetchError?.message || 'Report not found');
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
        <p className="mb-6">The report you're looking for doesn't exist or you don't have permission to view it.</p>
        <a href="/dashboard/reports" className="text-blue-500 hover:underline">
          Return to Reports
        </a>
      </div>
    );
  }
  
  // 5. Render the client component with the report data
  return (
    <div className="report-editor-container">
      <ReportEditor reportId={reportId} />
    </div>
  );
}