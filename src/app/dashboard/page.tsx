import { SignOutButton } from "@/components/ui/SignOutButton";
import { createServerSupabase } from "@/lib/supabase/server";
import { MigrationPanel } from "@/components/MigrationPanel";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  console.log('Rendering DashboardPage');
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
        <SignOutButton />
      </div>
      <p className="text-muted-foreground">
        This is where you will manage your reports and other tools.
      </p>

      {/* Migration Panel */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">System Update</h2>
        <MigrationPanel />
      </div>
    </div>
  );
}
