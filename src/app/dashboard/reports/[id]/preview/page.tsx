'use client'

import { useReport } from '@/lib/context/ReportContext'
import WYSIWYGReportPreview from '@/components/report-cards/wysiwyg-report-preview'

export default function PreviewPage() {
  const { report, loading } = useReport()

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-3 text-sm text-gray-500">Loading report…</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Report Not Found</h1>
        <p className="text-gray-600">The requested report could not be loaded.</p>
      </div>
    )
  }

  return <WYSIWYGReportPreview initialMode="edit" />
}
