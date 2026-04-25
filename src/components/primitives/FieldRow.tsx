'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type FieldRowProps = {
  label: React.ReactNode
  required?: boolean
  chips?: React.ReactNode
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export function FieldRow({
  label,
  required,
  chips,
  children,
  style,
  className,
}: FieldRowProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)} style={style}>
      <div className="flex items-center gap-1.5">
        <label
          className="font-mono font-medium"
          style={{
            fontSize: 11.5,
            color: 'var(--ink-2)',
            letterSpacing: '0.04em',
          }}
        >
          {label}
          {required && (
            <span style={{ color: '#e11d48', marginLeft: 2 }}>*</span>
          )}
        </label>
        {chips}
      </div>
      {children}
    </div>
  )
}

export default FieldRow
