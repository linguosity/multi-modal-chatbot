/**
 * Tests for StructuredChangeTracker
 */

import { 
  StructuredChangeTracker, 
  FieldChange, 
  ChangeFilter,
  getChangeTracker,
  createChangeTracker
} from '../structured-change-tracker';

describe('StructuredChangeTracker', () => {
  let tracker: StructuredChangeTracker;

  beforeEach(() => {
    tracker = new StructuredChangeTracker('test-report-id', false); // Disable persistence for tests
  });

  describe('trackFieldChange', () => {
    it('should track a new field change', () => {
      const changeData = {
        section_id: 'section-1',
        field_path: 'test.field',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'ai_update' as const,
        confidence: 0.9
      };

      const changeId = tracker.trackFieldChange(changeData);

      expect(changeId).toMatch(/^change_\d+_[a-z0-9]+$/);
      
      const changes = tracker.getChangesForSection('section-1');
      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        ...changeData,
        id: changeId,
        acknowledged: false
      });
      expect(changes[0].timestamp).toBeDefined();
    });

    it('should generate unique IDs for multiple changes', () => {
      const changeData = {
        section_id: 'section-1',
        field_path: 'test.field',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'ai_update' as const
      };

      const id1 = tracker.trackFieldChange(changeData);
      const id2 = tracker.trackFieldChange(changeData);

      expect(id1).not.toBe(id2);
    });

    it('should include optional metadata', () => {
      const changeData = {
        section_id: 'section-1',
        field_path: 'test.field',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'merge' as const,
        source_reference: 'test-source',
        user_id: 'user-123',
        metadata: {
          merge_strategy: 'append' as const,
          validation_errors: ['error1'],
          processing_context: 'test context'
        }
      };

      const changeId = tracker.trackFieldChange(changeData);
      const changes = tracker.getChangesForSection('section-1');
      
      expect(changes[0]).toMatchObject(changeData);
    });
  });

  describe('getChangesForSection', () => {
    beforeEach(() => {
      // Add test changes
      tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old1',
        new_value: 'new1',
        change_type: 'ai_update'
      });

      tracker.trackFieldChange({
        section_id: 'section-2',
        field_path: 'field2',
        previous_value: 'old2',
        new_value: 'new2',
        change_type: 'user_edit'
      });

      tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field3',
        previous_value: 'old3',
        new_value: 'new3',
        change_type: 'merge'
      });
    });

    it('should return changes for specific section only', () => {
      const section1Changes = tracker.getChangesForSection('section-1');
      const section2Changes = tracker.getChangesForSection('section-2');

      expect(section1Changes).toHaveLength(2);
      expect(section2Changes).toHaveLength(1);

      section1Changes.forEach(change => {
        expect(change.section_id).toBe('section-1');
      });

      section2Changes.forEach(change => {
        expect(change.section_id).toBe('section-2');
      });
    });

    it('should return changes sorted by timestamp (newest first)', () => {
      const changes = tracker.getChangesForSection('section-1');
      
      expect(changes).toHaveLength(2);
      expect(new Date(changes[0].timestamp).getTime())
        .toBeGreaterThanOrEqual(new Date(changes[1].timestamp).getTime());
    });

    it('should return empty array for non-existent section', () => {
      const changes = tracker.getChangesForSection('non-existent');
      expect(changes).toHaveLength(0);
    });
  });

  describe('getUnacknowledgedChanges', () => {
    beforeEach(() => {
      const id1 = tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old1',
        new_value: 'new1',
        change_type: 'ai_update'
      });

      tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field2',
        previous_value: 'old2',
        new_value: 'new2',
        change_type: 'user_edit'
      });

      // Acknowledge one change
      tracker.acknowledgeChange(id1);
    });

    it('should return only unacknowledged changes', () => {
      const unacknowledged = tracker.getUnacknowledgedChanges();
      
      expect(unacknowledged).toHaveLength(1);
      expect(unacknowledged[0].field_path).toBe('field2');
      expect(unacknowledged[0].acknowledged).toBe(false);
    });

    it('should return empty array when all changes are acknowledged', () => {
      const allChanges = tracker.getChangesForSection('section-1');
      allChanges.forEach(change => {
        tracker.acknowledgeChange(change.id);
      });

      const unacknowledged = tracker.getUnacknowledgedChanges();
      expect(unacknowledged).toHaveLength(0);
    });
  });

  describe('getFilteredChanges', () => {
    beforeEach(() => {
      const baseTime = new Date('2024-01-01T10:00:00Z');
      
      // Mock Date.now to control timestamps
      const originalNow = Date.now;
      let timeOffset = 0;
      
      jest.spyOn(Date, 'now').mockImplementation(() => {
        return baseTime.getTime() + timeOffset;
      });

      tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old1',
        new_value: 'new1',
        change_type: 'ai_update',
        user_id: 'user-1'
      });

      timeOffset += 1000; // 1 second later

      tracker.trackFieldChange({
        section_id: 'section-2',
        field_path: 'field2',
        previous_value: 'old2',
        new_value: 'new2',
        change_type: 'user_edit',
        user_id: 'user-2'
      });

      timeOffset += 1000; // 1 second later

      const id3 = tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field3',
        previous_value: 'old3',
        new_value: 'new3',
        change_type: 'merge',
        user_id: 'user-1'
      });

      tracker.acknowledgeChange(id3);

      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should filter by section_id', () => {
      const filter: ChangeFilter = { section_id: 'section-1' };
      const filtered = tracker.getFilteredChanges(filter);
      
      expect(filtered).toHaveLength(2);
      filtered.forEach(change => {
        expect(change.section_id).toBe('section-1');
      });
    });

    it('should filter by change_type', () => {
      const filter: ChangeFilter = { change_type: 'ai_update' };
      const filtered = tracker.getFilteredChanges(filter);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].change_type).toBe('ai_update');
    });

    it('should filter by acknowledged status', () => {
      const acknowledgedFilter: ChangeFilter = { acknowledged: true };
      const unacknowledgedFilter: ChangeFilter = { acknowledged: false };
      
      const acknowledged = tracker.getFilteredChanges(acknowledgedFilter);
      const unacknowledged = tracker.getFilteredChanges(unacknowledgedFilter);
      
      expect(acknowledged).toHaveLength(1);
      expect(unacknowledged).toHaveLength(2);
    });

    it('should filter by user_id', () => {
      const filter: ChangeFilter = { user_id: 'user-1' };
      const filtered = tracker.getFilteredChanges(filter);
      
      expect(filtered).toHaveLength(2);
      filtered.forEach(change => {
        expect(change.user_id).toBe('user-1');
      });
    });

    it('should filter by date range', () => {
      const filter: ChangeFilter = {
        date_range: {
          start: '2024-01-01T10:00:00Z',
          end: '2024-01-01T10:00:01Z'
        }
      };
      
      const filtered = tracker.getFilteredChanges(filter);
      expect(filtered).toHaveLength(1);
    });

    it('should combine multiple filters', () => {
      const filter: ChangeFilter = {
        section_id: 'section-1',
        acknowledged: false
      };
      
      const filtered = tracker.getFilteredChanges(filter);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].section_id).toBe('section-1');
      expect(filtered[0].acknowledged).toBe(false);
    });
  });

  describe('acknowledgeChange', () => {
    it('should acknowledge a specific change', () => {
      const changeId = tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'ai_update'
      });

      tracker.acknowledgeChange(changeId);

      const changes = tracker.getChangesForSection('section-1');
      expect(changes[0].acknowledged).toBe(true);
    });

    it('should handle non-existent change ID gracefully', () => {
      expect(() => {
        tracker.acknowledgeChange('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('acknowledgeMultipleChanges', () => {
    it('should acknowledge multiple changes at once', () => {
      const id1 = tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old1',
        new_value: 'new1',
        change_type: 'ai_update'
      });

      const id2 = tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field2',
        previous_value: 'old2',
        new_value: 'new2',
        change_type: 'user_edit'
      });

      tracker.acknowledgeMultipleChanges([id1, id2]);

      const changes = tracker.getChangesForSection('section-1');
      expect(changes.every(change => change.acknowledged)).toBe(true);
    });

    it('should handle mix of valid and invalid IDs', () => {
      const validId = tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'ai_update'
      });

      expect(() => {
        tracker.acknowledgeMultipleChanges([validId, 'invalid-id']);
      }).not.toThrow();

      const changes = tracker.getChangesForSection('section-1');
      expect(changes[0].acknowledged).toBe(true);
    });
  });

  describe('getChangeHistory', () => {
    it('should return change history for specific field', () => {
      const fieldPath = 'test.field';
      const sectionId = 'section-1';

      // Add multiple changes to the same field
      tracker.trackFieldChange({
        section_id: sectionId,
        field_path: fieldPath,
        previous_value: 'value1',
        new_value: 'value2',
        change_type: 'ai_update'
      });

      tracker.trackFieldChange({
        section_id: sectionId,
        field_path: fieldPath,
        previous_value: 'value2',
        new_value: 'value3',
        change_type: 'user_edit'
      });

      // Add change to different field
      tracker.trackFieldChange({
        section_id: sectionId,
        field_path: 'other.field',
        previous_value: 'other1',
        new_value: 'other2',
        change_type: 'merge'
      });

      const history = tracker.getChangeHistory(fieldPath, sectionId);
      
      expect(history).toHaveLength(2);
      history.forEach(change => {
        expect(change.field_path).toBe(fieldPath);
        expect(change.section_id).toBe(sectionId);
      });

      // Should be sorted chronologically (oldest first)
      expect(new Date(history[0].timestamp).getTime())
        .toBeLessThanOrEqual(new Date(history[1].timestamp).getTime());
    });

    it('should return empty array for non-existent field', () => {
      const history = tracker.getChangeHistory('non.existent', 'section-1');
      expect(history).toHaveLength(0);
    });
  });

  describe('change listeners', () => {
    it('should notify listeners when changes are tracked', () => {
      const listener = jest.fn();
      tracker.addChangeListener(listener);

      const changeData = {
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'ai_update' as const
      };

      tracker.trackFieldChange(changeData);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining(changeData)
      );
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      tracker.addChangeListener(errorListener);
      tracker.addChangeListener(goodListener);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'ai_update'
      });

      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error in change listener:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should remove listeners correctly', () => {
      const listener = jest.fn();
      tracker.addChangeListener(listener);
      tracker.removeChangeListener(listener);

      tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'ai_update'
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('clearChanges', () => {
    it('should clear all changes', () => {
      tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'ai_update'
      });

      expect(tracker.getChangesForSection('section-1')).toHaveLength(1);

      tracker.clearChanges();

      expect(tracker.getChangesForSection('section-1')).toHaveLength(0);
      expect(tracker.getUnacknowledgedChanges()).toHaveLength(0);
    });
  });

  describe('revertChange', () => {
    it('should throw error for non-existent change', async () => {
      await expect(tracker.revertChange('non-existent')).rejects.toThrow('Change non-existent not found');
    });

    it('should throw not implemented error for existing change', async () => {
      const changeId = tracker.trackFieldChange({
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'ai_update'
      });

      await expect(tracker.revertChange(changeId)).rejects.toThrow('Revert functionality not yet implemented');
    });
  });
});

describe('Global change tracker functions', () => {
  describe('getChangeTracker', () => {
    it('should return same instance for same report ID', () => {
      const tracker1 = getChangeTracker('report-1');
      const tracker2 = getChangeTracker('report-1');
      
      expect(tracker1).toBe(tracker2);
    });

    it('should create new instance for different report ID', () => {
      const tracker1 = getChangeTracker('report-1');
      const tracker2 = getChangeTracker('report-2');
      
      expect(tracker1).not.toBe(tracker2);
    });
  });

  describe('createChangeTracker', () => {
    it('should create new instance each time', () => {
      const tracker1 = createChangeTracker('report-1');
      const tracker2 = createChangeTracker('report-1');
      
      expect(tracker1).not.toBe(tracker2);
    });

    it('should respect persistence setting', () => {
      const tracker = createChangeTracker('report-1', false);
      expect(tracker).toBeInstanceOf(StructuredChangeTracker);
    });
  });
});