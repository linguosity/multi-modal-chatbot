'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

type Importance = 'info' | 'notice' | 'critical'

interface RecentUpdate {
  sectionId: string
  timestamp: number
  changes: string[] // Array of field paths that were updated
  type: 'ai_update' | 'user_edit' | 'ai_narrative_generated'
  importance?: Importance
  beforeState?: any // For undo functionality
}

interface RecentUpdatesContextType {
  recentUpdates: RecentUpdate[]
  addRecentUpdate: (sectionId: string, changes: string[], type?: 'ai_update' | 'user_edit' | 'ai_narrative_generated', importance?: Importance, beforeState?: any) => void
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



  const addRecentUpdate = useCallback((sectionId: string, changes: string[], type: 'ai_update' | 'user_edit' = 'ai_update', importance: Importance = 'notice', beforeState?: any) => {
    console.log(`📍 Adding recent update for section ${sectionId}:`, changes)
    
    setRecentUpdates(prev => {
      // Remove any existing update for this section
      const filtered = prev.filter(update => update.sectionId !== sectionId)
      
      // Add the new update
      const newUpdate: RecentUpdate = {
        sectionId,
        timestamp: Date.now(),
        changes,
        type,
        importance,
        beforeState
      }
      
      const updated = [...filtered, newUpdate]
      console.log('📍 Updated recent updates:', updated)
      return updated
    })
  }, [])

  const clearRecentUpdate = useCallback((sectionId: string) => {
    console.log(`🧹 Clearing recent update for section ${sectionId}`)
    setRecentUpdates(prev => {
      console.log(`📊 Before clear - Total updates: ${prev.length}`)
      const filtered = prev.filter(update => update.sectionId !== sectionId)
      console.log(`📊 After clear - Remaining updates: ${filtered.length}`)
      return filtered
    })
  }, [])

  const isRecentlyUpdated = useCallback((sectionId: string) => {
    const update = recentUpdates.find(update => update.sectionId === sectionId)
    if (!update) return false
    
    // Different expiry times based on importance
    const expiryTime = {
      'info': 5000,      // 5 seconds for low-priority (auto-saves, typos)
      'notice': 30000,   // 30 seconds for normal updates
      'critical': 120000 // 2 minutes for critical updates (AI overwrites)
    }[update.importance || 'notice']
    
    const isRecent = Date.now() - update.timestamp < expiryTime
    
    // Don't auto-clear during render - let components handle expiry
    return isRecent
  }, [recentUpdates])

  // Separate function to clean up expired updates (called from useEffect)
  const cleanupExpiredUpdates = useCallback(() => {
    const now = Date.now()
    const expiredSections: string[] = []
    
    recentUpdates.forEach(update => {
      const expiryTime = {
        'info': 5000,
        'notice': 30000,
        'critical': 120000
      }[update.importance || 'notice']
      
      if (now - update.timestamp >= expiryTime) {
        expiredSections.push(update.sectionId)
      }
    })
    
    expiredSections.forEach(sectionId => {
      clearRecentUpdate(sectionId)
    })
  }, [recentUpdates, clearRecentUpdate])

  // Periodically clean up expired updates
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredUpdates()
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [cleanupExpiredUpdates])

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
      // Don't clear during render - this could cause infinite loops
      // Let the cleanup interval handle expired updates
      return false
    }
    
    return update.changes.includes(fieldPath)
  }, [recentUpdates])

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