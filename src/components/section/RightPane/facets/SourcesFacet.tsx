'use client'

import React from 'react'
import type { BlockFieldSchema } from '../../LeftPane/FieldBlock'

type ProvenanceEntry = {
  field_path: string
  artifactId?: string
  page?: number
  confidence?: number
}

/**
 * Sources facet — evidence snippets tied to the focused field.
 *
 * Reads from `data.__provenance` (the same sidecar that the AI pipeline
 * already writes; see process-intake/route.ts). Filters entries whose
 * `field_path` matches the focused field key.
 *
 * Spike scope: lists the provenance entries with file + page + confidence.
 * The full Sources-tab snippet view is a follow-up.
 */
export function SourcesFacet({
  field,
  data,
}: {
  field: BlockFieldSchema | null
  data: Record<string, unknown>
}) {
  if (!field) {
    return <Empty>Focus a field to see its supporting sources.</Empty>
  }
  const provenance = Array.isArray((data as any)?.__provenance)
    ? ((data as any).__provenance as ProvenanceEntry[])
    : []
  const matching = provenance.filter((p) => p.field_path === field.key)
  if (matching.length === 0) {
    return (
      <Empty>
        No source links recorded for <span className="font-medium">{field.label}</span> yet.
        Upload a file via AI assist or add a source from the Sources tab.
      </Empty>
    )
  }
  return (
    <ul className="space-y-2 text-[12.5px]">
      {matching.map((p, i) => (
        <li
          key={i}
          className="rounded border border-gray-200 bg-white p-2"
        >
          <div className="flex items-center justify-between">
            <span className="truncate font-medium text-gray-800">
              {p.artifactId || 'Unknown source'}
            </span>
            {typeof p.confidence === 'number' && (
              <span className="text-[11px] text-gray-500">
                {Math.round(p.confidence * 100)}%
              </span>
            )}
          </div>
          {p.page && (
            <div className="mt-0.5 text-[11.5px] text-gray-500">page {p.page}</div>
          )}
        </li>
      ))}
    </ul>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-[12.5px] text-gray-400">{children}</div>
}
