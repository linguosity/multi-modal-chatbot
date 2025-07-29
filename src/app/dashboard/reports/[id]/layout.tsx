'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ReportSidebar } from '@/components/ReportSidebar'
import { useReport } from '@/lib/context/ReportContext'
import { createBrowserSupabase } from '@/lib/supabase/browser'


export default function ReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { id } = useParams<{ id: string }>()
  const { report, loading, setReport } = useReport()
  const [isSeedReport, setIsSeedReport] = useState(false)

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
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex-shrink-0">
        <ReportSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}