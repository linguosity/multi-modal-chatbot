'use client';

import React from 'react';
import { GalleryVerticalEnd, Minus, Plus, FileText, Globe, Mic, Lightbulb, ChevronRight } from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SearchForm } from "@/components/search-form";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

// Original type for backward compatibility
type ReportSection = {
  id: string;
  title: string;
  order: number;
};

// New type for collapsible sections
type ReportSectionGroup = {
  title: string;
  url?: string;
  items?: { 
    title: string;
    url: string; 
    id?: string;
    isActive?: boolean;
  }[];
};

interface ReportSidebarProps {
  sections?: ReportSection[];  // Keep for backward compatibility
  sectionGroups?: ReportSectionGroup[]; // New prop for grouped sections
  showAppNav?: boolean; // Control whether to show app navigation
}

// App suite navigation items
const appSuiteItems = [
  {
    id: 'reports',
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    color: '#6C8578', // sage green
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
    id: 'listophonic',
    name: 'Listophonic',
    href: '/listophonic',
    icon: Mic,
    color: '#C45336', // burnt sienna
    comingSoon: true
  },
  {
    id: 'narratively',
    name: 'Narratively',
    href: '/narratively',
    icon: Lightbulb,
    color: '#A87C39', // warm gold
    comingSoon: true
  }
];

export function ReportSidebar({ sections, sectionGroups, showAppNav = true }: ReportSidebarProps) {
  const pathname = usePathname();
  
  // Determine the current app
  const currentApp = appSuiteItems.find(app => 
    pathname === app.href || pathname.startsWith(`${app.href}/`)
  )?.id;
  
  // Support both old and new formats for report sections
  let displayGroups: ReportSectionGroup[] = [];
  
  if (sectionGroups && sectionGroups.length > 0) {
    // Use the new format if provided
    displayGroups = sectionGroups;
  } else if (sections && sections.length > 0) {
    // Convert old format to new format if needed
    const sortedSections = [...sections].sort((a, b) => a.order - b.order);
    displayGroups = [{
      title: "Report Sections",
      items: sortedSections.map(section => ({
        title: section.title,
        url: `#${section.id}`,
        id: section.id
      }))
    }];
  }

  // Icons for different section types (keep from original implementation)
  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'heading':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h8"/><path d="M4 18h8"/><path d="M4 6h16"/></svg>
        );
      case 'reason_for_referral':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m12 8 4 4-4 4"/><path d="M8 12h8"/></svg>
        );
      case 'family_background':
      case 'parent_concern':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        );
      case 'health_developmental_history':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/></svg>
        );
      case 'validity_statement':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        );
      case 'assessment_tools':
      case 'assessment_results':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        );
      case 'eligibility_checklist':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        );
      case 'conclusion':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        );
      case 'recommendations':
      case 'accommodations':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        );
    }
  };

  return (
    <div className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Report Sections</h3>
      </div>
      
      {/* Only show Report Sections if available */}
      {displayGroups.length > 0 && (
        <div className="p-4">
          {displayGroups.map((group, index) => (
            <div key={group.title} className="mb-4">
              <h4 className="font-medium text-sm mb-2">{group.title}</h4>
              <ul className="space-y-1">
                {group.items?.map((item) => (
                  <li key={item.title}>
                    <a 
                      href={item.url} 
                      className={cn(
                        "flex items-center text-sm px-2 py-1.5 rounded-md hover:bg-muted",
                        item.isActive && "bg-muted font-medium"
                      )}
                      onClick={(e) => {
                        if (item.url?.startsWith('#')) {
                          e.preventDefault();
                          const elementId = item.id || item.url.substring(1);
                          const element = document.getElementById(elementId);
                          if (element) {
                            element.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'start' 
                            });
                          }
                        }
                      }}
                    >
                      {item.id && getSectionIcon(item.id)}
                      <span className="ml-2">{item.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}