"use client"

import { useState } from 'react'
import { BaseModal } from '@/components/ui/base-modal'
import { Button } from '@/components/ui/button'

export type DryRunSlide = {
  sectionId: string
  sectionTitle: string
  html: string
  updates: any[]
}

export function DryRunPreviewModal({
  open,
  onClose,
  slides,
  onApplyAll,
}: {
  open: boolean
  onClose: () => void
  slides: DryRunSlide[]
  onApplyAll: (approvedUpdates: any[]) => Promise<void> | void
}) {
  const [index, setIndex] = useState(0)
  const [approved, setApproved] = useState<Record<string, boolean>>({})
  const total = slides?.length || 0
  const current = slides[index] || null

  const next = () => setIndex((i) => Math.min(i + 1, Math.max(0, total - 1)))
  const prev = () => setIndex((i) => Math.max(0, i - 1))

  const toggleApprove = (sid: string) => {
    setApproved(prev => ({ ...prev, [sid]: !prev[sid] }))
  }

  const approvedCount = slides.filter(s => approved[s.sectionId]).length
  const approvedUpdates = slides
    .filter(s => approved[s.sectionId])
    .flatMap(s => s.updates || [])

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title={"Dry Run Preview"}
      size="xl"
      variant="clinical"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-gray-500">
            {total > 0 ? `Section ${index + 1} of ${total}` : 'No proposed updates'}
            {total > 0 && (
              <span className="ml-3 text-gray-600">Approved {approvedCount} / {total}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={prev} disabled={index <= 0}>Previous</Button>
            <Button variant="secondary" onClick={next} disabled={index >= total - 1}>Next</Button>
            <Button onClick={() => onApplyAll(approvedUpdates)} disabled={approvedCount === 0}>Apply Selected</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Steps header (HyperUI-inspired) */}
        <div>
          <h2 className="sr-only">Steps</h2>
          <div>
            <ol className="grid grid-cols-1 divide-x divide-gray-100 overflow-hidden rounded-lg border border-gray-100 text-sm text-gray-500 sm:grid-cols-3">
              <li className="flex items-center justify-center gap-2 p-4">
                <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                </svg>
                <p className="leading-none">
                  <strong className="block font-medium"> Review </strong>
                  <small className="mt-1"> Proposed changes </small>
                </p>
              </li>
              <li className="relative flex items-center justify-center gap-2 bg-gray-50 p-4">
                <span className="absolute top-1/2 -left-2 hidden size-4 -translate-y-1/2 rotate-45 border border-gray-100 sm:block ltr:border-s-0 ltr:border-b-0 ltr:bg-white rtl:border-e-0 rtl:border-t-0 rtl:bg-gray-50" />
                <span className="absolute top-1/2 -right-2 hidden size-4 -translate-y-1/2 rotate-45 border border-gray-100 sm:block ltr:border-s-0 ltr:border-b-0 ltr:bg-gray-50 rtl:border-e-0 rtl:border-t-0 rtl:bg-white" />
                <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18m-9 9V3" />
                </svg>
                <p className="leading-none">
                  <strong className="block font-medium"> Navigate </strong>
                  <small className="mt-1"> Use Prev/Next </small>
                </p>
              </li>
              <li className="flex items-center justify-center gap-2 p-4">
                <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="leading-none">
                  <strong className="block font-medium"> Apply </strong>
                  <small className="mt-1"> Commit updates </small>
                </p>
              </li>
            </ol>
          </div>
        </div>

        {current ? (
          <div className="rounded border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">{current.sectionTitle}</div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-400">{current.updates?.length || 0} field updates</div>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={!!approved[current.sectionId]}
                    onChange={() => toggleApprove(current.sectionId)}
                  />
                  Approve this section
                </label>
              </div>
            </div>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: current.html }} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No proposed updates to preview.</div>
        )}
      </div>
    </BaseModal>
  )
}

export default DryRunPreviewModal
