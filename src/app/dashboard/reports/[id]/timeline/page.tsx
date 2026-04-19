'use client'

import { useReport } from '@/lib/context/ReportContext'
import React from 'react'

interface TimelineEvent {
  id: string
  type: string
  timestamp: string
  sectionIds?: string[]
  sectionTitles?: string[]
  summaries?: string[]
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function eventLabel(type: string) {
  switch (type) {
    case 'ai_intake': return 'AI intake'
    case 'section_update': return 'Section update'
    case 'manual_edit': return 'Manual edit'
    default: return type.replace(/_/g, ' ')
  }
}

export default function TimelinePage() {
  const { report } = useReport()
  const activity = ((report?.metadata as Record<string, unknown>)?.activity as TimelineEvent[] | undefined) ?? []

  return (
    <div className="p-8 bg-[var(--paper)] min-h-full">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-1 mb-6">
          <div className="wf-label">Activity</div>
          <h1 className="wf-heading" style={{ fontSize: 26 }}>AI activity timeline.</h1>
          <p className="wf-sm">Chronological log of everything Linguosity has done on this report.</p>
        </div>

        {activity.length === 0 ? (
          <div className="wf-box">
            <p className="wf-sm">No AI activity yet for this report.</p>
          </div>
        ) : (
          <ol className="relative ml-5">
            <div
              className="absolute top-0 bottom-0 left-0 w-px"
              style={{ background: 'var(--line-2)' }}
              aria-hidden
            />
            {activity.slice().reverse().map((evt) => {
              const titles = Array.isArray(evt.sectionTitles) && evt.sectionTitles.length > 0
                ? evt.sectionTitles
                : Array.isArray(evt.sectionIds) && evt.sectionIds.length > 0
                  ? evt.sectionIds.map(id => report?.sections?.find(s => s.id === id)?.title || id)
                  : []

              return (
                <li key={evt.id} className="mb-6 ml-6 relative">
                  <span
                    className="absolute flex h-4 w-4 items-center justify-center rounded-full"
                    style={{
                      left: -30,
                      top: 4,
                      background: 'var(--terracotta)',
                      border: '2px solid var(--paper)',
                      boxShadow: '0 0 0 2px var(--terracotta-ink)',
                    }}
                  />
                  <div className="wf-box p-4">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="wf-heading" style={{ fontSize: 15 }}>{eventLabel(evt.type)}</h3>
                      <time className="wf-ticker">{formatDateTime(evt.timestamp)}</time>
                    </div>

                    {titles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2 mt-2">
                        {titles.map((t, i) => (
                          <span key={i} className="wf-pill tan">{t}</span>
                        ))}
                      </div>
                    )}

                    {evt.summaries && evt.summaries.length > 0 && (
                      <details className="mt-2">
                        <summary
                          className="cursor-pointer select-none wf-sm"
                          style={{ color: 'var(--terracotta-ink)', fontWeight: 600 }}
                        >
                          Show process summaries
                        </summary>
                        <ul className="mt-2 list-disc pl-5 space-y-1">
                          {evt.summaries.map((s, i) => (
                            <li key={i} className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
