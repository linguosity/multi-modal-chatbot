'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Database } from '@/types/supabaseTypes';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler-client'; 
import Link from 'next/link';

// Import only server-compatible components
import { Plus } from "lucide-react";

export default async function ReportsPage() {
  // Use the route handler client
  const supabase = await createRouteHandlerClient();
  
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) redirect('/auth');
  
  // Fetch user's reports directly from Supabase
  const { data: reports, error: rptErr } = await supabase
    .from('speech_language_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  
  if (rptErr) {
    console.error('Error fetching reports:', rptErr);
  }
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium mb-2">Reports</h1>
          <p className="text-muted-foreground">
            Manage and create your speech-language assessment reports.
          </p>
        </div>
        
        <Link href="/dashboard/reports/new">
          <button className="px-4 py-2 bg-primary text-white rounded flex items-center gap-2 hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Report
          </button>
        </Link>
      </header>
      
      {/* Reports List */}
      <div className="space-y-4">
        {reports && reports.length > 0 ? (
          reports.map((report) => (
            <Link href={`/dashboard/reports/${report.id}`} key={report.id} className="block">
              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {report.report?.header?.studentInformation?.firstName} {report.report?.header?.studentInformation?.lastName || 'Untitled Report'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Last updated: {new Date(report.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                    {report.report?.metadata?.version || 1}.0
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="border rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">You haven't created any reports yet.</p>
            <Link href="/dashboard/reports/new">
              <button className="px-4 py-2 bg-primary text-white rounded inline-flex items-center gap-2 hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                Create Your First Report
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}