'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/** SegmentedControl — inline-flex group of mono-styled buttons; one active. */

export type SegmentedOption<T extends string> =
  | T
  | { value: T; label: string }

export type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (next: T) => void
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex overflow-hidden rounded-md',
        className,
      )}
      style={{ border: '1.25px solid #d0d0d0' }}
    >
      {options.map((opt, i) => {
        const v = (typeof opt === 'string' ? opt : opt.value) as T
        const label = typeof opt === 'string' ? opt : opt.label
        const active = value === v
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(v)}
            className={cn(
              'font-mono transition-colors',
              disabled && 'cursor-not-allowed opacity-60',
            )}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              border: 'none',
              borderLeft: i > 0 ? '1px solid #d0d0d0' : 'none',
              background: active ? '#111' : '#fff',
              color: active ? '#fff' : '#3a3a3a',
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.04em',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
