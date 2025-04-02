'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Removed debug logging

export default function Page() {
  return (
    <div className="container mx-auto py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-display font-medium mb-2">Welcome to Linguosity</h1>
        <p className="text-muted-foreground max-w-3xl">
          AI-powered tools for speech-language professionals to create reports, assessment resources, 
          and educational materials.
        </p>
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="font-medium">Navigation Links:</p>
          <div className="flex space-x-4 mt-2">
            <a href="/dashboard/reports" className="px-3 py-1 bg-blue-100 rounded">Reports</a>
            <a href="/dashboard/reports/text-editor-test" className="px-3 py-1 bg-blue-100 rounded">Report Editor</a>
          </div>
        </div>
      </header>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Reports card */}
        <a 
          href="/dashboard/reports" 
          className="block"
        >
          <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm h-full hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-xl mb-2">Reports</h2>
            <p className="text-muted-foreground mb-4">
              Write and edit speech-language reports with AI assistance.
            </p>
            <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary/60" />
            </div>
          </div>
        </a>
        
        <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm opacity-75 h-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-xl">Polyglot</h2>
            <span className="text-xs font-medium py-0.5 px-1.5 bg-[#F0DDC5] text-[#8A6534] rounded">
              Coming Soon
            </span>
          </div>
          <p className="text-muted-foreground mb-4">
            Multilingual assessment and translation resources.
          </p>
          <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center">
            <Globe className="w-10 h-10 text-primary/60" />
          </div>
        </div>
        
        <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm opacity-75 h-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-xl">Listophonic</h2>
            <span className="text-xs font-medium py-0.5 px-1.5 bg-[#F0DDC5] text-[#8A6534] rounded">
              Coming Soon
            </span>
          </div>
          <p className="text-muted-foreground mb-4">
            Auditory processing and listening skills tools.
          </p>
          <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center">
            <Mic className="w-10 h-10 text-primary/60" />
          </div>
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-medium mb-4">Recent Activity</h2>
        <div className="border rounded-lg p-6 bg-card text-center">
          <p className="text-muted-foreground">Create your first report to see activity here</p>
          <Link href="/reports/speech-language/new">
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create a Report
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Icon components
function FileText(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

function Globe(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function Mic(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function Plus(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}