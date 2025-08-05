'use client'

import { Home, Plus, FileText, Pen, Book, Eye, Sparkles, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useReport } from "@/lib/context/ReportContext";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const inReport = pathname.startsWith("/dashboard/reports/") && id;

  const { report } = useReport();
  const [isTocOpen, setIsTocOpen] = useState(true);

  const NavLink = ({ href, icon: Icon, children, isActive }: any) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50",
        isActive ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-600"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="size-4" />
      {children}
    </Link>
  );

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-white text-sm">
      <div className="inline-flex h-16 w-full items-center justify-center">
        <div className="h-8 w-8 relative">
          <Image
            src="/images/logo-animation.gif"
            alt="Linguosity logo"
            fill
            sizes="32px"
            className="object-contain text-teal-600"
            unoptimized
          />
        </div>
      </div>
      <div className="p-2">
        <NavLink 
          href="/dashboard" 
          icon={Home}
          isActive={pathname === '/dashboard'}
        >
          Dashboard
        </NavLink>
        <NavLink 
          href="/dashboard/reports/new" 
          icon={Plus}
          isActive={pathname === '/dashboard/reports/new'}
        >
          New Report
        </NavLink>
      </div>

      <hr className="my-2" />

      {inReport && (
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-2">
            <NavLink 
              href={`/dashboard/reports/${id}/data`} 
              icon={FileText}
              isActive={pathname.endsWith('/data')}
            >
              Data Entry
            </NavLink>
            <NavLink 
              href={`/dashboard/reports/${id}/template`} 
              icon={Pen}
              isActive={pathname.endsWith('/template')}
            >
              Edit Template
            </NavLink>
            <NavLink 
              href={`/dashboard/reports/${id}/sources`} 
              icon={Book}
              isActive={pathname.endsWith('/sources')}
            >
              Sources
            </NavLink>

            <hr className="my-2" />

            <NavLink 
              href={`/dashboard/reports/${id}/view`} 
              icon={Eye}
              isActive={pathname.endsWith('/view')}
            >
              View Report
            </NavLink>
            <button
              onClick={() => window.dispatchEvent(new Event("open-ai"))}
              className="flex w-full items-center gap-2 px-3 py-2 rounded text-gray-600 hover:bg-gray-50"
            >
              <Sparkles className="size-4" />
              AI Assistant
            </button>
          </div>

          {report && report.sections && report.sections.length > 0 && (
            <>
              <hr className="my-2" />
              <div className="px-2">
                <button
                  onClick={() => setIsTocOpen(!isTocOpen)}
                  className="flex w-full items-center justify-between px-3 py-2 rounded text-gray-800 font-semibold hover:bg-gray-50"
                >
                  <span>Table of Contents</span>
                  <ChevronDown className={cn("size-4 transition-transform", isTocOpen && "rotate-180")} />
                </button>
                {isTocOpen && (
                  <div className="mt-1 space-y-1 pl-4">
                    {report.sections.map((section) => (
                      <Link
                        key={section.id}
                        href={`/dashboard/reports/${id}/${section.id}`}
                        className={cn(
                          "block px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100",
                          pathname.endsWith(`/${section.id}`) && "font-semibold text-gray-900 bg-gray-100"
                        )}
                      >
                        {section.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
