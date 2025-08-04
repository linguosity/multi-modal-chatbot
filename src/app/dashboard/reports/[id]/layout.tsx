'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { ReportSidebar } from '@/components/ReportSidebar'
import { useReport } from '@/lib/context/ReportContext'
import { NavigationProvider, useReportNavigation } from '@/lib/context/NavigationContext'
import { Breadcrumb, useReportBreadcrumbs } from '@/components/ui/breadcrumb'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'


function ReportLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const { report, loading, setReport } = useReport()
  const [isSeedReport, setIsSeedReport] = useState(false)
  
  // Extract section ID from pathname
  const pathSegments = pathname.split('/')
  const sectionId = pathSegments[pathSegments.length - 1] !== id ? pathSegments[pathSegments.length - 1] : undefined
  const currentSection = report?.sections.find(s => s.id === sectionId)
  
  // Setup navigation breadcrumbs
  const breadcrumbs = useReportBreadcrumbs(
    id,
    sectionId,
    report?.title,
    currentSection?.title
  )
  
  // Memoize sections to prevent infinite re-renders
  const memoizedSections = useMemo(() => 
    report?.sections.map(section => ({
      id: section.id,
      title: section.title,
      isCompleted: section.isCompleted,
      isRequired: section.isRequired,
      progress: section.isCompleted ? 100 : 0
    })) || [], 
    [report?.sections]
  )
  
  // Setup report navigation
  useReportNavigation(
    id,
    report?.title || 'Report',
    memoizedSections,
    sectionId
  )

  // Load report data
  useEffect(() => {
    if (id === 'seed-report-demo') {
      setIsSeedReport(true)
      const fetchSeedReport = async () => {
        try {
          const response = await fetch('/api/seed')
          if (!response.ok) throw new Error('Failed to fetch seed data')
          const seedData = await response.json()
          if (seedData.reports && seedData.reports.length > 0) {
            setReport(seedData.reports[0])
          }
        } catch (err) {
          console.error('Error loading seed report:', err)
        }
      }
      fetchSeedReport()
    }
  }, [id, setReport])

  if (loading && !isSeedReport) {
    return (
      <div className="flex h-screen">
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-3 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Report not found</h2>
          <p className="text-gray-600">The requested report could not be loaded.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden flex-col">
      {/* Breadcrumb Navigation - Sticky header */}
      {report && (
        <div className="sticky top-0 z-40 flex items-center gap-2 bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-3">
          <div className="flex-1 min-w-0">
            <Breadcrumb 
              items={breadcrumbs}
              variant="clinical"
              showIcons={true}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/reports')}
            className="ml-4 h-8 w-8 p-0 hover:bg-gray-100 rounded-full flex-none"
            title="Close report"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      )}
      
      {/* Main content area with sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar - Fixed width, no shrink */}
        <div className="w-80 flex-none bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <ReportSidebar />
        </div>
        
        {/* Main Content - Flexible, can shrink */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="w-full h-full px-6 py-4">
            <div className="max-w-4xl mx-auto min-w-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NavigationProvider>
      <ReportLayoutContent>
        {children}
      </ReportLayoutContent>
    </NavigationProvider>
  )
}