'use client'

import React, { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import TiptapEditor from '@/components/TiptapEditor'
import { Pencil } from 'lucide-react'

interface EditableRichTextProps {
  content: string
  onChange: (html: string) => void
  onBlur?: (html: string) => void
  readOnly?: boolean
  minHeight?: string
  className?: string
  /** Whether to show a pencil icon overlay on hover */
  showEditIcon?: boolean
}

/**
 * Click-to-edit rich text block.
 *
 * View mode: renders HTML content via dangerouslySetInnerHTML.
 * Edit mode: mounts TiptapEditor with the content.
 *
 * Clicking anywhere activates editing. Blur commits and returns to view.
 */
export default function EditableRichText({
  content,
  onChange,
  onBlur,
  readOnly = false,
  minHeight = '2rem',
  className,
  showEditIcon = true,
}: EditableRichTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [latestHtml, setLatestHtml] = useState(content)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleActivate = useCallback(() => {
    if (!readOnly) {
      setLatestHtml(content)
      setIsEditing(true)
    }
  }, [readOnly, content])

  const handleChange = useCallback(
    (html: string) => {
      setLatestHtml(html)
      onChange(html)
    },
    [onChange]
  )

  const handleBlur = useCallback(
    (html: string) => {
      setIsEditing(false)
      onBlur?.(html)
    },
    [onBlur]
  )

  // View mode — render HTML, click to edit
  if (!isEditing) {
    const isEmpty = !content || content.replace(/<[^>]*>/g, '').trim().length === 0

    return (
      <div
        ref={containerRef}
        onClick={handleActivate}
        className={cn(
          'group relative',
          !readOnly && 'cursor-text hover:ring-1 hover:ring-[#2E75B6]/30 rounded transition-all duration-150',
          className
        )}
        style={{ minHeight }}
      >
        {isEmpty ? (
          <p className="text-gray-400 italic text-sm py-1">
            {readOnly ? 'No content' : 'Click to add content…'}
          </p>
        ) : (
          <div
            className="tiptap prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        {/* Pencil icon overlay */}
        {showEditIcon && !readOnly && !isEmpty && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity duration-150">
            <Pencil className="w-3.5 h-3.5 text-[#2E75B6]" />
          </div>
        )}
      </div>
    )
  }

  // Edit mode — TiptapEditor
  return (
    <div
      className={cn(
        'ring-2 ring-[#2E75B6]/40 rounded transition-all duration-150',
        className
      )}
      style={{ minHeight }}
    >
      <TiptapEditor
        content={latestHtml}
        onChange={handleChange}
        onBlur={handleBlur}
        editable={true}
        withBorder={false}
        scrollable={false}
        showTemplateTools={false}
      />
    </div>
  )
}
