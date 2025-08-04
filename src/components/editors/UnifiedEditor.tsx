'use client'

import React, { forwardRef } from 'react'
import { RichTextEditor, type RichTextEditorProps } from './RichTextEditor'
import { StructuredEditor, type StructuredEditorProps } from './StructuredEditor'
import { BulletListEditor, type BulletListEditorProps } from './BulletListEditor'
import { CardStackEditor, type CardStackEditorProps } from './CardStackEditor'
import type { BaseEditorProps, EditorRef, EditorMode } from './BaseEditor'

export interface UnifiedEditorProps extends BaseEditorProps {
  /** Editor mode - determines which editor to use */
  mode: EditorMode
  /** Rich text editor specific props */
  richTextProps?: Partial<RichTextEditorProps>
  /** Structured editor specific props */
  structuredProps?: Partial<StructuredEditorProps>
  /** Bullet list editor specific props */
  bulletListProps?: Partial<BulletListEditorProps>
  /** Card stack editor specific props */
  cardStackProps?: Partial<CardStackEditorProps>
}

export const UnifiedEditor = forwardRef<EditorRef, UnifiedEditorProps>(
  (
    {
      mode,
      richTextProps,
      structuredProps,
      bulletListProps,
      cardStackProps,
      ...baseProps
    },
    ref
  ) => {
    // Render the appropriate editor based on mode
    switch (mode) {
      case 'rich-text':
        return (
          <RichTextEditor
            ref={ref}
            {...baseProps}
            {...richTextProps}
          />
        )

      case 'structured':
        if (!structuredProps?.schema) {
          console.error('StructuredEditor requires a schema prop')
          return (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="text-red-700 font-medium">Configuration Error</div>
              <div className="text-red-600 text-sm mt-1">
                Structured editor mode requires a schema to be provided.
              </div>
            </div>
          )
        }
        return (
          <StructuredEditor
            ref={ref}
            {...baseProps}
            {...structuredProps}
          />
        )

      case 'bullet-list':
        return (
          <BulletListEditor
            ref={ref}
            {...baseProps}
            {...bulletListProps}
          />
        )

      case 'card-stack':
        return (
          <CardStackEditor
            ref={ref}
            {...baseProps}
            {...cardStackProps}
          />
        )

      default:
        console.error(`Unknown editor mode: ${mode}`)
        return (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="text-red-700 font-medium">Unknown Editor Mode</div>
            <div className="text-red-600 text-sm mt-1">
              The editor mode "{mode}" is not supported. Available modes: rich-text, structured, bullet-list, card-stack.
            </div>
          </div>
        )
    }
  }
)

UnifiedEditor.displayName = 'UnifiedEditor'