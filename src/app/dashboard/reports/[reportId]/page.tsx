'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabaseTypes';
import React from 'react';
import ReportEditor from '@/components/reports/ReportEditor';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  
  // Use the centralized server client wrapper
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  // If not authenticated, would normally be handled by middleware, but add a check just in case
  if (!user) {
    redirect('/auth');
  }
  
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