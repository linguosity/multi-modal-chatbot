import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth");
  }

  // Fetch all reports for this user
  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, title, type, status, student_id, student_name, metadata, created_at, updated_at, finalized_date"
    )
    .eq("user_id", data.user.id)
    .order("updated_at", { ascending: false });

  type ReportRow = {
    id: string;
    title: string;
    type: string;
    status: string;
    student_id: string | null;
    student_name: string | null;
    metadata: any;
    created_at: string;
    updated_at: string;
    finalized_date: string | null;
  };

  const allReports: ReportRow[] = (reports ?? []) as ReportRow[];

  // Fetch section counts per report in a single query
  const reportIds = allReports.map((r) => r.id);
  const sectionCounts: Record<string, number> = {};
  if (reportIds.length > 0) {
    const { data: sections } = await supabase
      .from("report_sections")
      .select("report_id")
      .in("report_id", reportIds);

    if (sections) {
      for (const s of sections) {
        sectionCounts[s.report_id] = (sectionCounts[s.report_id] || 0) + 1;
      }
    }
  }

  return (
    <DashboardContent
      reports={allReports}
      sectionCounts={sectionCounts}
    />
  );
}
