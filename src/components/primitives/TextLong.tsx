'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/** TextLong — multi-line textarea with optional label and AI draft button. */

export type TextLongProps = {
  value?: string
  onChange: (next: string) => void
  placeholder?: string
  rows?: number
  label?: string
  onAIDraft?: () => void
  aiDrafting?: boolean
  disabled?: boolean
  className?: string
  textareaClassName?: string
  id?: string
}

export function TextLong({
  value,
  onChange,
  placeholder,
  rows = 3,
  label,
  onAIDraft,
  aiDrafting,
  disabled,
  className,
  textareaClassName,
  id,
}: TextLongProps) {
  return (
    <div className={className}>
      {(label || onAIDraft) && (
        <div className="mb-1 flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                color: 'var(--ink-3)',
                letterSpacing: '0.08em',
              }}
            >
              {label}
            </label>
          )}
          {onAIDraft && (
            <button
              type="button"
              onClick={onAIDraft}
              disabled={aiDrafting || disabled}
              className={cn(
                'inline-flex items-center gap-1 rounded font-mono',
                'bg-transparent text-blue-600 disabled:opacity-50',
              )}
              style={{
                padding: '2px 8px',
                fontSize: 11,
                border: 'none',
                cursor: aiDrafting || disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <Sparkles className="size-[11px]" aria-hidden="true" />
              {aiDrafting ? 'Drafting…' : 'AI draft'}
            </button>
          )}
        </div>
      )}
      <textarea
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full font-mono outline-none',
          disabled && 'opacity-60',
          textareaClassName,
        )}
        style={{
          border: '1.25px solid #d0d0d0',
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 13.5,
          lineHeight: 1.6,
          resize: 'vertical',
          background: '#fff',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--terracotta)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#d0d0d0'
        }}
      />
    </div>
  )
}

export default TextLong
