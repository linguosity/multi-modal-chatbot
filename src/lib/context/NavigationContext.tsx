'use client'

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { BreadcrumbItem } from '@/components/ui/breadcrumb'
import type { SectionProgressItem } from '@/components/ui/section-progress'

interface NavigationState {
  breadcrumbs: BreadcrumbItem[]
  sectionProgress: SectionProgressItem[]
  currentSection?: string
  reportTitle?: string
  reportId?: string
  isNavigating: boolean
}

interface NavigationActions {
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
  setSectionProgress: (sections: SectionProgressItem[]) => void
  setCurrentSection: (sectionId?: string) => void
  setReportContext: (reportId: string, reportTitle: string) => void
  navigateToSection: (sectionId: string) => void
  navigateToBreadcrumb: (item: BreadcrumbItem) => void
  updateSectionStatus: (sectionId: string, status: SectionProgressItem['status'], progress?: number) => void
  clearNavigation: () => void
}

interface NavigationContextType extends NavigationState, NavigationActions {}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

interface NavigationProviderProps {
  children: ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  
  const [state, setState] = useState<NavigationState>({
    breadcrumbs: [],
    sectionProgress: [],
    currentSection: undefined,
    reportTitle: undefined,
    reportId: undefined,
    isNavigating: false
  })

  // Update navigation state based on pathname changes
  useEffect(() => {
    setState((prev: NavigationState) => ({ ...prev, isNavigating: false }))
  }, [pathname])

  const setBreadcrumbs = useCallback((breadcrumbs: BreadcrumbItem[]) => {
    setState((prev: NavigationState) => ({ ...prev, breadcrumbs }))
  }, [])

  const setSectionProgress = useCallback((sectionProgress: SectionProgressItem[]) => {
    setState((prev: NavigationState) => ({ ...prev, sectionProgress }))
  }, [])

  const setCurrentSection = useCallback((currentSection?: string) => {
    setState((prev: NavigationState) => ({ ...prev, currentSection }))
  }, [])

  const setReportContext = useCallback((reportId: string, reportTitle: string) => {
    setState((prev: NavigationState) => ({ ...prev, reportId, reportTitle }))
  }, [])

  const navigateToSection = useCallback((sectionId: string) => {
    if (!state.reportId) return
    
    setState((prev: NavigationState) => ({ ...prev, isNavigating: true, currentSection: sectionId }))
    router.push(`/dashboard/reports/${state.reportId}/${sectionId}`)
  }, [state.reportId, router])

  const navigateToBreadcrumb = useCallback((item: BreadcrumbItem) => {
    if (!item.href) return
    
    setState((prev: NavigationState) => ({ ...prev, isNavigating: true }))
    router.push(item.href!)
  }, [router])

  const updateSectionStatus = useCallback((
    sectionId: string, 
    status: SectionProgressItem['status'], 
    progress?: number
  ) => {
    setState((prev: NavigationState) => ({
      ...prev,
      sectionProgress: prev.sectionProgress.map((section: SectionProgressItem) =>
        section.id === sectionId
          ? { 
              ...section, 
              status, 
              progress,
              lastUpdated: new Date().toLocaleString()
            }
          : section
      )
    }))
  }, [])

  const clearNavigation = useCallback(() => {
    setState({
      breadcrumbs: [],
      sectionProgress: [],
      currentSection: undefined,
      reportTitle: undefined,
      reportId: undefined,
      isNavigating: false
    })
  }, [])

  const contextValue: NavigationContextType = useMemo(() => ({
    ...state,
    setBreadcrumbs,
    setSectionProgress,
    setCurrentSection,
    setReportContext,
    navigateToSection,
    navigateToBreadcrumb,
    updateSectionStatus,
    clearNavigation
  }), [state, setBreadcrumbs, setSectionProgress, setCurrentSection, setReportContext, navigateToSection, navigateToBreadcrumb, updateSectionStatus, clearNavigation])

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
}

// Hook for report-specific navigation setup
export function useReportNavigation(
  reportId: string,
  reportTitle: string,
  sections: Array<{
    id: string
    title: string
    isCompleted?: boolean
    isRequired?: boolean
    progress?: number
  }>,
  currentSectionId?: string
) {
  const { setReportContext, setBreadcrumbs, setSectionProgress, setCurrentSection, navigateToSection, updateSectionStatus } = useNavigation()

  useEffect(() => {
    // Set report context
    setReportContext(reportId, reportTitle)

    // Set breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
      {
        id: 'reports',
        label: 'Reports',
        href: '/dashboard/reports',
        icon: undefined // Will be set by breadcrumb component
      },
      {
        id: reportId,
        label: reportTitle,
        href: `/dashboard/reports/${reportId}`,
        metadata: { reportTitle }
      }
    ]

    if (currentSectionId) {
      const currentSection = sections.find(s => s.id === currentSectionId)
      if (currentSection) {
        breadcrumbs.push({
          id: currentSectionId,
          label: currentSection.title,
          current: true,
          metadata: { sectionTitle: currentSection.title }
        })
      }
    }

    setBreadcrumbs(breadcrumbs)

    // Set section progress
    const sectionProgress: SectionProgressItem[] = sections.map(section => ({
      id: section.id,
      title: section.title,
      status: section.isCompleted ? 'completed' : 
              section.progress && section.progress > 0 ? 'in-progress' : 'not-started',
      progress: section.progress,
      isRequired: section.isRequired
    }))

    setSectionProgress(sectionProgress)
    setCurrentSection(currentSectionId)

  }, [reportId, reportTitle, sections, currentSectionId])

  return {
    navigateToSection,
    updateSectionStatus
  }
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  sections: SectionProgressItem[],
  currentSectionId?: string
) {
  const navigation = useNavigation()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation keys when not in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      const currentIndex = sections.findIndex(s => s.id === currentSectionId)
      
      if (event.key === 'ArrowUp' && currentIndex > 0) {
        event.preventDefault()
        navigation.navigateToSection(sections[currentIndex - 1].id)
      } else if (event.key === 'ArrowDown' && currentIndex < sections.length - 1) {
        event.preventDefault()
        navigation.navigateToSection(sections[currentIndex + 1].id)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sections, currentSectionId, navigation])
}