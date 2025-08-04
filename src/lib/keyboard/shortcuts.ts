// Comprehensive keyboard navigation system for clinical workflows

import React from 'react'

export interface KeyboardShortcut {
  id: string
  key: string
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[]
  description: string
  category: string
  handler: () => void
  disabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
}

export interface KeyboardShortcutGroup {
  category: string
  shortcuts: KeyboardShortcut[]
}

// Common keyboard shortcuts for clinical workflows
export const CLINICAL_SHORTCUTS = {
  // File operations
  SAVE: { key: 's', modifiers: ['ctrl'], description: 'Save current report' },
  SAVE_AS: { key: 's', modifiers: ['ctrl', 'shift'], description: 'Save report as...' },
  NEW_REPORT: { key: 'n', modifiers: ['ctrl'], description: 'Create new report' },
  OPEN_REPORT: { key: 'o', modifiers: ['ctrl'], description: 'Open report' },
  PRINT: { key: 'p', modifiers: ['ctrl'], description: 'Print report' },
  
  // Navigation
  NEXT_SECTION: { key: 'ArrowRight', modifiers: ['ctrl'], description: 'Next section' },
  PREV_SECTION: { key: 'ArrowLeft', modifiers: ['ctrl'], description: 'Previous section' },
  FIRST_SECTION: { key: 'Home', modifiers: ['ctrl'], description: 'First section' },
  LAST_SECTION: { key: 'End', modifiers: ['ctrl'], description: 'Last section' },
  GO_TO_DASHBOARD: { key: 'h', modifiers: ['ctrl'], description: 'Go to dashboard' },
  
  // Editing
  UNDO: { key: 'z', modifiers: ['ctrl'], description: 'Undo last action' },
  REDO: { key: 'y', modifiers: ['ctrl'], description: 'Redo last action' },
  CUT: { key: 'x', modifiers: ['ctrl'], description: 'Cut selected text' },
  COPY: { key: 'c', modifiers: ['ctrl'], description: 'Copy selected text' },
  PASTE: { key: 'v', modifiers: ['ctrl'], description: 'Paste from clipboard' },
  SELECT_ALL: { key: 'a', modifiers: ['ctrl'], description: 'Select all text' },
  
  // AI and Tools
  AI_GENERATE: { key: 'g', modifiers: ['ctrl', 'shift'], description: 'Generate with AI' },
  AI_ENHANCE: { key: 'e', modifiers: ['ctrl', 'shift'], description: 'Enhance with AI' },
  SPELL_CHECK: { key: 'F7', modifiers: [], description: 'Check spelling' },
  WORD_COUNT: { key: 'w', modifiers: ['ctrl', 'shift'], description: 'Show word count' },
  
  // Assessment Tools
  ADD_ASSESSMENT: { key: 'a', modifiers: ['ctrl', 'shift'], description: 'Add assessment tool' },
  SEARCH_TOOLS: { key: 'f', modifiers: ['ctrl', 'shift'], description: 'Search assessment tools' },
  
  // View and Display
  TOGGLE_SIDEBAR: { key: 'b', modifiers: ['ctrl'], description: 'Toggle sidebar' },
  TOGGLE_PREVIEW: { key: 'p', modifiers: ['ctrl', 'shift'], description: 'Toggle preview mode' },
  ZOOM_IN: { key: '=', modifiers: ['ctrl'], description: 'Zoom in' },
  ZOOM_OUT: { key: '-', modifiers: ['ctrl'], description: 'Zoom out' },
  RESET_ZOOM: { key: '0', modifiers: ['ctrl'], description: 'Reset zoom' },
  
  // Help and Support
  HELP: { key: 'F1', modifiers: [], description: 'Show help' },
  SHORTCUTS: { key: '/', modifiers: ['ctrl'], description: 'Show keyboard shortcuts' },
  
  // Modal and Dialog
  CLOSE_MODAL: { key: 'Escape', modifiers: [], description: 'Close modal/dialog' },
  CONFIRM_ACTION: { key: 'Enter', modifiers: ['ctrl'], description: 'Confirm action' },
  
  // Grid Navigation
  GRID_UP: { key: 'ArrowUp', modifiers: [], description: 'Move up in grid' },
  GRID_DOWN: { key: 'ArrowDown', modifiers: [], description: 'Move down in grid' },
  GRID_LEFT: { key: 'ArrowLeft', modifiers: [], description: 'Move left in grid' },
  GRID_RIGHT: { key: 'ArrowRight', modifiers: [], description: 'Move right in grid' },
  GRID_SELECT: { key: 'Space', modifiers: [], description: 'Select grid item' },
  GRID_ACTIVATE: { key: 'Enter', modifiers: [], description: 'Activate grid item' }
} as const

// Keyboard shortcut manager class
export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private listeners: Map<string, (event: KeyboardEvent) => void> = new Map()
  private isEnabled = true
  private debugMode = false

  constructor() {
    this.bindGlobalListener()
  }

  // Register a keyboard shortcut
  register(shortcut: KeyboardShortcut): void {
    const key = this.createShortcutKey(shortcut.key, shortcut.modifiers || [])
    this.shortcuts.set(key, shortcut)
    
    if (this.debugMode) {
      console.log(`Registered shortcut: ${key} - ${shortcut.description}`)
    }
  }

  // Unregister a keyboard shortcut
  unregister(key: string, modifiers: string[] = []): void {
    const shortcutKey = this.createShortcutKey(key, modifiers)
    this.shortcuts.delete(shortcutKey)
    
    if (this.debugMode) {
      console.log(`Unregistered shortcut: ${shortcutKey}`)
    }
  }

  // Register multiple shortcuts
  registerGroup(shortcuts: KeyboardShortcut[]): void {
    shortcuts.forEach(shortcut => this.register(shortcut))
  }

  // Enable/disable shortcut system
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  // Enable debug mode
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  // Get all registered shortcuts grouped by category
  getShortcutGroups(): KeyboardShortcutGroup[] {
    const groups: Record<string, KeyboardShortcut[]> = {}
    
    this.shortcuts.forEach(shortcut => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = []
      }
      groups[shortcut.category].push(shortcut)
    })

    return Object.entries(groups).map(([category, shortcuts]) => ({
      category,
      shortcuts: shortcuts.sort((a, b) => a.description.localeCompare(b.description))
    }))
  }

  // Create a unique key for the shortcut
  private createShortcutKey(key: string, modifiers: string[]): string {
    const sortedModifiers = [...modifiers].sort()
    return `${sortedModifiers.join('+')}+${key.toLowerCase()}`
  }

  // Check if modifiers match
  private modifiersMatch(event: KeyboardEvent, modifiers: string[]): boolean {
    const eventModifiers = []
    if (event.ctrlKey) eventModifiers.push('ctrl')
    if (event.altKey) eventModifiers.push('alt')
    if (event.shiftKey) eventModifiers.push('shift')
    if (event.metaKey) eventModifiers.push('meta')

    if (eventModifiers.length !== modifiers.length) return false
    
    return modifiers.every(modifier => eventModifiers.includes(modifier))
  }

  // Global keyboard event listener
  private bindGlobalListener(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!this.isEnabled) return

      // Don't trigger shortcuts when typing in inputs (unless specifically allowed)
      const target = event.target as HTMLElement
      const isInputElement = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.contentEditable === 'true'

      // Allow certain shortcuts even in input elements
      const allowedInInputs = ['ctrl+s', 'ctrl+z', 'ctrl+y', 'escape', 'f1']
      const currentShortcut = this.createShortcutKey(event.key, this.getEventModifiers(event))
      
      if (isInputElement && !allowedInInputs.includes(currentShortcut)) {
        return
      }

      const shortcut = this.shortcuts.get(currentShortcut)
      
      if (shortcut && !shortcut.disabled) {
        if (this.debugMode) {
          console.log(`Executing shortcut: ${currentShortcut} - ${shortcut.description}`)
        }

        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        
        if (shortcut.stopPropagation !== false) {
          event.stopPropagation()
        }

        try {
          shortcut.handler()
        } catch (error) {
          console.error(`Error executing shortcut ${currentShortcut}:`, error)
        }
      }
    })
  }

  // Get modifiers from keyboard event
  private getEventModifiers(event: KeyboardEvent): string[] {
    const modifiers = []
    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')
    if (event.metaKey) modifiers.push('meta')
    return modifiers
  }

  // Cleanup
  destroy(): void {
    this.shortcuts.clear()
    this.listeners.clear()
  }
}

// Global shortcut manager instance
export const shortcutManager = new KeyboardShortcutManager()

// Utility function to format shortcut display
export function formatShortcut(key: string, modifiers: string[] = []): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  const modifierMap = {
    ctrl: isMac ? '⌘' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: isMac ? '⇧' : 'Shift',
    meta: isMac ? '⌘' : 'Win'
  }

  const keyMap: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Enter: '↵',
    Escape: 'Esc',
    Space: 'Space',
    Home: 'Home',
    End: 'End',
    F1: 'F1',
    F7: 'F7'
  }

  const formattedModifiers = modifiers.map(mod => modifierMap[mod as keyof typeof modifierMap] || mod)
  const formattedKey = keyMap[key] || key.toUpperCase()
  
  return [...formattedModifiers, formattedKey].join(isMac ? '' : '+')
}

// Hook for using keyboard shortcuts in React components
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], deps: any[] = []) {
  React.useEffect(() => {
    shortcuts.forEach(shortcut => shortcutManager.register(shortcut))
    
    return () => {
      shortcuts.forEach(shortcut => {
        shortcutManager.unregister(shortcut.key, shortcut.modifiers)
      })
    }
  }, deps)
}

// Predefined shortcut groups for different contexts
export const SHORTCUT_GROUPS = {
  REPORT_EDITING: [
    { ...CLINICAL_SHORTCUTS.SAVE, id: 'save', category: 'File Operations' },
    { ...CLINICAL_SHORTCUTS.SAVE_AS, id: 'save-as', category: 'File Operations' },
    { ...CLINICAL_SHORTCUTS.UNDO, id: 'undo', category: 'Editing' },
    { ...CLINICAL_SHORTCUTS.REDO, id: 'redo', category: 'Editing' },
    { ...CLINICAL_SHORTCUTS.AI_GENERATE, id: 'ai-generate', category: 'AI Tools' },
    { ...CLINICAL_SHORTCUTS.NEXT_SECTION, id: 'next-section', category: 'Navigation' },
    { ...CLINICAL_SHORTCUTS.PREV_SECTION, id: 'prev-section', category: 'Navigation' }
  ],
  
  ASSESSMENT_TOOLS: [
    { ...CLINICAL_SHORTCUTS.ADD_ASSESSMENT, id: 'add-assessment', category: 'Assessment Tools' },
    { ...CLINICAL_SHORTCUTS.SEARCH_TOOLS, id: 'search-tools', category: 'Assessment Tools' },
    { ...CLINICAL_SHORTCUTS.GRID_UP, id: 'grid-up', category: 'Grid Navigation' },
    { ...CLINICAL_SHORTCUTS.GRID_DOWN, id: 'grid-down', category: 'Grid Navigation' },
    { ...CLINICAL_SHORTCUTS.GRID_SELECT, id: 'grid-select', category: 'Grid Navigation' }
  ],
  
  GLOBAL: [
    { ...CLINICAL_SHORTCUTS.HELP, id: 'help', category: 'Help' },
    { ...CLINICAL_SHORTCUTS.SHORTCUTS, id: 'shortcuts', category: 'Help' },
    { ...CLINICAL_SHORTCUTS.CLOSE_MODAL, id: 'close-modal', category: 'Modal' },
    { ...CLINICAL_SHORTCUTS.GO_TO_DASHBOARD, id: 'dashboard', category: 'Navigation' }
  ]
}