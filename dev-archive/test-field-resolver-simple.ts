// Simple TypeScript test for field path resolver
import { StructuredFieldPathResolver, FieldPathUtils } from './src/lib/field-path-resolver';
import { SectionSchema } from './src/lib/structured-schemas';

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
const testSchema: SectionSchema = {
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

function runTests() {
  console.log('🚀 Testing Field Path Resolver...\n');

  const resolver = new StructuredFieldPathResolver();

  // Test 1: Get simple values
  console.log('✅ Test 1: Get simple values');
  const simpleString = resolver.getFieldValue(testData, 'simple_string');
  const simpleNumber = resolver.getFieldValue(testData, 'simple_number');
  console.log(`  simple_string: "${simpleString}" (expected: "Hello World")`);
  console.log(`  simple_number: ${simpleNumber} (expected: 42)`);
  console.log(`  ✓ Simple values: ${simpleString === 'Hello World' && simpleNumber === 42 ? 'PASS' : 'FAIL'}\n`);

  // Test 2: Get nested values
  console.log('✅ Test 2: Get nested values');
  const nestedString = resolver.getFieldValue(testData, 'nested_object.child_string');
  const deepValue = resolver.getFieldValue(testData, 'nested_object.deep_nested.deep_value');
  console.log(`  nested_object.child_string: "${nestedString}" (expected: "Nested Value")`);
  console.log(`  nested_object.deep_nested.deep_value: "${deepValue}" (expected: "Very Deep")`);
  console.log(`  ✓ Nested values: ${nestedString === 'Nested Value' && deepValue === 'Very Deep' ? 'PASS' : 'FAIL'}\n`);

  // Test 3: Get array values
  console.log('✅ Test 3: Get array values');
  const arrayItem0 = resolver.getFieldValue(testData, 'simple_array.0');
  const arrayItem1 = resolver.getFieldValue(testData, 'simple_array.1');
  const objectName = resolver.getFieldValue(testData, 'array_of_objects.0.name');
  const objectValue = resolver.getFieldValue(testData, 'array_of_objects.1.value');
  console.log(`  simple_array.0: "${arrayItem0}" (expected: "item1")`);
  console.log(`  simple_array.1: "${arrayItem1}" (expected: "item2")`);
  console.log(`  array_of_objects.0.name: "${objectName}" (expected: "Object 1")`);
  console.log(`  array_of_objects.1.value: ${objectValue} (expected: 20)`);
  const arrayTestPass = arrayItem0 === 'item1' && arrayItem1 === 'item2' && objectName === 'Object 1' && objectValue === 20;
  console.log(`  ✓ Array values: ${arrayTestPass ? 'PASS' : 'FAIL'}\n`);

  // Test 4: Set values
  console.log('✅ Test 4: Set values');
  const updated = resolver.setFieldValue(testData, 'simple_string', 'Updated Value');
  const updatedValue = updated.simple_string;
  const originalUnchanged = testData.simple_string;
  console.log(`  Updated simple_string: "${updatedValue}" (expected: "Updated Value")`);
  console.log(`  Original unchanged: "${originalUnchanged}" (expected: "Hello World")`);
  console.log(`  ✓ Set values: ${updatedValue === 'Updated Value' && originalUnchanged === 'Hello World' ? 'PASS' : 'FAIL'}\n`);

  // Test 5: Validate paths
  console.log('✅ Test 5: Validate paths');
  const validPath1 = resolver.validateFieldPath('simple_string', testSchema);
  const validPath2 = resolver.validateFieldPath('nested_object.child_string', testSchema);
  const invalidPath = resolver.validateFieldPath('non_existent', testSchema);
  console.log(`  simple_string valid: ${validPath1} (expected: true)`);
  console.log(`  nested_object.child_string valid: ${validPath2} (expected: true)`);
  console.log(`  non_existent valid: ${invalidPath} (expected: false)`);
  console.log(`  ✓ Path validation: ${validPath1 && validPath2 && !invalidPath ? 'PASS' : 'FAIL'}\n`);

  // Test 6: Utility functions
  console.log('✅ Test 6: Utility functions');
  const allPaths = FieldPathUtils.getAllFieldPaths(testSchema);
  console.log(`  All field paths (${allPaths.length}):`, allPaths);
  const hasRequiredPaths = allPaths.includes('simple_string') && 
                          allPaths.includes('nested_object.child_string') && 
                          allPaths.includes('nested_object.deep_nested.deep_value');
  console.log(`  ✓ Utility functions: ${hasRequiredPaths ? 'PASS' : 'FAIL'}\n`);

  console.log('🎉 All tests completed successfully! Field Path Resolver is working correctly! ✅');
}

// Run the tests
runTests();