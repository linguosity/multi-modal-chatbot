import { useCallback, useRef, useState } from 'react'

export interface HistoryEntry {
  /** Content snapshot */
  content: string
  /** Timestamp */
  timestamp: Date
  /** Optional description of the change */
  description?: string
}

export interface UseEditorHistoryOptions {
  /** Maximum number of history entries to keep */
  maxEntries?: number
  /** Debounce delay for adding entries (ms) */
  debounceDelay?: number
  /** Whether to automatically add entries on content change */
  autoAdd?: boolean
}

export interface UseEditorHistoryReturn {
  /** Whether undo is available */
  canUndo: boolean
  /** Whether redo is available */
  canRedo: boolean
  /** Current history position */
  currentIndex: number
  /** Total history entries */
  historyLength: number
  /** Add entry to history */
  addEntry: (content: string, description?: string) => void
  /** Undo last change */
  undo: () => string | null
  /** Redo next change */
  redo: () => string | null
  /** Clear history */
  clearHistory: () => void
  /** Get history entries */
  getHistory: () => HistoryEntry[]
  /** Jump to specific history entry */
  jumpTo: (index: number) => string | null
}

export function useEditorHistory({
  maxEntries = 50,
  debounceDelay = 1000,
  autoAdd = true
}: UseEditorHistoryOptions = {}): UseEditorHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')

  // Add entry to history
  const addEntry = useCallback(
    (content: string, description?: string) => {
      // Don't add if content hasn't changed
      if (content === lastContentRef.current) {
        return
      }

      const entry: HistoryEntry = {
        content,
        timestamp: new Date(),
        description
      }

      setHistory(prev => {
        // Remove any entries after current index (when undoing then making new changes)
        const newHistory = prev.slice(0, currentIndex + 1)
        
        // Add new entry
        newHistory.push(entry)
        
        // Limit history size
        if (newHistory.length > maxEntries) {
          newHistory.shift()
          setCurrentIndex(prev => Math.max(0, prev - 1))
        } else {
          setCurrentIndex(newHistory.length - 1)
        }
        
        return newHistory
      })

      lastContentRef.current = content
    },
    [currentIndex, maxEntries]
  )

  // Debounced add entry
  const debouncedAddEntry = useCallback(
    (content: string, description?: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        addEntry(content, description)
      }, debounceDelay)
    },
    [addEntry, debounceDelay]
  )

  // Undo
  const undo = useCallback((): string | null => {
    if (currentIndex <= 0) return null

    const newIndex = currentIndex - 1
    setCurrentIndex(newIndex)
    const entry = history[newIndex]
    lastContentRef.current = entry.content
    return entry.content
  }, [currentIndex, history])

  // Redo
  const redo = useCallback((): string | null => {
    if (currentIndex >= history.length - 1) return null

    const newIndex = currentIndex + 1
    setCurrentIndex(newIndex)
    const entry = history[newIndex]
    lastContentRef.current = entry.content
    return entry.content
  }, [currentIndex, history])

  // Jump to specific index
  const jumpTo = useCallback(
    (index: number): string | null => {
      if (index < 0 || index >= history.length) return null

      setCurrentIndex(index)
      const entry = history[index]
      lastContentRef.current = entry.content
      return entry.content
    },
    [history]
  )

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentIndex(-1)
    lastContentRef.current = ''
  }, [])

  // Get history
  const getHistory = useCallback(() => {
    return [...history]
  }, [history])

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  return {
    canUndo,
    canRedo,
    currentIndex,
    historyLength: history.length,
    addEntry: autoAdd ? debouncedAddEntry : addEntry,
    undo,
    redo,
    clearHistory,
    getHistory,
    jumpTo
  }
}