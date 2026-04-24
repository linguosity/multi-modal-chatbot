'use client'

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Lock, Unlock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REPORT_COLORS } from '@/lib/styles/report-card-colors'
import { toRoman } from '@/lib/export/report-to-export-data'
import InlineEditField from './inline-edit-field'
import EditableRichText from './editable-rich-text'
import SubsectionCard from './subsection-card'

import type { ExportSection } from '@/lib/export/report-to-export-data'

interface SectionEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: ExportSection
  sectionIndex: number
  sectionId: string
  onTitleChange: (value: string) => void
  onContentChange: (html: string) => void
  onContentBlur?: (html: string) => void
  onSubsectionHeadingChange: (subIdx: number, value: string) => void
  onSubsectionContentChange: (subIdx: number, html: string) => void
  onSubsectionContentBlur?: (subIdx: number, html: string) => void
}

/**
 * Full-screen-ish modal for editing a single report section.
 * Opens when the user clicks a compact card in the grid.
 * Has a lock/unlock toggle to switch between view and edit modes.
 */
export default function SectionEditModal({
  open,
  onOpenChange,
  section,
  sectionIndex,
  sectionId,
  onTitleChange,
  onContentChange,
  onContentBlur,
  onSubsectionHeadingChange,
  onSubsectionContentChange,
  onSubsectionContentBlur,
}: SectionEditModalProps) {
  const [locked, setLocked] = useState(true)
  const isEditing = !locked
  const roman = toRoman(sectionIndex + 1)

  const handleClose = useCallback(() => {
    setLocked(true) // re-lock on close
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!max-w-3xl !w-[90vw] max-h-[85vh] overflow-hidden flex flex-col relative"
      >
        <DialogHeader className="shrink-0 pb-3 border-b">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="!text-base flex items-center gap-2">
              {/* Section heading bar inline */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold tracking-wide uppercase"
                style={{
                  backgroundColor: REPORT_COLORS.headerBg,
                  color: REPORT_COLORS.navy,
                }}
              >
                {roman}. {section.title}
              </span>
            </DialogTitle>

            {/* Lock / Edit toggle */}
            <button
              onClick={() => setLocked((prev) => !prev)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors mr-8',
                isEditing
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {isEditing ? (
                <>
                  <Unlock className="w-3.5 h-3.5" /> Editing
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" /> Locked
                </>
              )}
            </button>
          </div>
          <DialogDescription className="sr-only">
            Edit section {section.title}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
          {/* Section title (editable) */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">
              Section Title
            </label>
            <div
              className="px-3 py-2 rounded-sm"
              style={{ backgroundColor: REPORT_COLORS.headerBg }}
            >
              <InlineEditField
                value={section.title.toUpperCase()}
                onChange={onTitleChange}
                readOnly={locked}
                placeholder="Section title…"
                className="font-bold text-sm tracking-wide uppercase"
                viewClassName="font-bold uppercase tracking-wide"
                editClassName="font-bold uppercase tracking-wide"
              />
            </div>
          </div>

          {/* Main content */}
          {(section.content || isEditing) && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">
                Content
              </label>
              <EditableRichText
                content={section.content || ''}
                onChange={onContentChange}
                onBlur={onContentBlur}
                readOnly={locked}
                minHeight="3rem"
                className="text-sm leading-relaxed"
              />
            </div>
          )}

          {/* Subsections */}
          {section.subsections.length > 0 && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">
                Subsections
              </label>
              <div className="space-y-3">
                {section.subsections.map((sub, subIdx) => (
                  <SubsectionCard
                    key={subIdx}
                    letter={String.fromCharCode(65 + subIdx)}
                    heading={sub.heading}
                    content={sub.content}
                    onHeadingChange={(val) => onSubsectionHeadingChange(subIdx, val)}
                    onContentChange={(html) => onSubsectionContentChange(subIdx, html)}
                    onContentBlur={(html) => onSubsectionContentBlur?.(subIdx, html)}
                    readOnly={locked}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
