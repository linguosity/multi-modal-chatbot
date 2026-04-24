'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Horizontal stepper that replaces the old vertical "This report" sidebar
 * stack. The six ordered stages below are the linear workflow a clinician
 * follows, renamed out of internal jargon:
 *
 *   Upload → De-identify → Review → Draft → Reconcile → Finalize
 *
 * Secondary report tools (Template, Canvas) live on the right — they're
 * not part of the linear flow, they're modes/views the user pops into.
 */

const WORKFLOW_STEPS = [
  { key: 'sources',     label: 'Upload',      help: 'Drop source files and notes' },
  { key: 'pii',         label: 'De-identify', help: 'Review detected PII' },
  { key: 'triage',      label: 'Review',      help: 'Confirm AI classification' },
  { key: 'surface',     label: 'Draft',       help: 'Build the skeleton' },
  { key: 'convergence', label: 'Reconcile',   help: 'Evidence synthesis' },
  { key: 'view',        label: 'Finalize',    help: 'Read-only report' },
] as const

const SECONDARY = [
  { key: 'template', label: 'Template' },
  { key: 'canvas',   label: 'Canvas' },
] as const

export function WorkflowStepper() {
  const params = useParams<{ id?: string }>()
  const pathname = usePathname()
  const id = params?.id
  if (!id || !pathname.startsWith('/dashboard/reports/')) return null

  const activeIdx = WORKFLOW_STEPS.findIndex((s) => pathname.endsWith(`/${s.key}`))

  return (
    <nav
      className="sticky top-0 z-30 flex flex-wrap items-center gap-1 border-b border-[#d0cec6] bg-[#f7f5f0] px-7 py-2.5"
      aria-label="Report workflow"
    >
      {WORKFLOW_STEPS.map((step, i) => {
        const isActive = i === activeIdx
        const isDone = activeIdx >= 0 && i < activeIdx
        return (
          <div key={step.key} className="flex items-center gap-1">
            <Link
              href={`/dashboard/reports/${id}/${step.key}`}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] transition-colors',
                isActive
                  ? 'border border-terracotta bg-white font-medium text-[#111]'
                  : isDone
                    ? 'text-[#6b6b6b] hover:bg-white'
                    : 'text-[#9a9a9a] hover:bg-white',
              )}
              aria-current={isActive ? 'step' : undefined}
              title={step.help}
            >
              <span
                className={cn(
                  'inline-block size-1.5 rounded-full',
                  isActive ? 'bg-terracotta' : isDone ? 'bg-[#6b6b6b]' : 'bg-[#d0cec6]',
                )}
                aria-hidden="true"
              />
              {step.label}
            </Link>
            {i < WORKFLOW_STEPS.length - 1 && (
              <ChevronRight className="size-3 text-[#d0cec6]" aria-hidden="true" />
            )}
          </div>
        )
      })}

      <div className="ml-auto flex items-center gap-2 text-[12px]">
        {SECONDARY.map((s, i) => {
          const isActive = pathname.endsWith(`/${s.key}`)
          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#d0cec6]">·</span>}
              <Link
                href={`/dashboard/reports/${id}/${s.key}`}
                className={cn(
                  'rounded px-2 py-1 transition-colors hover:bg-white',
                  isActive ? 'font-medium text-[#111]' : 'text-[#6b6b6b]',
                )}
              >
                {s.label}
              </Link>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
