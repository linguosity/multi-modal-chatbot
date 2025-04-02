"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Globe, Mic, Lightbulb, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const apps = [
  {
    id: 'reports',
    name: 'Reports',
    description: 'Create and manage speech & language reports',
    href: '/reports',
    icon: FileText,
    color: '#6C8578', // sage green
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Multilingual assessment and resources',
    href: '/polyglot',
    icon: Globe,
    color: '#785F73', // muted plum
    comingSoon: true
  },
  {
    id: 'listophonic',
    name: 'Listophonic',
    description: 'Auditory processing and listening skills',
    href: '/listophonic',
    icon: Mic,
    color: '#C45336', // burnt sienna
    comingSoon: true
  },
  {
    id: 'narratives',
    name: 'Narratively',
    description: 'Student narrative development tools',
    href: '/narratively',
    icon: Lightbulb,
    color: '#A87C39', // warm gold
    comingSoon: true
  }
];

export function AppSuiteNav() {
  const pathname = usePathname();
  
  // Check if path is within a specific app
  const currentApp = apps.find(app => 
    pathname === app.href || pathname.startsWith(`${app.href}/`)
  )?.id;
  
  return (
    <Card className="border border-[#E6E0D6] bg-[#F8F7F4] rounded-xl shadow-sm mb-6">
      <CardContent className="p-3">
        <h2 className="font-display text-lg font-medium ml-3 mb-2 text-foreground">Linguosity Suite</h2>
        <nav className="space-y-1">
          {apps.map((app) => {
            const isActive = app.id === currentApp;
            
            return (
              <Link
                key={app.id}
                href={app.comingSoon ? '#' : app.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-lg transition-colors relative group",
                  isActive 
                    ? "bg-white text-foreground shadow-sm border border-[#E6E0D6]" 
                    : "text-muted-foreground hover:bg-[#F1EEE9] hover:text-foreground"
                )}
                onClick={(e) => app.comingSoon && e.preventDefault()}
              >
                <div className={cn(
                  "mr-3 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center",
                  `text-[${app.color}]`
                )}>
                  {React.createElement(app.icon, { 
                    size: 16,
                    className: isActive ? "text-current" : "text-current opacity-75"
                  })}
                </div>
                <div className="flex-1">
                  <span className="font-medium block">{app.name}</span>
                  <span className={cn(
                    "text-xs block",
                    isActive ? "text-muted-foreground" : "text-muted-foreground/75"
                  )}>
                    {app.description}
                  </span>
                </div>
                
                {app.comingSoon ? (
                  <span className="text-xs font-medium py-0.5 px-1.5 bg-[#F0DDC5] text-[#8A6534] rounded">
                    Coming Soon
                  </span>
                ) : (
                  <ChevronRight 
                    className={cn(
                      "h-4 w-4 opacity-0 group-hover:opacity-70 transition-opacity",
                      isActive && "opacity-70"
                    )}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}