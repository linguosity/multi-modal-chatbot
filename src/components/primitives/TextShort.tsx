'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/** TextShort — single-line text input with mono styling and terracotta focus. */

export type TextShortProps = {
  value?: string
  onChange: (next: string) => void
  placeholder?: string
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
  id?: string
  ariaLabel?: string
  type?: 'text' | 'email' | 'tel' | 'url' | 'search'
}

export function TextShort({
  value,
  onChange,
  placeholder,
  disabled,
  style,
  className,
  id,
  ariaLabel,
  type = 'text',
}: TextShortProps) {
  return (
    <input
      id={id}
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn('w-full font-mono outline-none', disabled && 'opacity-60', className)}
      style={{
        border: '1.25px solid #d0d0d0',
        borderRadius: 6,
        padding: '7px 10px',
        fontSize: 13,
        background: '#fff',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--terracotta)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#d0d0d0'
      }}
    />
  )
}

export default TextShort
