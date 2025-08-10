/**
 * Progress Toast Dispatcher
 * Manages real-time field-level progress toasts based on event bus events
 */

import { eventBus, ProcessingUpdateEvent, ProcessingCompleteEvent, ProcessingErrorEvent } from './event-bus';

export interface ProgressToast {
  id: string;
  sectionId: string;
  fieldLabel: string;
  verb: string;
  status: 'processing' | 'success' | 'error' | 'timeout';
  errors?: string[];
  timestamp: number;
  count?: number; // For coalesced toasts
}

type ToastUpdateHandler = (toasts: Map<string, ProgressToast>) => void;

class ProgressToastDispatcher {
  private toasts: Map<string, ProgressToast> = new Map();
  private sectionCounts: Map<string, number> = new Map();
  private updateHandlers: Set<ToastUpdateHandler> = new Set();
  private readonly MAX_CONCURRENT_TOASTS = 5;
  private readonly COALESCE_THRESHOLD = 3; // Coalesce when 3+ updates in same section

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Subscribe to processing updates
    eventBus.subscribe<ProcessingUpdateEvent>('processing-update', (event) => {
      this.handleProcessingUpdate(event);
    });

    // Subscribe to processing completion
    eventBus.subscribe<ProcessingCompleteEvent>('processing-complete', (event) => {
      this.handleProcessingComplete(event);
    });

    // Subscribe to processing errors
    eventBus.subscribe<ProcessingErrorEvent>('processing-error', (event) => {
      this.handleProcessingError(event);
    });
  }

  private handleProcessingUpdate(event: ProcessingUpdateEvent): void {
    const { id, sectionId, fieldLabel, verb } = event;
    
    // Update section count
    const currentCount = this.sectionCounts.get(sectionId) || 0;
    this.sectionCounts.set(sectionId, currentCount + 1);
    
    // Check if we should coalesce toasts for this section
    if (currentCount >= this.COALESCE_THRESHOLD) {
      this.handleCoalescedToast(sectionId, verb);
    } else {
      // Create individual toast
      const toast: ProgressToast = {
        id,
        sectionId,
        fieldLabel,
        verb,
        status: 'processing',
        timestamp: event.timestamp
      };
      
      this.addToast(toast);
    }
  }

  private handleCoalescedToast(sectionId: string, verb: string): void {
    const coalescedId = `${sectionId}.coalesced`;
    const count = this.sectionCounts.get(sectionId) || 0;
    
    // Remove individual toasts for this section
    Array.from(this.toasts.keys())
      .filter(id => id.startsWith(sectionId) && id !== coalescedId)
      .forEach(id => this.toasts.delete(id));
    
    // Create or update coalesced toast
    const toast: ProgressToast = {
      id: coalescedId,
      sectionId,
      fieldLabel: this.getSectionLabel(sectionId),
      verb,
      status: 'processing',
      timestamp: Date.now(),
      count
    };
    
    this.addToast(toast);
  }

  private handleProcessingComplete(event: ProcessingCompleteEvent): void {
    const { id, success } = event;
    const toast = this.toasts.get(id);
    
    if (toast) {
      toast.status = success ? 'success' : 'error';
      toast.errors = success ? undefined : event.errors;
      
      // Don't auto-remove toasts - let user dismiss them manually
      
      this.notifyHandlers();
    }
    
    // Update section count
    const sectionId = id.split('.')[0];
    const currentCount = this.sectionCounts.get(sectionId) || 0;
    if (currentCount > 0) {
      this.sectionCounts.set(sectionId, currentCount - 1);
    }
  }

  private handleProcessingError(event: ProcessingErrorEvent): void {
    const { id, errors } = event;
    const toast = this.toasts.get(id);
    
    if (toast) {
      toast.status = 'error';
      toast.errors = errors;
      this.notifyHandlers();
    }
  }

  private addToast(toast: ProgressToast): void {
    // Enforce max concurrent toasts
    if (this.toasts.size >= this.MAX_CONCURRENT_TOASTS) {
      // Remove oldest toast
      const oldestId = Array.from(this.toasts.keys())[0];
      this.toasts.delete(oldestId);
    }
    
    this.toasts.set(toast.id, toast);
    this.notifyHandlers();
  }

  removeToast(id: string): void {
    this.toasts.delete(id);
    this.notifyHandlers();
  }

  private getSectionLabel(sectionId: string): string {
    // This could be enhanced to map section IDs to user-friendly names
    // For now, return a generic label
    return 'Section';
  }

  private notifyHandlers(): void {
    this.updateHandlers.forEach(handler => handler(new Map(this.toasts)));
  }

  // Public API
  subscribe(handler: ToastUpdateHandler): () => void {
    this.updateHandlers.add(handler);
    
    // Immediately notify with current state
    handler(new Map(this.toasts));
    
    // Return unsubscribe function
    return () => {
      this.updateHandlers.delete(handler);
    };
  }

  getActiveToasts(): Map<string, ProgressToast> {
    return new Map(this.toasts);
  }

  clearAllToasts(): void {
    this.toasts.clear();
    this.sectionCounts.clear();
    this.notifyHandlers();
  }

  // Cleanup method
  cleanup(): void {
    this.toasts.clear();
    this.sectionCounts.clear();
    this.updateHandlers.clear();
  }
}

// Global dispatcher instance
export const progressToastDispatcher = new ProgressToastDispatcher();

/**
 * React hook for using progress toasts
 */
export function useProgressToasts() {
  const [toasts, setToasts] = React.useState<Map<string, ProgressToast>>(new Map());

  React.useEffect(() => {
    const unsubscribe = progressToastDispatcher.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return {
    toasts: Array.from(toasts.values()),
    clearAll: () => progressToastDispatcher.clearAllToasts()
  };
}

// Import React for the hook
import React from 'react';