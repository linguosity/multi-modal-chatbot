'use client'

import React from 'react'
import type { BlockFieldSchema } from '../../LeftPane/FieldBlock'

/**
 * Schema facet — read-only display of the focused field's metadata for
 * the spike. Editing (label / key / type / placeholder / required) is
 * the next-cycle task; it lifts wholesale from DynamicSchemaEditor's
 * existing inline editor. Stub here keeps the layout honest.
 */
export function SchemaFacet({ field }: { field: BlockFieldSchema | null }) {
  if (!field) {
    return <Empty>Click a field on the left to inspect its schema.</Empty>
  }
  return (
    <div className="space-y-3 text-[12.5px]">
      <Row label="Label">{field.label}</Row>
      <Row label="Key">
        <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11.5px]">{field.key}</code>
      </Row>
      <Row label="Type">{field.type}</Row>
      {field.required && <Row label="Required">Yes</Row>}
      {field.placeholder && <Row label="Placeholder">{field.placeholder}</Row>}
      {field.options && field.options.length > 0 && (
        <Row label="Options">{field.options.join(' · ')}</Row>
      )}
      <p className="rounded border border-dashed border-gray-200 bg-gray-50 p-2 text-[11.5px] text-gray-500">
        Inline schema editing wires the existing template-tab logic here next.
      </p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-baseline gap-2">
      <dt className="text-[11.5px] font-medium text-gray-500">{label}</dt>
      <dd className="text-gray-800">{children}</dd>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-[12.5px] text-gray-400">{children}</div>
}
