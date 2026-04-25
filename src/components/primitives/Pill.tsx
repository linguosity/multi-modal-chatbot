'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type PillTone = 'terra' | 'tan' | 'dark' | 'emerald' | 'rose'

export type PillProps = {
  children: React.ReactNode
  tone?: PillTone
  style?: React.CSSProperties
  className?: string
}

type ToneStyle = { background: string; color: string; border: string }

const TONE_STYLES: Record<PillTone, ToneStyle> = {
  terra: {
    background: '#fbe7da',
    color: 'var(--terracotta-ink)',
    border: 'var(--terracotta-ink)',
  },
  tan: {
    background: 'var(--tan-soft)',
    color: '#6b5d32',
    border: 'var(--line-2)',
  },
  dark: {
    background: 'var(--ink)',
    color: '#ffffff',
    border: 'var(--line)',
  },
  emerald: {
    background: '#d1fae5',
    color: '#065f46',
    border: 'var(--line-2)',
  },
  rose: {
    background: '#ffe4e6',
    color: '#9f1239',
    border: 'var(--line-2)',
  },
}

const DEFAULT_TONE: ToneStyle = {
  background: '#ffffff',
  color: 'var(--ink-2)',
  border: 'var(--line-2)',
}

export function Pill({ children, tone, style, className }: PillProps) {
  const t = tone ? TONE_STYLES[tone] : DEFAULT_TONE
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] rounded-full border font-mono',
        className,
      )}
      style={{
        padding: '3px 8px',
        borderColor: t.border,
        background: t.background,
        color: t.color,
        fontSize: 10.5,
        letterSpacing: '0.06em',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

export default Pill
