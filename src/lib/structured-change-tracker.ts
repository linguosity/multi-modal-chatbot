/**
 * Structured Change Tracker
 * 
 * Monitors and tracks field-level changes in structured data with audit trail,
 * event notifications, and change management capabilities.
 * 
 * CRITICAL: Uses iterative algorithms only - no recursion to prevent stack overflow
 */

export interface FieldChange {
  id: string;
  section_id: string;
  field_path: string;
  previous_value: any;
  new_value: any;
  change_type: 'ai_update' | 'user_edit' | 'merge' | 'validation_fix';
  confidence?: number;
  source_reference?: string;
  timestamp: string;
  acknowledged: boolean;
  user_id?: string;
  metadata?: {
    merge_strategy?: 'replace' | 'append' | 'merge';
    validation_errors?: string[];
    processing_context?: string;
  };
}

export interface ChangeFilter {
  section_id?: string;
  field_path?: string;
  change_type?: FieldChange['change_type'];
  acknowledged?: boolean;
  user_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface ChangeListener {
  (change: FieldChange): void;
}

export interface ChangeTracker {
  trackFieldChange(change: Omit<FieldChange, 'id' | 'timestamp' | 'acknowledged'>): string;
  getChangesForSection(sectionId: string): FieldChange[];
  getUnacknowledgedChanges(): FieldChange[];
  getFilteredChanges(filter: ChangeFilter): FieldChange[];
  acknowledgeChange(changeId: string): void;
  acknowledgeMultipleChanges(changeIds: string[]): void;
  revertChange(changeId: string): Promise<void>;
  addChangeListener(listener: ChangeListener): void;
  removeChangeListener(listener: ChangeListener): void;
  persistChanges(): Promise<void>;
  loadChanges(reportId: string): Promise<void>;
  clearChanges(): void;
  getChangeHistory(fieldPath: string, sectionId: string): FieldChange[];
}

/**
 * In-memory change tracker with persistence capabilities
 */
export class StructuredChangeTracker implements ChangeTracker {
  private changes: Map<string, FieldChange> = new Map();
  private changeListeners: ChangeListener[] = [];
  private reportId: string | null = null;
  private persistenceEnabled: boolean = true;
  private changeTrackingService: any = null; // Lazy loaded to avoid circular imports

  constructor(reportId?: string, enablePersistence: boolean = true) {
    this.reportId = reportId || null;
    this.persistenceEnabled = enablePersistence;
  }

  /**
   * Lazy load the change tracking service to avoid circular imports
   */
  private async getChangeTrackingService() {
    if (!this.changeTrackingService) {
      const { getChangeTrackingService } = await import('./change-tracking-service');
      this.changeTrackingService = getChangeTrackingService();
    }
    return this.changeTrackingService;
  }

  /**
   * Track a new field change
   */
  trackFieldChange(change: Omit<FieldChange, 'id' | 'timestamp' | 'acknowledged'>): string {
    const id = this.generateChangeId();
    const fullChange: FieldChange = {
      ...change,
      id,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.changes.set(id, fullChange);
    this.notifyListeners(fullChange);

    // Persist if enabled
    if (this.persistenceEnabled) {
      this.persistChanges().catch(error => {
        console.error('Failed to persist change:', error);
      });
    }

    return id;
  }

  /**
   * Get all changes for a specific section
   */
  getChangesForSection(sectionId: string): FieldChange[] {
    const sectionChanges: FieldChange[] = [];
    
    // Iterative approach to avoid stack overflow
    for (const change of this.changes.values()) {
      if (change.section_id === sectionId) {
        sectionChanges.push(change);
      }
    }

    return sectionChanges.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get all unacknowledged changes
   */
  getUnacknowledgedChanges(): FieldChange[] {
    const unacknowledged: FieldChange[] = [];
    
    for (const change of this.changes.values()) {
      if (!change.acknowledged) {
        unacknowledged.push(change);
      }
    }

    return unacknowledged.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get changes based on filter criteria
   */
  getFilteredChanges(filter: ChangeFilter): FieldChange[] {
    const filtered: FieldChange[] = [];
    
    for (const change of this.changes.values()) {
      if (this.matchesFilter(change, filter)) {
        filtered.push(change);
      }
    }

    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Acknowledge a single change
   */
  acknowledgeChange(changeId: string): void {
    const change = this.changes.get(changeId);
    if (change) {
      const updatedChange = { ...change, acknowledged: true };
      this.changes.set(changeId, updatedChange);
      
      if (this.persistenceEnabled) {
        this.persistChanges().catch(error => {
          console.error('Failed to persist acknowledgment:', error);
        });
      }
    }
  }

  /**
   * Acknowledge multiple changes at once
   */
  acknowledgeMultipleChanges(changeIds: string[]): void {
    let hasChanges = false;
    
    for (const changeId of changeIds) {
      const change = this.changes.get(changeId);
      if (change && !change.acknowledged) {
        const updatedChange = { ...change, acknowledged: true };
        this.changes.set(changeId, updatedChange);
        hasChanges = true;
      }
    }

    if (hasChanges && this.persistenceEnabled) {
      this.persistChanges().catch(error => {
        console.error('Failed to persist bulk acknowledgments:', error);
      });
    }
  }

  /**
   * Revert a change (placeholder for future implementation)
   */
  async revertChange(changeId: string): Promise<void> {
    const change = this.changes.get(changeId);
    if (!change) {
      throw new Error(`Change ${changeId} not found`);
    }

    // TODO: Implement actual revert logic
    // This would involve:
    // 1. Using field path resolver to set the field back to previous_value
    // 2. Updating the database
    // 3. Notifying listeners of the revert
    // 4. Creating a new change record for the revert action
    
    throw new Error('Revert functionality not yet implemented');
  }

  /**
   * Add a change listener
   */
  addChangeListener(listener: ChangeListener): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove a change listener
   */
  removeChangeListener(listener: ChangeListener): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Persist changes to database
   */
  async persistChanges(): Promise<void> {
    if (!this.reportId || !this.persistenceEnabled) {
      return;
    }

    try {
      const service = await this.getChangeTrackingService();
      const metadata = {
        field_changes: Array.from(this.changes.values()),
        last_ai_update: this.getLastAIUpdate(),
        validation_status: 'valid' as const
      };

      await service.saveChangeMetadata(this.reportId, metadata);
      
      if (process.env.NEXT_PUBLIC_DEBUG) {
        console.log('Persisted changes for report:', this.reportId, {
          changeCount: this.changes.size,
          unacknowledged: this.getUnacknowledgedChanges().length
        });
      }
    } catch (error) {
      console.error('Failed to persist changes:', error);
    }
  }

  /**
   * Load changes from database
   */
  async loadChanges(reportId: string): Promise<void> {
    this.reportId = reportId;
    this.changes.clear();

    if (!this.persistenceEnabled) {
      return;
    }

    try {
      const service = await this.getChangeTrackingService();
      const metadata = await service.loadChangeMetadata(reportId);
      
      // Populate changes map from loaded data
      if (metadata.field_changes) {
        for (const change of metadata.field_changes) {
          this.changes.set(change.id, change);
        }
      }
      
      if (process.env.NEXT_PUBLIC_DEBUG) {
        console.log('Loaded changes for report:', reportId, {
          changeCount: this.changes.size
        });
      }
    } catch (error) {
      console.error('Failed to load changes:', error);
    }
  }

  /**
   * Clear all changes from memory
   */
  clearChanges(): void {
    this.changes.clear();
  }

  /**
   * Get change history for a specific field
   */
  getChangeHistory(fieldPath: string, sectionId: string): FieldChange[] {
    const history: FieldChange[] = [];
    
    for (const change of this.changes.values()) {
      if (change.field_path === fieldPath && change.section_id === sectionId) {
        history.push(change);
      }
    }

    return history.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Generate a unique change ID
   */
  private generateChangeId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `change_${timestamp}_${random}`;
  }

  /**
   * Notify all listeners of a change
   */
  private notifyListeners(change: FieldChange): void {
    // Use iterative approach to avoid stack overflow with many listeners
    for (const listener of this.changeListeners) {
      try {
        listener(change);
      } catch (error) {
        console.error('Error in change listener:', error);
      }
    }
  }

  /**
   * Get the timestamp of the last AI update
   */
  private getLastAIUpdate(): string | undefined {
    let lastUpdate: string | undefined;
    
    for (const change of this.changes.values()) {
      if (change.change_type === 'ai_update') {
        if (!lastUpdate || new Date(change.timestamp) > new Date(lastUpdate)) {
          lastUpdate = change.timestamp;
        }
      }
    }
    
    return lastUpdate;
  }

  /**
   * Check if a change matches the filter criteria
   */
  private matchesFilter(change: FieldChange, filter: ChangeFilter): boolean {
    if (filter.section_id && change.section_id !== filter.section_id) {
      return false;
    }

    if (filter.field_path && change.field_path !== filter.field_path) {
      return false;
    }

    if (filter.change_type && change.change_type !== filter.change_type) {
      return false;
    }

    if (filter.acknowledged !== undefined && change.acknowledged !== filter.acknowledged) {
      return false;
    }

    if (filter.user_id && change.user_id !== filter.user_id) {
      return false;
    }

    if (filter.date_range) {
      const changeTime = new Date(change.timestamp).getTime();
      const startTime = new Date(filter.date_range.start).getTime();
      const endTime = new Date(filter.date_range.end).getTime();
      
      if (changeTime < startTime || changeTime > endTime) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Global change tracker instance
 */
let globalChangeTracker: StructuredChangeTracker | null = null;

/**
 * Get or create the global change tracker instance
 */
export function getChangeTracker(reportId?: string): StructuredChangeTracker {
  if (!globalChangeTracker || (reportId && globalChangeTracker['reportId'] !== reportId)) {
    globalChangeTracker = new StructuredChangeTracker(reportId);
  }
  return globalChangeTracker;
}

/**
 * Create a new change tracker instance
 */
export function createChangeTracker(reportId?: string, enablePersistence: boolean = true): StructuredChangeTracker {
  return new StructuredChangeTracker(reportId, enablePersistence);
}