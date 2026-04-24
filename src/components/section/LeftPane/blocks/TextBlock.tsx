'use client'

import React, { useEffect, useRef } from 'react'
import type { FieldBlockProps } from '../FieldBlock'

export function TextBlock({ field, value, onChange, registerLabel }: FieldBlockProps) {
  const labelId = registerLabel(field.key)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow on content change.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 88)}px`
  }, [value])

  return (
    <div className="space-y-1.5">
      <label id={labelId} className="block text-[12.5px] font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      <textarea
        ref={textareaRef}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Cmd+Enter / Ctrl+Enter commits (blurs to trigger autosave).
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.currentTarget.blur()
          }
        }}
        placeholder={field.placeholder}
        aria-labelledby={labelId}
        rows={3}
        className="w-full resize-none rounded border border-gray-300 bg-white px-3 py-2 text-[13px] leading-relaxed focus:border-terracotta focus:outline-none focus:ring-0"
      />
    </div>
  )
}
