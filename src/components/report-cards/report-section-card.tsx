'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REPORT_COLORS } from '@/lib/styles/report-card-colors'
import { toRoman } from '@/lib/export/report-to-export-data'

import type { ExportSection } from '@/lib/export/report-to-export-data'

/**
 * Helper to strip HTML tags and template placeholders from text for preview display
 */
function stripHtmlAndPlaceholders(html: string): string {
  if (!html) return ''

  // Remove HTML tags
  let text = html.replace(/<[^>]+>/g, '')

  // Remove any remaining template placeholders like {field_name}
  text = text.replace(/\{[^}]+\}/g, '')

  // Remove bracket placeholders like [Student Name]
  text = text.replace(/\[[^\]]+\]/g, '')

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  // Clean up multiple spaces and line breaks
  text = text.replace(/\s+/g, ' ').trim()

  return text
}

/**
 * Helper to detect if remaining text after stripping is just template skeleton
 * (field labels with no actual content values)
 */
function isTemplateSkeletonOnly(text: string): boolean {
  if (!text || text.length < 5) return true

  // After stripping placeholders, if remaining text is only labels (word: . word: . etc.) with no real values
  // Remove common label patterns like "Field name:" followed by optional whitespace/punctuation
  const withoutLabels = text
    .replace(/[A-Za-z\s\/]+:\s*/g, '') // Remove "Label:" patterns
    .replace(/[.,;:\s\-—]+/g, '')       // Remove punctuation and whitespace
    .replace(/\b(yes|no|n\/a|none|na)\b/gi, '') // Keep actual boolean values
    .trim()

  // If nothing meaningful remains after stripping labels, it's skeleton
  return withoutLabels.length < 10
}

export interface ReportSectionCardProps {
  /** Unique ID for dnd-kit (DB section ID) */
  id: string
  section: ExportSection
  sectionIndex: number
  /** Called when user clicks the card body to open the edit modal */
  onClick: () => void
  readOnly?: boolean
}

/**
 * Compact, uniform-sized section thumbnail card.
 * Shows a miniature preview of the section content.
 * Click to open in the edit modal. Drag the grip to reorder.
 */
export default function ReportSectionCard({
  id,
  section,
  sectionIndex,
  onClick,
  readOnly = false,
}: ReportSectionCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const roman = toRoman(sectionIndex + 1)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  // Build a plain-text preview from content + subsections
  // Strip HTML tags and placeholders to get clean preview text
  const previewLines: string[] = []
  if (section.content) {
    const cleanContent = stripHtmlAndPlaceholders(section.content)
    if (cleanContent) {
      previewLines.push(cleanContent.slice(0, 120))
    }
  }
  section.subsections.forEach((sub, i) => {
    const letter = String.fromCharCode(65 + i)
    const cleanHeading = stripHtmlAndPlaceholders(sub.heading)
    if (cleanHeading) {
      previewLines.push(`${letter}. ${cleanHeading}`)
    }
  })
  const previewText = previewLines.join('\n')
  const displayText = (!previewText || isTemplateSkeletonOnly(previewText)) ? 'No content yet' : previewText

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/card relative flex flex-col',
        'bg-white dark:bg-gray-950 rounded-lg border overflow-hidden',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'cursor-pointer select-none',
        isDragging && 'shadow-xl ring-2 ring-blue-300/60 scale-[1.02]',
        !isDragging && 'hover:border-[#2E75B6]/40',
      )}
      onClick={onClick}
    >
      {/* Heading bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-2 shrink-0"
        style={{ backgroundColor: REPORT_COLORS.headerBg }}
      >
        {/* Drag handle */}
        {!readOnly && (
          <span
            {...attributes}
            {...listeners}
            className={cn(
              'cursor-grab active:cursor-grabbing text-gray-400',
              'opacity-0 group-hover/card:opacity-60 hover:!opacity-100',
              'transition-opacity duration-150 shrink-0 -ml-1',
            )}
            aria-label="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </span>
        )}

        <span
          className="font-bold text-[11px] tracking-wide shrink-0"
          style={{ color: REPORT_COLORS.navy }}
        >
          {roman}.
        </span>
        <span
          className="font-bold text-[11px] tracking-wide uppercase truncate"
          style={{ color: REPORT_COLORS.navy }}
        >
          {section.title}
        </span>
      </div>

      {/* Content preview — clipped to card height */}
      <div className="flex-1 px-3 py-2 overflow-hidden relative min-h-[100px]">
        <p
          className="text-[10px] leading-relaxed whitespace-pre-line break-words"
          style={{ color: REPORT_COLORS.muted }}
        >
          {displayText}
        </p>

        {/* Fade-out gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
      </div>

      {/* Subsection count badge */}
      {section.subsections.length > 0 && (
        <div className="px-3 pb-2 pt-0">
          <span
            className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: REPORT_COLORS.light,
              color: REPORT_COLORS.navy,
            }}
          >
            {section.subsections.length} subsection{section.subsections.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
