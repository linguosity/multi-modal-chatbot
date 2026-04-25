'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type CompletionMeterProps = {
  filled: number
  total: number
  label?: string
  width?: string
  className?: string
  style?: React.CSSProperties
}

export function CompletionMeter({
  filled,
  total,
  label,
  width = 'w-24',
  className,
  style,
}: CompletionMeterProps) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      style={style}
    >
      <div
        className={cn('h-1 overflow-hidden rounded-sm', width)}
        style={{ background: '#e4e0d3' }}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: 'var(--terracotta)',
          }}
        />
      </div>
      <span
        className="font-mono"
        style={{ fontSize: 11, color: 'var(--ink-3)' }}
      >
        {filled}/{total} {label || 'fields'} · {pct}%
      </span>
    </div>
  )
}

export default CompletionMeter
