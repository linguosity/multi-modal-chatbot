'use client'

import { useReport } from '@/lib/context/ReportContext'
import { useParams } from 'next/navigation'
import React from 'react'

function formatDateTime(iso: string) {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

export default function TimelinePage() {
  const { report } = useReport()
  const params = useParams<{ id: string }>()
  const activity = (report?.metadata as any)?.activity as Array<{ id: string; type: string; timestamp: string; sectionIds?: string[]; summaries?: string[] }>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">AI Activity Timeline</h1>
      {!activity || activity.length === 0 ? (
        <p className="text-sm text-gray-500">No AI activity yet for this report.</p>
      ) : (
        <ol className="relative border-s ml-4">
          {activity.slice().reverse().map((evt) => (
            <li key={evt.id} className="mb-6 ms-6">
              <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white">
                <span className="h-3 w-3 rounded-full bg-blue-600" />
              </span>
              <h3 className="mb-1 text-sm font-medium text-gray-900">{evt.type === 'ai_intake' ? 'AI Intake' : evt.type}</h3>
              <time className="block mb-2 text-xs font-normal leading-none text-gray-400">{formatDateTime(evt.timestamp)}</time>
              {evt.summaries && evt.summaries.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer select-none text-blue-600">Show process summaries</summary>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    {evt.summaries.map((s, i) => (<li key={i} className="text-gray-700">{s}</li>))}
                  </ul>
                </details>
              )}
              {evt.sectionIds && evt.sectionIds.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">Sections updated: {evt.sectionIds.join(', ')}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

