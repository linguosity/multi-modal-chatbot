'use client'

import { useParams } from 'next/navigation'
import { useReport } from '@/lib/context/ReportContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import SourcesGrid from '@/components/SourcesGrid'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import { cn } from '@/lib/design-system/utils'

export default function ReportSourcesPage() {
  const { id: reportId } = useParams<{ id: string }>()
  const { report } = useReport()

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className={cn(getClinicalTypographyClass('sectionHeading'), 'mb-2')}>Report not found</h2>
          <p className={getClinicalTypographyClass('bodyText', 'gray-600')}>The requested report could not be loaded.</p>
        </div>
      </div>
    )
  }

  const sources = (report.metadata as any)?.uploadedFiles?.map((file: any) => ({
    id: file.id,
    type: file.type as 'text' | 'pdf' | 'image' | 'audio',
    fileName: file.name,
    uploadDate: file.uploadDate,
    size: file.size,
    description: file.description
  })) || []

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/reports/${reportId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Report
              </Button>
            </Link>
            <div>
              <h1 className={getClinicalTypographyClass('reportTitle')}>
                Report Sources
              </h1>
              <p className={getClinicalTypographyClass('bodyText', 'gray-600')}>
                View and manage uploaded files and data sources for this report
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sources Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <SourcesGrid 
          sources={sources}
          reportId={reportId}
          sectionId={undefined} // Global sources view
        />
      </div>
    </div>
  )
}