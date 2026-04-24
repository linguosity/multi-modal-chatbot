'use client'

import React from 'react'
import type { FieldBlockProps } from '../FieldBlock'

export function NumberBlock({ field, value, onChange, registerLabel }: FieldBlockProps) {
  const labelId = registerLabel(field.key)
  const unit = (field as any).unit as string | undefined
  return (
    <div className="space-y-1.5">
      <label id={labelId} className="block text-[12.5px] font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      <div className="inline-flex items-center gap-2">
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            onChange(Number.isFinite(n) ? n : 0)
          }}
          placeholder={field.placeholder}
          aria-labelledby={labelId}
          className="w-32 rounded border border-gray-300 bg-white px-3 py-1.5 text-[13px] focus:border-terracotta focus:outline-none focus:ring-0"
        />
        {unit && <span className="text-[12px] text-gray-500">{unit}</span>}
      </div>
    </div>
  )
}
