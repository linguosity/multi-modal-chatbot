'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  shortcutManager, 
  type KeyboardShortcut, 
  SHORTCUT_GROUPS 
} from '@/lib/keyboard/shortcuts'
import { focusManager } from '@/lib/keyboard/focus-management'
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-navigation'

export interface KeyboardNavigationContextValue {
  /** Whether keyboard navigation is enabled */
  isEnabled: boolean
  /** Enable/disable keyboard navigation */
  setEnabled: (enabled: boolean) => void
  /** Show keyboard shortcuts modal */
  showShortcuts: () => void
  /** Hide keyboard shortcuts modal */
  hideShortcuts: () => void
  /** Whether shortcuts modal is visible */
  shortcutsVisible: boolean
  /** Register a temporary shortcut */
  registerShortcut: (shortcut: KeyboardShortcut) => void
  /** Unregister a temporary shortcut */
  unregisterShortcut: (key: string, modifiers?: string[]) => void
  /** Current navigation context */
  navigationContext: string | null
  /** Set navigation context */
  setNavigationContext: (context: string | null) => void
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextValue | undefined>(undefined)

export interface KeyboardNavigationProviderProps {
  children: React.ReactNode
  /** Whether to enable keyboard navigation by default */
  defaultEnabled?: boolean
  /** Whether to show navigation hints */
  showHints?: boolean
}

export function KeyboardNavigationProvider({
  children,
  defaultEnabled = true,
  showHints = true
}: KeyboardNavigationProviderProps) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled)
  const [shortcutsVisible, setShortcutsVisible] = useState(false)
  const [navigationContext, setNavigationContext] = useState<string | null>(null)
  const router = useRouter()

  // Stable router handler
  const goToDashboard = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  // Initialize global shortcuts
  useEffect(() => {
    if (!isEnabled) return

    const globalShortcuts: KeyboardShortcut[] = [
      // Help and shortcuts
      {
        id: 'show-shortcuts',
        key: '/',
        modifiers: ['ctrl'],
        description: 'Show keyboard shortcuts',
        category: 'Help',
        handler: () => setShortcutsVisible(true)
      },
      {
        id: 'help',
        key: 'F1',
        modifiers: [],
        description: 'Show help',
        category: 'Help',
        handler: () => {
          // TODO: Implement help system
          console.log('Help requested')
        }
      },
      
      // Navigation
      {
        id: 'go-to-dashboard',
        key: 'h',
        modifiers: ['ctrl'],
        description: 'Go to dashboard',
        category: 'Navigation',
        handler: goToDashboard
      },
      
      // Modal and dialog
      {
        id: 'close-modal',
        key: 'Escape',
        modifiers: [],
        description: 'Close modal/dialog',
        category: 'Modal',
        handler: () => {
          // This will be handled by individual modals
          // but we register it globally for documentation
        },
        preventDefault: false // Let modals handle this
      }
    ]

    globalShortcuts.forEach(shortcut => shortcutManager.register(shortcut))
    
    return () => {
      globalShortcuts.forEach(shortcut => {
        shortcutManager.unregister(shortcut.key, shortcut.modifiers)
      })
    }
  }, [isEnabled, goToDashboard])

  // Enable/disable shortcut manager
  useEffect(() => {
    shortcutManager.setEnabled(isEnabled)
  }, [isEnabled])

  // Register context-specific shortcuts
  useEffect(() => {
    if (!isEnabled || !navigationContext) return

    let contextShortcuts: KeyboardShortcut[] = []

    switch (navigationContext) {
      case 'report-editing':
        contextShortcuts = SHORTCUT_GROUPS.REPORT_EDITING.map(shortcut => ({
          ...shortcut,
          handler: () => {
            // These will be implemented by specific components
            console.log(`Report editing shortcut: ${shortcut.id}`)
          }
        }))
        break
        
      case 'assessment-tools':
        contextShortcuts = SHORTCUT_GROUPS.ASSESSMENT_TOOLS.map(shortcut => ({
          ...shortcut,
          handler: () => {
            // These will be implemented by specific components
            console.log(`Assessment tools shortcut: ${shortcut.id}`)
          }
        }))
        break
    }

    contextShortcuts.forEach(shortcut => shortcutManager.register(shortcut))
    
    return () => {
      contextShortcuts.forEach(shortcut => {
        shortcutManager.unregister(shortcut.key, shortcut.modifiers)
      })
    }
  }, [isEnabled, navigationContext])

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcutManager.register(shortcut)
  }, [])

  const unregisterShortcut = useCallback((key: string, modifiers: string[] = []) => {
    shortcutManager.unregister(key, modifiers)
  }, [])

  const showShortcuts = useCallback(() => {
    setShortcutsVisible(true)
  }, [])

  const hideShortcuts = useCallback(() => {
    setShortcutsVisible(false)
  }, [])

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled)
  }, [])

  const value: KeyboardNavigationContextValue = {
    isEnabled,
    setEnabled,
    showShortcuts,
    hideShortcuts,
    shortcutsVisible,
    registerShortcut,
    unregisterShortcut,
    navigationContext,
    setNavigationContext
  }

  return (
    <KeyboardNavigationContext.Provider value={value}>
      {children}
      
      {/* Global keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsVisible}
        onClose={hideShortcuts}
      />
    </KeyboardNavigationContext.Provider>
  )
}

export function useKeyboardNavigation() {
  const context = useContext(KeyboardNavigationContext)
  if (context === undefined) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider')
  }
  return context
}

// Hook for registering component-specific shortcuts
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  deps: any[] = []
) {
  const { isEnabled, registerShortcut, unregisterShortcut } = useKeyboardNavigation()

  useEffect(() => {
    if (!isEnabled) return

    shortcuts.forEach(shortcut => registerShortcut(shortcut))
    
    return () => {
      shortcuts.forEach(shortcut => {
        unregisterShortcut(shortcut.key, shortcut.modifiers)
      })
    }
  }, [isEnabled, registerShortcut, unregisterShortcut, ...deps])
}

// Hook for setting navigation context
export function useNavigationContext(context: string) {
  const { setNavigationContext } = useKeyboardNavigation()

  useEffect(() => {
    setNavigationContext(context)
    
    return () => {
      setNavigationContext(null)
    }
  }, [context, setNavigationContext])
}

// Hook for report editing shortcuts
export function useReportEditingShortcuts(handlers: {
  onSave?: () => void
  onSaveAs?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onAIGenerate?: () => void
  onNextSection?: () => void
  onPrevSection?: () => void
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      id: 'save-report',
      key: 's',
      modifiers: ['ctrl'],
      description: 'Save current report',
      category: 'File Operations',
      handler: () => handlers.onSave?.()
    },
    {
      id: 'save-as-report',
      key: 's',
      modifiers: ['ctrl', 'shift'],
      description: 'Save report as...',
      category: 'File Operations',
      handler: () => handlers.onSaveAs?.()
    },
    {
      id: 'undo-action',
      key: 'z',
      modifiers: ['ctrl'],
      description: 'Undo last action',
      category: 'Editing',
      handler: () => handlers.onUndo?.()
    },
    {
      id: 'redo-action',
      key: 'y',
      modifiers: ['ctrl'],
      description: 'Redo last action',
      category: 'Editing',
      handler: () => handlers.onRedo?.()
    },
    {
      id: 'ai-generate',
      key: 'g',
      modifiers: ['ctrl', 'shift'],
      description: 'Generate with AI',
      category: 'AI Tools',
      handler: () => handlers.onAIGenerate?.()
    },
    {
      id: 'next-section',
      key: 'ArrowRight',
      modifiers: ['ctrl'],
      description: 'Next section',
      category: 'Navigation',
      handler: () => handlers.onNextSection?.()
    },
    {
      id: 'prev-section',
      key: 'ArrowLeft',
      modifiers: ['ctrl'],
      description: 'Previous section',
      category: 'Navigation',
      handler: () => handlers.onPrevSection?.()
    }
  ].filter(shortcut => {
    // Only register shortcuts that have handlers
    const handlerKey = shortcut.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    return handlers[handlerKey as keyof typeof handlers] !== undefined
  })

  useKeyboardShortcuts(shortcuts, [handlers])
}

// Hook for assessment tools shortcuts
export function useAssessmentToolsShortcuts(handlers: {
  onAddAssessment?: () => void
  onSearchTools?: () => void
  onGridNavigation?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onSelectItem?: () => void
  onActivateItem?: () => void
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      id: 'add-assessment',
      key: 'a',
      modifiers: ['ctrl', 'shift'],
      description: 'Add assessment tool',
      category: 'Assessment Tools',
      handler: () => handlers.onAddAssessment?.()
    },
    {
      id: 'search-tools',
      key: 'f',
      modifiers: ['ctrl', 'shift'],
      description: 'Search assessment tools',
      category: 'Assessment Tools',
      handler: () => handlers.onSearchTools?.()
    }
  ].filter(shortcut => {
    const handlerKey = shortcut.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    return handlers[handlerKey as keyof typeof handlers] !== undefined
  })

  useKeyboardShortcuts(shortcuts, [handlers])
}