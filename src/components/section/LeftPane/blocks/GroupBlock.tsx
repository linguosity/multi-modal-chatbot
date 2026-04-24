'use client'

import React from 'react'
import { FieldBlock, type FieldBlockProps } from '../FieldBlock'

export function GroupBlock(props: FieldBlockProps) {
  const { field, value, onChange, registerLabel, onFocusField } = props
  const labelId = registerLabel(field.key)
  const groupValue = (value && typeof value === 'object' && !Array.isArray(value))
    ? (value as Record<string, unknown>)
    : {}
  const children = field.children || []
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div id={labelId} className="border-b border-gray-100 px-4 py-2 text-[12.5px] font-medium text-gray-700">
        {field.label}
      </div>
      <div className="space-y-3 p-4 pl-5 border-l-2 border-gray-100 ml-2">
        {children.map((child) => {
          const path = `${field.key}.${child.key}`
          return (
            <FieldBlock
              key={path}
              field={child}
              value={groupValue[child.key]}
              onChange={(v) => onChange({ ...groupValue, [child.key]: v })}
              registerLabel={(k) => registerLabel(`${field.key}.${k}`)}
              onFocusField={(k) => onFocusField(`${field.key}.${k}`)}
            />
          )
        })}
        {children.length === 0 && (
          <div className="text-[12px] text-gray-400">No fields in this group.</div>
        )}
      </div>
    </div>
  )
}
