'use client'

import { Home, Plus, Library } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useReport } from '@/lib/context/ReportContext'

/** Derive a simple status from section data for TOC status dots. */
function sectionStatus(section: { content: string | null; structured_data: unknown }): 'complete' | 'partial' | 'empty' {
  const hasContent = typeof section.content === 'string' && section.content.trim().length > 0
  const hasData = section.structured_data != null && Object.keys(section.structured_data as object).length > 0
  if (hasContent && hasData) return 'complete'
  if (hasContent || hasData) return 'partial'
  return 'empty'
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-5 pb-2 text-[11px] font-medium text-[#9a9a9a] tracking-wide">
      {children}
    </div>
  )
}

type NavLinkProps = {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  isActive?: boolean
}

function NavLink({ href, icon: Icon, children, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'mx-2 flex items-center gap-2.5 rounded px-3 py-1.5 text-[13px] transition-colors',
        isActive
          ? 'bg-[#f7f5f0] border-l-2 border-terracotta font-medium text-[#111]'
          : 'text-[#3a3a3a] hover:bg-[#ede9dc] font-normal',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="size-4 shrink-0 opacity-80" />
      {children}
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const params = useParams<{ id?: string }>()
  const id = params?.id
  const inReport = pathname.startsWith('/dashboard/reports/') && !!id
  const { report } = useReport()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-[#1a1a1a] bg-[#efece4]">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-4 border-b border-[#d0cec6]">
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
        <span
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-[20px] leading-tight tracking-tight"
        >
          Linguosity<span className="text-terracotta">.</span>
        </span>
      </div>

      {/* Workspace — top-level app areas */}
      <GroupLabel>Workspace</GroupLabel>
      <div>
        <NavLink href="/dashboard" icon={Home} isActive={pathname === '/dashboard'}>
          Home
        </NavLink>
        <NavLink
          href="/dashboard/reports/new"
          icon={Plus}
          isActive={pathname === '/dashboard/reports/new'}
        >
          New report
        </NavLink>
        <NavLink href="/dashboard/tools" icon={Library} isActive={pathname === '/dashboard/tools'}>
          Tool library
        </NavLink>
      </div>

      {/* Contents — table of contents, derived from report.sections.
          Progress bar moved out to the Header so it lives next to the
          report title rather than buried in the sidebar. */}
      {inReport && report && report.sections && report.sections.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col">
          <GroupLabel>Contents</GroupLabel>
          <div className="flex-1 overflow-y-auto pb-3">
            {report.sections.map((section) => {
              const status = sectionStatus(section)
              const isActive = pathname.endsWith(`/${section.id}`)
              return (
                <Link
                  key={section.id}
                  href={`/dashboard/reports/${id}/${section.id}`}
                  className={cn(
                    'mx-2 flex items-center gap-2 rounded px-3 py-1.5 text-[13px] transition-colors',
                    isActive
                      ? 'bg-[#f7f5f0] font-medium text-[#111]'
                      : 'text-[#3a3a3a] hover:bg-[#ede9dc]',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block size-2 shrink-0 rounded-full',
                      status === 'complete' && 'bg-[#111]',
                      status === 'partial' && 'bg-[#C9BA94]',
                      status === 'empty' && 'border border-[#d0d0d0] bg-white',
                    )}
                  />
                  <span className="truncate">{section.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}
