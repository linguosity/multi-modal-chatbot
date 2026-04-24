'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useReport } from '@/lib/context/ReportContext'

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { report, loading } = useReport()
  const shouldOpenAI = searchParams.get('ai') === '1'

  // Redirect to first section when report loads
  useEffect(() => {
    if (report && report.sections.length > 0) {
      const firstSectionId = report.sections[0].id
      // If ai=1, redirect without the query param but dispatch the event once mounted
      if (shouldOpenAI) {
        router.replace(`/dashboard/reports/${id}/${firstSectionId}`)
      } else {
        router.replace(`/dashboard/reports/${id}/${firstSectionId}`)
      }
    }
  }, [report, id, router, shouldOpenAI])

  // After redirect, dispatch open-ai event to auto-open the drawer
  useEffect(() => {
    if (shouldOpenAI && report && report.sections.length > 0) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('open-ai'))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [shouldOpenAI, report])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!report || report.sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No sections found</h2>
          <p className="text-gray-600">This report doesn't have any sections yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )
}

