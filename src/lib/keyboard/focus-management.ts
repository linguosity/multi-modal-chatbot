// Advanced focus management system for clinical interfaces

import React from 'react'

export interface FocusableElement {
  element: HTMLElement
  priority: number
  group?: string
  skipOnDisabled?: boolean
}

export interface FocusGroup {
  id: string
  elements: FocusableElement[]
  circular?: boolean
  orientation?: 'horizontal' | 'vertical' | 'grid'
  gridColumns?: number
}

// Focus management utilities
export class FocusManager {
  private focusGroups: Map<string, FocusGroup> = new Map()
  private currentGroup: string | null = null
  private currentIndex: number = 0
  private trapStack: HTMLElement[] = []

  // Register a focus group
  registerGroup(group: FocusGroup): void {
    this.focusGroups.set(group.id, group)
  }

  // Unregister a focus group
  unregisterGroup(groupId: string): void {
    this.focusGroups.delete(groupId)
    if (this.currentGroup === groupId) {
      this.currentGroup = null
      this.currentIndex = 0
    }
  }

  // Set active focus group
  setActiveGroup(groupId: string): void {
    const group = this.focusGroups.get(groupId)
    if (group) {
      this.currentGroup = groupId
      this.currentIndex = 0
    }
  }

  // Move focus to next element in group
  focusNext(groupId?: string): boolean {
    const group = this.focusGroups.get(groupId || this.currentGroup || '')
    if (!group) return false

    const focusableElements = this.getFocusableElements(group)
    if (focusableElements.length === 0) return false

    if (group.orientation === 'grid' && group.gridColumns) {
      return this.focusNextInGrid(group, focusableElements)
    }

    let nextIndex = this.currentIndex + 1
    if (nextIndex >= focusableElements.length) {
      nextIndex = group.circular ? 0 : focusableElements.length - 1
    }

    return this.focusElementAtIndex(focusableElements, nextIndex)
  }

  // Move focus to previous element in group
  focusPrevious(groupId?: string): boolean {
    const group = this.focusGroups.get(groupId || this.currentGroup || '')
    if (!group) return false

    const focusableElements = this.getFocusableElements(group)
    if (focusableElements.length === 0) return false

    if (group.orientation === 'grid' && group.gridColumns) {
      return this.focusPreviousInGrid(group, focusableElements)
    }

    let prevIndex = this.currentIndex - 1
    if (prevIndex < 0) {
      prevIndex = group.circular ? focusableElements.length - 1 : 0
    }

    return this.focusElementAtIndex(focusableElements, prevIndex)
  }

  // Move focus up in grid
  focusUp(groupId?: string): boolean {
    const group = this.focusGroups.get(groupId || this.currentGroup || '')
    if (!group || group.orientation !== 'grid' || !group.gridColumns) return false

    const focusableElements = this.getFocusableElements(group)
    const currentRow = Math.floor(this.currentIndex / group.gridColumns)
    const currentCol = this.currentIndex % group.gridColumns
    
    if (currentRow > 0) {
      const newIndex = (currentRow - 1) * group.gridColumns + currentCol
      return this.focusElementAtIndex(focusableElements, newIndex)
    }

    return false
  }

  // Move focus down in grid
  focusDown(groupId?: string): boolean {
    const group = this.focusGroups.get(groupId || this.currentGroup || '')
    if (!group || group.orientation !== 'grid' || !group.gridColumns) return false

    const focusableElements = this.getFocusableElements(group)
    const totalRows = Math.ceil(focusableElements.length / group.gridColumns)
    const currentRow = Math.floor(this.currentIndex / group.gridColumns)
    const currentCol = this.currentIndex % group.gridColumns
    
    if (currentRow < totalRows - 1) {
      const newIndex = Math.min(
        (currentRow + 1) * group.gridColumns + currentCol,
        focusableElements.length - 1
      )
      return this.focusElementAtIndex(focusableElements, newIndex)
    }

    return false
  }

  // Focus first element in group
  focusFirst(groupId?: string): boolean {
    const group = this.focusGroups.get(groupId || this.currentGroup || '')
    if (!group) return false

    const focusableElements = this.getFocusableElements(group)
    return this.focusElementAtIndex(focusableElements, 0)
  }

  // Focus last element in group
  focusLast(groupId?: string): boolean {
    const group = this.focusGroups.get(groupId || this.currentGroup || '')
    if (!group) return false

    const focusableElements = this.getFocusableElements(group)
    return this.focusElementAtIndex(focusableElements, focusableElements.length - 1)
  }

  // Trap focus within an element
  trapFocus(element: HTMLElement): void {
    this.trapStack.push(element)
    this.setupFocusTrap(element)
  }

  // Release focus trap
  releaseFocusTrap(): void {
    const element = this.trapStack.pop()
    if (element) {
      this.removeFocusTrap(element)
    }
  }

  // Get focusable elements within a container
  getFocusableElements(group: FocusGroup): HTMLElement[] {
    return group.elements
      .filter(item => {
        const element = item.element
        if (!element || !document.contains(element)) return false
        if (item.skipOnDisabled && element.hasAttribute('disabled')) return false
        
        // Check if element is visible and focusable
        const style = window.getComputedStyle(element)
        if (style.display === 'none' || style.visibility === 'hidden') return false
        
        return this.isFocusable(element)
      })
      .sort((a, b) => b.priority - a.priority)
      .map(item => item.element)
  }

  // Check if element is focusable
  private isFocusable(element: HTMLElement): boolean {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ]

    return focusableSelectors.some(selector => element.matches(selector)) ||
           element.tabIndex >= 0
  }

  // Focus element at specific index
  private focusElementAtIndex(elements: HTMLElement[], index: number): boolean {
    if (index < 0 || index >= elements.length) return false
    
    const element = elements[index]
    if (element) {
      element.focus()
      this.currentIndex = index
      return true
    }
    
    return false
  }

  // Grid navigation helpers
  private focusNextInGrid(group: FocusGroup, elements: HTMLElement[]): boolean {
    if (!group.gridColumns) return false
    
    const currentRow = Math.floor(this.currentIndex / group.gridColumns)
    const currentCol = this.currentIndex % group.gridColumns
    
    // Try to move right in current row
    if (currentCol < group.gridColumns - 1 && this.currentIndex + 1 < elements.length) {
      return this.focusElementAtIndex(elements, this.currentIndex + 1)
    }
    
    // Move to first column of next row
    const nextRowStart = (currentRow + 1) * group.gridColumns
    if (nextRowStart < elements.length) {
      return this.focusElementAtIndex(elements, nextRowStart)
    }
    
    // Wrap to beginning if circular
    if (group.circular) {
      return this.focusElementAtIndex(elements, 0)
    }
    
    return false
  }

  private focusPreviousInGrid(group: FocusGroup, elements: HTMLElement[]): boolean {
    if (!group.gridColumns) return false
    
    const currentRow = Math.floor(this.currentIndex / group.gridColumns)
    const currentCol = this.currentIndex % group.gridColumns
    
    // Try to move left in current row
    if (currentCol > 0) {
      return this.focusElementAtIndex(elements, this.currentIndex - 1)
    }
    
    // Move to last column of previous row
    if (currentRow > 0) {
      const prevRowEnd = currentRow * group.gridColumns - 1
      const actualIndex = Math.min(prevRowEnd, elements.length - 1)
      return this.focusElementAtIndex(elements, actualIndex)
    }
    
    // Wrap to end if circular
    if (group.circular) {
      return this.focusElementAtIndex(elements, elements.length - 1)
    }
    
    return false
  }

  // Focus trap implementation
  private setupFocusTrap(element: HTMLElement): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = this.getAllFocusableElements(element)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    element.setAttribute('data-focus-trap', 'true')
  }

  private removeFocusTrap(element: HTMLElement): void {
    element.removeAttribute('data-focus-trap')
    // Note: In a real implementation, you'd need to store and remove the specific event listener
  }

  private getAllFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        const style = window.getComputedStyle(element as HTMLElement)
        return style.display !== 'none' && style.visibility !== 'hidden'
      }) as HTMLElement[]
  }
}

// Global focus manager instance
export const focusManager = new FocusManager()

// React hook for focus management
export function useFocusGroup(groupId: string, elements: FocusableElement[], options: {
  circular?: boolean
  orientation?: 'horizontal' | 'vertical' | 'grid'
  gridColumns?: number
} = {}) {
  React.useEffect(() => {
    const group: FocusGroup = {
      id: groupId,
      elements,
      circular: options.circular,
      orientation: options.orientation,
      gridColumns: options.gridColumns
    }

    focusManager.registerGroup(group)
    
    return () => {
      focusManager.unregisterGroup(groupId)
    }
  }, [groupId, elements, options.circular, options.orientation, options.gridColumns])

  return {
    focusNext: () => focusManager.focusNext(groupId),
    focusPrevious: () => focusManager.focusPrevious(groupId),
    focusUp: () => focusManager.focusUp(groupId),
    focusDown: () => focusManager.focusDown(groupId),
    focusFirst: () => focusManager.focusFirst(groupId),
    focusLast: () => focusManager.focusLast(groupId),
    setActive: () => focusManager.setActiveGroup(groupId)
  }
}

// Hook for focus trap
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    if (isActive && containerRef.current) {
      focusManager.trapFocus(containerRef.current)
      
      return () => {
        focusManager.releaseFocusTrap()
      }
    }
  }, [isActive, containerRef])
}

// Utility functions
export function getNextFocusableElement(current: HTMLElement, direction: 'next' | 'previous' = 'next'): HTMLElement | null {
  const focusableElements = Array.from(document.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
  )) as HTMLElement[]

  const currentIndex = focusableElements.indexOf(current)
  if (currentIndex === -1) return null

  const nextIndex = direction === 'next' 
    ? (currentIndex + 1) % focusableElements.length
    : (currentIndex - 1 + focusableElements.length) % focusableElements.length

  return focusableElements[nextIndex]
}

export function focusFirstElement(container: HTMLElement): boolean {
  const focusableElements = Array.from(container.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
  )) as HTMLElement[]

  if (focusableElements.length > 0) {
    focusableElements[0].focus()
    return true
  }

  return false
}

export function restoreFocus(previousElement: HTMLElement | null): void {
  if (previousElement && document.contains(previousElement)) {
    previousElement.focus()
  }
}