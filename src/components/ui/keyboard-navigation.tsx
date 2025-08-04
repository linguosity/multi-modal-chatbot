'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X, Search } from 'lucide-react'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import { BaseModal } from './base-modal'
import { InteractiveButton, InteractiveInput } from './interactive-elements'
import { 
  shortcutManager, 
  formatShortcut, 
  type KeyboardShortcutGroup,
  type KeyboardShortcut 
} from '@/lib/keyboard/shortcuts'
import { 
  focusManager, 
  useFocusGroup, 
  useFocusTrap,
  type FocusableElement 
} from '@/lib/keyboard/focus-management'
import type { BaseComponentProps } from '@/lib/design-system/types'

// Keyboard shortcuts help modal
export interface KeyboardShortcutsModalProps extends BaseComponentProps {
  /** Whether modal is open */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Filter by category */
  category?: string
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  category,
  className,
  'data-testid': testId,
  ...props
}: KeyboardShortcutsModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredGroups, setFilteredGroups] = useState<KeyboardShortcutGroup[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  // Setup focus trap for modal
  useFocusTrap(isOpen, modalRef)

  // Get and filter shortcuts
  useEffect(() => {
    const groups = shortcutManager.getShortcutGroups()
    
    let filtered = groups
    
    // Filter by category if specified
    if (category) {
      filtered = groups.filter(group => group.category === category)
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.map(group => ({
        ...group,
        shortcuts: group.shortcuts.filter(shortcut =>
          shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shortcut.key.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(group => group.shortcuts.length > 0)
    }
    
    setFilteredGroups(filtered)
  }, [category, searchTerm])

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
      variant="clinical"
      className={className}
      data-testid={testId}
      {...props}
    >
      <div ref={modalRef} className="p-6">
        {/* Search */}
        <div className="mb-6">
          <InteractiveInput
            type="text"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search shortcuts..."
            variant="clinical"
          />
        </div>

        {/* Shortcuts list */}
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {filteredGroups.map(group => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className={cn(
                'font-semibold text-blue-700 border-b border-blue-200 pb-2',
                getClinicalTypographyClass('subsectionHeading')
              )}>
                {group.category}
              </h3>
              
              <div className="grid gap-2">
                {group.shortcuts.map(shortcut => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                  >
                    <span className={cn(
                      'text-gray-700',
                      getClinicalTypographyClass('bodyText')
                    )}>
                      {shortcut.description}
                    </span>
                    
                    <kbd className={cn(
                      'px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono',
                      getClinicalTypographyClass('codeText')
                    )}>
                      {formatShortcut(shortcut.key, shortcut.modifiers)}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-8">
            <Keyboard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className={cn(
              'text-gray-500',
              getClinicalTypographyClass('bodyText')
            )}>
              {searchTerm ? 'No shortcuts found matching your search.' : 'No shortcuts available.'}
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  )
}

// Grid navigation component
export interface KeyboardGridProps extends BaseComponentProps {
  /** Grid items */
  items: Array<{
    id: string
    element: HTMLElement | null
    disabled?: boolean
  }>
  /** Number of columns */
  columns: number
  /** Selected item ID */
  selectedId?: string
  /** Selection change handler */
  onSelectionChange?: (id: string) => void
  /** Item activation handler */
  onItemActivate?: (id: string) => void
  /** Whether grid is circular */
  circular?: boolean
  /** Focus group ID */
  focusGroupId?: string
}

export function KeyboardGrid({
  items,
  columns,
  selectedId,
  onSelectionChange,
  onItemActivate,
  circular = true,
  focusGroupId = 'keyboard-grid',
  className,
  'data-testid': testId,
  ...props
}: KeyboardGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)

  // Create focusable elements for focus manager
  const focusableElements: FocusableElement[] = items
    .filter(item => item.element && !item.disabled)
    .map((item, index) => ({
      element: item.element!,
      priority: 0,
      group: focusGroupId
    }))

  // Setup focus group
  const focusGroup = useFocusGroup(focusGroupId, focusableElements, {
    circular,
    orientation: 'grid',
    gridColumns: columns
  })

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gridRef.current?.contains(document.activeElement)) return

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          focusGroup.focusUp()
          break
        case 'ArrowDown':
          event.preventDefault()
          focusGroup.focusDown()
          break
        case 'ArrowLeft':
          event.preventDefault()
          focusGroup.focusPrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          focusGroup.focusNext()
          break
        case 'Home':
          event.preventDefault()
          focusGroup.focusFirst()
          break
        case 'End':
          event.preventDefault()
          focusGroup.focusLast()
          break
        case ' ':
          event.preventDefault()
          if (selectedId && onSelectionChange) {
            const focusedElement = document.activeElement as HTMLElement
            const itemId = focusedElement.getAttribute('data-item-id')
            if (itemId) {
              onSelectionChange(itemId)
            }
          }
          break
        case 'Enter':
          event.preventDefault()
          if (onItemActivate) {
            const focusedElement = document.activeElement as HTMLElement
            const itemId = focusedElement.getAttribute('data-item-id')
            if (itemId) {
              onItemActivate(itemId)
            }
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [focusGroup, selectedId, onSelectionChange, onItemActivate])

  return (
    <div
      ref={gridRef}
      className={cn(
        'keyboard-grid focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50 rounded-lg',
        className
      )}
      role="grid"
      aria-label="Keyboard navigable grid"
      data-testid={testId}
      {...props}
    >
      {/* Grid items are rendered by parent component */}
      {/* This component only provides keyboard navigation behavior */}
    </div>
  )
}

// Section navigation component
export interface SectionNavigationProps extends BaseComponentProps {
  /** Current section ID */
  currentSection: string
  /** Available sections */
  sections: Array<{
    id: string
    title: string
    disabled?: boolean
  }>
  /** Section change handler */
  onSectionChange: (sectionId: string) => void
  /** Whether to show navigation hints */
  showHints?: boolean
}

export function SectionNavigation({
  currentSection,
  sections,
  onSectionChange,
  showHints = true,
  className,
  'data-testid': testId,
  ...props
}: SectionNavigationProps) {
  const [showNavigationHint, setShowNavigationHint] = useState(false)

  // Register section navigation shortcuts
  useEffect(() => {
    const currentIndex = sections.findIndex(s => s.id === currentSection)
    
    const shortcuts: KeyboardShortcut[] = [
      {
        id: 'next-section',
        key: 'ArrowRight',
        modifiers: ['ctrl'],
        description: 'Next section',
        category: 'Navigation',
        handler: () => {
          const nextIndex = (currentIndex + 1) % sections.length
          const nextSection = sections[nextIndex]
          if (nextSection && !nextSection.disabled) {
            onSectionChange(nextSection.id)
          }
        }
      },
      {
        id: 'prev-section',
        key: 'ArrowLeft',
        modifiers: ['ctrl'],
        description: 'Previous section',
        category: 'Navigation',
        handler: () => {
          const prevIndex = (currentIndex - 1 + sections.length) % sections.length
          const prevSection = sections[prevIndex]
          if (prevSection && !prevSection.disabled) {
            onSectionChange(prevSection.id)
          }
        }
      },
      {
        id: 'first-section',
        key: 'Home',
        modifiers: ['ctrl'],
        description: 'First section',
        category: 'Navigation',
        handler: () => {
          const firstSection = sections[0]
          if (firstSection && !firstSection.disabled) {
            onSectionChange(firstSection.id)
          }
        }
      },
      {
        id: 'last-section',
        key: 'End',
        modifiers: ['ctrl'],
        description: 'Last section',
        category: 'Navigation',
        handler: () => {
          const lastSection = sections[sections.length - 1]
          if (lastSection && !lastSection.disabled) {
            onSectionChange(lastSection.id)
          }
        }
      }
    ]

    shortcuts.forEach(shortcut => shortcutManager.register(shortcut))
    
    return () => {
      shortcuts.forEach(shortcut => {
        shortcutManager.unregister(shortcut.key, shortcut.modifiers)
      })
    }
  }, [currentSection, sections, onSectionChange])

  // Show navigation hint on first focus
  useEffect(() => {
    const handleFocus = () => {
      if (showHints) {
        setShowNavigationHint(true)
        setTimeout(() => setShowNavigationHint(false), 3000)
      }
    }

    document.addEventListener('focusin', handleFocus, { once: true })
    return () => document.removeEventListener('focusin', handleFocus)
  }, [showHints])

  return (
    <div
      className={cn('section-navigation', className)}
      data-testid={testId}
      {...props}
    >
      {/* Navigation hint */}
      <AnimatePresence>
        {showNavigationHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              <span className={getClinicalTypographyClass('helpText')}>
                Use Ctrl + ← → to navigate sections
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Focus indicator component
export interface FocusIndicatorProps extends BaseComponentProps {
  /** Whether to show focus indicator */
  visible: boolean
  /** Target element to indicate */
  target?: HTMLElement | null
  /** Indicator variant */
  variant?: 'default' | 'clinical' | 'success' | 'warning' | 'error'
}

export function FocusIndicator({
  visible,
  target,
  variant = 'default',
  className,
  'data-testid': testId,
  ...props
}: FocusIndicatorProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })

  // Update position when target changes
  useEffect(() => {
    if (target && visible) {
      const updatePosition = () => {
        const rect = target.getBoundingClientRect()
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        })
      }

      updatePosition()
      
      const observer = new ResizeObserver(updatePosition)
      observer.observe(target)
      
      window.addEventListener('scroll', updatePosition)
      window.addEventListener('resize', updatePosition)
      
      return () => {
        observer.disconnect()
        window.removeEventListener('scroll', updatePosition)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [target, visible])

  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return 'border-blue-500 shadow-blue-500/50'
      case 'success':
        return 'border-green-500 shadow-green-500/50'
      case 'warning':
        return 'border-orange-500 shadow-orange-500/50'
      case 'error':
        return 'border-red-500 shadow-red-500/50'
      default:
        return 'border-blue-500 shadow-blue-500/50'
    }
  }

  if (!visible || !target) return null

  return (
    <motion.div
      className={cn(
        'fixed pointer-events-none border-2 rounded-lg shadow-lg z-50',
        getVariantClasses(),
        className
      )}
      style={{
        top: position.top - 2,
        left: position.left - 2,
        width: position.width + 4,
        height: position.height + 4
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      data-testid={testId}
      {...props}
    />
  )
}