'use client'

import { useParams, useRouter, usePathname } from 'next/navigation'
import { ReportSection } from '@/lib/schemas/report'
import { useReport } from '@/lib/context/ReportContext'
import { ChevronDown, ChevronRight, Plus, FileText, CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface SectionGroup {
  title: string
  sectionTypes: string[]
}

const DEFAULT_GROUPS: SectionGroup[] = [
  {
    title: "Initial Information & Background",
    sectionTypes: ["header", "heading", "reason_for_referral", "parent_concern", "health_developmental_history", "family_background"]
  },
  {
    title: "Assessment Findings", 
    sectionTypes: ["assessment_tools", "assessment_results", "language_sample", "validity_statement"]
  },
  {
    title: "Summary, Eligibility & Recommendations",
    sectionTypes: ["eligibility_checklist", "conclusion", "recommendations", "accommodations"]
  }
]

export function ReportSidebar() {
  const { report } = useReport()
  const router = useRouter()
  const pathname = usePathname()
  const { id: reportId } = useParams<{ id: string }>()
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Get current section ID from URL
  const currentSectionId = pathname.split('/').pop()

  // Get section completion status
  const getSectionStatus = (section: ReportSection) => {
    if (!section.content || section.content.trim() === '') {
      return section.isRequired ? 'required-empty' : 'optional-empty'
    }
    // Basic completion check - could be enhanced with schema validation
    return 'complete'
  }

  const getSectionIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />
      case 'required-empty':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'optional-empty':
        return <Circle className="h-4 w-4 text-gray-400" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const toggleGroup = (groupTitle: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupTitle)) {
      newCollapsed.delete(groupTitle)
    } else {
      newCollapsed.add(groupTitle)
    }
    setCollapsedGroups(newCollapsed)
  }

  const navigateToSection = (sectionId: string) => {
    router.push(`/dashboard/reports/${reportId}/${sectionId}`)
  }

  const getFirstSectionId = () => {
    return report.sections[0]?.id
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h1 className="font-semibold text-gray-900 truncate">{report.title}</h1>
        </div>
        <div className="text-xs text-gray-500">
          {report.sections.length} sections • {report.status}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2">
          {DEFAULT_GROUPS.map((group) => {
            const groupSections = report.sections.filter(section => 
              group.sectionTypes.includes(section.sectionType)
            )
            
            if (groupSections.length === 0) return null

            const isCollapsed = collapsedGroups.has(group.title)

            return (
              <div key={group.title} className="mb-2">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {group.title}
                </button>

                {/* Group Sections */}
                {!isCollapsed && (
                  <div className="ml-4 space-y-1">
                    {groupSections.map((section) => {
                      const status = getSectionStatus(section)
                      const isActive = currentSectionId === section.id

                      return (
                        <button
                          key={section.id}
                          onClick={() => navigateToSection(section.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-800 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {getSectionIcon(status)}
                          <span className="truncate">{section.title}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>
    </div>
  )
}