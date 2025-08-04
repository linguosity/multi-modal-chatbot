'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import { getIcon, type IconKey } from '@/lib/icons/icon-map'
import { 
  fadeInOut, 
  slideInFromRight, 
  staggerContainer, 
  listItemVariants,
  transitionClasses 
} from '@/lib/animations/transitions'
import type { BaseComponentProps } from '@/lib/design-system/types'

// Enhanced breadcrumb with smooth transitions
export interface AnimatedBreadcrumbItem {
  id: string
  label: string
  href?: string
  iconKey?: IconKey | string
  isActive?: boolean
  metadata?: Record<string, any>
}

export interface AnimatedBreadcrumbProps extends BaseComponentProps {
  /** Breadcrumb items */
  items: AnimatedBreadcrumbItem[]
  /** Separator component */
  separator?: React.ComponentType<{ className?: string }>
  /** Maximum items to show before collapsing */
  maxItems?: number
  /** Whether to show home icon */
  showHomeIcon?: boolean
  /** Click handler */
  onItemClick?: (item: AnimatedBreadcrumbItem) => void
  /** Variant */
  variant?: 'default' | 'clinical'
}

export function AnimatedBreadcrumb({
  items,
  separator: Separator = ChevronRight,
  maxItems = 5,
  showHomeIcon = true,
  onItemClick,
  variant = 'default',
  className,
  'data-testid': testId,
  ...props
}: AnimatedBreadcrumbProps) {
  const [expandedItems, setExpandedItems] = useState(false)

  const shouldCollapse = items.length > maxItems
  const visibleItems = shouldCollapse && !expandedItems 
    ? [items[0], ...items.slice(-2)] 
    : items

  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return 'text-blue-700 hover:text-blue-800'
      default:
        return 'text-gray-600 hover:text-gray-800'
    }
  }

  return (
    <motion.nav
      className={cn('flex items-center space-x-1', className)}
      data-testid={testId}
      {...staggerContainer}
      {...props}
    >
      <AnimatePresence mode="wait">
        {visibleItems.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex items-center space-x-1"
            {...listItemVariants}
            transition={{ delay: index * 0.05 }}
          >
            {/* Home icon for first item */}
            {index === 0 && showHomeIcon && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {(() => {
                  const HomeIcon = getIcon('home')
                  return HomeIcon ? <HomeIcon className="h-4 w-4 text-gray-500" /> : null
                })()}
              </motion.div>
            )}

            {/* Breadcrumb item */}
            <motion.button
              onClick={() => onItemClick?.(item)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded transition-colors duration-200',
                transitionClasses.focus.ring,
                item.isActive 
                  ? 'text-gray-900 font-medium cursor-default' 
                  : cn(
                      'cursor-pointer',
                      getVariantClasses()
                    ),
                getClinicalTypographyClass('breadcrumbText')
              )}
              whileHover={!item.isActive ? { scale: 1.05 } : undefined}
              whileTap={!item.isActive ? { scale: 0.95 } : undefined}
              disabled={item.isActive}
            >
              {item.iconKey && (() => {
                const IconComponent = getIcon(item.iconKey)
                return IconComponent ? <IconComponent className="h-3 w-3" /> : null
              })()}
              <span className="truncate max-w-[150px]">
                {item.label}
              </span>
            </motion.button>

            {/* Separator */}
            {index < visibleItems.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index * 0.05) + 0.1 }}
              >
                <Separator className="h-3 w-3 text-gray-400" />
              </motion.div>
            )}

            {/* Collapsed indicator */}
            {shouldCollapse && !expandedItems && index === 0 && items.length > maxItems && (
              <motion.button
                onClick={() => setExpandedItems(true)}
                className={cn(
                  'px-2 py-1 text-gray-500 hover:text-gray-700 rounded transition-colors duration-200',
                  transitionClasses.focus.ring
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                ...
              </motion.button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.nav>
  )
}

// Animated tab navigation
export interface AnimatedTabItem {
  id: string
  label: string
  iconKey?: IconKey | string
  badge?: string | number
  disabled?: boolean
}

export interface AnimatedTabsProps extends BaseComponentProps {
  /** Tab items */
  items: AnimatedTabItem[]
  /** Active tab ID */
  activeTab: string
  /** Tab change handler */
  onTabChange: (tabId: string) => void
  /** Variant */
  variant?: 'default' | 'clinical' | 'pills'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
}

export function AnimatedTabs({
  items,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  className,
  'data-testid': testId,
  ...props
}: AnimatedTabsProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm'
      case 'lg':
        return 'px-6 py-3 text-lg'
      default:
        return 'px-4 py-2 text-base'
    }
  }

  const getVariantClasses = (isActive: boolean) => {
    switch (variant) {
      case 'clinical':
        return isActive
          ? 'bg-blue-100 text-blue-700 border-blue-300'
          : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
      case 'pills':
        return isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
      default:
        return isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }
  }

  return (
    <div
      className={cn(
        'flex space-x-1',
        variant === 'default' && 'border-b border-gray-200',
        className
      )}
      data-testid={testId}
      {...props}
    >
      {items.map((item, index) => {
        const isActive = item.id === activeTab

        return (
          <motion.button
            key={item.id}
            onClick={() => !item.disabled && onTabChange(item.id)}
            className={cn(
              'relative flex items-center gap-2 font-medium transition-all duration-200 rounded-lg',
              transitionClasses.focus.ring,
              getSizeClasses(),
              getVariantClasses(isActive),
              variant === 'default' && 'border-b-2 rounded-none',
              item.disabled && 'opacity-50 cursor-not-allowed',
              getClinicalTypographyClass('tabText')
            )}
            whileHover={!item.disabled ? { scale: 1.02 } : undefined}
            whileTap={!item.disabled ? { scale: 0.98 } : undefined}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            disabled={item.disabled}
          >
            {/* Icon */}
            {item.iconKey && (
              <motion.div
                animate={{ rotate: isActive ? 360 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {(() => {
                  const IconComponent = getIcon(item.iconKey)
                  return IconComponent ? <IconComponent className="h-4 w-4" /> : null
                })()}
              </motion.div>
            )}

            {/* Label */}
            <span>{item.label}</span>

            {/* Badge */}
            {item.badge && (
              <motion.span
                className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  isActive 
                    ? 'bg-blue-200 text-blue-800' 
                    : 'bg-gray-200 text-gray-600'
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (index * 0.05) + 0.1, type: 'spring' }}
              >
                {item.badge}
              </motion.span>
            )}

            {/* Active indicator */}
            {isActive && variant === 'default' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* Active background for pills */}
            {isActive && variant === 'pills' && (
              <motion.div
                className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                layoutId="activePill"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// Animated sidebar navigation
export interface AnimatedSidebarItem {
  id: string
  label: string
  iconKey?: IconKey | string
  href?: string
  badge?: string | number
  children?: AnimatedSidebarItem[]
  isActive?: boolean
  isExpanded?: boolean
}

export interface AnimatedSidebarProps extends BaseComponentProps {
  /** Navigation items */
  items: AnimatedSidebarItem[]
  /** Collapsed state */
  collapsed?: boolean
  /** Item click handler */
  onItemClick?: (item: AnimatedSidebarItem) => void
  /** Variant */
  variant?: 'default' | 'clinical'
}

export function AnimatedSidebar({
  items,
  collapsed = false,
  onItemClick,
  variant = 'default',
  className,
  'data-testid': testId,
  ...props
}: AnimatedSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const getVariantClasses = (isActive: boolean) => {
    switch (variant) {
      case 'clinical':
        return isActive
          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
          : 'text-blue-600 hover:bg-blue-50'
      default:
        return isActive
          ? 'bg-gray-100 text-gray-900 border-r-2 border-blue-500'
          : 'text-gray-600 hover:bg-gray-50'
    }
  }

  const renderItem = (item: AnimatedSidebarItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            }
            onItemClick?.(item)
          }}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2 text-left transition-all duration-200',
            transitionClasses.focus.ring,
            getVariantClasses(item.isActive || false),
            level > 0 && 'pl-8',
            getClinicalTypographyClass('navigationText')
          )}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Icon */}
          {item.iconKey && (
            <motion.div
              animate={{ rotate: hasChildren && isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {(() => {
                const IconComponent = getIcon(item.iconKey)
                return IconComponent ? <IconComponent className="h-4 w-4 flex-shrink-0" /> : null
              })()}
            </motion.div>
          )}

          {/* Label */}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="flex-1 truncate"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Badge */}
          {item.badge && !collapsed && (
            <motion.span
              className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              {item.badge}
            </motion.span>
          )}

          {/* Expand indicator */}
          {hasChildren && !collapsed && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-3 w-3" />
            </motion.div>
          )}
        </motion.button>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && !collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {item.children?.map(child => renderItem(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <motion.nav
      className={cn(
        'flex flex-col space-y-1',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      data-testid={testId}
      {...props}
    >
      {items.map(item => renderItem(item))}
    </motion.nav>
  )
}