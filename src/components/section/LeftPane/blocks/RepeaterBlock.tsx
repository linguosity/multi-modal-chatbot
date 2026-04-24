'use client'

import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { FieldBlock, type FieldBlockProps } from '../FieldBlock'

/**
 * RepeaterBlock — used by Assessment Tools (and any array-of-objects field).
 * Compact row list on top + focused detail editor below for the selected row.
 *
 * Spike scope: titles + completed badge + remove on each row, single-row
 * detail editor below. Drag-to-reorder, "AI extract from sources", and
 * column-config are deferred to the Template D follow-up.
 */
export function RepeaterBlock({ field, value, onChange, registerLabel, onFocusField }: FieldBlockProps) {
  const labelId = registerLabel(field.key)
  const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : []
  const [selected, setSelected] = useState<number>(items.length > 0 ? 0 : -1)
  const children = field.children || []

  const newItem = () => {
    return children.reduce<Record<string, unknown>>((acc, c) => {
      acc[c.key] = c.type === 'number' ? 0 : c.type === 'boolean' ? false : c.type === 'array' ? [] : ''
      return acc
    }, {})
  }

  const updateItem = (idx: number, patch: Record<string, unknown>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    onChange(next)
  }
  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
    setSelected((s) => (s >= idx ? Math.max(0, s - 1) : s))
  }
  const addItem = () => {
    const next = [...items, newItem()]
    onChange(next)
    setSelected(next.length - 1)
  }

  const detailIdx = selected >= 0 && selected < items.length ? selected : -1
  const detail = detailIdx >= 0 ? items[detailIdx] : null
  const titleField = children.find((c) => c.key === 'title' || c.key === 'name') || children[0]
  const titleOf = (it: Record<string, unknown>, idx: number) => {
    const v = titleField ? (it as any)[titleField.key] : ''
    return (typeof v === 'string' && v.trim()) || `Item ${idx + 1}`
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <span id={labelId} className="text-[12.5px] font-medium text-gray-700">
          {field.label}
          <span className="ml-1.5 text-[11px] text-gray-400">{items.length}</span>
        </span>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-[11.5px] text-gray-700 hover:bg-gray-50"
        >
          <Plus className="size-3" /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-4 text-[12.5px] text-gray-400">
          No entries yet. Click <span className="font-medium text-gray-600">Add</span> to start.
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-100">
            {items.map((it, idx) => (
              <li
                key={idx}
                className={
                  'flex items-center justify-between px-4 py-1.5 text-[13px] cursor-pointer ' +
                  (idx === selected ? 'bg-gray-50' : 'hover:bg-gray-50')
                }
                onClick={() => setSelected(idx)}
              >
                <span className="flex items-center gap-2 truncate">
                  {(it as any)?.completed === true && (
                    <span className="inline-block size-1.5 rounded-full bg-emerald-500" aria-label="completed" />
                  )}
                  <span className="truncate">{titleOf(it, idx)}</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeItem(idx)
                  }}
                  aria-label={`Remove ${titleOf(it, idx)}`}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>

          {detail && (
            <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-400">
                Editing: {titleOf(detail, detailIdx)}
              </div>
              {children.map((child) => (
                <FieldBlock
                  key={child.key}
                  field={child}
                  value={(detail as any)[child.key]}
                  onChange={(v) => updateItem(detailIdx, { [child.key]: v })}
                  registerLabel={(k) => registerLabel(`${field.key}[${detailIdx}].${k}`)}
                  onFocusField={(k) => onFocusField(`${field.key}[${detailIdx}].${k}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
