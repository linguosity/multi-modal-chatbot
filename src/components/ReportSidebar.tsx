'use client'

import { useParams, useRouter, usePathname } from 'next/navigation'
import { ReportSection } from '@/lib/schemas/report';
import { useReport } from '@/lib/context/ReportContext'
import { ChevronDown, ChevronRight, Plus, FileText } from 'lucide-react'
import { StudentBioCard } from './StudentBioCard'
import { SectionToggle, ProgressIndicator } from './ui/ProgressIndicator'
import { BadgeWrapper } from './ui/update-badge'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'
import { useState } from 'react'
import { useSectionDnd, SectionId } from '@/lib/hooks/useSectionDnd'
import { SectionTocItem, Section as TocSection } from './SectionTocItem'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'

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
    sectionTypes: ["assessment_results", "language_sample", "validity_statement"]
  },
  {
    title: "Summary, Eligibility & Recommendations",
    sectionTypes: ["eligibility_checklist", "conclusion", "recommendations", "accommodations"]
  }
]

// Component for rendering draggable sections within a group
function GroupSectionList({
  sections,
  currentSectionId,
  onNavigate,
  onReorder,
  getSectionStatus,
  getSectionIcon,
  onToggleCompletion
}: {
  sections: ReportSection[]
  currentSectionId: string | undefined
  onNavigate: (sectionId: string) => void
  onReorder: (newOrder: string[]) => void
  getSectionStatus: (section: ReportSection) => string
  getSectionIcon: (status: string) => React.ReactNode
  onToggleCompletion: (sectionId: string) => void
}) {
  const sectionIds = sections.map(s => s.id)
  const { sensors, handleDragEnd, strategy, collisionDetection } = useSectionDnd(sectionIds, onReorder)
  const { isRecentlyUpdated, getFieldChanges, getRecentUpdate } = useRecentUpdates()

  // Convert ReportSection to TocSection format
  const createTocSection = (section: ReportSection): TocSection => {
    const status = getSectionStatus(section)
    return {
      id: section.id,
      title: section.title,
      required: section.isRequired,
      complete: section.isCompleted || false
    }
  }

  return (
    <div className="ml-4">
      <DndContext 
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sectionIds} strategy={strategy}>
          <div className="space-y-1">
            {sections.map((section) => {
              const status = getSectionStatus(section)
              const isActive = currentSectionId === section.id
              const tocSection = createTocSection(section)

              const isUpdated = isRecentlyUpdated(section.id)
              const updateCount = getFieldChanges(section.id).length
              const updatedFields = getFieldChanges(section.id)
              
              // Check if this section has AI-generated narrative
              const recentUpdate = getRecentUpdate ? getRecentUpdate(section.id) : undefined
              const hasAINarrative = recentUpdate?.type === 'ai_narrative_generated'

              return (
                <div 
                  key={section.id} 
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-300 relative ${
                    isActive 
                      ? 'bg-brand-rust/10 text-brand-black font-medium' 
                      : isUpdated
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100'
                      : 'hover:bg-brand-beige/20 text-gray-700'
                  }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-rust rounded-r-full" />
                  )}
                  
                  <div 
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => {
                      onNavigate(section.id);
                      // The visual indicator will be cleared when the user clicks on the section card
                    }}
                  >
                    <div className="flex-shrink-0 ml-1">
                      {getSectionIcon(status)}
                    </div>
                    <BadgeWrapper
                      badge={isUpdated ? {
                        count: updateCount,
                        type: status === 'complete' ? 'completed' : 'updated',
                        ariaLabel: hasAINarrative 
                          ? `${section.title} (AI narrative generated)` 
                          : `${section.title} (${updateCount} recent updates)`,
                        updatedFields: updatedFields
                      } : undefined}
                    >
                      <span 
                        className={`truncate flex-1 text-sm transition-colors duration-300 ${
                          isUpdated ? 'font-medium' : ''
                        }`}
                        aria-label={isUpdated ? `${section.title} (updated)` : section.title}
                      >
                        {section.title}
                      </span>
                      {isUpdated && (
                        <div className="flex items-center gap-1 ml-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </BadgeWrapper>
                  </div>
                  
                  <SectionToggle
                    isCompleted={section.isCompleted || false}
                    onToggle={() => onToggleCompletion(section.id)}
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export function ReportSidebar() {
  const { report, setReport, handleSave } = useReport()
  const router = useRouter()
  const pathname = usePathname()
  const { id: reportId } = useParams<{ id: string }>()
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const { isRecentlyUpdated, getFieldChanges } = useRecentUpdates()
  
  // If report is null, show a loading state
  if (!report) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading report...</div>
      </div>
    )
  }

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
        return <span className="text-brand-beige text-lg">●</span>
      case 'required-empty':
        return <span className="text-brand-rust text-lg border-2 border-brand-rust rounded-full w-4 h-4 inline-block"></span>
      case 'optional-empty':
        return <span className="text-gray-400 text-lg">○</span>
      default:
        return <span className="text-gray-400 text-lg">○</span>
    }
  }

  const getGroupStats = (groupSections: ReportSection[]) => {
    const completed = groupSections.filter(s => s.isCompleted).length
    const total = groupSections.length
    const updatedCount = groupSections.filter(s => isRecentlyUpdated(s.id)).length
    return { completed, total, updatedCount }
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

  const toggleSectionCompletion = async (sectionId: string) => {
    if (!report) return
    
    const updatedSections = report.sections.map(section => 
      section.id === sectionId 
        ? { ...section, isCompleted: !section.isCompleted }
        : section
    )
    
    const updatedReport = {
      ...report,
      sections: updatedSections
    }
    
    setReport(updatedReport)
    
    // Save to database
    try {
      await handleSave(updatedReport)
    } catch (error) {
      console.error('Failed to save section completion:', error)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        {/* Student Bio Card */}
        <StudentBioCard />
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
            const groupStats = getGroupStats(groupSections)

            return (
              <div key={group.title} className="mb-2">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <BadgeWrapper
                      badge={groupStats.updatedCount > 0 ? {
                        count: groupStats.updatedCount,
                        type: 'updated',
                        ariaLabel: `${group.title} (${groupStats.updatedCount} sections updated)`
                      } : undefined}
                    >
                      <span aria-label={groupStats.updatedCount > 0 ? `${group.title} (updated)` : group.title}>
                        {group.title}
                      </span>
                    </BadgeWrapper>
                  </div>
                  <ProgressIndicator
                    completed={groupStats.completed}
                    total={groupStats.total}
                    size="sm"
                    showText={false}
                  />
                </button>

                {/* Group Sections */}
                {!isCollapsed && (
                  <GroupSectionList
                    sections={groupSections}
                    currentSectionId={currentSectionId}
                    onNavigate={navigateToSection}
                    onToggleCompletion={toggleSectionCompletion}
                    onReorder={(newOrder) => {
                      try {
                        // Create a new sections array with the updated order for this group
                        const updatedSections = [...report.sections];
                        
                        // Find the indices of the sections in this group
                        const groupIndices = groupSections.map(section => 
                          updatedSections.findIndex(s => s.id === section.id)
                        );
                        
                        // Validate that all sections were found
                        if (groupIndices.some(idx => idx === -1)) {
                          console.warn('Some sections not found during reordering');
                          return;
                        }
                        
                        // Replace the sections in this group with the reordered ones
                        newOrder.forEach((id, index) => {
                          const newSection = groupSections.find(s => s.id === id);
                          const targetIndex = groupIndices[index];
                          if (newSection && targetIndex !== undefined && targetIndex !== -1) {
                            updatedSections[targetIndex] = newSection;
                          }
                        });
                        
                        // Update the report with the new section order
                        setReport({
                          ...report,
                          sections: updatedSections
                        });
                      } catch (error) {
                        console.error('Error reordering sections:', error);
                      }
                    }}
                    getSectionStatus={getSectionStatus}
                    getSectionIcon={getSectionIcon}
                  />
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
          + Section
        </button>
      </div>
    </div>
  )
}