'use client'

import React from 'react'
import { FieldBlock, type BlockFieldSchema } from './FieldBlock'
import { ParallelDomainBlock } from './blocks/ParallelDomainBlock'

/**
 * Renders the section's flat field list as a vertical stack of FieldBlocks.
 *
 * Spike heuristic for parallel-domain sections: when the section's flat
 * field list has 3+ fields with keys ending in `_notes`, render them as a
 * single ParallelDomainBlock (one chip row + focused editor) rather than
 * stacking all textareas. Long-term this should be a formal section-level
 * hint, not key-name sniffing.
 */

type Props = {
  fields: BlockFieldSchema[]
  data: Record<string, unknown>
  onFieldChange: (key: string, value: unknown) => void
  registerLabel: (key: string) => string
  onFocusField: (key: string) => void
  suggestionsForField?: (key: string) => string[]
}

export function FieldBlockList({
  fields,
  data,
  onFieldChange,
  registerLabel,
  onFocusField,
  suggestionsForField,
}: Props) {
  const notesFields = fields.filter((f) => /_notes$/.test(f.key) && (f.type === 'string' || f.type === 'paragraph' || f.type === 'text'))
  const useParallelDomains = notesFields.length >= 3
  const restFields = useParallelDomains
    ? fields.filter((f) => !notesFields.includes(f))
    : fields

  return (
    <div className="space-y-4">
      {useParallelDomains && (
        <ParallelDomainBlock
          field={notesFields[0]}
          value={data[notesFields[0].key]}
          onChange={(v) => onFieldChange(notesFields[0].key, v)}
          registerLabel={registerLabel}
          onFocusField={onFocusField}
          allFields={notesFields}
          allValues={data}
          onAllChange={(k, v) => onFieldChange(k, v)}
        />
      )}

      {restFields.map((field) => (
        <FieldBlock
          key={field.key}
          field={field}
          value={data[field.key]}
          onChange={(v) => onFieldChange(field.key, v)}
          registerLabel={registerLabel}
          onFocusField={onFocusField}
          suggestions={suggestionsForField?.(field.key)}
        />
      ))}

      {fields.length === 0 && (
        <div className="rounded border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-[13px] text-gray-500">
          No fields configured for this section yet.
        </div>
      )}
    </div>
  )
}
