"use client"

import React from 'react'
import { Badge } from './badge'
import type { SourceRef } from '@/types/field-contracts'
import { cn } from '@/lib/utils'

type Props = {
  sources?: SourceRef[]
  className?: string
  onOpenPreview?: (ref: SourceRef) => void
}

function formatTimeRange(sec?: { startSec: number; endSec: number }) {
  if (!sec) return ''
  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const r = Math.round(s % 60)
    return `${m}:${r.toString().padStart(2, '0')}`
  }
  return `${fmt(sec.startSec)}–${fmt(sec.endSec)}`
}

function shortName(id: string) {
  if (!id) return 'source'
  const parts = id.split('/')
  return parts[parts.length - 1]
}

export function ProvenanceChips({ sources = [], className, onOpenPreview }: Props) {
  if (!sources.length) return null

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {sources.map((ref, idx) => {
        const label = ref.page
          ? `${shortName(ref.artifactId)} p.${ref.page}`
          : ref.timestamp
            ? `${shortName(ref.artifactId)} ${formatTimeRange(ref.timestamp)}`
            : shortName(ref.artifactId)
        const conf = typeof ref.confidence === 'number' ? Math.round(ref.confidence * 100) : undefined
        return (
          <button
            key={`${ref.artifactId}-${idx}`}
            type="button"
            onClick={onOpenPreview ? () => onOpenPreview(ref) : undefined}
            className={cn('focus:outline-none')}
            aria-label={`Open provenance for ${label}`}
          >
            <Badge
              variant="outline"
              className={cn(
                'bg-white/60 text-foreground hover:bg-white border-muted-foreground/20',
                'px-2 py-0.5 text-[11px]'
              )}
            >
              <span className="truncate max-w-[12rem] inline-flex gap-1 items-center">
                <span className="opacity-80">{label}</span>
                {conf !== undefined && (
                  <span className="opacity-60">{conf}%</span>
                )}
              </span>
            </Badge>
          </button>
        )
      })}
    </div>
  )
}

export default ProvenanceChips

