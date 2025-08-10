/**
 * Change Tracking Context
 * 
 * Provides change tracking functionality across the application with
 * React context integration and real-time updates.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  StructuredChangeTracker, 
  FieldChange, 
  ChangeFilter,
  getChangeTracker 
} from '../structured-change-tracker';

interface ChangeTrackingContextValue {
  // Core tracking functions
  trackChange: (change: Omit<FieldChange, 'id' | 'timestamp' | 'acknowledged'>) => string;
  acknowledgeChange: (changeId: string) => void;
  acknowledgeMultipleChanges: (changeIds: string[]) => void;
  revertChange: (changeId: string) => Promise<void>;
  
  // Query functions
  getChangesForSection: (sectionId: string) => FieldChange[];
  getUnacknowledgedChanges: () => FieldChange[];
  getFilteredChanges: (filter: ChangeFilter) => FieldChange[];
  getChangeHistory: (fieldPath: string, sectionId: string) => FieldChange[];
  
  // State
  allChanges: FieldChange[];
  unacknowledgedCount: number;
  isLoading: boolean;
  
  // Utilities
  clearChanges: () => void;
  refreshChanges: () => void;
}

const ChangeTrackingContext = createContext<ChangeTrackingContextValue | null>(null);

interface ChangeTrackingProviderProps {
  children: ReactNode;
  reportId: string;
}

export function ChangeTrackingProvider({ children, reportId }: ChangeTrackingProviderProps) {
  const [tracker] = useState(() => getChangeTracker(reportId));
  const [allChanges, setAllChanges] = useState<FieldChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh changes from tracker
  const refreshChanges = useCallback(() => {
    // Get all changes by using an empty filter
    const changes = tracker.getFilteredChanges({});
    setAllChanges(changes);
  }, [tracker]);

  // Track a new change
  const trackChange = useCallback((change: Omit<FieldChange, 'id' | 'timestamp' | 'acknowledged'>) => {
    const changeId = tracker.trackFieldChange(change);
    refreshChanges();
    return changeId;
  }, [tracker, refreshChanges]);

  // Acknowledge a single change
  const acknowledgeChange = useCallback((changeId: string) => {
    tracker.acknowledgeChange(changeId);
    refreshChanges();
  }, [tracker, refreshChanges]);

  // Acknowledge multiple changes
  const acknowledgeMultipleChanges = useCallback((changeIds: string[]) => {
    tracker.acknowledgeMultipleChanges(changeIds);
    refreshChanges();
  }, [tracker, refreshChanges]);

  // Revert a change
  const revertChange = useCallback(async (changeId: string) => {
    await tracker.revertChange(changeId);
    refreshChanges();
  }, [tracker, refreshChanges]);

  // Query functions that use current state
  const getChangesForSection = useCallback((sectionId: string) => {
    return tracker.getChangesForSection(sectionId);
  }, [tracker]);

  const getUnacknowledgedChanges = useCallback(() => {
    return tracker.getUnacknowledgedChanges();
  }, [tracker]);

  const getFilteredChanges = useCallback((filter: ChangeFilter) => {
    return tracker.getFilteredChanges(filter);
  }, [tracker]);

  const getChangeHistory = useCallback((fieldPath: string, sectionId: string) => {
    return tracker.getChangeHistory(fieldPath, sectionId);
  }, [tracker]);

  // Clear all changes
  const clearChanges = useCallback(() => {
    tracker.clearChanges();
    refreshChanges();
  }, [tracker, refreshChanges]);

  // Calculate unacknowledged count
  const unacknowledgedCount = allChanges.filter(change => !change.acknowledged).length;

  // Set up change listener
  useEffect(() => {
    const handleChange = () => {
      refreshChanges();
    };

    tracker.addChangeListener(handleChange);
    
    return () => {
      tracker.removeChangeListener(handleChange);
    };
  }, [tracker, refreshChanges]);

  // Load initial changes
  useEffect(() => {
    const loadInitialChanges = async () => {
      setIsLoading(true);
      try {
        await tracker.loadChanges(reportId);
        refreshChanges();
      } catch (error) {
        console.error('Failed to load changes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialChanges();
  }, [reportId, tracker, refreshChanges]);

  const contextValue: ChangeTrackingContextValue = {
    // Core functions
    trackChange,
    acknowledgeChange,
    acknowledgeMultipleChanges,
    revertChange,
    
    // Query functions
    getChangesForSection,
    getUnacknowledgedChanges,
    getFilteredChanges,
    getChangeHistory,
    
    // State
    allChanges,
    unacknowledgedCount,
    isLoading,
    
    // Utilities
    clearChanges,
    refreshChanges
  };

  return (
    <ChangeTrackingContext.Provider value={contextValue}>
      {children}
    </ChangeTrackingContext.Provider>
  );
}

/**
 * Hook to use change tracking functionality
 */
export function useChangeTracking() {
  const context = useContext(ChangeTrackingContext);
  if (!context) {
    throw new Error('useChangeTracking must be used within a ChangeTrackingProvider');
  }
  return context;
}

/**
 * Hook to get changes for a specific section
 */
export function useSectionChanges(sectionId: string) {
  const { getChangesForSection, allChanges } = useChangeTracking();
  
  return React.useMemo(() => {
    return getChangesForSection(sectionId);
  }, [getChangesForSection, sectionId, allChanges]);
}

/**
 * Hook to get unacknowledged changes
 */
export function useUnacknowledgedChanges() {
  const { getUnacknowledgedChanges, allChanges } = useChangeTracking();
  
  return React.useMemo(() => {
    return getUnacknowledgedChanges();
  }, [getUnacknowledgedChanges, allChanges]);
}

/**
 * Hook to get filtered changes with automatic updates
 */
export function useFilteredChanges(filter: ChangeFilter) {
  const { getFilteredChanges, allChanges } = useChangeTracking();
  
  return React.useMemo(() => {
    return getFilteredChanges(filter);
  }, [getFilteredChanges, filter, allChanges]);
}

/**
 * Hook to get change history for a specific field
 */
export function useFieldChangeHistory(fieldPath: string, sectionId: string) {
  const { getChangeHistory, allChanges } = useChangeTracking();
  
  return React.useMemo(() => {
    return getChangeHistory(fieldPath, sectionId);
  }, [getChangeHistory, fieldPath, sectionId, allChanges]);
}