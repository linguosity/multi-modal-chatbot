'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { FocusProvider, useFocusedField } from './state/FocusContext'
import { FieldBlockList } from './LeftPane/FieldBlockList'
import { FieldInspector } from './RightPane/FieldInspector'
import type { BlockFieldSchema } from './LeftPane/FieldBlock'
import type { SectionSchema } from '@/lib/structured-schemas'
import type { Json } from '@/lib/types/json'

/**
 * SectionPageV2 — split-pane section editor (spike).
 *
 * Replaces the three-tab Data entry / Edit template / Sources layout with
 * a single canvas: vertical block stack on the left, contextual inspector
 * (Schema / AI / Sources facets, focused-field-scoped) on the right.
 *
 * Behavioral parity with the v1 page is intentionally narrow for this
 * spike — value updates flow through the same `onChange(data, generatedText)`
 * contract the v1 component uses, so autosave / Save Report / nav / sidebar
 * progress all keep working without modification.
 */

type Props = {
  schema: SectionSchema
  initialData?: Json
  sectionTitle: string
  sectionIndex: number
  totalSections: number
  onChange: (data: Json, generatedText: string) => void
}

const SUGGESTIONS: Record<string, string[]> = {
  testing_accommodations: [
    'Extended time',
    'Small group setting',
    'Frequent breaks',
    'Oral administration',
    'Simplified directions',
    'Reduced-distraction environment',
    'Visual supports',
  ],
  classroom_modifications: [
    'Preferential seating',
    'Visual supports',
    'Break down multi-step directions',
    'Provide written checklists',
    'Allow extra processing time',
    'Pre-teach vocabulary',
    'Repeat/rephrase instructions',
  ],
  domains_assessed: [
    'Articulation',
    'Phonology',
    'Receptive language',
    'Expressive language',
    'Pragmatics',
    'Voice',
    'Fluency',
    'Hearing',
  ],
}

export default function SectionPageV2(props: Props) {
  return (
    <FocusProvider>
      <SectionPageV2Inner {...props} />
    </FocusProvider>
  )
}

function SectionPageV2Inner({
  schema,
  initialData,
  sectionTitle,
  sectionIndex,
  totalSections,
  onChange,
}: Props) {
  const [data, setData] = useState<Record<string, unknown>>(
    (initialData as Record<string, unknown>) ?? {},
  )
  const focus = useFocusedField()

  // Sync with parent updates (e.g. after autosave round-trip / AI intake).
  useEffect(() => {
    setData((initialData as Record<string, unknown>) ?? {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  const fields = useMemo<BlockFieldSchema[]>(
    () => (schema.fields as unknown as BlockFieldSchema[]) ?? [],
    [schema],
  )

  const onFieldChange = useCallback(
    (key: string, value: unknown) => {
      const next = { ...data, [key]: value }
      setData(next)
      // Light-weight prose generator stub: dump key:value pairs. v1's
      // structured-block has its own template-driven generator; we mirror
      // its onChange shape so the parent's autosave still fires.
      const generatedText = Object.entries(next)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join('\n')
      onChange(next as Json, generatedText)
    },
    [data, onChange],
  )

  const registerLabel = useCallback(
    (key: string) => `field-${schema.key}-${key.replace(/[^a-z0-9_-]/gi, '-')}`,
    [schema.key],
  )
  const onFocusField = useCallback(
    (key: string) => focus.setFocusedField(key),
    [focus],
  )

  const filledCount = useMemo(() => {
    let n = 0
    for (const f of fields) {
      const v = data[f.key]
      if (v === null || v === undefined) continue
      if (typeof v === 'string' && v.trim() === '') continue
      if (Array.isArray(v) && v.length === 0) continue
      if (typeof v === 'object' && Object.keys(v as object).length === 0) continue
      n++
    }
    return n
  }, [fields, data])
  const totalCount = fields.length
  const pct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--paper)]">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="min-w-0">
          <div className="text-[11.5px] font-medium text-gray-500">
            Section {sectionIndex + 1} of {totalSections}
          </div>
          <h1 className="truncate text-[19px] font-medium text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
            {sectionTitle}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="hidden md:flex items-center gap-2 text-[12px] text-gray-500"
            aria-label={`Section progress: ${filledCount} of ${totalCount} fields`}
          >
            <div className="h-1 w-32 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-terracotta transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span>{filledCount}/{totalCount} fields · {pct}%</span>
          </div>
          <button
            type="button"
            onClick={focus.toggleStructureMode}
            className={
              'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition-colors ' +
              (focus.structureMode
                ? 'border-terracotta bg-terracotta/10 text-terracotta'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')
            }
            aria-pressed={focus.structureMode}
            title="Spike: structure mode is a stub — drag handles + add-field affordances wire next."
          >
            <Settings2 className="size-3.5" />
            Edit structure
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl">
            {focus.structureMode && (
              <div className="mb-4 rounded border border-dashed border-terracotta/50 bg-[#fff5ee] px-3 py-2 text-[12px] text-[#8a4a30]">
                Structure-mode is a stub on this spike. Drag-to-reorder and "+ Add field"
                affordances wire from the existing template editor in the next pass.
              </div>
            )}
            <FieldBlockList
              fields={fields}
              data={data}
              onFieldChange={onFieldChange}
              registerLabel={registerLabel}
              onFocusField={onFocusField}
              suggestionsForField={(k) => SUGGESTIONS[k] || []}
            />
          </div>
        </div>
        <FieldInspector fields={fields} data={data} />
      </div>
    </div>
  )
}
