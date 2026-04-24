'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { REPORT_COLORS } from '@/lib/styles/report-card-colors'
import InlineEditField from './inline-edit-field'
import EditableRichText from './editable-rich-text'

interface SubsectionCardProps {
  letter: string
  heading: string
  content: string
  onHeadingChange: (value: string) => void
  onContentChange: (html: string) => void
  onContentBlur?: (html: string) => void
  readOnly?: boolean
}

/**
 * Lettered subsection card (A, B, C...) matching PDF export style:
 * - Bold italic heading with letter prefix
 * - Shaded content box with border
 */
export default function SubsectionCard({
  letter,
  heading,
  content,
  onHeadingChange,
  onContentChange,
  onContentBlur,
  readOnly = false,
}: SubsectionCardProps) {
  return (
    <div className="mt-3">
      {/* Subsection heading: "A. Heading Text" */}
      <div className="flex items-baseline gap-1 mb-1.5">
        <span
          className="font-bold text-sm"
          style={{ color: REPORT_COLORS.navy }}
        >
          {letter}.
        </span>
        <InlineEditField
          value={heading}
          onChange={onHeadingChange}
          readOnly={readOnly}
          placeholder="Subsection heading…"
          className="font-bold italic text-sm"
          viewClassName="font-bold italic"
          editClassName="font-bold italic"
        />
      </div>

      {/* Shaded content box */}
      <div
        className={cn(
          'ml-3 rounded',
          'border px-3 py-2'
        )}
        style={{
          backgroundColor: REPORT_COLORS.light,
          borderColor: REPORT_COLORS.border,
        }}
      >
        <EditableRichText
          content={content}
          onChange={onContentChange}
          onBlur={onContentBlur}
          readOnly={readOnly}
          minHeight="1.5rem"
          showEditIcon={false}
          className="text-sm leading-relaxed"
        />
      </div>
    </div>
  )
}
