'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { REPORT_COLORS } from '@/lib/styles/report-card-colors'

interface InlineEditFieldProps {
  value: string
  onChange: (value: string) => void
  onBlur?: (value: string) => void
  multiline?: boolean
  placeholder?: string
  readOnly?: boolean
  className?: string
  /** Tailwind classes for the view-mode span */
  viewClassName?: string
  /** Tailwind classes for the edit-mode input/textarea */
  editClassName?: string
}

/**
 * Click-to-edit field that renders as a styled span in view mode
 * and a transparent input/textarea in edit mode.
 *
 * Follows the inline edit pattern from template-editor.tsx:
 * - Click to activate
 * - Enter commits (single-line) / blur commits
 * - Escape cancels
 * - Auto-focus on activation
 */
export default function InlineEditField({
  value,
  onChange,
  onBlur,
  multiline = false,
  placeholder = 'Click to edit…',
  readOnly = false,
  className,
  viewClassName,
  editClassName,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Keep draft in sync when value changes externally
  useEffect(() => {
    if (!isEditing) setDraft(value)
  }, [value, isEditing])

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Place cursor at end
      const len = draft.length
      inputRef.current.setSelectionRange(len, len)
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback(() => {
    setIsEditing(false)
    if (draft !== value) {
      onChange(draft)
      onBlur?.(draft)
    } else {
      onBlur?.(draft)
    }
  }, [draft, value, onChange, onBlur])

  const cancel = useCallback(() => {
    setDraft(value)
    setIsEditing(false)
  }, [value])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault()
        commit()
      }
    },
    [cancel, commit, multiline]
  )

  if (readOnly) {
    return (
      <span className={cn('inline', className, viewClassName)}>
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
      </span>
    )
  }

  if (isEditing) {
    const sharedClasses = cn(
      'w-full bg-transparent outline-none',
      'border-b-2 border-[#2E75B6] focus:border-[#1B365D]',
      'transition-colors duration-150',
      'font-inherit text-inherit leading-inherit',
      className,
      editClassName
    )

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className={cn(sharedClasses, 'resize-y min-h-[3rem]')}
        />
      )
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={sharedClasses}
      />
    )
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        'inline cursor-text',
        'hover:bg-blue-50/60 dark:hover:bg-blue-900/20',
        'rounded px-0.5 -mx-0.5 transition-colors duration-150',
        className,
        viewClassName
      )}
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </span>
  )
}
