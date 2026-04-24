'use client'

import React, { useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { YesNoDecision } from './YesNoDecision'
import { cn } from '@/lib/utils'

/**
 * CriterionCard — Template C primitive (per data-entry redesign §2 and §4.09).
 *
 *   ┌───────────────────────────────────────────────────────┐
 *   │ ① Meets criteria for speech impairment   [ Yes | No ] │
 *   │    California Definition: Speech or language…  [ ▾ ]  │
 *   │ ────────────────────────────────────────────────────  │
 *   │ Justification                            [✨ AI draft] │
 *   │ [ TextLong, pre-seeded with AI suggestion if avail. ] │
 *   │ Evidence from: CELF-5 (Sec 7), Parent Concern (Sec 5) │
 *   └───────────────────────────────────────────────────────┘
 *
 * Each card pairs one YesNoDecision with one justification TextLong.
 * Definition is collapsible so it doesn't dominate the card visually.
 */

export type CriterionCardProps = {
  number?: string
  title: string
  required?: boolean
  /** Free-text definition / legal source. Renders behind a "Show definition" toggle. */
  definition?: string
  /** Bound to the YesNoDecision. Pass `undefined` (or null) for "not yet decided". */
  decision?: boolean | null
  onDecisionChange: (next: boolean) => void
  /** Bound to the justification TextLong. Pass `undefined` for the
   *  onJustificationChange handler to hide the justification section
   *  entirely (used by validity factors that only carry a decision). */
  justification?: string
  onJustificationChange?: (next: string) => void
  justificationPlaceholder?: string
  justificationLabel?: string
  /** Optional list of source references (file p.N, etc.) to show under the textarea. */
  evidence?: string[]
  /** Optional AI-draft action — wired by parent. If omitted, the button is hidden. */
  onAIDraft?: () => void
  aiDrafting?: boolean
}

export function CriterionCard({
  number,
  title,
  required,
  definition,
  decision,
  onDecisionChange,
  justification,
  onJustificationChange,
  justificationPlaceholder,
  justificationLabel = 'Justification',
  evidence,
  onAIDraft,
  aiDrafting,
}: CriterionCardProps) {
  const [defOpen, setDefOpen] = useState(false)
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header — title left, decision right */}
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 text-[14px] text-gray-900">
            {number && <span className="text-gray-400 font-medium">{number}</span>}
            <span className="font-medium">{title}</span>
            {required && (
              <span className="text-rose-500 text-[12px]" aria-label="required">
                *
              </span>
            )}
          </div>
          {definition && (
            <button
              type="button"
              onClick={() => setDefOpen((o) => !o)}
              aria-expanded={defOpen}
              className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-gray-500 hover:text-gray-700"
            >
              <ChevronDown
                className={cn(
                  'size-3 transition-transform',
                  defOpen ? 'rotate-180' : 'rotate-0',
                )}
                aria-hidden="true"
              />
              {defOpen ? 'Hide definition' : 'Show definition'}
            </button>
          )}
          {defOpen && definition && (
            <div className="mt-2 rounded border border-gray-100 bg-gray-50 p-3 text-[12.5px] leading-relaxed text-gray-600">
              {definition}
            </div>
          )}
        </div>
        <YesNoDecision
          value={decision}
          onChange={onDecisionChange}
          ariaLabel={title}
        />
      </div>

      {onJustificationChange && (
        <>
          <div className="border-t border-dashed border-gray-200" />
          <div className="p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11.5px] text-gray-500">{justificationLabel}</span>
              {onAIDraft && (
                <button
                  type="button"
                  onClick={onAIDraft}
                  disabled={aiDrafting}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11.5px] text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  <Sparkles className="size-3" aria-hidden="true" />
                  {aiDrafting ? 'Drafting…' : 'AI draft'}
                </button>
              )}
            </div>
            <textarea
              value={justification || ''}
              onChange={(e) => onJustificationChange(e.target.value)}
              placeholder={justificationPlaceholder}
              className="w-full min-h-[80px] rounded border border-gray-200 bg-white px-3 py-2 text-[13px] focus:border-terracotta focus:outline-none focus:ring-0"
            />
            {evidence && evidence.length > 0 && (
              <div className="mt-2 text-[11.5px] text-gray-500">
                Evidence from: {evidence.join(', ')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default CriterionCard
