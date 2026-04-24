'use client'

import React, { useMemo, useState } from 'react'
import { TextBlock } from './TextBlock'
import type { FieldBlockProps } from '../FieldBlock'
import { cn } from '@/lib/utils'

/**
 * ParallelDomainBlock — used by Assessment Results today (six parallel
 * `*_notes` textareas: articulation, phonology, receptive, expressive,
 * pragmatic, voice, fluency). Renders a chip row of the available domains
 * with one focused editor below, instead of stacking all textareas.
 *
 * Heuristic for spike: scans the section's flat field list for keys ending
 * in `_notes` and treats each as a domain. Long-term this should be a
 * formal section-level hint in the schema.
 */
export function ParallelDomainBlock({ field, value, onChange, registerLabel, onFocusField, allFields, allValues, onAllChange }: FieldBlockProps & {
  allFields?: any[]
  allValues?: Record<string, unknown>
  onAllChange?: (key: string, val: unknown) => void
}) {
  // When wired through SectionPageV2's parallel-domain detection, allFields
  // is the full domain set. Fall back to a single-block render otherwise.
  const domainFields = useMemo(() => {
    if (Array.isArray(allFields) && allFields.length > 0) return allFields
    return [field]
  }, [allFields, field])

  const [focusedKey, setFocusedKey] = useState<string>(domainFields[0]?.key ?? field.key)
  const focused = domainFields.find((f) => f.key === focusedKey) ?? domainFields[0]

  const focusedVal = allValues ? allValues[focused.key] : value
  const focusedOnChange = (v: unknown) => {
    if (onAllChange) onAllChange(focused.key, v)
    else onChange(v)
  }

  const cleanLabel = (k: string) =>
    k.replace(/_notes$/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const filledCount = (k: string) => {
    const v = allValues ? allValues[k] : null
    return typeof v === 'string' && v.trim().length > 0 ? 1 : 0
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11.5px] text-gray-500 mr-1">Domain:</span>
        {domainFields.map((f) => {
          const sel = f.key === focusedKey
          const filled = filledCount(f.key) > 0
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFocusedKey(f.key)
                onFocusField(f.key)
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition-colors',
                sel
                  ? 'border-terracotta bg-white font-medium text-[#111]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400',
              )}
            >
              <span
                className={cn(
                  'inline-block size-1.5 rounded-full',
                  filled ? 'bg-emerald-500' : 'bg-gray-300',
                )}
                aria-hidden="true"
              />
              {cleanLabel(f.key)}
            </button>
          )
        })}
      </div>

      <TextBlock
        field={focused}
        value={focusedVal}
        onChange={focusedOnChange}
        registerLabel={registerLabel}
        onFocusField={onFocusField}
      />
    </div>
  )
}
