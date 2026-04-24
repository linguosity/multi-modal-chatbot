'use client'

import React from 'react'
import type { FieldBlockProps } from '../FieldBlock'
import { cn } from '@/lib/utils'

export function SelectBlock({ field, value, onChange, registerLabel }: FieldBlockProps) {
  const labelId = registerLabel(field.key)
  const options = field.options || []
  // Mirror DynamicStructuredBlock heuristic: ≤5 short options renders
  // segmented; longer lists fall back to a native dropdown.
  const useSegmented =
    options.length > 0 &&
    options.length <= 5 &&
    options.every((o) => o.length <= 18)

  return (
    <div className="space-y-1.5">
      <label id={labelId} className="block text-[12.5px] font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {useSegmented ? (
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white"
        >
          {options.map((opt) => {
            const sel = value === opt
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => onChange(opt)}
                className={cn(
                  'border-l border-gray-200 px-3 py-1.5 text-[12.5px] transition-colors first:border-l-0',
                  sel ? 'bg-terracotta text-white font-medium' : 'bg-white text-gray-700 hover:bg-gray-50',
                )}
              >
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          aria-labelledby={labelId}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[13px] focus:border-terracotta focus:outline-none focus:ring-0"
        >
          <option value="">Select an option…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
