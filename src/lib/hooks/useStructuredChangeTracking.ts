/**
 * Structured Change Tracking Hook
 * 
 * Provides integration between structured data editing and change tracking
 * with automatic field monitoring and change detection.
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useChangeTracking } from '../context/ChangeTrackingContext';
import { FieldChange } from '../structured-change-tracker';
import { resolveFieldPath, setFieldValue } from '../field-path-resolver';

interface StructuredChangeTrackingOptions {
  sectionId: string;
  autoTrack?: boolean;
  trackUserEdits?: boolean;
  debounceMs?: number;
}

interface FieldChangeEvent {
  fieldPath: string;
  previousValue: any;
  newValue: any;
  changeType: FieldChange['change_type'];
  confidence?: number;
  sourceReference?: string;
}

/**
 * Hook for tracking changes in structured data
 */
export function useStructuredChangeTracking(
  data: any,
  setData: (data: any) => void,
  options: StructuredChangeTrackingOptions
) {
  const { trackChange, getChangesForSection } = useChangeTracking();
  const previousDataRef = useRef(data);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    sectionId,
    autoTrack = true,
    trackUserEdits = true,
    debounceMs = 500
  } = options;

  /**
   * Track a field change manually
   */
  const trackFieldChange = useCallback((event: FieldChangeEvent) => {
    const changeId = trackChange({
      section_id: sectionId,
      field_path: event.fieldPath,
      previous_value: event.previousValue,
      new_value: event.newValue,
      change_type: event.changeType,
      confidence: event.confidence,
      source_reference: event.sourceReference
    });

    return changeId;
  }, [trackChange, sectionId]);

  /**
   * Apply an AI-generated change to the data
   */
  const applyAIChange = useCallback((
    fieldPath: string,
    newValue: any,
    confidence: number = 1.0,
    sourceReference?: string
  ) => {
    const previousValue = resolveFieldPath(data, fieldPath);
    
    // Only apply if the value is actually different
    if (JSON.stringify(previousValue) === JSON.stringify(newValue)) {
      return null;
    }

    // Update the data
    const updatedData = setFieldValue(data, fieldPath, newValue);
    setData(updatedData);

    // Track the change
    const changeId = trackFieldChange({
      fieldPath,
      previousValue,
      newValue,
      changeType: 'ai_update',
      confidence,
      sourceReference
    });

    return changeId;
  }, [data, setData, trackFieldChange]);

  /**
   * Apply multiple AI changes at once
   */
  const applyAIChanges = useCallback((
    changes: Array<{
      fieldPath: string;
      newValue: any;
      confidence?: number;
      sourceReference?: string;
    }>
  ) => {
    let updatedData = data;
    const changeIds: string[] = [];

    for (const change of changes) {
      const previousValue = resolveFieldPath(updatedData, change.fieldPath);
      
      // Only apply if the value is actually different
      if (JSON.stringify(previousValue) !== JSON.stringify(change.newValue)) {
        updatedData = setFieldValue(updatedData, change.fieldPath, change.newValue);
        
        const changeId = trackFieldChange({
          fieldPath: change.fieldPath,
          previousValue,
          newValue: change.newValue,
          changeType: 'ai_update',
          confidence: change.confidence || 1.0,
          sourceReference: change.sourceReference
        });

        if (changeId) {
          changeIds.push(changeId);
        }
      }
    }

    // Update data once with all changes
    if (changeIds.length > 0) {
      setData(updatedData);
    }

    return changeIds;
  }, [data, setData, trackFieldChange]);

  /**
   * Apply a merge operation
   */
  const applyMerge = useCallback((
    fieldPath: string,
    newValue: any,
    mergeStrategy: 'replace' | 'append' | 'merge' = 'replace',
    sourceReference?: string
  ) => {
    const previousValue = resolveFieldPath(data, fieldPath);
    let finalValue = newValue;

    // Apply merge strategy
    if (mergeStrategy === 'append' && Array.isArray(previousValue)) {
      finalValue = [...previousValue, ...(Array.isArray(newValue) ? newValue : [newValue])];
    } else if (mergeStrategy === 'merge' && typeof previousValue === 'object' && typeof newValue === 'object') {
      finalValue = { ...previousValue, ...newValue };
    }

    // Update the data
    const updatedData = setFieldValue(data, fieldPath, finalValue);
    setData(updatedData);

    // Track the change
    const changeId = trackFieldChange({
      fieldPath,
      previousValue,
      newValue: finalValue,
      changeType: 'merge',
      sourceReference
    });

    return changeId;
  }, [data, setData, trackFieldChange]);

  /**
   * Revert a field to its previous value
   */
  const revertField = useCallback((fieldPath: string) => {
    const changes = getChangesForSection(sectionId);
    const fieldChanges = changes
      .filter(change => change.field_path === fieldPath)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (fieldChanges.length === 0) {
      return false;
    }

    const latestChange = fieldChanges[0];
    const updatedData = setFieldValue(data, fieldPath, latestChange.previous_value);
    setData(updatedData);

    // Track the revert as a new change
    trackFieldChange({
      fieldPath,
      previousValue: latestChange.new_value,
      newValue: latestChange.previous_value,
      changeType: 'user_edit',
      sourceReference: `Reverted change ${latestChange.id}`
    });

    return true;
  }, [data, setData, getChangesForSection, sectionId, trackFieldChange]);

  /**
   * Get pending changes for a specific field
   */
  const getFieldChanges = useCallback((fieldPath: string) => {
    const changes = getChangesForSection(sectionId);
    return changes.filter(change => change.field_path === fieldPath);
  }, [getChangesForSection, sectionId]);

  /**
   * Check if a field has pending changes
   */
  const hasFieldChanges = useCallback((fieldPath: string) => {
    const changes = getFieldChanges(fieldPath);
    return changes.some(change => !change.acknowledged);
  }, [getFieldChanges]);

  /**
   * Get the confidence score for the latest change to a field
   */
  const getFieldConfidence = useCallback((fieldPath: string) => {
    const changes = getFieldChanges(fieldPath);
    const latestChange = changes
      .filter(change => change.change_type === 'ai_update')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    return latestChange?.confidence;
  }, [getFieldChanges]);

  /**
   * Detect changes automatically when data changes
   */
  useEffect(() => {
    if (!autoTrack || !trackUserEdits) {
      previousDataRef.current = data;
      return;
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce change detection
    debounceTimeoutRef.current = setTimeout(() => {
      const previousData = previousDataRef.current;
      
      if (previousData && JSON.stringify(previousData) !== JSON.stringify(data)) {
        // Detect which fields changed
        const changedFields = detectChangedFields(previousData, data);
        
        for (const { fieldPath, previousValue, newValue } of changedFields) {
          trackFieldChange({
            fieldPath,
            previousValue,
            newValue,
            changeType: 'user_edit'
          });
        }
      }

      previousDataRef.current = data;
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [data, autoTrack, trackUserEdits, debounceMs, trackFieldChange]);

  return {
    // Change application
    applyAIChange,
    applyAIChanges,
    applyMerge,
    revertField,
    
    // Change tracking
    trackFieldChange,
    
    // Change queries
    getFieldChanges,
    hasFieldChanges,
    getFieldConfidence,
    
    // Section changes
    sectionChanges: getChangesForSection(sectionId)
  };
}

/**
 * Detect which fields changed between two data objects
 */
function detectChangedFields(
  previousData: any,
  currentData: any,
  basePath: string = ''
): Array<{ fieldPath: string; previousValue: any; newValue: any }> {
  const changes: Array<{ fieldPath: string; previousValue: any; newValue: any }> = [];
  
  // Use iterative approach to avoid stack overflow
  const stack: Array<{ prev: any; curr: any; path: string }> = [
    { prev: previousData, curr: currentData, path: basePath }
  ];
  
  while (stack.length > 0) {
    const { prev, curr, path } = stack.pop()!;
    
    if (prev === curr) continue;
    
    if (typeof prev !== 'object' || typeof curr !== 'object' || prev === null || curr === null) {
      if (prev !== curr) {
        changes.push({
          fieldPath: path || 'root',
          previousValue: prev,
          newValue: curr
        });
      }
      continue;
    }
    
    // Handle arrays
    if (Array.isArray(prev) || Array.isArray(curr)) {
      if (JSON.stringify(prev) !== JSON.stringify(curr)) {
        changes.push({
          fieldPath: path || 'root',
          previousValue: prev,
          newValue: curr
        });
      }
      continue;
    }
    
    // Handle objects
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
    
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      const prevValue = prev[key];
      const currValue = curr[key];
      
      if (prevValue !== currValue) {
        if (typeof prevValue === 'object' && typeof currValue === 'object' && 
            prevValue !== null && currValue !== null) {
          stack.push({ prev: prevValue, curr: currValue, path: newPath });
        } else {
          changes.push({
            fieldPath: newPath,
            previousValue: prevValue,
            newValue: currValue
          });
        }
      }
    }
  }
  
  return changes;
}