"use client"

import React from 'react'
import { Badge } from './badge'
import type { FieldMode } from '@/types/field-contracts'
import { cn } from '@/lib/utils'

type Props = {
  mode?: FieldMode
  className?: string
  compact?: boolean // smaller padding/text
}

const labels: Record<FieldMode, string> = {
  manual: 'Manual',
  computed: 'Computed',
  ai_extracted: 'AI',
  ai_summarized: 'AI',
  locked: 'Locked',
}

export function FieldModeBadge({ mode = 'manual', className, compact = true }: Props) {
  const color =
    mode === 'manual' ? 'bg-gray-200 text-gray-800 border-transparent' :
    mode === 'computed' ? 'bg-cyan-100 text-cyan-800 border-transparent' :
    mode === 'ai_extracted' ? 'bg-blue-100 text-blue-800 border-transparent' :
    mode === 'ai_summarized' ? 'bg-purple-100 text-purple-800 border-transparent' :
    'bg-slate-200 text-slate-800 border-transparent'

  return (
    <Badge
      className={cn(
        'uppercase tracking-wide',
        compact ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs',
        color,
        className
      )}
      variant="outline"
    >
      {labels[mode]}
    </Badge>
  )
}

export default FieldModeBadge

