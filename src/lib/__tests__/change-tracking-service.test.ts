/**
 * Tests for ChangeTrackingService
 */

import { ChangeTrackingService, ChangeTrackingMetadata } from '../change-tracking-service';
import { FieldChange } from '../structured-change-tracker';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn()
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('ChangeTrackingService', () => {
  let service: ChangeTrackingService;
  let mockSelect: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    service = new ChangeTrackingService();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock chain
    mockSingle = jest.fn();
    mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    
    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      update: mockUpdate
    });
  });

  describe('loadChangeMetadata', () => {
    it('should load change metadata successfully', async () => {
      const mockMetadata: ChangeTrackingMetadata = {
        field_changes: [
          {
            id: 'change-1',
            section_id: 'section-1',
            field_path: 'test.field',
            previous_value: 'old',
            new_value: 'new',
            change_type: 'ai_update',
            timestamp: '2024-01-01T10:00:00Z',
            acknowledged: false
          }
        ],
        validation_status: 'valid'
      };

      mockSingle.mockResolvedValue({
        data: { change_tracking_metadata: mockMetadata },
        error: null
      });

      const result = await service.loadChangeMetadata('report-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('reports');
      expect(mockSelect).toHaveBeenCalledWith('change_tracking_metadata');
      expect(mockEq).toHaveBeenCalledWith('id', 'report-1');
      expect(result).toEqual(mockMetadata);
    });

    it('should return empty metadata on error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      const result = await service.loadChangeMetadata('report-1');

      expect(result).toEqual({ field_changes: [] });
    });

    it('should return empty metadata when no data exists', async () => {
      mockSingle.mockResolvedValue({
        data: { change_tracking_metadata: null },
        error: null
      });

      const result = await service.loadChangeMetadata('report-1');

      expect(result).toEqual({ field_changes: [] });
    });

    it('should handle exceptions gracefully', async () => {
      mockSingle.mockRejectedValue(new Error('Network error'));

      const result = await service.loadChangeMetadata('report-1');

      expect(result).toEqual({ field_changes: [] });
    });
  });

  describe('saveChangeMetadata', () => {
    it('should save metadata successfully', async () => {
      const metadata: ChangeTrackingMetadata = {
        field_changes: [],
        validation_status: 'valid'
      };

      mockEq.mockResolvedValue({ error: null });

      const result = await service.saveChangeMetadata('report-1', metadata);

      expect(mockSupabase.from).toHaveBeenCalledWith('reports');
      expect(mockUpdate).toHaveBeenCalledWith({ change_tracking_metadata: metadata });
      expect(mockEq).toHaveBeenCalledWith('id', 'report-1');
      expect(result).toBe(true);
    });

    it('should return false on database error', async () => {
      const metadata: ChangeTrackingMetadata = { field_changes: [] };

      mockEq.mockResolvedValue({ error: new Error('Update failed') });

      const result = await service.saveChangeMetadata('report-1', metadata);

      expect(result).toBe(false);
    });

    it('should handle exceptions gracefully', async () => {
      const metadata: ChangeTrackingMetadata = { field_changes: [] };

      mockEq.mockRejectedValue(new Error('Network error'));

      const result = await service.saveChangeMetadata('report-1', metadata);

      expect(result).toBe(false);
    });
  });

  describe('addFieldChange', () => {
    it('should add field change using database function', async () => {
      const changeId = 'change_123_abc';
      
      mockSupabase.rpc.mockResolvedValue({
        data: changeId,
        error: null
      });

      const result = await service.addFieldChange(
        'report-1',
        'section-1',
        'test.field',
        'old',
        'new',
        'ai_update',
        {
          confidence: 0.9,
          sourceReference: 'test-source',
          userId: 'user-1'
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_field_change', {
        report_id: 'report-1',
        section_id: 'section-1',
        field_path: 'test.field',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'ai_update',
        confidence: 0.9,
        source_reference: 'test-source',
        user_id: 'user-1'
      });
      expect(result).toBe(changeId);
    });

    it('should return null on database error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Function failed')
      });

      const result = await service.addFieldChange(
        'report-1',
        'section-1',
        'test.field',
        'old',
        'new',
        'ai_update'
      );

      expect(result).toBeNull();
    });

    it('should handle missing options', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: 'change-id',
        error: null
      });

      await service.addFieldChange(
        'report-1',
        'section-1',
        'test.field',
        'old',
        'new',
        'user_edit'
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_field_change', {
        report_id: 'report-1',
        section_id: 'section-1',
        field_path: 'test.field',
        previous_value: 'old',
        new_value: 'new',
        change_type: 'user_edit',
        confidence: null,
        source_reference: null,
        user_id: null
      });
    });
  });

  describe('getUnacknowledgedChanges', () => {
    it('should get unacknowledged changes using database function', async () => {
      const changes: FieldChange[] = [
        {
          id: 'change-1',
          section_id: 'section-1',
          field_path: 'test.field',
          previous_value: 'old',
          new_value: 'new',
          change_type: 'ai_update',
          timestamp: '2024-01-01T10:00:00Z',
          acknowledged: false
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: changes,
        error: null
      });

      const result = await service.getUnacknowledgedChanges('report-1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_unacknowledged_changes', {
        report_id: 'report-1'
      });
      expect(result).toEqual(changes);
    });

    it('should return empty array on error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Function failed')
      });

      const result = await service.getUnacknowledgedChanges('report-1');

      expect(result).toEqual([]);
    });
  });

  describe('acknowledgeChanges', () => {
    it('should acknowledge changes using database function', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null
      });

      const result = await service.acknowledgeChanges('report-1', ['change-1', 'change-2']);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('acknowledge_changes', {
        report_id: 'report-1',
        change_ids: ['change-1', 'change-2']
      });
      expect(result).toBe(true);
    });

    it('should return false on database error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: new Error('Function failed')
      });

      const result = await service.acknowledgeChanges('report-1', ['change-1']);

      expect(result).toBe(false);
    });
  });

  describe('getFilteredChanges', () => {
    const mockChanges: FieldChange[] = [
      {
        id: 'change-1',
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old1',
        new_value: 'new1',
        change_type: 'ai_update',
        timestamp: '2024-01-01T10:00:00Z',
        acknowledged: false,
        user_id: 'user-1'
      },
      {
        id: 'change-2',
        section_id: 'section-2',
        field_path: 'field2',
        previous_value: 'old2',
        new_value: 'new2',
        change_type: 'user_edit',
        timestamp: '2024-01-01T11:00:00Z',
        acknowledged: true,
        user_id: 'user-2'
      },
      {
        id: 'change-3',
        section_id: 'section-1',
        field_path: 'field1',
        previous_value: 'old3',
        new_value: 'new3',
        change_type: 'ai_update',
        timestamp: '2024-01-01T12:00:00Z',
        acknowledged: false,
        user_id: 'user-1'
      }
    ];

    beforeEach(() => {
      // Mock loadChangeMetadata to return test data
      jest.spyOn(service, 'loadChangeMetadata').mockResolvedValue({
        field_changes: mockChanges
      });
    });

    it('should filter by section ID', async () => {
      const result = await service.getFilteredChanges('report-1', {
        sectionId: 'section-1'
      });

      expect(result).toHaveLength(2);
      expect(result.every(c => c.section_id === 'section-1')).toBe(true);
    });

    it('should filter by field path', async () => {
      const result = await service.getFilteredChanges('report-1', {
        fieldPath: 'field1'
      });

      expect(result).toHaveLength(2);
      expect(result.every(c => c.field_path === 'field1')).toBe(true);
    });

    it('should filter by change type', async () => {
      const result = await service.getFilteredChanges('report-1', {
        changeType: 'ai_update'
      });

      expect(result).toHaveLength(2);
      expect(result.every(c => c.change_type === 'ai_update')).toBe(true);
    });

    it('should filter by acknowledged status', async () => {
      const result = await service.getFilteredChanges('report-1', {
        acknowledged: false
      });

      expect(result).toHaveLength(2);
      expect(result.every(c => !c.acknowledged)).toBe(true);
    });

    it('should filter by user ID', async () => {
      const result = await service.getFilteredChanges('report-1', {
        userId: 'user-1'
      });

      expect(result).toHaveLength(2);
      expect(result.every(c => c.user_id === 'user-1')).toBe(true);
    });

    it('should filter by date range', async () => {
      const result = await service.getFilteredChanges('report-1', {
        dateRange: {
          start: '2024-01-01T10:30:00Z',
          end: '2024-01-01T11:30:00Z'
        }
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('change-2');
    });

    it('should combine multiple filters', async () => {
      const result = await service.getFilteredChanges('report-1', {
        sectionId: 'section-1',
        acknowledged: false
      });

      expect(result).toHaveLength(2);
      expect(result.every(c => c.section_id === 'section-1' && !c.acknowledged)).toBe(true);
    });

    it('should sort results by timestamp (newest first)', async () => {
      const result = await service.getFilteredChanges('report-1', {});

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('change-3'); // Most recent
      expect(result[1].id).toBe('change-2');
      expect(result[2].id).toBe('change-1'); // Oldest
    });
  });

  describe('getChangeStatistics', () => {
    it('should calculate change statistics correctly', async () => {
      const mockChanges: FieldChange[] = [
        {
          id: 'change-1',
          section_id: 'section-1',
          field_path: 'field1',
          previous_value: 'old1',
          new_value: 'new1',
          change_type: 'ai_update',
          timestamp: '2024-01-01T10:00:00Z',
          acknowledged: false
        },
        {
          id: 'change-2',
          section_id: 'section-1',
          field_path: 'field2',
          previous_value: 'old2',
          new_value: 'new2',
          change_type: 'user_edit',
          timestamp: '2024-01-01T11:00:00Z',
          acknowledged: true
        },
        {
          id: 'change-3',
          section_id: 'section-2',
          field_path: 'field3',
          previous_value: 'old3',
          new_value: 'new3',
          change_type: 'ai_update',
          timestamp: '2024-01-01T12:00:00Z',
          acknowledged: false
        }
      ];

      jest.spyOn(service, 'loadChangeMetadata').mockResolvedValue({
        field_changes: mockChanges,
        last_ai_update: '2024-01-01T12:00:00Z'
      });

      const result = await service.getChangeStatistics('report-1');

      expect(result).toEqual({
        total: 3,
        unacknowledged: 2,
        byType: {
          ai_update: 2,
          user_edit: 1
        },
        bySection: {
          'section-1': 2,
          'section-2': 1
        },
        lastUpdate: '2024-01-01T12:00:00Z'
      });
    });

    it('should handle empty changes', async () => {
      jest.spyOn(service, 'loadChangeMetadata').mockResolvedValue({
        field_changes: []
      });

      const result = await service.getChangeStatistics('report-1');

      expect(result).toEqual({
        total: 0,
        unacknowledged: 0,
        byType: {},
        bySection: {},
        lastUpdate: undefined
      });
    });
  });

  describe('updateValidationStatus', () => {
    it('should update validation status', async () => {
      const existingMetadata = {
        field_changes: [],
        validation_status: 'valid' as const
      };

      jest.spyOn(service, 'loadChangeMetadata').mockResolvedValue(existingMetadata);
      jest.spyOn(service, 'saveChangeMetadata').mockResolvedValue(true);

      const result = await service.updateValidationStatus('report-1', 'invalid', ['Error 1']);

      expect(service.saveChangeMetadata).toHaveBeenCalledWith('report-1', {
        field_changes: [],
        validation_status: 'invalid',
        validation_errors: ['Error 1']
      });
      expect(result).toBe(true);
    });
  });

  describe('cleanupOldChanges', () => {
    it('should remove old acknowledged changes', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 days ago

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      const mockChanges: FieldChange[] = [
        {
          id: 'old-change',
          section_id: 'section-1',
          field_path: 'field1',
          previous_value: 'old',
          new_value: 'new',
          change_type: 'ai_update',
          timestamp: oldDate.toISOString(),
          acknowledged: true
        },
        {
          id: 'recent-change',
          section_id: 'section-1',
          field_path: 'field2',
          previous_value: 'old',
          new_value: 'new',
          change_type: 'user_edit',
          timestamp: recentDate.toISOString(),
          acknowledged: true
        },
        {
          id: 'unacknowledged-old',
          section_id: 'section-1',
          field_path: 'field3',
          previous_value: 'old',
          new_value: 'new',
          change_type: 'merge',
          timestamp: oldDate.toISOString(),
          acknowledged: false
        }
      ];

      jest.spyOn(service, 'loadChangeMetadata').mockResolvedValue({
        field_changes: mockChanges
      });
      jest.spyOn(service, 'saveChangeMetadata').mockResolvedValue(true);

      const result = await service.cleanupOldChanges('report-1', 30);

      expect(service.saveChangeMetadata).toHaveBeenCalledWith('report-1', {
        field_changes: [
          mockChanges[1], // Recent acknowledged change kept
          mockChanges[2]  // Old unacknowledged change kept
        ]
      });
      expect(result).toBe(true);
    });
  });
});