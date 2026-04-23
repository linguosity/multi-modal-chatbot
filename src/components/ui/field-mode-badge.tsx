"use client"

import React from 'react'
import { Lock, Sparkles, Sigma } from 'lucide-react'
import type { FieldMode } from '@/types/field-contracts'
import { cn } from '@/lib/utils'

/**
 * Small icon-only field-state marker with tooltip. Replaces the former
 * ALL-CAPS wordmark chip (COMPUTED / LOCKED / AI), which competed visually
 * with the field values it was describing.
 *
 * Rendering rule: `manual` mode renders nothing — it's the default, so
 * there's no information to communicate.
 */

type Props = {
  mode?: FieldMode
  className?: string
}

const META: Record<Exclude<FieldMode, 'manual'>, { label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = {
  computed: {
    label: 'Computed from other fields',
    Icon: Sigma,
    color: 'text-cyan-700',
  },
  ai_extracted: {
    label: 'Extracted by AI — review before relying on it',
    Icon: Sparkles,
    color: 'text-blue-700',
  },
  ai_summarized: {
    label: 'Summarized by AI — review before relying on it',
    Icon: Sparkles,
    color: 'text-purple-700',
  },
  locked: {
    label: 'Locked by your settings',
    Icon: Lock,
    color: 'text-slate-600',
  },
}

export function FieldModeBadge({ mode = 'manual', className }: Props) {
  if (mode === 'manual') return null
  const meta = META[mode]
  if (!meta) return null
  const { label, Icon, color } = meta
  return (
    <span
      title={label}
      aria-label={label}
      className={cn('inline-flex items-center align-middle', color, className)}
    >
      <Icon className="size-3.5" aria-hidden="true" />
    </span>
  )
}

export default FieldModeBadge
