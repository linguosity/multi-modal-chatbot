/**
 * Unit tests for Field Path Resolution Utilities
 */

import { StructuredFieldPathResolver, FieldPathUtils } from '../field-path-resolver';
import { SectionSchema, FieldSchema } from '../structured-schemas';

describe('StructuredFieldPathResolver', () => {
  let resolver: StructuredFieldPathResolver;
  let testSchema: SectionSchema;
  let testData: any;

  beforeEach(() => {
    resolver = new StructuredFieldPathResolver();
    
    // Create a comprehensive test schema
    testSchema = {
      key: 'test_section',
      title: 'Test Section',
      fields: [
        {
          key: 'simple_string',
          label: 'Simple String',
          type: 'string'
        },
        {
          key: 'simple_number',
          label: 'Simple Number',
          type: 'number'
        },
        {
          key: 'simple_boolean',
          label: 'Simple Boolean',
          type: 'boolean'
        },
        {
          key: 'simple_array',
          label: 'Simple Array',
          type: 'array'
        },
        {
          key: 'nested_object',
          label: 'Nested Object',
          type: 'object',
          children: [
            {
              key: 'child_string',
              label: 'Child String',
              type: 'string'
            },
            {
              key: 'child_number',
              label: 'Child Number',
              type: 'number'
            },
            {
              key: 'deep_nested',
              label: 'Deep Nested',
              type: 'object',
              children: [
                {
                  key: 'deep_value',
                  label: 'Deep Value',
                  type: 'string'
                }
              ]
            }
          ]
        },
        {
          key: 'array_of_objects',
          label: 'Array of Objects',
          type: 'array'
        }
      ]
    };

    // Create corresponding test data
    testData = {
      simple_string: 'Hello World',
      simple_number: 42,
      simple_boolean: true,
      simple_array: ['item1', 'item2', 'item3'],
      nested_object: {
        child_string: 'Nested Value',
        child_number: 100,
        deep_nested: {
          deep_value: 'Very Deep'
        }
      },
      array_of_objects: [
        { name: 'Object 1', value: 10 },
        { name: 'Object 2', value: 20 },
        { name: 'Object 3', value: 30 }
      ]
    };
  });

  describe('getFieldValue', () => {
    it('should get simple field values', () => {
      expect(resolver.getFieldValue(testData, 'simple_string')).toBe('Hello World');
      expect(resolver.getFieldValue(testData, 'simple_number')).toBe(42);
      expect(resolver.getFieldValue(testData, 'simple_boolean')).toBe(true);
    });

    it('should get nested object values', () => {
      expect(resolver.getFieldValue(testData, 'nested_object.child_string')).toBe('Nested Value');
      expect(resolver.getFieldValue(testData, 'nested_object.child_number')).toBe(100);
      expect(resolver.getFieldValue(testData, 'nested_object.deep_nested.deep_value')).toBe('Very Deep');
    });

    it('should get array values by index', () => {
      expect(resolver.getFieldValue(testData, 'simple_array.0')).toBe('item1');
      expect(resolver.getFieldValue(testData, 'simple_array.1')).toBe('item2');
      expect(resolver.getFieldValue(testData, 'simple_array.2')).toBe('item3');
    });

    it('should get values from array of objects', () => {
      expect(resolver.getFieldValue(testData, 'array_of_objects.0.name')).toBe('Object 1');
      expect(resolver.getFieldValue(testData, 'array_of_objects.1.value')).toBe(20);
      expect(resolver.getFieldValue(testData, 'array_of_objects.2.name')).toBe('Object 3');
    });

    it('should return undefined for non-existent paths', () => {
      expect(resolver.getFieldValue(testData, 'non_existent')).toBeUndefined();
      expect(resolver.getFieldValue(testData, 'nested_object.non_existent')).toBeUndefined();
      expect(resolver.getFieldValue(testData, 'simple_array.10')).toBeUndefined();
    });

    it('should handle null/undefined data gracefully', () => {
      expect(resolver.getFieldValue(null, 'any_path')).toBeUndefined();
      expect(resolver.getFieldValue(undefined, 'any_path')).toBeUndefined();
      expect(resolver.getFieldValue({}, 'non_existent')).toBeUndefined();
    });

    it('should handle empty paths', () => {
      expect(resolver.getFieldValue(testData, '')).toBeUndefined();
    });
  });

  describe('setFieldValue', () => {
    it('should set simple field values', () => {
      const result = resolver.setFieldValue(testData, 'simple_string', 'New Value');
      expect(result.simple_string).toBe('New Value');
      expect(result.simple_number).toBe(42); // Other values unchanged
    });

    it('should set nested object values', () => {
      const result = resolver.setFieldValue(testData, 'nested_object.child_string', 'Updated Nested');
      expect(result.nested_object.child_string).toBe('Updated Nested');
      expect(result.nested_object.child_number).toBe(100); // Other values unchanged
    });

    it('should set deep nested values', () => {
      const result = resolver.setFieldValue(testData, 'nested_object.deep_nested.deep_value', 'New Deep Value');
      expect(result.nested_object.deep_nested.deep_value).toBe('New Deep Value');
    });

    it('should set array values by index', () => {
      const result = resolver.setFieldValue(testData, 'simple_array.1', 'updated_item');
      expect(result.simple_array[1]).toBe('updated_item');
      expect(result.simple_array[0]).toBe('item1'); // Other items unchanged
    });

    it('should extend arrays when setting beyond current length', () => {
      const result = resolver.setFieldValue(testData, 'simple_array.5', 'new_item');
      expect(result.simple_array[5]).toBe('new_item');
      expect(result.simple_array.length).toBe(6);
      expect(result.simple_array[3]).toBeNull(); // Filled with null
      expect(result.simple_array[4]).toBeNull();
    });

    it('should create intermediate objects when needed', () => {
      const result = resolver.setFieldValue({}, 'new_object.new_field', 'value');
      expect(result.new_object.new_field).toBe('value');
    });

    it('should create intermediate arrays when needed', () => {
      const result = resolver.setFieldValue({}, 'new_array.0', 'first_item');
      expect(result.new_array[0]).toBe('first_item');
      expect(Array.isArray(result.new_array)).toBe(true);
    });

    it('should not mutate original data', () => {
      const original = { value: 'original' };
      const result = resolver.setFieldValue(original, 'value', 'modified');
      expect(original.value).toBe('original');
      expect(result.value).toBe('modified');
    });

    it('should throw error for empty path', () => {
      expect(() => resolver.setFieldValue(testData, '', 'value')).toThrow('Field path cannot be empty');
    });

    it('should throw error when trying to index non-array', () => {
      expect(() => resolver.setFieldValue(testData, 'simple_string.0', 'value')).toThrow('Expected array');
    });
  });

  describe('validateFieldPath', () => {
    it('should validate simple field paths', () => {
      expect(resolver.validateFieldPath('simple_string', testSchema)).toBe(true);
      expect(resolver.validateFieldPath('simple_number', testSchema)).toBe(true);
      expect(resolver.validateFieldPath('simple_boolean', testSchema)).toBe(true);
    });

    it('should validate nested field paths', () => {
      expect(resolver.validateFieldPath('nested_object.child_string', testSchema)).toBe(true);
      expect(resolver.validateFieldPath('nested_object.child_number', testSchema)).toBe(true);
      expect(resolver.validateFieldPath('nested_object.deep_nested.deep_value', testSchema)).toBe(true);
    });

    it('should validate array field paths', () => {
      expect(resolver.validateFieldPath('simple_array', testSchema)).toBe(true);
      expect(resolver.validateFieldPath('array_of_objects', testSchema)).toBe(true);
    });

    it('should reject invalid field paths', () => {
      expect(resolver.validateFieldPath('non_existent', testSchema)).toBe(false);
      expect(resolver.validateFieldPath('nested_object.non_existent', testSchema)).toBe(false);
      expect(resolver.validateFieldPath('simple_string.invalid_nested', testSchema)).toBe(false);
    });

    it('should handle empty paths and invalid schemas', () => {
      expect(resolver.validateFieldPath('', testSchema)).toBe(false);
      expect(resolver.validateFieldPath('valid_field', {} as SectionSchema)).toBe(false);
    });
  });

  describe('getFieldSchema', () => {
    it('should return correct schema for simple fields', () => {
      const schema = resolver.getFieldSchema('simple_string', testSchema);
      expect(schema?.key).toBe('simple_string');
      expect(schema?.type).toBe('string');
    });

    it('should return correct schema for nested fields', () => {
      const schema = resolver.getFieldSchema('nested_object.child_string', testSchema);
      expect(schema?.key).toBe('child_string');
      expect(schema?.type).toBe('string');
    });

    it('should return correct schema for deep nested fields', () => {
      const schema = resolver.getFieldSchema('nested_object.deep_nested.deep_value', testSchema);
      expect(schema?.key).toBe('deep_value');
      expect(schema?.type).toBe('string');
    });

    it('should return null for invalid paths', () => {
      expect(resolver.getFieldSchema('non_existent', testSchema)).toBeNull();
      expect(resolver.getFieldSchema('nested_object.non_existent', testSchema)).toBeNull();
    });
  });

  describe('hasFieldPath', () => {
    it('should correctly identify existing paths', () => {
      expect(resolver.hasFieldPath(testData, 'simple_string')).toBe(true);
      expect(resolver.hasFieldPath(testData, 'nested_object.child_string')).toBe(true);
      expect(resolver.hasFieldPath(testData, 'simple_array.0')).toBe(true);
    });

    it('should correctly identify non-existing paths', () => {
      expect(resolver.hasFieldPath(testData, 'non_existent')).toBe(false);
      expect(resolver.hasFieldPath(testData, 'nested_object.non_existent')).toBe(false);
      expect(resolver.hasFieldPath(testData, 'simple_array.10')).toBe(false);
    });
  });

  describe('deleteFieldPath', () => {
    it('should delete simple fields', () => {
      const result = resolver.deleteFieldPath(testData, 'simple_string');
      expect(result.simple_string).toBeUndefined();
      expect(result.simple_number).toBe(42); // Other fields unchanged
    });

    it('should delete nested fields', () => {
      const result = resolver.deleteFieldPath(testData, 'nested_object.child_string');
      expect(result.nested_object.child_string).toBeUndefined();
      expect(result.nested_object.child_number).toBe(100); // Other fields unchanged
    });

    it('should delete array elements', () => {
      const result = resolver.deleteFieldPath(testData, 'simple_array.1');
      expect(result.simple_array).toEqual(['item1', 'item3']); // item2 removed
      expect(result.simple_array.length).toBe(2);
    });

    it('should handle non-existent paths gracefully', () => {
      const result = resolver.deleteFieldPath(testData, 'non_existent');
      expect(result).toEqual(testData); // No changes
    });

    it('should not mutate original data', () => {
      const original = { ...testData };
      resolver.deleteFieldPath(testData, 'simple_string');
      expect(testData).toEqual(original);
    });
  });
});

describe('FieldPathUtils', () => {
  let testData: any;
  let testSchema: SectionSchema;

  beforeEach(() => {
    testData = {
      field1: 'value1',
      field2: 'value2',
      nested: {
        child: 'nested_value'
      }
    };

    testSchema = {
      key: 'test',
      title: 'Test',
      fields: [
        { key: 'field1', label: 'Field 1', type: 'string' },
        { key: 'field2', label: 'Field 2', type: 'string' },
        {
          key: 'nested',
          label: 'Nested',
          type: 'object',
          children: [
            { key: 'child', label: 'Child', type: 'string' }
          ]
        }
      ]
    };
  });

  describe('utility methods', () => {
    it('should provide quick access to getValue', () => {
      expect(FieldPathUtils.getValue(testData, 'field1')).toBe('value1');
      expect(FieldPathUtils.getValue(testData, 'nested.child')).toBe('nested_value');
    });

    it('should provide quick access to setValue', () => {
      const result = FieldPathUtils.setValue(testData, 'field1', 'new_value');
      expect(result.field1).toBe('new_value');
    });

    it('should provide quick access to hasPath', () => {
      expect(FieldPathUtils.hasPath(testData, 'field1')).toBe(true);
      expect(FieldPathUtils.hasPath(testData, 'non_existent')).toBe(false);
    });

    it('should provide quick access to isValidPath', () => {
      expect(FieldPathUtils.isValidPath('field1', testSchema)).toBe(true);
      expect(FieldPathUtils.isValidPath('non_existent', testSchema)).toBe(false);
    });
  });

  describe('getAllFieldPaths', () => {
    it('should return all possible field paths from schema', () => {
      const paths = FieldPathUtils.getAllFieldPaths(testSchema);
      expect(paths).toContain('field1');
      expect(paths).toContain('field2');
      expect(paths).toContain('nested');
      expect(paths).toContain('nested.child');
    });

    it('should handle array fields', () => {
      const schemaWithArray: SectionSchema = {
        key: 'test',
        title: 'Test',
        fields: [
          { key: 'items', label: 'Items', type: 'array' }
        ]
      };
      
      const paths = FieldPathUtils.getAllFieldPaths(schemaWithArray);
      expect(paths).toContain('items');
      expect(paths).toContain('items.0');
    });
  });

  describe('getChangedPaths', () => {
    it('should identify changed field paths', () => {
      const oldData = { field1: 'old_value', field2: 'same_value' };
      const newData = { field1: 'new_value', field2: 'same_value' };
      
      const changedPaths = FieldPathUtils.getChangedPaths(oldData, newData, testSchema);
      expect(changedPaths).toContain('field1');
      expect(changedPaths).not.toContain('field2');
    });

    it('should handle nested changes', () => {
      const oldData = { nested: { child: 'old_value' } };
      const newData = { nested: { child: 'new_value' } };
      
      const changedPaths = FieldPathUtils.getChangedPaths(oldData, newData, testSchema);
      expect(changedPaths).toContain('nested.child');
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  let resolver: StructuredFieldPathResolver;

  beforeEach(() => {
    resolver = new StructuredFieldPathResolver();
  });

  it('should handle circular references gracefully', () => {
    const circularData: any = { name: 'test' };
    circularData.self = circularData;
    
    // Should not throw or cause infinite loops
    expect(() => resolver.getFieldValue(circularData, 'name')).not.toThrow();
    expect(resolver.getFieldValue(circularData, 'name')).toBe('test');
  });

  it('should handle very deep nesting', () => {
    let deepData: any = {};
    let current = deepData;
    
    // Create 100 levels of nesting
    for (let i = 0; i < 100; i++) {
      current.next = { level: i };
      current = current.next;
    }
    
    const deepPath = Array(100).fill('next').join('.') + '.level';
    expect(resolver.getFieldValue(deepData, deepPath)).toBe(99);
  });

  it('should handle special characters in field names', () => {
    const data = {
      'field-with-dashes': 'value1',
      'field_with_underscores': 'value2',
      'field with spaces': 'value3' // This might not work with dot notation
    };
    
    expect(resolver.getFieldValue(data, 'field-with-dashes')).toBe('value1');
    expect(resolver.getFieldValue(data, 'field_with_underscores')).toBe('value2');
  });

  it('should handle numeric field names', () => {
    const data = {
      '123': 'numeric_field',
      '0': 'zero_field'
    };
    
    expect(resolver.getFieldValue(data, '123')).toBe('numeric_field');
    expect(resolver.getFieldValue(data, '0')).toBe('zero_field');
  });
});