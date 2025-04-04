'use client';

import { FileText, Globe, Mic, Lightbulb, ChevronRight } from "lucide-react";
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useReports, ReportsProvider } from "@/components/contexts/reports-context";
import { StoriesProvider } from "@/components/contexts/stories-context";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarInset, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SearchForm } from "@/components/search-form";
import { cn } from "@/lib/utils";
import * as React from "react";

// App suite navigation items
const appSuiteItems = [
  {
    id: 'reports',
    name: 'Reports',
    href: '/dashboard/user1/reports', // Using user1 as temporary user ID
    icon: FileText,
    color: '#6C8578', // sage green
  },
  {
    id: 'lists',
    name: 'Word Lists',
    href: '/dashboard/user1/lists', // Using user1 as temporary user ID
    icon: Mic,
    color: '#C45336', // burnt sienna
  },
  {
    id: 'stories',
    name: 'Stories',
    href: '/dashboard/user1/stories', // Using user1 as temporary user ID
    icon: Lightbulb,
    color: '#A87C39', // warm gold
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    href: '/polyglot',
    icon: Globe,
    color: '#785F73', // muted plum
    comingSoon: true
  },
  {
    id: 'narratively',
    name: 'Narratively',
    href: '/dashboard/narratively',
    icon: Lightbulb,
    color: '#A87C39', // warm gold
  }
];

// Report Section Navigation component that uses the reports context
function ReportSectionNavigation() {
  const { sectionGroups } = useReports();
  
  return (
    <>
      <hr className="my-4" />
      {sectionGroups.map((group, index) => (
        <SidebarGroup key={index}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarMenu>
          
            {group.items?.map((item, itemIndex) => (
              <SidebarMenuItem key={itemIndex}>
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                >
                  <a 
                    href={item.url} 
                    className="flex items-center gap-3"
                  >
                    <span className="font-medium text-sm">
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  // Determine the current app
  const currentApp = appSuiteItems.find(app => {
    // Special case for reports, lists, and stories which now use a dynamic route with userId
    if (app.id === 'reports') {
      return pathname.includes('/dashboard/') && pathname.includes('/reports');
    }
    if (app.id === 'lists') {
      return pathname.includes('/dashboard/') && pathname.includes('/lists');
    }
    if (app.id === 'stories') {
      return pathname.includes('/dashboard/') && pathname.includes('/stories');
    }
    return pathname === app.href || pathname.startsWith(`${app.href}/`);
  })?.id;
  
  return (
    <ReportsProvider>
      <StoriesProvider>
        <div className="flex min-h-screen">
          <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                      <img src="/linguosity_logo.jpg" alt="Linguosity Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">Linguosity</span>
                      <span className="">Speech & Language Suite</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SearchForm />
          </SidebarHeader>
          
          <SidebarContent>
            {/* App Suite Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Linguosity Suite</SidebarGroupLabel>
              <SidebarMenu>
                {appSuiteItems.map((app) => {
                  const isActive = app.id === currentApp;
                  
                  return (
                    <SidebarMenuItem key={app.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                      >
                        <Link
                          href={app.comingSoon ? '#' : app.href}
                          className="flex items-center gap-3 group relative"
                        >
                          <div className={cn(
                            "flex-shrink-0 h-5 w-5 rounded-md flex items-center justify-center",
                            `text-[${app.color}]`
                          )}>
                            {React.createElement(app.icon, { 
                              size: 16,
                              className: isActive ? "text-current" : "text-current opacity-75"
                            })}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-sm">
                              {app.name}
                              
                            </span>
                          </div>
                          {!app.comingSoon && (
                            <ChevronRight 
                              className={cn(
                                "h-3.5 w-3.5 opacity-0 group-hover:opacity-70 transition-opacity",
                                isActive && "opacity-70"
                              )}
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
            
            {/* Report Section Navigation - Only show when viewing a specific report */}
            {pathname.includes('/reports/') && pathname.split('/').length > 4 && (
              <ReportSectionNavigation />
            )}
          </SidebarContent>
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