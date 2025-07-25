'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface RecentUpdate {
  sectionId: string
  timestamp: number
  changes: string[] // Array of field paths that were updated
  type: 'ai_update' | 'user_edit'
}

interface RecentUpdatesContextType {
  recentUpdates: RecentUpdate[]
  addRecentUpdate: (sectionId: string, changes: string[], type?: 'ai_update' | 'user_edit') => void
  clearRecentUpdate: (sectionId: string) => void
  clearFieldUpdate: (sectionId: string, fieldPath: string) => void
  isRecentlyUpdated: (sectionId: string) => boolean
  isFieldRecentlyUpdated: (sectionId: string, fieldPath: string) => boolean
  getRecentUpdate: (sectionId: string) => RecentUpdate | undefined
  getFieldChanges: (sectionId: string) => string[]
  clearAllUpdates: () => void
}

const RecentUpdatesContext = createContext<RecentUpdatesContextType | undefined>(undefined)

export function RecentUpdatesProvider({ children }: { children: React.ReactNode }) {
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentUpdates')
      if (stored) {
        const parsed = JSON.parse(stored) as RecentUpdate[]
        // Filter out updates older than 30 seconds
        const fresh = parsed.filter(update => Date.now() - update.timestamp < 30000)
        setRecentUpdates(fresh)
      }
    } catch (error) {
      console.error('Failed to load recent updates from localStorage:', error)
    }
  }, [])

  // Save to localStorage whenever updates change
  useEffect(() => {
    try {
      localStorage.setItem('recentUpdates', JSON.stringify(recentUpdates))
    } catch (error) {
      console.error('Failed to save recent updates to localStorage:', error)
    }
  }, [recentUpdates])

  const addRecentUpdate = useCallback((sectionId: string, changes: string[], type: 'ai_update' | 'user_edit' = 'ai_update') => {
    console.log(`📍 Adding recent update for section ${sectionId}:`, changes)
    
    setRecentUpdates(prev => {
      // Remove any existing update for this section
      const filtered = prev.filter(update => update.sectionId !== sectionId)
      
      // Add the new update
      const newUpdate: RecentUpdate = {
        sectionId,
        timestamp: Date.now(),
        changes,
        type
      }
      
      const updated = [...filtered, newUpdate]
      console.log('📍 Updated recent updates:', updated)
      return updated
    })
  }, [])

  const clearRecentUpdate = useCallback((sectionId: string) => {
    console.log(`🧹 Clearing recent update for section ${sectionId}`)
    setRecentUpdates(prev => prev.filter(update => update.sectionId !== sectionId))
  }, [])

  const isRecentlyUpdated = useCallback((sectionId: string) => {
    const update = recentUpdates.find(update => update.sectionId === sectionId)
    if (!update) return false
    
    // Consider updates "recent" for 30 seconds
    const isRecent = Date.now() - update.timestamp < 30000
    
    // Auto-clear old updates
    if (!isRecent) {
      clearRecentUpdate(sectionId)
      return false
    }
    
    return true
  }, [recentUpdates, clearRecentUpdate])

  const getRecentUpdate = useCallback((sectionId: string) => {
    return recentUpdates.find(update => update.sectionId === sectionId)
  }, [recentUpdates])

  const clearFieldUpdate = useCallback((sectionId: string, fieldPath: string) => {
    console.log(`🧹 Clearing field update for ${sectionId}.${fieldPath}`)
    setRecentUpdates(prev => prev.map(update => {
      if (update.sectionId === sectionId) {
        const newChanges = update.changes.filter(change => change !== fieldPath)
        // If no changes left, remove the entire update
        if (newChanges.length === 0) {
          return null
        }
        return { ...update, changes: newChanges }
      }
      return update
    }).filter(Boolean) as RecentUpdate[])
  }, [])

  const isFieldRecentlyUpdated = useCallback((sectionId: string, fieldPath: string) => {
    const update = recentUpdates.find(update => update.sectionId === sectionId)
    if (!update) return false
    
    // Check if update is still recent (30 seconds)
    const isRecent = Date.now() - update.timestamp < 30000
    if (!isRecent) {
      clearRecentUpdate(sectionId)
      return false
    }
    
    return update.changes.includes(fieldPath)
  }, [recentUpdates, clearRecentUpdate])

  const getFieldChanges = useCallback((sectionId: string) => {
    const update = recentUpdates.find(update => update.sectionId === sectionId)
    return update?.changes || []
  }, [recentUpdates])

  const clearAllUpdates = useCallback(() => {
    console.log('🧹 Clearing all recent updates')
    setRecentUpdates([])
  }, [])

  return (
    <RecentUpdatesContext.Provider value={{
      recentUpdates,
      addRecentUpdate,
      clearRecentUpdate,
      clearFieldUpdate,
      isRecentlyUpdated,
      isFieldRecentlyUpdated,
      getRecentUpdate,
      getFieldChanges,
      clearAllUpdates
    }}>
      {children}
    </RecentUpdatesContext.Provider>
  )
}

export function useRecentUpdates() {
  const context = useContext(RecentUpdatesContext)
  if (context === undefined) {
    throw new Error('useRecentUpdates must be used within a RecentUpdatesProvider')
  }
  return context
}