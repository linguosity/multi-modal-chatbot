import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth");
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-card border-r">
        <div className="p-6">
          <h2 className="text-xl font-bold">Linguosity</h2>
        </div>
        <nav className="px-4">
          <ul>
            <li>
              <a href="/dashboard" className="block px-4 py-2 rounded-md hover:bg-accent">
                Dashboard
              </a>
            </li>
            <li>
              <a href="/dashboard/reports" className="block px-4 py-2 rounded-md hover:bg-accent">
                Reports
              </a>
            </li>
            {/* Future apps will be added here */}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between p-4 border-b">
          <div>{/* Can add breadcrumbs or page title here */}</div>
          <div>{/* User menu can go here */}</div>
        </header>
        {children}
      </main>
    </div>
  );
}
