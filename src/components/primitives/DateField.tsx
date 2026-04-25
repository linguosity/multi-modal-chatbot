'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/** DateField — native date input with mono styling and terracotta focus. */

export type DateFieldProps = {
  value?: string
  onChange: (next: string) => void
  disabled?: boolean
  min?: string
  max?: string
  style?: React.CSSProperties
  className?: string
  id?: string
  ariaLabel?: string
}

export function DateField({
  value,
  onChange,
  disabled,
  min,
  max,
  style,
  className,
  id,
  ariaLabel,
}: DateFieldProps) {
  return (
    <input
      id={id}
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      min={min}
      max={max}
      aria-label={ariaLabel}
      className={cn('font-mono outline-none', disabled && 'opacity-60', className)}
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

export default DateField
