'use client'

import React from 'react'
import { MultiSelectChips } from '@/components/primitives/MultiSelectChips'
import type { FieldBlockProps } from '../FieldBlock'

export function ListBlock({ field, value, onChange, registerLabel, suggestions }: FieldBlockProps) {
  const labelId = registerLabel(field.key)
  const items = Array.isArray(value) ? (value as string[]) : []
  return (
    <div className="space-y-1.5">
      <label id={labelId} className="block text-[12.5px] font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      <MultiSelectChips
        value={items}
        onChange={(next) => onChange(next)}
        suggestions={suggestions || []}
        placeholder={field.placeholder || 'Type and press Enter…'}
        ariaLabel={field.label}
      />
    </div>
  )
}
