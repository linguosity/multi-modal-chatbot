'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { YesNoDecision } from '@/components/primitives/YesNoDecision'
import type { FieldBlockProps } from '../FieldBlock'
import { cn } from '@/lib/utils'

export function YesNoBlock({ field, value, onChange, registerLabel }: FieldBlockProps) {
  const labelId = registerLabel(field.key)
  const [defOpen, setDefOpen] = useState(false)
  const definition = (field as any).definition as string | undefined
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label id={labelId} className="block text-[12.5px] font-medium text-gray-700">
            {field.label}
            {field.required && <span className="ml-0.5 text-rose-500">*</span>}
          </label>
          {definition && (
            <button
              type="button"
              onClick={() => setDefOpen((o) => !o)}
              aria-expanded={defOpen}
              className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700"
            >
              <ChevronDown
                className={cn('size-3 transition-transform', defOpen ? 'rotate-180' : 'rotate-0')}
                aria-hidden="true"
              />
              {defOpen ? 'Hide definition' : 'Show definition'}
            </button>
          )}
        </div>
        <YesNoDecision
          value={typeof value === 'boolean' ? value : null}
          onChange={onChange}
          ariaLabel={field.label}
          size="sm"
        />
      </div>
      {defOpen && definition && (
        <div className="rounded border border-gray-100 bg-gray-50 p-2.5 text-[12px] leading-relaxed text-gray-600">
          {definition}
        </div>
      )}
    </div>
  )
}
