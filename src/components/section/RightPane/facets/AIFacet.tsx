'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import type { BlockFieldSchema } from '../../LeftPane/FieldBlock'

/**
 * AI facet — field-scoped AI actions. Spike stub: surfaces the field's
 * mode, a one-line description of what AI can do for it, and a button
 * that opens the existing AI intake drawer. A real implementation would
 * call /api/ai/generate-narrative or the Eligibility CriterionCard
 * draft path scoped to this single field.
 */
export function AIFacet({ field }: { field: BlockFieldSchema | null }) {
  if (!field) {
    return <Empty>Focus a field to see AI options.</Empty>
  }
  const mode = (field as any).mode as string | undefined
  return (
    <div className="space-y-3 text-[12.5px]">
      <div>
        <div className="mb-1 text-[11.5px] font-medium text-gray-500">Field</div>
        <div className="text-gray-800">{field.label}</div>
      </div>
      <div>
        <div className="mb-1 text-[11.5px] font-medium text-gray-500">Mode</div>
        <div className="text-gray-800">{mode || 'manual'}</div>
      </div>
      <p className="text-[11.5px] text-gray-500">
        {mode === 'ai_extracted' || mode === 'ai_summarized'
          ? 'This field can be auto-populated from uploaded sources.'
          : mode === 'computed'
            ? 'Computed from other fields. Edit upstream values to update.'
            : mode === 'locked'
              ? 'Locked by your settings. Update via Settings → Profile.'
              : 'Manual field. AI can draft a value from sources on request.'}
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            window.dispatchEvent(new Event('open-ai'))
          } catch { /* no-op */ }
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[12px] text-blue-700 hover:bg-blue-100"
      >
        <Sparkles className="size-3.5" aria-hidden="true" />
        Open AI assist
      </button>
      <p className="text-[10.5px] text-gray-400">
        Spike stub — opens the existing AI intake drawer. Per-field draft
        endpoint wires next.
      </p>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-[12.5px] text-gray-400">{children}</div>
}
