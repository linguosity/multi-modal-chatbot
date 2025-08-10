/**
 * Unit tests for StructuredDataMerger
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StructuredDataMerger, FieldSchema, MergeStrategy } from '../structured-data-merger';

describe('StructuredDataMerger', () => {
  let merger: StructuredDataMerger;

  beforeEach(() => {
    merger = new StructuredDataMerger();
  });

  describe('Replace Strategy', () => {
    it('should replace string values', () => {
      const schema: FieldSchema = { key: 'name', type: 'string' };
      const result = merger.mergeFieldUpdate('old value', 'new value', 'replace', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toBe('new value');
      expect(result.metadata.originalValue).toBe('old value');
      expect(result.metadata.strategy).toBe('replace');
    });

    it('should replace number values', () => {
      const schema: FieldSchema = { key: 'score', type: 'number' };
      const result = merger.mergeFieldUpdate(85, 92, 'replace', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toBe(92);
    });

    it('should validate type constraints', () => {
      const schema: FieldSchema = { key: 'score', type: 'number' };
      const result = merger.mergeFieldUpdate(85, 'invalid', 'replace', schema);

      expect(result.success).toBe(false);
      expect(result.mergedValue).toBe(85); // Should preserve original
      expect(result.warnings).toContain(expect.stringContaining('Expected number'));
    });

    it('should validate enum constraints', () => {
      const schema: FieldSchema = { 
        key: 'status', 
        type: 'string', 
        options: ['active', 'inactive', 'pending'] 
      };
      const result = merger.mergeFieldUpdate('active', 'invalid', 'replace', schema);

      expect(result.success).toBe(false);
      expect(result.warnings).toContain(expect.stringContaining('not in allowed options'));
    });

    it('should detect conflicts with low confidence', () => {
      const schema: FieldSchema = { key: 'name', type: 'string' };
      const result = merger.mergeFieldUpdate('existing', 'new', 'replace', schema, 0.5);

      expect(result.success).toBe(true);
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts![0].conflict_type).toBe('value_conflict');
      expect(result.conflicts![0].description).toContain('Low confidence');
    });
  });

  describe('Append Strategy', () => {
    it('should append to arrays without duplicates', () => {
      const schema: FieldSchema = { key: 'items', type: 'array' };
      const current = ['item1', 'item2'];
      const newVal = ['item2', 'item3'];
      
      const result = merger.mergeFieldUpdate(current, newVal, 'append', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual(['item1', 'item2', 'item3']);
    });

    it('should append single items to arrays', () => {
      const schema: FieldSchema = { key: 'items', type: 'array' };
      const current = ['item1'];
      const newVal = 'item2';
      
      const result = merger.mergeFieldUpdate(current, newVal, 'append', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual(['item1', 'item2']);
    });

    it('should handle empty arrays', () => {
      const schema: FieldSchema = { key: 'items', type: 'array' };
      const current = null;
      const newVal = ['item1'];
      
      const result = merger.mergeFieldUpdate(current, newVal, 'append', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual(['item1']);
    });

    it('should concatenate strings with smart separators', () => {
      const schema: FieldSchema = { key: 'description', type: 'string' };
      const current = 'First sentence';
      const newVal = 'Second sentence';
      
      const result = merger.mergeFieldUpdate(current, newVal, 'append', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toBe('First sentence. Second sentence');
    });

    it('should handle strings ending with periods', () => {
      const schema: FieldSchema = { key: 'description', type: 'string' };
      const current = 'First sentence.';
      const newVal = 'Second sentence';
      
      const result = merger.mergeFieldUpdate(current, newVal, 'append', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toBe('First sentence.Second sentence');
    });

    it('should fall back to replace for non-appendable types', () => {
      const schema: FieldSchema = { key: 'flag', type: 'boolean' };
      const result = merger.mergeFieldUpdate(true, false, 'append', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toBe(false);
      expect(result.warnings).toContain(expect.stringContaining('Cannot append to boolean'));
    });

    it('should warn about duplicate items', () => {
      const schema: FieldSchema = { key: 'items', type: 'array' };
      const current = ['item1'];
      const newVal = ['item1', 'item1', 'item2'];
      
      const result = merger.mergeFieldUpdate(current, newVal, 'append', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual(['item1', 'item2']);
      expect(result.warnings).toContain(expect.stringContaining('duplicate items were skipped'));
    });
  });

  describe('Merge Strategy', () => {
    it('should merge objects preserving existing properties', () => {
      const schema: FieldSchema = {
        key: 'assessment',
        type: 'object',
        children: [
          { key: 'score', type: 'number' },
          { key: 'notes', type: 'string' }
        ]
      };
      
      const current = { score: 85, notes: 'Good performance' };
      const newVal = { score: 92 };
      
      const result = merger.mergeFieldUpdate(current, newVal, 'merge', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual({
        score: 92,
        notes: 'Good performance'
      });
    });

    it('should handle nested object merging', () => {
      const schema: FieldSchema = {
        key: 'student',
        type: 'object',
        children: [
          {
            key: 'info',
            type: 'object',
            children: [
              { key: 'name', type: 'string' },
              { key: 'age', type: 'number' }
            ]
          }
        ]
      };
      
      const current = { info: { name: 'John', age: 10 } };
      const newVal = { info: { age: 11 } };
      
      const result = merger.mergeFieldUpdate(current, newVal, 'merge', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual({
        info: { name: 'John', age: 11 }
      });
    });

    it('should handle null/undefined current values', () => {
      const schema: FieldSchema = {
        key: 'data',
        type: 'object',
        children: [
          { key: 'value', type: 'string' }
        ]
      };
      
      const result = merger.mergeFieldUpdate(null, { value: 'test' }, 'merge', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual({ value: 'test' });
    });

    it('should warn about properties not in schema', () => {
      const schema: FieldSchema = {
        key: 'data',
        type: 'object',
        children: [
          { key: 'knownField', type: 'string' }
        ]
      };
      
      const current = { knownField: 'value' };
      const newVal = { unknownField: 'test' };
      
      const result = merger.mergeFieldUpdate(current, newVal, 'merge', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual({
        knownField: 'value',
        unknownField: 'test'
      });
      expect(result.warnings).toContain(expect.stringContaining('not found in schema'));
    });

    it('should use append logic for arrays in merge mode', () => {
      const schema: FieldSchema = { key: 'items', type: 'array' };
      const current = ['item1'];
      const newVal = ['item2'];
      
      const result = merger.mergeFieldUpdate(current, newVal, 'merge', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual(['item1', 'item2']);
    });

    it('should fall back to replace for primitive types', () => {
      const schema: FieldSchema = { key: 'value', type: 'string' };
      const result = merger.mergeFieldUpdate('old', 'new', 'merge', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toBe('new');
      expect(result.warnings).toContain(expect.stringContaining('Cannot merge string'));
    });
  });

  describe('Type Coercion', () => {
    it('should coerce string to number', () => {
      const schema: FieldSchema = { key: 'score', type: 'number' };
      const result = merger.mergeFieldUpdate(0, '85', 'replace', schema);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain(expect.stringContaining('Coerced string to number'));
    });

    it('should coerce values to string', () => {
      const schema: FieldSchema = { key: 'text', type: 'string' };
      const result = merger.mergeFieldUpdate('', 123, 'replace', schema);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain(expect.stringContaining('Coerced number to string'));
    });

    it('should coerce boolean-like values', () => {
      const schema: FieldSchema = { key: 'flag', type: 'boolean' };
      const result = merger.mergeFieldUpdate(false, 'true', 'replace', schema);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain(expect.stringContaining('Coerced string to boolean'));
    });
  });

  describe('Required Field Validation', () => {
    it('should reject null values for required fields', () => {
      const schema: FieldSchema = { key: 'name', type: 'string', required: true };
      const result = merger.mergeFieldUpdate('existing', null, 'replace', schema);

      expect(result.success).toBe(false);
      expect(result.warnings).toContain(expect.stringContaining('is required'));
    });

    it('should allow null values for optional fields', () => {
      const schema: FieldSchema = { key: 'notes', type: 'string', required: false };
      const result = merger.mergeFieldUpdate('existing', null, 'replace', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toBe(null);
    });
  });

  describe('Batch Operations', () => {
    it('should process multiple updates', () => {
      const updates = [
        {
          currentValue: 'old1',
          newValue: 'new1',
          strategy: 'replace' as MergeStrategy,
          fieldSchema: { key: 'field1', type: 'string' as const }
        },
        {
          currentValue: ['item1'],
          newValue: ['item2'],
          strategy: 'append' as MergeStrategy,
          fieldSchema: { key: 'field2', type: 'array' as const }
        }
      ];

      const results = merger.batchMerge(updates);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].mergedValue).toBe('new1');
      expect(results[1].success).toBe(true);
      expect(results[1].mergedValue).toEqual(['item1', 'item2']);
    });
  });

  describe('Statistics', () => {
    it('should calculate merge statistics', () => {
      const results = [
        {
          success: true,
          mergedValue: 'value1',
          metadata: { originalValue: 'old1', strategy: 'replace' as MergeStrategy, timestamp: '2023-01-01', confidence: 0.9 }
        },
        {
          success: false,
          mergedValue: 'value2',
          warnings: ['error'],
          metadata: { originalValue: 'old2', strategy: 'replace' as MergeStrategy, timestamp: '2023-01-01', confidence: 0.5 }
        },
        {
          success: true,
          mergedValue: 'value3',
          conflicts: [{ field_path: 'test', conflict_type: 'value_conflict' as const, current_value: 'a', new_value: 'b', suggested_resolution: 'b', description: 'test' }],
          metadata: { originalValue: 'old3', strategy: 'merge' as MergeStrategy, timestamp: '2023-01-01', confidence: 0.8 }
        }
      ];

      const stats = merger.getMergeStatistics(results);

      expect(stats.totalUpdates).toBe(3);
      expect(stats.successfulUpdates).toBe(2);
      expect(stats.conflictCount).toBe(1);
      expect(stats.warningCount).toBe(1);
      expect(stats.averageConfidence).toBeCloseTo(0.73, 2);
    });
  });

  describe('Deep Equality', () => {
    it('should detect identical objects', () => {
      const schema: FieldSchema = { key: 'items', type: 'array' };
      const obj1 = { name: 'test', value: 123 };
      const obj2 = { name: 'test', value: 123 };
      const current = [obj1];
      const newVal = [obj2];
      
      const result = merger.mergeFieldUpdate(current, newVal, 'append', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual([obj1]); // Should not duplicate
      expect(result.warnings).toContain(expect.stringContaining('duplicate items'));
    });

    it('should detect different objects', () => {
      const schema: FieldSchema = { key: 'items', type: 'array' };
      const obj1 = { name: 'test1', value: 123 };
      const obj2 = { name: 'test2', value: 123 };
      const current = [obj1];
      const newVal = [obj2];
      
      const result = merger.mergeFieldUpdate(current, newVal, 'append', schema);

      expect(result.success).toBe(true);
      expect(result.mergedValue).toEqual([obj1, obj2]);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid merge strategies gracefully', () => {
      const schema: FieldSchema = { key: 'test', type: 'string' };
      const result = merger.mergeFieldUpdate('old', 'new', 'invalid' as MergeStrategy, schema);

      expect(result.success).toBe(false);
      expect(result.mergedValue).toBe('old');
      expect(result.warnings).toContain(expect.stringContaining('Unknown merge strategy'));
    });

    it('should handle schema validation errors', () => {
      const schema: FieldSchema = { key: 'test', type: 'number' };
      const result = merger.mergeFieldUpdate(123, 'not-a-number', 'replace', schema);

      expect(result.success).toBe(false);
      expect(result.mergedValue).toBe(123);
      expect(result.warnings).toContain(expect.stringContaining('coercion failed'));
    });
  });

  describe('Confidence Threshold', () => {
    it('should use custom confidence threshold', () => {
      const customMerger = new StructuredDataMerger(0.9);
      const schema: FieldSchema = { key: 'name', type: 'string' };
      const result = customMerger.mergeFieldUpdate('existing', 'new', 'replace', schema, 0.8);

      expect(result.success).toBe(true);
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts![0].description).toContain('Low confidence');
    });
  });
});