'use client'

import React from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * YesNoDecision — a prominent binary control. Replaces the old paired
 * "boolean checkbox + dropdown" pattern in Eligibility / Validity sections.
 * Compounds with CriterionCard.
 *
 * Yes selected → emerald tint. No selected → rose tint. Neither → neutral
 * outlined. Click cycles to the chosen value (you can change your mind);
 * clicking the already-selected button does nothing (no accidental clear).
 */

export type YesNoDecisionProps = {
  value?: boolean | null
  onChange: (next: boolean) => void
  size?: 'sm' | 'md'
  yesLabel?: string
  noLabel?: string
  ariaLabel?: string
  disabled?: boolean
}

export function YesNoDecision({
  value,
  onChange,
  size = 'md',
  yesLabel = 'Yes',
  noLabel = 'No',
  ariaLabel,
  disabled,
}: YesNoDecisionProps) {
  const padCls = size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2 text-[13px]'
  const isYes = value === true
  const isNo = value === false
  const baseBtn = 'inline-flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50'
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex overflow-hidden rounded-lg border',
        isYes ? 'border-emerald-300' : isNo ? 'border-rose-300' : 'border-gray-300',
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={isYes}
        disabled={disabled}
        onClick={() => !isYes && onChange(true)}
        className={cn(
          baseBtn,
          padCls,
          isYes
            ? 'bg-emerald-100 text-emerald-800 font-medium'
            : 'bg-white text-gray-600 hover:bg-gray-50',
        )}
      >
        <Check className="size-3.5" aria-hidden="true" />
        {yesLabel}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={isNo}
        disabled={disabled}
        onClick={() => !isNo && onChange(false)}
        className={cn(
          baseBtn,
          padCls,
          'border-l',
          isNo ? 'border-rose-300' : isYes ? 'border-emerald-300' : 'border-gray-300',
          isNo
            ? 'bg-rose-100 text-rose-800 font-medium'
            : 'bg-white text-gray-600 hover:bg-gray-50',
        )}
      >
        <X className="size-3.5" aria-hidden="true" />
        {noLabel}
      </button>
    </div>
  )
}

export default YesNoDecision
