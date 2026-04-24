/**
 * Event Bus for Real-time Processing Updates
 * Handles streaming log events and dispatches them to subscribers
 */

export interface ProcessingUpdateEvent {
  id: string; // ${section_id}.${field_path}
  sectionId: string;
  fieldPath: string;
  fieldLabel: string; // User-friendly label
  action: 'replace' | 'append' | 'remove';
  verb: string; // "Updating", "Adding", "Removing"
  timestamp: number;
}

export interface ProcessingCompleteEvent {
  id: string; // Matches ProcessingUpdateEvent.id
  success: boolean;
  errors?: string[];
  timestamp: number;
}

export interface ProcessingErrorEvent {
  id: string;
  errors: string[];
  timestamp: number;
}

type EventType = 'processing-update' | 'processing-complete' | 'processing-error';

type EventHandler<T> = (event: T) => void;

class EventBus {
  private listeners: Map<EventType, Set<EventHandler<any>>> = new Map();

  subscribe<T>(eventType: EventType, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  emit<T>(eventType: EventType, event: T): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  // Clear all listeners (useful for cleanup)
  clear(): void {
    this.listeners.clear();
  }
}

// Global event bus instance
export const eventBus = new EventBus();

/**
 * Parse log line for processing updates
 * Matches: "📝 Processing update: ebddbf13-....language_criteria ... replace"
 */
export function parseProcessingUpdateLog(logLine: string): ProcessingUpdateEvent | null {
  const regex = /^📝 Processing update: (?<section>[a-f0-9\-]+)\.(?<field>[^ ]+) .* (?<action>replace|append|remove)/;
  const match = logLine.match(regex);
  
  if (!match?.groups) return null;
  
  const { section, field, action } = match.groups;

  // Ignore synthetic stage markers that are used for UX only
  // These do not represent actual field updates and were causing coalesced
  // toasts like "Updating Section (4 fields)" to appear regardless of input.
  const stageMarkers = new Set([
    'uploading_files',
    'extracting_text',
    'analyzing_with_ai',
    'applying_updates',
  ])
  if (stageMarkers.has(field)) return null;
  const fieldLabel = formatFieldLabel(field);
  const verb = getActionVerb(action as any);
  
  return {
    id: `${section}.${field}`,
    sectionId: section,
    fieldPath: field,
    fieldLabel,
    action: action as any,
    verb,
    timestamp: Date.now()
  };
}

/**
 * Parse log line for processing completion
 * Matches: "✅ Updated section.field" or "❌ Failed to update section.field"
 */
export function parseProcessingCompleteLog(logLine: string): ProcessingCompleteEvent | null {
  // Success pattern
  const successRegex = /^✅ Updated (?<section>[a-f0-9\-]+)\.(?<field>[^ ]+)/;
  const successMatch = logLine.match(successRegex);
  
  if (successMatch?.groups) {
    const { section, field } = successMatch.groups;
    return {
      id: `${section}.${field}`,
      success: true,
      timestamp: Date.now()
    };
  }
  
  // Error pattern
  const errorRegex = /^❌ Failed to update (?<section>[a-f0-9\-]+)\.(?<field>[^ ]+)/;
  const errorMatch = logLine.match(errorRegex);
  
  if (errorMatch?.groups) {
    const { section, field } = errorMatch.groups;
    return {
      id: `${section}.${field}`,
      success: false,
      errors: ['Update failed'], // Could be enhanced to parse specific errors
      timestamp: Date.now()
    };
  }
  
  return null;
}

/**
 * Convert field path to user-friendly label
 * e.g., "language_criteria" → "Language Criteria"
 */
function formatFieldLabel(fieldPath: string): string {
  return fieldPath
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert action to user-friendly verb
 */
function getActionVerb(action: 'replace' | 'append' | 'remove'): string {
  switch (action) {
    case 'replace':
      return 'Updating';
    case 'append':
      return 'Adding';
    case 'remove':
      return 'Removing';
    default:
      return 'Processing';
  }
}

/**
 * Log stream processor
 * Processes incoming log lines and emits events
 */
export class LogStreamProcessor {
  private timeoutMap: Map<string, NodeJS.Timeout> = new Map();
  private readonly TIMEOUT_MS = 30000; // 30 seconds timeout

  processLogLine(logLine: string): void {
    // Try to parse as processing update
    const updateEvent = parseProcessingUpdateLog(logLine);
    if (updateEvent) {
      eventBus.emit('processing-update', updateEvent);
      
      // Set timeout for this update
      this.setUpdateTimeout(updateEvent.id);
      return;
    }
    
    // Try to parse as processing complete
    const completeEvent = parseProcessingCompleteLog(logLine);
    if (completeEvent) {
      eventBus.emit('processing-complete', completeEvent);
      
      // Clear timeout for this update
      this.clearUpdateTimeout(completeEvent.id);
      return;
    }
  }

  private setUpdateTimeout(id: string): void {
    // Clear existing timeout if any
    this.clearUpdateTimeout(id);
    
    // Set new timeout
    const timeout = setTimeout(() => {
      eventBus.emit('processing-error', {
        id,
        errors: ['Update timed out'],
        timestamp: Date.now()
      });
      this.timeoutMap.delete(id);
    }, this.TIMEOUT_MS);
    
    this.timeoutMap.set(id, timeout);
  }

  private clearUpdateTimeout(id: string): void {
    const timeout = this.timeoutMap.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeoutMap.delete(id);
    }
  }

  // Cleanup method
  cleanup(): void {
    this.timeoutMap.forEach(timeout => clearTimeout(timeout));
    this.timeoutMap.clear();
  }
}

// Global log processor instance
export const logProcessor = new LogStreamProcessor();
