// Simple test script for field path resolver
const { StructuredFieldPathResolver, FieldPathUtils } = require('./src/lib/field-path-resolver.ts');

// Test data
const testData = {
  simple_string: 'Hello World',
  simple_number: 42,
  nested_object: {
    child_string: 'Nested Value',
    child_number: 100,
    deep_nested: {
      deep_value: 'Very Deep'
    }
  },
  simple_array: ['item1', 'item2', 'item3'],
  array_of_objects: [
    { name: 'Object 1', value: 10 },
    { name: 'Object 2', value: 20 }
  ]
};

// Test schema
const testSchema = {
  key: 'test_section',
  title: 'Test Section',
  fields: [
    { key: 'simple_string', label: 'Simple String', type: 'string' },
    { key: 'simple_number', label: 'Simple Number', type: 'number' },
    { key: 'simple_array', label: 'Simple Array', type: 'array' },
    {
      key: 'nested_object',
      label: 'Nested Object',
      type: 'object',
      children: [
        { key: 'child_string', label: 'Child String', type: 'string' },
        { key: 'child_number', label: 'Child Number', type: 'number' },
        {
          key: 'deep_nested',
          label: 'Deep Nested',
          type: 'object',
          children: [
            { key: 'deep_value', label: 'Deep Value', type: 'string' }
          ]
        }
      ]
    },
    { key: 'array_of_objects', label: 'Array of Objects', type: 'array' }
  ]
};

console.log('Testing Field Path Resolver...\n');

const resolver = new StructuredFieldPathResolver();

// Test 1: Get simple values
console.log('Test 1: Get simple values');
console.log('simple_string:', resolver.getFieldValue(testData, 'simple_string'));
console.log('simple_number:', resolver.getFieldValue(testData, 'simple_number'));

// Test 2: Get nested values
console.log('\nTest 2: Get nested values');
console.log('nested_object.child_string:', resolver.getFieldValue(testData, 'nested_object.child_string'));
console.log('nested_object.deep_nested.deep_value:', resolver.getFieldValue(testData, 'nested_object.deep_nested.deep_value'));

// Test 3: Get array values
console.log('\nTest 3: Get array values');
console.log('simple_array.0:', resolver.getFieldValue(testData, 'simple_array.0'));
console.log('simple_array.1:', resolver.getFieldValue(testData, 'simple_array.1'));
console.log('array_of_objects.0.name:', resolver.getFieldValue(testData, 'array_of_objects.0.name'));
console.log('array_of_objects.1.value:', resolver.getFieldValue(testData, 'array_of_objects.1.value'));

// Test 4: Set values
console.log('\nTest 4: Set values');
const updated = resolver.setFieldValue(testData, 'simple_string', 'Updated Value');
console.log('Updated simple_string:', updated.simple_string);
console.log('Original unchanged:', testData.simple_string);

// Test 5: Validate paths
console.log('\nTest 5: Validate paths');
console.log('simple_string valid:', resolver.validateFieldPath('simple_string', testSchema));
console.log('nested_object.child_string valid:', resolver.validateFieldPath('nested_object.child_string', testSchema));
console.log('non_existent valid:', resolver.validateFieldPath('non_existent', testSchema));

// Test 6: Utility functions
console.log('\nTest 6: Utility functions');
console.log('All field paths:', FieldPathUtils.getAllFieldPaths(testSchema));

console.log('\nAll tests completed successfully! ✅');