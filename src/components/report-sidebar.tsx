'use client';

import React from 'react';
import { Minus, Plus } from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
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
}

export function ReportSidebar({ sections, sectionGroups }: ReportSidebarProps) {
  // Support both old and new formats
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
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {!displayGroups.length && <SidebarGroupLabel>Report Sections</SidebarGroupLabel>}
          <SidebarMenu>
            {displayGroups.map((group, index) => (
              <Collapsible key={group.title} defaultOpen={index === 0} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {group.title}
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {group.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton 
                              asChild
                              isActive={item.isActive}
                            >
                              <a 
                                href={item.url} 
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
                                {item.title}
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}