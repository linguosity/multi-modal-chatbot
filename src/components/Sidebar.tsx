'use client'

import { Home, Plus, FileText, Pen, Book, Eye, Sparkles, ChevronDown, Library, Filter, LayoutList, Gauge, Workflow, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useReport } from "@/lib/context/ReportContext";
import { useState } from "react";

/** Derive a simple status from section data for TOC status dots. */
function sectionStatus(section: { content: string | null; structured_data: unknown }): 'complete' | 'partial' | 'empty' {
  const hasContent = typeof section.content === 'string' && section.content.trim().length > 0;
  const hasData = section.structured_data != null && Object.keys(section.structured_data as object).length > 0;
  if (hasContent && hasData) return 'complete';
  if (hasContent || hasData) return 'partial';
  return 'empty';
}

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
        "flex items-center gap-2 px-3 py-2 rounded font-mono text-[12px] uppercase tracking-[0.06em] transition-colors",
        isActive
          ? "bg-[#f7f5f0] border-l-2 border-[#CE7B56] font-semibold text-[#111111]"
          : "text-[#3a3a3a] hover:bg-[#ede9dc]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" />
      {children}
    </Link>
  );

  // Compute TOC progress
  const totalSections = report?.sections?.length ?? 0;
  const completeSections = report?.sections?.filter(s => sectionStatus(s) === 'complete').length ?? 0;
  const progressPct = totalSections > 0 ? Math.round((completeSections / totalSections) * 100) : 0;

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-[#1a1a1a] bg-[#efece4] text-sm">
      {/* Brand mark */}
      <div className="flex h-16 w-full items-center gap-2.5 px-4">
        <div className="h-7 w-7 relative shrink-0">
          <Image
            src="/images/logo-animation.gif"
            alt="Linguosity logo"
            fill
            sizes="28px"
            className="object-contain"
            unoptimized
          />
        </div>
        <div className="flex flex-col">
          <span className="font-serif text-[22px] leading-tight tracking-tight text-[#1a1a1a]">
            Linguosity<span className="text-[#CE7B56]">.</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b6b6b] leading-none">
            Speech &middot; Language &middot; Reports
          </span>
        </div>
      </div>

      {/* Main nav */}
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
        <NavLink
          href="/dashboard/tools"
          icon={Library}
          isActive={pathname === '/dashboard/tools'}
        >
          Tool Library
        </NavLink>
      </div>

      <hr className="my-2 border-[#d0cec6]" />

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
            <NavLink
              href={`/dashboard/reports/${id}/pii`}
              icon={ShieldCheck}
              isActive={pathname.endsWith('/pii')}
            >
              Privacy
            </NavLink>
            <NavLink
              href={`/dashboard/reports/${id}/triage`}
              icon={Filter}
              isActive={pathname.endsWith('/triage')}
            >
              Triage
            </NavLink>
            <NavLink
              href={`/dashboard/reports/${id}/surface`}
              icon={LayoutList}
              isActive={pathname.endsWith('/surface')}
            >
              Working Surface
            </NavLink>
            <NavLink
              href={`/dashboard/reports/${id}/convergence`}
              icon={Gauge}
              isActive={pathname.endsWith('/convergence')}
            >
              Convergence
            </NavLink>
            <NavLink
              href={`/dashboard/reports/${id}/canvas`}
              icon={Workflow}
              isActive={pathname.endsWith('/canvas')}
            >
              Canvas
            </NavLink>

            <hr className="my-2 border-[#d0cec6]" />

            <NavLink
              href={`/dashboard/reports/${id}/view`}
              icon={Eye}
              isActive={pathname.endsWith('/view')}
            >
              View Report
            </NavLink>
            <button
              onClick={() => window.dispatchEvent(new Event("open-ai"))}
              className="flex w-full items-center gap-2 px-3 py-2 rounded font-mono text-[12px] uppercase tracking-[0.06em] text-[#3a3a3a] hover:bg-[#ede9dc] transition-colors"
            >
              <Sparkles className="size-4 shrink-0" />
              AI Assistant
            </button>
          </div>

          {report && report.sections && report.sections.length > 0 && (
            <>
              <hr className="my-2 border-[#d0cec6]" />
              <div className="px-2">
                <button
                  onClick={() => setIsTocOpen(!isTocOpen)}
                  className="flex w-full items-center justify-between px-3 py-2 rounded font-mono text-[12px] uppercase tracking-[0.06em] font-semibold text-[#1a1a1a] hover:bg-[#ede9dc] transition-colors"
                >
                  <span>Table of Contents</span>
                  <ChevronDown className={cn("size-4 transition-transform", isTocOpen && "rotate-180")} />
                </button>

                {/* Progress bar */}
                <div className="mx-3 mt-1.5 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-[#6b6b6b]">{completeSections}/{totalSections} complete</span>
                    <span className="font-mono text-[10px] text-[#6b6b6b]">{progressPct}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-[#d0cec6]">
                    <div
                      className="h-1 rounded-full bg-[#CE7B56] transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {isTocOpen && (
                  <div className="mt-1 space-y-0.5 pl-2">
                    {report.sections.map((section) => {
                      const status = sectionStatus(section);
                      const isActive = pathname.endsWith(`/${section.id}`);
                      return (
                        <Link
                          key={section.id}
                          href={`/dashboard/reports/${id}/${section.id}`}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded font-mono text-[11px] transition-colors",
                            isActive
                              ? "font-semibold text-[#111111] bg-[#f7f5f0]"
                              : "text-[#3a3a3a] hover:bg-[#ede9dc]"
                          )}
                        >
                          {/* Status dot */}
                          <span
                            className={cn(
                              "inline-block size-2 shrink-0 rounded-full",
                              status === 'complete' && "bg-[#111111]",
                              status === 'partial' && "bg-[#C9BA94]",
                              status === 'empty' && "border border-[#d0d0d0] bg-white"
                            )}
                          />
                          <span className="truncate">{section.title}</span>
                        </Link>
                      );
                    })}
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
