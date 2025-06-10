import * as React from "react";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, Braces, Sparkles, Settings } from "lucide-react";
import { useWordLists } from '@/components/contexts/wordlists-context';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";

export function WordListSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const { userId, listId } = params as { userId: string, listId: string };
  const { currentSectionId, handleSectionChange } = useWordLists();
  
  const menuItems = [
    {
      id: 'overview',
      title: 'Overview',
      icon: FileText
    },
    {
      id: 'words',
      title: 'Words',
      icon: Braces
    },
    {
      id: 'narrative',
      title: 'Narrative',
      icon: Sparkles
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings
    }
  ];

  return (
    <Sidebar {...props}>
      <SidebarHeader className="flex flex-col gap-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/dashboard/${userId}/lists`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span>Back to Lists</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Word List</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={currentSectionId === item.id}
                  onClick={() => handleSectionChange(item.id)}
                  asChild
                >
                  <Link href={`/dashboard/${userId}/lists/${listId}/${item.id !== 'overview' ? item.id : ''}`}>
                    <item.icon className="h-4 w-4 mr-2" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}