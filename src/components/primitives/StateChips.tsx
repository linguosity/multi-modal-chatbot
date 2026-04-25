'use client'

import React from 'react'
import { Sparkles, Calculator, Link2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

const CHIP_BASE = 'inline-flex items-center rounded-full font-mono uppercase'

const CHIP_STYLE: React.CSSProperties = {
  fontSize: 10.5,
  letterSpacing: '0.06em',
  padding: '2px 7px',
  gap: 4,
}

/** AI-assisted field marker. */
export function AIChip() {
  return (
    <span
      title="AI-assisted field"
      className={cn(CHIP_BASE)}
      style={{ ...CHIP_STYLE, background: '#d1fae5', color: '#065f46' }}
    >
      <Sparkles aria-hidden="true" className="h-2.5 w-2.5" />
      AI
    </span>
  )
}

/** Field whose value is computed from other fields. */
export function ComputedChip() {
  return (
    <span
      title="Computed field"
      className={cn(CHIP_BASE)}
      style={{ ...CHIP_STYLE, background: '#dbeafe', color: '#1e40af' }}
    >
      <Calculator aria-hidden="true" className="h-2.5 w-2.5" />
      Computed
    </span>
  )
}

export type LinkedChipProps = {
  from: string
}

/** Field whose value is linked from another source; label is the source name. */
export function LinkedChip({ from }: LinkedChipProps) {
  return (
    <span
      title={`Linked from ${from}`}
      className={cn(CHIP_BASE, 'cursor-pointer')}
      style={{ ...CHIP_STYLE, background: 'var(--tan-soft)', color: '#6b5d32' }}
    >
      <Link2 aria-hidden="true" className="h-2.5 w-2.5" />
      {from}
    </span>
  )
}

/** Field that is locked from edits. */
export function LockedChip() {
  return (
    <span
      title="Locked field"
      className={cn(CHIP_BASE)}
      style={{ ...CHIP_STYLE, background: '#f3f4f6', color: '#6b7280', gap: 3 }}
    >
      <Lock aria-hidden="true" className="h-2.5 w-2.5" />
      Locked
    </span>
  )
}
