import { SignOutButton } from "@/components/ui/SignOutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MigrationPanel } from "@/components/MigrationPanel";
import { ReportTimeline } from "@/components/ReportTimeline";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Users, Clock } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  console.log('Rendering DashboardPage');
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth");
  }

  // Get some basic stats
  const { data: reports } = await supabase
    .from('reports')
    .select('id, status, created_at')
    .order('created_at', { ascending: false });

  const totalReports = reports?.length || 0;
  const completedReports = reports?.filter(r => r.status === 'completed').length || 0;
  const inProgressReports = reports?.filter(r => r.status === 'in_progress').length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your speech-language evaluation reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Timeline */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <ReportTimeline />
      </div>

      {/* Migration Panel - Only show if needed */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">System Updates</h2>
        <MigrationPanel />
      </div>
    </div>
  );
}
