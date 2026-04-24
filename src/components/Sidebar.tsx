'use client'

import { Home, Plus, Library } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useParams } from 'next/navigation'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useReport } from '@/lib/context/ReportContext'
import { contentToTree } from '@/components/report/section-editor/content-adapter'
import { validateTree } from '@/components/report/section-editor/validator'
import { SECTION_SCHEMAS } from '@/components/report/section-editor/slots'

type SectionLike = {
  id: string
  sectionType?: string
  content: string | null
  structured_data: unknown
}

interface SectionStatus {
  kind: 'complete' | 'partial' | 'empty'
  /** 0..1. Only meaningful for schema-backed sections. */
  completion: number
  /** True when we derived this from the slot validator rather than heuristics. */
  schemaBacked: boolean
}

/**
 * Per-section status for the sidebar TOC dots.
 *
 * When the section has a registered slot schema we run the validator
 * and use its completion ratio. For schema-less sections (free-form
 * prose, or types the registry doesn't cover yet) we fall back to the
 * old heuristic — content OR structured_data present = partial, both
 * = complete, neither = empty.
 */
function sectionStatus(section: SectionLike): SectionStatus {
  const sectionType = section.sectionType
  const hasSchema = sectionType && !!SECTION_SCHEMAS[sectionType]
  if (hasSchema && typeof section.content === 'string' && section.content.trim().length > 0) {
    try {
      const tree = contentToTree(section.content)
      const validation = validateTree(tree, sectionType as string)
      const ratio = validation.completion
      const hasAny =
        validation.slots.length > 0 &&
        validation.slots.some((s) => s.status !== 'missing')
      if (ratio >= 1) return { kind: 'complete', completion: ratio, schemaBacked: true }
      if (hasAny) return { kind: 'partial', completion: ratio, schemaBacked: true }
      return { kind: 'empty', completion: 0, schemaBacked: true }
    } catch {
      // fall through to heuristic
    }
  }
  const hasContent = typeof section.content === 'string' && section.content.trim().length > 0
  const hasData = section.structured_data != null && Object.keys(section.structured_data as object).length > 0
  if (hasContent && hasData) return { kind: 'complete', completion: 1, schemaBacked: false }
  if (hasContent || hasData) return { kind: 'partial', completion: 0.5, schemaBacked: false }
  return { kind: 'empty', completion: 0, schemaBacked: false }
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
        <TableOfContents sections={report.sections} pathname={pathname} reportId={id} />
      )}
    </aside>
  )
}

function TableOfContents({
  sections,
  pathname,
  reportId,
}: {
  sections: Array<{ id: string; title: string; content: string | null; structured_data: unknown; sectionType?: string }>
  pathname: string
  reportId?: string
}) {
  // Validator runs per-section but only recomputes when any of the
  // section content / structured_data / section list itself changes.
  // Rough cost check: parsing a ~2KB tree JSON 15× is negligible vs.
  // a render; we're well below any watch-this-profile threshold.
  const statuses = useMemo(
    () => new Map(sections.map((s) => [s.id, sectionStatus(s)] as const)),
    [sections],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GroupLabel>Contents</GroupLabel>
      <div className="flex-1 overflow-y-auto pb-3">
        {sections.map((section) => {
          const status = statuses.get(section.id)!
          const isActive = pathname.endsWith(`/${section.id}`)
          return (
            <Link
              key={section.id}
              href={`/dashboard/reports/${reportId}/${section.id}`}
              className={cn(
                'mx-2 flex items-center gap-2 rounded px-3 py-1.5 text-[13px] transition-colors',
                isActive
                  ? 'bg-[#f7f5f0] font-medium text-[#111]'
                  : 'text-[#3a3a3a] hover:bg-[#ede9dc]',
              )}
              title={
                status.schemaBacked
                  ? `${Math.round(status.completion * 100)}% of required slots filled`
                  : undefined
              }
            >
              <StatusIndicator status={status} />
              <span className="truncate">{section.title}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Status indicator. Schema-backed sections render as a tiny progress
 * ring whose fill angle is the completion ratio — terracotta wedge on
 * a muted track. Schema-less sections stay as the old three-state dot.
 */
function StatusIndicator({ status }: { status: SectionStatus }) {
  if (!status.schemaBacked) {
    return (
      <span
        className={cn(
          'inline-block size-2 shrink-0 rounded-full',
          status.kind === 'complete' && 'bg-[#111]',
          status.kind === 'partial' && 'bg-[#C9BA94]',
          status.kind === 'empty' && 'border border-[#d0d0d0] bg-white',
        )}
      />
    )
  }
  const pct = Math.max(0, Math.min(100, Math.round(status.completion * 100)))
  // Conic gradient draws the ring: filled arc in terracotta, remainder
  // in a muted track. Inner dot punches out the centre so it reads as
  // a ring rather than a pie.
  return (
    <span
      aria-hidden
      className="relative inline-block size-3 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(var(--terracotta) ${pct}%, #e5e0d1 0)`,
      }}
    >
      <span
        className="absolute inset-[2px] rounded-full"
        style={{ background: status.kind === 'complete' ? 'var(--terracotta)' : '#efece4' }}
      />
    </span>
  )
}
