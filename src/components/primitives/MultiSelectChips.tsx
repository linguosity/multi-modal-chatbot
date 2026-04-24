'use client'

import React, { useMemo, useState, useCallback, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * MultiSelectChips — tag input with optional suggested chips and free-add.
 * Replaces the embarrassing "Enter items separated by commas" textarea
 * pattern (data-entry redesign §2 + §4.12).
 *
 * Behaviors:
 *  - Selected values render as removable chips (× to delete).
 *  - Suggestions render below as ghost chips; click to add. Already-
 *    selected suggestions are filtered out so the user can't dupe.
 *  - Free-add: type into the input and hit Enter / comma / Tab to add a
 *    new chip. Free-add can be disabled to make the field strictly
 *    suggestion-bound.
 *  - Backspace on an empty input pops the last chip (Mac-mail style).
 */

export type MultiSelectChipsProps = {
  value?: string[]
  onChange: (next: string[]) => void
  /** Suggested chips. Click to add. Already-selected ones are hidden. */
  suggestions?: string[]
  /** Allow typing arbitrary new values. Defaults true. */
  freeAdd?: boolean
  placeholder?: string
  ariaLabel?: string
  maxCount?: number
  disabled?: boolean
}

export function MultiSelectChips({
  value,
  onChange,
  suggestions = [],
  freeAdd = true,
  placeholder = 'Add…',
  ariaLabel,
  maxCount,
  disabled,
}: MultiSelectChipsProps) {
  const items = Array.isArray(value) ? value : []
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedSet = useMemo(
    () => new Set(items.map((v) => v.trim().toLowerCase())),
    [items],
  )
  const remainingSuggestions = useMemo(
    () => suggestions.filter((s) => !selectedSet.has(s.trim().toLowerCase())),
    [suggestions, selectedSet],
  )

  const atMax = typeof maxCount === 'number' && items.length >= maxCount

  const addItem = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return
      if (selectedSet.has(trimmed.toLowerCase())) return
      if (atMax) return
      onChange([...items, trimmed])
      setDraft('')
    },
    [items, selectedSet, atMax, onChange],
  )

  const removeItem = useCallback(
    (idx: number) => {
      const next = items.filter((_, i) => i !== idx)
      onChange(next)
    },
    [items, onChange],
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      if (draft.trim()) {
        e.preventDefault()
        addItem(draft)
      }
    } else if (e.key === 'Backspace' && draft === '' && items.length > 0) {
      e.preventDefault()
      removeItem(items.length - 1)
    }
  }

  return (
    <div
      className={cn(
        'rounded-md border bg-white px-2 py-1.5',
        disabled ? 'border-gray-200 opacity-60' : 'border-gray-300 focus-within:border-terracotta',
      )}
      role="group"
      aria-label={ariaLabel}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[12.5px] text-gray-800"
          >
            {item}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeItem(i)
                }}
                aria-label={`Remove ${item}`}
                className="rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && freeAdd && !atMax && (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => draft.trim() && addItem(draft)}
            placeholder={items.length === 0 ? placeholder : ''}
            className="min-w-[100px] flex-1 border-0 bg-transparent px-1 py-0.5 text-[13px] outline-none focus:ring-0"
          />
        )}
      </div>

      {remainingSuggestions.length > 0 && !disabled && (
        <div className="mt-1.5 flex flex-wrap gap-1.5 border-t border-dashed border-gray-200 pt-1.5">
          <span className="text-[11px] text-gray-400 self-center pr-1">Suggested:</span>
          {remainingSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                addItem(s)
              }}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 bg-white px-2 py-0.5 text-[12px] text-gray-600 hover:border-gray-400 hover:bg-gray-50"
            >
              <Plus className="size-3" aria-hidden="true" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default MultiSelectChips
