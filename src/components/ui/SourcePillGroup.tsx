"use client"

import * as React from "react"
import * as Tooltip from "@radix-ui/react-tooltip"

type PillItem = {
  key: string
  label: string
  score?: number // 0..1 for confidence or a 0..100 percentage
  meta?: Record<string, unknown>
}

interface SourcePillGroupProps {
  items: PillItem[]
  className?: string
  compact?: boolean
}

// Groups items by key and aggregates scores for display like: Label (85%, 72%)
export function SourcePillGroup({ items, className = "", compact = false }: SourcePillGroupProps) {
  const groups = React.useMemo(() => {
    const map = new Map<string, PillItem[]>()
    for (const it of items) {
      const arr = map.get(it.key) || []
      arr.push(it)
      map.set(it.key, arr)
    }
    return Array.from(map.entries()).map(([key, arr]) => {
      const label = arr[0]?.label || key
      const scores = arr
        .map(i => typeof i.score === "number" ? (i.score <= 1 ? Math.round(i.score * 100) : Math.round(i.score)) : undefined)
        .filter((v): v is number => typeof v === 'number')
      return { key, label, items: arr, scores }
    })
  }, [items])

  if (!items || items.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Tooltip.Provider delayDuration={150}>
        {groups.map(g => {
          const scoreText = g.scores.length > 0 ? ` (${g.scores.join('% , ')}%)` : ''
          const pill = (
            <div
              className={`inline-flex items-center rounded-full border text-xs font-medium transition-colors ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'} bg-gray-100/90 border-gray-200 text-gray-700 hover:bg-gray-200/80`}
            >
              <span className="truncate max-w-[14rem]" title={g.label}>{g.label}</span>
              {g.scores.length > 0 && (
                <span className="ml-1 text-gray-500 whitespace-nowrap">({g.scores.map(s => `${s}%`).join(', ')})</span>
              )}
            </div>
          )

          // Tooltip content with full breakdown
          const tooltipContent = (
            <div className="max-w-xs text-xs text-gray-900">
              <div className="font-medium mb-1">{g.label}</div>
              {g.items.map((it, idx) => (
                <div key={idx} className="text-gray-600">• {typeof it.score === 'number' ? `${it.score <= 1 ? Math.round(it.score * 100) : Math.round(it.score)}%` : ''}</div>
              ))}
            </div>
          )

          return (
            <Tooltip.Root key={g.key}>
              <Tooltip.Trigger asChild>{pill}</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="top" sideOffset={6} className="rounded-md bg-white px-3 py-2 shadow-md border border-gray-200">
                  {tooltipContent}
                  <Tooltip.Arrow className="fill-white" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )
        })}
      </Tooltip.Provider>
    </div>
  )
}

