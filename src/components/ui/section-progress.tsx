'use client'

import { CheckCircle, Circle, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import type { NavigationComponentProps } from '@/lib/design-system/types'

export type SectionStatus = 'not-started' | 'in-progress' | 'completed' | 'needs-review' | 'error'

export interface SectionProgressItem {
  id: string
  title: string
  status: SectionStatus
  progress?: number // 0-100 for partial completion
  isRequired?: boolean
  estimatedTime?: string // e.g., "5 min"
  lastUpdated?: string
  errorMessage?: string
}

interface SectionProgressProps extends Omit<NavigationComponentProps, 'items' | 'variant' | 'onNavigate'> {
  sections: SectionProgressItem[]
  variant?: 'default' | 'compact' | 'detailed'
  showProgress?: boolean
  showEstimates?: boolean
  groupBy?: 'status' | 'category' | 'none'
  onNavigate?: (section: SectionProgressItem) => void
}

const statusConfig = {
  'not-started': {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    label: 'Not Started'
  },
  'in-progress': {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'In Progress'
  },
  'completed': {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Completed'
  },
  'needs-review': {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Needs Review'
  },
  'error': {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Error'
  }
}

function SectionProgressItem({ 
  section, 
  variant = 'default',
  showProgress = true,
  showEstimates = false,
  onNavigate,
  isActive = false
}: {
  section: SectionProgressItem
  variant?: 'default' | 'compact' | 'detailed'
  showProgress?: boolean
  showEstimates?: boolean
  onNavigate?: (section: SectionProgressItem) => void
  isActive?: boolean
}) {
  const config = statusConfig[section.status]
  const Icon = config.icon
  
  const handleClick = () => {
    if (onNavigate) {
      onNavigate(section)
    }
  }

  const progressPercentage = section.progress ?? (section.status === 'completed' ? 100 : 0)

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
        onNavigate && 'cursor-pointer hover:bg-gray-50',
        isActive && 'bg-blue-50 border border-blue-200',
        variant === 'compact' && 'p-2'
      )}
      onClick={handleClick}
    >
      {/* Status Icon */}
      <div className={cn('flex-shrink-0', config.color)}>
        <Icon className={cn('h-5 w-5', variant === 'compact' && 'h-4 w-4')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={cn(
            'font-medium truncate',
            getClinicalTypographyClass('formLabel'),
            isActive && 'text-blue-900'
          )}>
            {section.title}
            {section.isRequired && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </h4>
          
          {showEstimates && section.estimatedTime && (
            <span className={cn(
              'text-gray-500 flex-shrink-0 ml-2',
              getClinicalTypographyClass('helpText')
            )}>
              {section.estimatedTime}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && section.status !== 'not-started' && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                'text-gray-600',
                getClinicalTypographyClass('helpText')
              )}>
                {config.label}
              </span>
              <span className={cn(
                'text-gray-500',
                getClinicalTypographyClass('helpText')
              )}>
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  section.status === 'completed' && 'bg-green-500',
                  section.status === 'in-progress' && 'bg-blue-500',
                  section.status === 'needs-review' && 'bg-yellow-500',
                  section.status === 'error' && 'bg-red-500'
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {section.status === 'error' && section.errorMessage && (
          <p className={cn(
            'mt-1 text-red-600',
            getClinicalTypographyClass('helpText')
          )}>
            {section.errorMessage}
          </p>
        )}

        {/* Last Updated */}
        {variant === 'detailed' && section.lastUpdated && (
          <p className={cn(
            'mt-1 text-gray-500',
            getClinicalTypographyClass('helpText')
          )}>
            Updated {section.lastUpdated}
          </p>
        )}
      </div>

      {/* Navigation Arrow */}
      {onNavigate && (
        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
      )}
    </div>
  )
}

export function SectionProgress({
  sections,
  variant = 'default',
  showProgress = true,
  showEstimates = false,
  groupBy = 'none',
  activeItem,
  onNavigate,
  className
}: SectionProgressProps) {
  // Group sections if requested
  const groupedSections = groupBy === 'status' 
    ? sections.reduce((groups, section) => {
        const status = section.status
        if (!groups[status]) groups[status] = []
        groups[status].push(section)
        return groups
      }, {} as Record<SectionStatus, SectionProgressItem[]>)
    : { all: sections }

  // Calculate overall progress
  const completedSections = sections.filter(s => s.status === 'completed').length
  const totalSections = sections.length
  const overallProgress = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Progress Header */}
      {variant !== 'compact' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className={getClinicalTypographyClass('subsectionHeading')}>
              Section Progress
            </h3>
            <span className={cn(
              'font-medium',
              getClinicalTypographyClass('formLabel')
            )}>
              {completedSections} of {totalSections} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className={cn(
            'mt-2 text-gray-600',
            getClinicalTypographyClass('helpText')
          )}>
            {overallProgress}% complete
          </p>
        </div>
      )}

      {/* Section Groups */}
      {Object.entries(groupedSections).map(([groupKey, groupSections]) => (
        <div key={groupKey}>
          {groupBy === 'status' && groupKey !== 'all' && (
            <h4 className={cn(
              'mb-3 text-gray-700',
              getClinicalTypographyClass('formLabel')
            )}>
              {statusConfig[groupKey as SectionStatus]?.label} ({groupSections.length})
            </h4>
          )}
          
          <div className="space-y-2">
            {groupSections.map((section) => (
              <SectionProgressItem
                key={section.id}
                section={section}
                variant={variant}
                showProgress={showProgress}
                showEstimates={showEstimates}
                onNavigate={onNavigate}
                isActive={activeItem === section.id}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Quick Stats */}
      {variant === 'detailed' && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className={cn(
              'font-semibold text-green-600',
              getClinicalTypographyClass('subsectionHeading')
            )}>
              {sections.filter(s => s.status === 'completed').length}
            </div>
            <div className={cn(
              'text-gray-600',
              getClinicalTypographyClass('helpText')
            )}>
              Completed
            </div>
          </div>
          <div className="text-center">
            <div className={cn(
              'font-semibold text-blue-600',
              getClinicalTypographyClass('subsectionHeading')
            )}>
              {sections.filter(s => s.status === 'in-progress').length}
            </div>
            <div className={cn(
              'text-gray-600',
              getClinicalTypographyClass('helpText')
            )}>
              In Progress
            </div>
          </div>
        </div>
      )}
    </div>
  )
}