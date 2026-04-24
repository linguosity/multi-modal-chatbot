'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { TextBlock } from './TextBlock'
import type { FieldBlockProps } from '../FieldBlock'

/**
 * NarrativeBlock — TextBlock wrapper that surfaces a "Generate for this
 * section" affordance inline. Replaces today's bottom AI-narrative strip.
 *
 * Spike: the button is wired to the existing dispatchEvent('open-ai')
 * pattern so the AIIntakeDrawer takes over. A future commit can wire
 * direct per-field narrative generation via /api/ai/generate-narrative.
 */
export function NarrativeBlock(props: FieldBlockProps) {
  return (
    <div className="space-y-2">
      <TextBlock {...props} />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            try {
              window.dispatchEvent(new Event('open-ai'))
            } catch {
              /* no-op */
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[12px] text-blue-700 hover:bg-blue-100"
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          Generate for this field
        </button>
      </div>
    </div>
  )
}
