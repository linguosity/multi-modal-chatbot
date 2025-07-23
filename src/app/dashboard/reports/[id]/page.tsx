'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useReport } from '@/lib/context/ReportContext'

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { report, loading } = useReport()

  // Redirect to first section when report loads
  useEffect(() => {
    if (report && report.sections.length > 0) {
      const firstSectionId = report.sections[0].id
      router.replace(`/dashboard/reports/${id}/${firstSectionId}`)
    }
  }, [report, id, router])

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

