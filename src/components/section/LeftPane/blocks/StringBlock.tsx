'use client'

import React from 'react'
import type { FieldBlockProps } from '../FieldBlock'

export function StringBlock({ field, value, onChange, registerLabel }: FieldBlockProps) {
  const labelId = registerLabel(field.key)
  return (
    <div className="space-y-1.5">
      <label id={labelId} className="block text-[12.5px] font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      <input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        aria-labelledby={labelId}
        className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-[13px] focus:border-terracotta focus:outline-none focus:ring-0"
      />
    </div>
  )
}
