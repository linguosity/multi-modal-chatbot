'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import { getIcon, type IconKey } from '@/lib/icons/icon-map'
import type { NavigationComponentProps, NavigationItem } from '@/lib/design-system/types'

export interface BreadcrumbItem extends NavigationItem {
  /** Icon key to display with the breadcrumb item */
  iconKey?: IconKey | string
  /** Whether this is the current page */
  current?: boolean
  /** Custom metadata for the breadcrumb */
  metadata?: {
    reportTitle?: string
    sectionTitle?: string
    reportType?: string
  }
}

interface BreadcrumbProps extends Omit<NavigationComponentProps, 'items' | 'variant'> {
  items: BreadcrumbItem[]
  showHome?: boolean
  separator?: React.ReactNode
  maxItems?: number
  showIcons?: boolean
  variant?: 'default' | 'clinical' | 'compact'
}

export function Breadcrumb({ 
  items, 
  showHome = true, 
  className,
  separator = <ChevronRight className="h-4 w-4 text-gray-400" />,
  maxItems = 5,
  showIcons = true,
  variant = 'default',
  onNavigate
}: BreadcrumbProps) {
  // Add home item if requested
  const homeItem: BreadcrumbItem = {
    id: 'home',
    label: 'Dashboard',
    href: '/dashboard',
    iconKey: 'home'
  }
  
  let allItems = showHome ? [homeItem, ...items] : items
  
  // Handle overflow with ellipsis
  if (allItems.length > maxItems) {
    const firstItem = allItems[0]
    const lastItems = allItems.slice(-2)
    allItems = [firstItem, { id: 'ellipsis', label: '...', disabled: true }, ...lastItems]
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return 'bg-blue-50 px-4 py-2 rounded-lg border border-blue-200'
      case 'compact':
        return 'py-1'
      default:
        return 'py-2'
    }
  }

  return (
    <nav 
      className={cn(
        'flex items-center space-x-2',
        getClinicalTypographyClass('navigationText'),
        getVariantClasses(),
        className
      )}
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isHome = showHome && index === 0
          const isEllipsis = item.id === 'ellipsis'

          return (
            <li key={item.id || index} className="flex items-center">
              {index > 0 && (
                <span className="mr-2" aria-hidden="true">
                  {separator}
                </span>
              )}
              
              {isEllipsis ? (
                <span className="text-gray-400 px-1">...</span>
              ) : item.href && !isLast && !item.disabled ? (
                <Link
                  href={item.href}
                  onClick={() => onNavigate?.(item)}
                  className={cn(
                    'hover:text-gray-900 transition-colors duration-150 flex items-center gap-1.5',
                    isHome ? 'text-gray-500' : 'text-gray-600',
                    variant === 'clinical' && 'hover:text-blue-700'
                  )}
                >
                  {showIcons && item.iconKey && (() => {
                    const IconComponent = getIcon(item.iconKey)
                    return IconComponent ? <IconComponent className="h-4 w-4" /> : null
                  })()}
                  <span className={isHome ? 'sr-only' : undefined}>
                    {item.label}
                  </span>

                </Link>
              ) : (
                <span 
                  className={cn(
                    'flex items-center gap-1.5',
                    isLast ? 'text-gray-900 font-medium' : 'text-gray-500',
                    variant === 'clinical' && isLast && 'text-blue-900'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {showIcons && item.iconKey && (() => {
                    const IconComponent = getIcon(item.iconKey)
                    return IconComponent ? <IconComponent className="h-4 w-4" /> : null
                  })()}
                  <span className={isHome ? 'sr-only' : undefined}>
                    {item.label}
                  </span>

                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Hook for building breadcrumbs from route segments with clinical context
export function useBreadcrumbs(
  pathname: string, 
  customLabels: Record<string, string> = {},
  reportData?: { title?: string; type?: string },
  sectionData?: { title?: string }
) {
  const segments = pathname.split('/').filter(Boolean)
  
  // Filter out 'dashboard' segment if it's the first one (to avoid duplication with home item)
  const filteredSegments = segments[0] === 'dashboard' ? segments.slice(1) : segments
  
  const items: BreadcrumbItem[] = filteredSegments.map((segment, index) => {
    const originalIndex = segments.indexOf(segment)
    const href = '/' + segments.slice(0, originalIndex + 1).join('/')
    const isLast = index === filteredSegments.length - 1
    
    // Determine label and icon based on segment
    let label = customLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    let iconKey: IconKey | string | undefined
    let metadata: BreadcrumbItem['metadata'] = {}
    
    switch (segment) {
      case 'dashboard':
        label = 'Dashboard'
        iconKey = 'home'
        break
      case 'reports':
        label = 'Reports'
        iconKey = 'folder-open'
        break
      case 'templates':
        label = 'Templates'
        iconKey = 'file-text'
        break
      default:
        // Check if this is a UUID segment
        if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          const originalIndex = segments.indexOf(segment)
          const previousSegment = segments[originalIndex - 1]
          
          // If previous segment is 'reports', this is a report ID
          if (previousSegment === 'reports') {
            label = reportData?.title || 'Report'
            iconKey = 'file-text'
            metadata.reportTitle = reportData?.title
            metadata.reportType = reportData?.type
          }
          // If previous segment is a UUID (report ID), this is a section ID
          else if (previousSegment?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            label = sectionData?.title || 'Section'
            metadata.sectionTitle = sectionData?.title
          }
        }
        break
    }
    
    return {
      id: segment,
      label,
      href: isLast ? undefined : href,
      iconKey,
      current: isLast,
      metadata
    }
  })
  
  return items
}

// Hook for report-specific breadcrumbs
export function useReportBreadcrumbs(
  reportId: string,
  sectionId?: string,
  reportTitle?: string,
  sectionTitle?: string
) {
  const items: BreadcrumbItem[] = [
    {
      id: 'reports',
      label: 'Reports',
      href: '/dashboard/reports',
      iconKey: 'folder-open'
    },
    {
      id: reportId,
      label: reportTitle || 'Report',
      href: `/dashboard/reports/${reportId}`,
      iconKey: 'file-text',
      metadata: { reportTitle }
    }
  ]
  
  if (sectionId && sectionTitle) {
    items.push({
      id: sectionId,
      label: sectionTitle,
      current: true,
      metadata: { sectionTitle }
    })
  }
  
  return items
}