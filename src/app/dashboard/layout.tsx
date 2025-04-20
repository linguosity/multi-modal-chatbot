// src/app/dashboard/layout.tsx
'use client';

// --- Make sure ALL necessary imports are present ---
import React, { useEffect } from 'react';
import { FileText, Globe, Mic, Lightbulb, ChevronRight } from "lucide-react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // <<< Need useRouter
import { useReports, ReportsProvider } from "@/components/contexts/reports-context";
import { StoriesProvider } from "@/components/contexts/stories-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter, // <<< Keep SidebarFooter
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { SearchForm } from "@/components/search-form";
import { useAuth } from '@/components/auth/auth-provider'; // <<< Keep useAuth
import { NavUser } from "@/components/auth/NavUser"; // <<< Keep NavUser
import { Icons } from '@/components/ui/icons'; // <<< Need Icons for spinner
import { cn } from "@/lib/utils";
// --- End Imports ---

// --- ReportSectionNavigation: Remove Auth Check ---
// This component should assume it only renders when user is authenticated
function ReportSectionNavigation() {
  const { sectionGroups } = useReports();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // REMOVED: No need for useAuth or loading check here - layout handles it
  // const { user, isLoading } = useAuth();
  // if (isLoading || !user) { return <DashboardLoading />; }

  return (
    <>
      <hr className="my-4" />
      {/* ... rest of ReportSectionNavigation JSX (unchanged) ... */}
       {sectionGroups.map((group, index) => (
        <SidebarGroup key={group.title || index}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items?.map((item) => (
              <SidebarMenuItem key={item.url || item.title}>
                <SidebarMenuButton /* ...props... */ >
                  <a href={item.url} className={cn("flex items-center w-full")}>
                    {isCollapsed ? item.collapsedIcon : item.icon }
                     <span className="font-medium text-sm truncate ml-2 group-data-[collapsible=icon]:hidden">
                       {item.title}
                     </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}

// --- Loading Component Definition ---
function DashboardLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}


// --- Main DashboardLayout Component ---
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter(); // <<< Need router for redirect
  const { user, isLoading } = useAuth(); // <<< Fetch user state HERE

  // --- Client-side Redirect Fallback ---
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth'); // Redirect if not authenticated after load
    }
  }, [user, isLoading, router]);

  // --- Loading State Check ---
  // Return loader BEFORE rendering the main layout if still loading or no user
  if (isLoading || !user) {
    return <DashboardLoading />;
  }

  // --- Determine Current App (logic unchanged) ---
   const currentApp = appSuiteItems.find(app => {
      if (app.id === 'reports') return pathname.includes('/dashboard/') && pathname.includes('/reports');
      if (app.id === 'lists') return pathname.includes('/dashboard/') && pathname.includes('/lists');
      if (app.id === 'stories') return pathname.includes('/dashboard/') && pathname.includes('/stories');
      return pathname === app.href || pathname.startsWith(`${app.href}/`);
    })?.id;

  // --- Render the actual layout for authenticated users ---
  return (
    <ReportsProvider>
      <StoriesProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader>
              {/* ... Header Content ... */}
               <SidebarMenu>
                 <SidebarMenuItem>
                   <SidebarMenuButton size="lg" asChild>
                     <Link href="/">
                       <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                         <img src="/linguosity_logo.jpg" alt="Linguosity Logo" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex flex-col gap-0.5 leading-none">
                         <span className="font-semibold">Linguosity</span>
                       </div>
                     </Link>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               </SidebarMenu>
              <SearchForm />
            </SidebarHeader>

            <SidebarContent>
              {/* ... App Suite Navigation ... */}
                <SidebarGroup>
                    <SidebarGroupLabel>Linguosity Suite</SidebarGroupLabel>
                    <SidebarMenu>
                         {appSuiteItems.map((app) => {
                             const isActive = app.id === currentApp;
                             return (
                                 <SidebarMenuItem key={app.id}>
                                     {/* ... SidebarMenuButton with Link ... */}
                                      <SidebarMenuButton asChild isActive={isActive}>
                                        <Link href={app.comingSoon ? '#' : app.href} className="flex items-center gap-3 group relative">
                                            <div className={cn("flex-shrink-0 h-5 w-5 rounded-md flex items-center justify-center")}>
                                                {React.createElement(app.icon, { size: 16, className: isActive ? "text-current" : "text-current opacity-75"})}
                                            </div>
                                            <div className="flex-1"><span className="font-medium text-sm">{app.name}</span></div>
                                            {!app.comingSoon && <ChevronRight className={cn("h-3.5 w-3.5 opacity-0 group-hover:opacity-70 transition-opacity", isActive && "opacity-70")}/>}
                                        </Link>
                                      </SidebarMenuButton>
                                 </SidebarMenuItem>
                             );
                         })}
                    </SidebarMenu>
                </SidebarGroup>
              {/* ... Report Navigation ... */}
               {pathname.includes('/reports/') && pathname.split('/').length > 4 && (
                 <ReportSectionNavigation />
               )}
            </SidebarContent>

            {/* --- SidebarFooter with NavUser --- */}
            <SidebarFooter>
               {/* Now 'user' is defined and passed correctly */}
               <NavUser user={user} />
            </SidebarFooter>
            {/* --- End SidebarFooter --- */}

            <SidebarRail />
          </Sidebar>

          <SidebarInset>
            <div className="flex flex-col h-full">
              <div className="relative flex-1 overflow-auto">
                {children}
              </div>
            </div>
          </SidebarInset>
        </div>
      </StoriesProvider>
    </ReportsProvider>
  );
}

// --- Placeholder Data (Ensure this matches reality) ---
const appSuiteItems = [
  { id: 'reports', name: 'Reports', href: '/dashboard/user1/reports', icon: FileText, color: '#6C8578' },
  { id: 'lists', name: 'Word Lists', href: '/dashboard/user1/lists', icon: Mic, color: '#C45336' },
  { id: 'stories', name: 'Stories', href: '/dashboard/user1/stories', icon: Lightbulb, color: '#A87C39' },
  { id: 'polyglot', name: 'Polyglot', href: '/polyglot', icon: Globe, color: '#785F73', comingSoon: true },
  { id: 'narratively', name: 'Narratively', href: '/dashboard/narratively', icon: Lightbulb, color: '#A87C39' }
];