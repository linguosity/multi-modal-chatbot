'use client';

import * as React from "react";
import { School, ChevronDown, Check, PlusCircle } from "lucide-react";
import { cn } from "@/components/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface WorkspaceSwitcherProps {
  className?: string;
}

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const [selectedWorkspace, setSelectedWorkspace] = React.useState({
    name: "Main District",
    abbreviation: "MD",
    logo: "/logo.png",
  });

  const workspaces = [
    {
      name: "Main District",
      abbreviation: "MD",
      logo: "/logo.png",
    },
    {
      name: "East Elementary",
      abbreviation: "EE",
      logo: "/ee-logo.png",
    },
    {
      name: "West Middle School",
      abbreviation: "WM",
      logo: "/wm-logo.png",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex h-9 w-full items-center justify-between px-2 text-sm font-normal",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={selectedWorkspace.logo} alt={selectedWorkspace.name} />
              <AvatarFallback className="text-xs">{selectedWorkspace.abbreviation}</AvatarFallback>
            </Avatar>
            <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[state=collapsed]:hidden">{selectedWorkspace.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[state=collapsed]:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.name}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setSelectedWorkspace(workspace)}
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={workspace.logo} alt={workspace.name} />
              <AvatarFallback className="text-xs">{workspace.abbreviation}</AvatarFallback>
            </Avatar>
            <span>{workspace.name}</span>
            {selectedWorkspace.name === workspace.name && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
          <PlusCircle className="h-4 w-4" />
          <span>Add Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}