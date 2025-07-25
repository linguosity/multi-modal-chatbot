'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { Report } from '@/lib/schemas/report'
import { Clock, FileText, User, Calendar, ChevronRight, Sparkles, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressIndicator } from '@/components/ui/ProgressIndicator'
import Link from 'next/link'

interface ReportWithActivity extends Report {
  lastActivity?: string
  aiSummary?: string
  lastModifiedSections?: string[]
  completedSections?: number
  totalSections?: number
}

export function ReportTimeline() {
  const [reports, setReports] = useState<ReportWithActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null)
  const supabase = createBrowserSupabase()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const reportsWithActivity = data?.map(report => {
        const completedSections = report.sections?.filter((section: any) => section.isCompleted).length || 0
        const totalSections = report.sections?.length || 0
        
        return {
          ...report,
          lastActivity: getLastActivity(report),
          lastModifiedSections: getLastModifiedSections(report),
          completedSections,
          totalSections
        }
      }) || []

      setReports(reportsWithActivity)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLastActivity = (report: Report): string => {
    if (report.updated_at) {
      const date = new Date(report.updated_at)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return 'Just now'
      if (diffInHours < 24) return `${diffInHours}h ago`
      if (diffInHours < 48) return 'Yesterday'
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `${diffInDays}d ago`
      
      return date.toLocaleDateString()
    }
    return 'Unknown'
  }

  const getLastModifiedSections = (report: Report): string[] => {
    if (!report.sections) return []
    
    // Sort sections by lastUpdated and take the most recent ones
    const sortedSections = report.sections
      .filter(section => section.lastUpdated)
      .sort((a, b) => new Date(b.lastUpdated!).getTime() - new Date(a.lastUpdated!).getTime())
      .slice(0, 3)
      .map(section => section.title)
    
    return sortedSections.length > 0 ? sortedSections : ['No recent activity']
  }

  const generateAISummary = async (reportId: string) => {
    setGeneratingSummary(reportId)
    try {
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId })
      })

      if (!response.ok) throw new Error('Failed to generate summary')

      const { summary } = await response.json()
      
      // Update the report with the AI summary
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, aiSummary: summary }
          : report
      ))
    } catch (error) {
      console.error('Error generating AI summary:', error)
    } finally {
      setGeneratingSummary(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
        <p className="text-gray-500 mb-4">Get started by creating your first evaluation report</p>
        <Link href="/dashboard/reports">
          <Button>Create Report</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <Link href="/dashboard/reports">
          <Button variant="outline" size="sm">
            View All Reports
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {reports.map((report, index) => (
          <div key={report.id} className="relative">
            {/* Timeline line */}
            {index < reports.length - 1 && (
              <div className="absolute left-5 top-12 w-0.5 h-full bg-gray-200 -z-10"></div>
            )}
            
            <Link href={`/dashboard/reports/${report.id}`} className="block">
              <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {report.title}
                    </h3>
                    
                    {report.studentName && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <User className="h-4 w-4 mr-1" />
                        {report.studentName}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {report.lastActivity}
                      </div>
                      <div className="text-xs text-gray-400">
                        {report.completedSections}/{report.totalSections} complete
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <ProgressIndicator 
                      completed={report.completedSections || 0}
                      total={report.totalSections || 0}
                      size="sm"
                      showText={false}
                    />
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* AI Summary or Last Modified Sections */}
                <div className="mt-3">
                  {report.aiSummary ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800">{report.aiSummary}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <Edit3 className="h-4 w-4 mr-1" />
                          Recent sections:
                        </div>
                        <Button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            generateAISummary(report.id)
                          }}
                          disabled={generatingSummary === report.id}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          {generatingSummary === report.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Summary
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {report.lastModifiedSections?.map((section, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2 mt-3">
                  <Button size="sm" variant="outline">
                    Continue Working
                  </Button>
                  <Button size="sm" variant="ghost">
                    View Details
                  </Button>
                </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}