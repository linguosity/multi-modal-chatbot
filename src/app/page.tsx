import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  // Authenticated users go straight to the dashboard.
  if (!error && data?.user) {
    redirect("/dashboard");
  }

  // Visitors see the marketing splash; they reach /auth via its "Sign in" link.
  redirect("/landing");
}