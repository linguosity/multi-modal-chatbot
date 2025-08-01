import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createServerSupabase();

  // Check if user is authenticated
  const { data, error } = await supabase.auth.getUser();
  
  // If authenticated, redirect to dashboard
  if (!error && data?.user) {
    redirect("/dashboard");
  }

  // If not authenticated, redirect to auth page
  redirect("/auth");
}