import { SignOutButton } from "@/components/ui/SignOutButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth");
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
        <SignOutButton />
      </div>
      <p className="mt-2 text-muted-foreground">
        This is where you will manage your reports and other tools.
      </p>
    </div>
  );
}
