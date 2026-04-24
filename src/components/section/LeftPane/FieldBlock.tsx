'use client'

import React from 'react'
import { useFocusedField } from '../state/FocusContext'
import { StringBlock } from './blocks/StringBlock'
import { TextBlock } from './blocks/TextBlock'
import { YesNoBlock } from './blocks/YesNoBlock'
import { DateBlock } from './blocks/DateBlock'
import { NumberBlock } from './blocks/NumberBlock'
import { SelectBlock } from './blocks/SelectBlock'
import { ListBlock } from './blocks/ListBlock'
import { GroupBlock } from './blocks/GroupBlock'
import { RepeaterBlock } from './blocks/RepeaterBlock'
import { NarrativeBlock } from './blocks/NarrativeBlock'

/** Local, narrow FieldSchema shape — kept independent of the canonical
 *  type so the spike can iterate without touching schema modules. */
export interface BlockFieldSchema {
  key: string
  label: string
  type: string
  required?: boolean
  options?: string[]
  placeholder?: string
  children?: BlockFieldSchema[]
  // Optional display hints used by individual blocks.
  unit?: string
  definition?: string
  variant?: 'narrative'
}

export type FieldBlockProps = {
  field: BlockFieldSchema
  value: unknown
  onChange: (next: unknown) => void
  registerLabel: (key: string) => string
  onFocusField: (key: string) => void
  /** Optional list of seeded suggestions (for ListBlock chips). */
  suggestions?: string[]
}

/**
 * Type dispatcher. The `field.type` strings line up with the existing
 * structured-schemas types (string / boolean / number / date / select /
 * array / object / etc.) plus a couple of variants the spike introduces
 * (`narrative`, `repeater`).
 */
export function FieldBlock(props: FieldBlockProps) {
  const { field, onFocusField } = props
  const focus = useFocusedField()

  const onFocus = () => {
    focus.setFocusedField(field.key)
    onFocusField(field.key)
  }

  const Inner = (() => {
    switch (field.type) {
      case 'boolean':
      case 'yes_no':
        return <YesNoBlock {...props} />
      case 'date':
        return <DateBlock {...props} />
      case 'number':
        return <NumberBlock {...props} />
      case 'select':
        return <SelectBlock {...props} />
      case 'array':
        // Arrays of objects → repeater. Bare string arrays → ListBlock.
        return field.children && field.children.length > 0 ? (
          <RepeaterBlock {...props} />
        ) : (
          <ListBlock {...props} />
        )
      case 'object':
        return <GroupBlock {...props} />
      case 'narrative':
        return <NarrativeBlock {...props} />
      case 'paragraph':
      case 'text':
        return <TextBlock {...props} />
      case 'string':
        // Long fields with lengthy placeholder text get the textarea by
        // default — closer to the clinical reality.
        return field.variant === 'narrative' || (field.placeholder && field.placeholder.length > 60)
          ? <TextBlock {...props} />
          : <StringBlock {...props} />
      default:
        return <StringBlock {...props} />
    }
  })()

  const isFocused = focus.focusedFieldKey === field.key

  return (
    <div
      onFocusCapture={onFocus}
      onClickCapture={onFocus}
      className={
        'rounded-md transition-colors ' +
        (isFocused ? 'ring-1 ring-terracotta/40 bg-white/40' : '')
      }
    >
      {Inner}
    </div>
  )
}
