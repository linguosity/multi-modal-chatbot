// src/app/dashboard/page.tsx
'use server';

import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/supabase/server';
import type { Database } from '@/types/supabaseTypes';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
// Import icons directly for server component
import { FileText, Globe, Mic, Plus } from "lucide-react";

export default async function DashboardPage() {
  // Get the cookie store
  const cookieStore = await cookies();
  
  // Use our helper function that checks both getUser and getSession
  // This will redirect to /auth if the user is not authenticated
  const user = await requireAuth(cookieStore);

    // --- Render actual page content ONLY if authenticated and not loading ---
    return (
        <div className="container mx-auto py-6 px-4 md:px-6">
            <header className="mb-6">
                <h1 className="text-3xl font-display font-medium mb-2">Welcome to Linguosity</h1>
                <p className="text-muted-foreground max-w-3xl">
                    AI-powered tools for speech-language professionals to create reports, assessment resources,
                    and educational materials.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Reports card */}
                <Link
                    href="/dashboard/reports"
                    className="block group"
                >
                    <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm h-full hover:shadow-md transition-shadow duration-200 ease-in-out">
                        <h2 className="font-semibold text-xl mb-2 group-hover:text-primary">Reports</h2>
                        <p className="text-muted-foreground mb-4">
                            Write and edit speech-language reports with AI assistance.
                        </p>
                        <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                            <FileText className="w-10 h-10 text-primary/60 transition-transform duration-200 ease-in-out group-hover:scale-110" />
                        </div>
                    </div>
                </Link>

                {/* Polyglot card */}
                <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm h-full opacity-60 cursor-not-allowed">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="font-semibold text-xl">Polyglot</h2>
                        <span className="text-xs font-medium py-0.5 px-1.5 bg-muted text-muted-foreground rounded">
                            Coming Soon
                        </span>
                    </div>
                    <p className="text-muted-foreground mb-4">
                        Multilingual assessment and translation resources.
                    </p>
                    <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center">
                        <Globe className="w-10 h-10 text-primary/40" />
                    </div>
                </div>

                {/* Listophonic card */}
                <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm h-full opacity-60 cursor-not-allowed">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="font-semibold text-xl">Listophonic</h2>
                         <span className="text-xs font-medium py-0.5 px-1.5 bg-muted text-muted-foreground rounded">
                            Coming Soon
                        </span>
                    </div>
                    <p className="text-muted-foreground mb-4">
                        Auditory processing and listening skills tools.
                    </p>
                    <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center">
                        <Mic className="w-10 h-10 text-primary/40" />
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-medium mb-4">Recent Activity</h2>
                <div className="border rounded-lg p-6 bg-card text-center">
                    <p className="text-muted-foreground">Create your first report to see activity here</p>
                    <Link href="/dashboard/reports/new">
                        <Button className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Create a Report
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}