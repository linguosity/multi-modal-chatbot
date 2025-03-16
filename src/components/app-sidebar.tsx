'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader,
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarSeparator,
  SidebarRail
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  FileText, 
  ClipboardCheck, 
  MessageSquare, 
  User, 
  LogOut,
  Settings,
  Users
} from 'lucide-react';
import EnvCard from './cards/envcard';

export function AppSidebar() {
  const pathname = usePathname();
  
  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="space-y-2">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex items-center gap-2 h-9">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-4 w-4"
              >
                <path d="M19 19H5V5h7V3H3v18h18v-9h-2v7z"></path>
                <path d="M15 3h6v6h-2V6.41l-4.29 4.3-1.41-1.42L17.59 5H15V3z"></path>
              </svg>
            </div>
            <span className="font-semibold text-xl transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[state=collapsed]:hidden">Linguosity</span>
          </div>
          <div className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[state=collapsed]:hidden">
            <EnvCard />
          </div>
        </div>
        <WorkspaceSwitcher />
      </SidebarHeader>
      
      <SidebarSeparator />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[state=collapsed]:hidden">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip="Overview">
                  <Link href="/dashboard">
                    <Home />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/referral')} tooltip="Referral">
                  <Link href="/dashboard/referral">
                    <FileText />
                    <span>Reason for Referral</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/background')} tooltip="Background">
                  <Link href="/dashboard/background">
                    <Users />
                    <span>Background Information</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/parent-report')} tooltip="Parent Report">
                  <Link href="/dashboard/parent-report">
                    <MessageSquare />
                    <span>Parent Report</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/assessment')} tooltip="Assessment">
                  <Link href="/dashboard/assessment">
                    <ClipboardCheck />
                    <span>Assessment Tools & Results</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/eligibility')} tooltip="Eligibility">
                  <Link href="/dashboard/eligibility">
                    <FileText />
                    <span>Eligibility</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/summary')} tooltip="Summary">
                  <Link href="/dashboard/summary">
                    <MessageSquare />
                    <span>Summary & Recommendations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip="Account">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src="/avatar.png" alt="User" />
                    <AvatarFallback>SL</AvatarFallback>
                  </Avatar>
                  <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[state=collapsed]:hidden">Sarah Lewis</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">Sarah Lewis</p>
                    <p className="text-sm text-muted-foreground">slewis@example.com</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/logout" className="flex items-center cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}