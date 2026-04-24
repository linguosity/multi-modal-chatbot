'use client'

import React from 'react'
import { ChevronsRight, ChevronsLeft } from 'lucide-react'
import { useFocusedField, type InspectorFacet } from '../state/FocusContext'
import { SchemaFacet } from './facets/SchemaFacet'
import { AIFacet } from './facets/AIFacet'
import { SourcesFacet } from './facets/SourcesFacet'
import type { BlockFieldSchema } from '../LeftPane/FieldBlock'
import { cn } from '@/lib/utils'

const FACETS: { key: InspectorFacet; label: string }[] = [
  { key: 'schema', label: 'Schema' },
  { key: 'ai', label: 'AI' },
  { key: 'sources', label: 'Sources' },
]

type Props = {
  fields: BlockFieldSchema[]
  data: Record<string, unknown>
}

export function FieldInspector({ fields, data }: Props) {
  const focus = useFocusedField()
  const focused = focus.focusedFieldKey
    ? fields.find((f) => f.key === focus.focusedFieldKey || f.key === focus.focusedFieldKey?.split('.')[0]) ?? null
    : null

  if (!focus.inspectorOpen) {
    return (
      <button
        type="button"
        onClick={() => focus.setInspectorOpen(true)}
        aria-label="Open inspector"
        className="self-start rounded-l-md border border-r-0 border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50"
      >
        <ChevronsLeft className="size-4" />
      </button>
    )
  }

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-gray-200 bg-[#fafaf7]">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <div role="tablist" className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white">
          {FACETS.map((f) => {
            const sel = focus.facet === f.key
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={sel}
                onClick={() => focus.setFacet(f.key)}
                className={cn(
                  'border-l border-gray-200 px-3 py-1 text-[12px] transition-colors first:border-l-0',
                  sel ? 'bg-terracotta text-white font-medium' : 'bg-white text-gray-700 hover:bg-gray-50',
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => focus.setInspectorOpen(false)}
          aria-label="Collapse inspector"
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {focus.facet === 'schema' && <SchemaFacet field={focused} />}
        {focus.facet === 'ai' && <AIFacet field={focused} />}
        {focus.facet === 'sources' && <SourcesFacet field={focused} data={data} />}
      </div>
    </aside>
  )
}
