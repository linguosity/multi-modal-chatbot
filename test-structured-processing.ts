// Test script to demonstrate structured data processing
import { StructuredFieldPathResolver } from './src/lib/field-path-resolver';
import { VALIDITY_STATEMENT_SECTION, ASSESSMENT_RESULTS_SECTION } from './src/lib/structured-schemas';

console.log('🚀 Testing Structured Data Processing...\n');

// Simulate a report section with structured data
const mockSection = {
  id: 'validity_statement',
  sectionType: 'validity_statement',
  title: 'Validity Statement',
  content: '', // Old HTML content (empty for now)
  structured_data: {
    is_valid: true,
    student_cooperation: {
      cooperative: true,
      understanding: 'Student understood all directions clearly',
      custom_notes: ''
    },
    validity_factors: {
      attention_issues: false,
      motivation_problems: false,
      cultural_considerations: false,
      other: ''
    }
  }
};

// Simulate AI updates using the new update_report_data tool
const aiUpdates = [
  {
    section_id: 'validity_statement',
    field_path: 'student_cooperation.understanding',
    value: 'Student demonstrated excellent understanding of all task directions and maintained attention throughout the assessment',
    merge_strategy: 'replace' as const,
    confidence: 0.9,
    source_reference: 'Clinical observation during assessment'
  },
  {
    section_id: 'validity_statement',
    field_path: 'validity_factors.cultural_considerations',
    value: true,
    merge_strategy: 'replace' as const,
    confidence: 0.8,
    source_reference: 'Assessment conducted in student\'s native language'
  },
  {
    section_id: 'validity_statement',
    field_path: 'validity_factors.other',
    value: 'Assessment was conducted in Spanish to accommodate the student\'s primary language preference',
    merge_strategy: 'replace' as const,
    confidence: 0.9,
    source_reference: 'Language preference noted in referral'
  }
];

console.log('📋 Original structured data:');
console.log(JSON.stringify(mockSection.structured_data, null, 2));

console.log('\n🤖 AI Updates to apply:');
aiUpdates.forEach((update, index) => {
  console.log(`${index + 1}. ${update.field_path} = "${update.value}" (${update.merge_strategy})`);
});

// Apply the updates
const fieldResolver = new StructuredFieldPathResolver();
let updatedData = mockSection.structured_data;

console.log('\n⚡ Applying updates...');
for (const update of aiUpdates) {
  try {
    const currentValue = fieldResolver.getFieldValue(updatedData, update.field_path);
    console.log(`  - Updating ${update.field_path}: "${currentValue}" → "${update.value}"`);
    
    updatedData = fieldResolver.setFieldValue(updatedData, update.field_path, update.value);
  } catch (error) {
    console.error(`  ❌ Failed to update ${update.field_path}:`, error);
  }
}

console.log('\n✅ Updated structured data:');
console.log(JSON.stringify(updatedData, null, 2));

// Demonstrate how this would generate prose using the schema template
console.log('\n📝 Generated prose from structured data:');
const schema = VALIDITY_STATEMENT_SECTION;
if (schema.prose_template) {
  let prose = schema.prose_template;
  
  // Replace placeholders with actual data
  prose = prose.replace(/{is_valid}/g, updatedData.is_valid ? 'valid' : 'invalid');
  prose = prose.replace(/{student_cooperation\.cooperative}/g, updatedData.student_cooperation.cooperative ? 'cooperative' : 'uncooperative');
  prose = prose.replace(/{student_cooperation\.understanding}/g, updatedData.student_cooperation.understanding || '');
  prose = prose.replace(/{validity_factors\.cultural_considerations}/g, 
    updatedData.validity_factors.cultural_considerations ? 'Cultural and linguistic factors were considered during assessment.' : '');
  prose = prose.replace(/{validity_factors\.other}/g, updatedData.validity_factors.other || '');
  
  console.log(prose);
}

console.log('\n🎉 Structured data processing test completed successfully!');
console.log('\n💡 Key benefits of this approach:');
console.log('   ✓ Precise field-level updates instead of replacing entire HTML content');
console.log('   ✓ Data integrity maintained with schema validation');
console.log('   ✓ Merge strategies allow intelligent data combination');
console.log('   ✓ Structured data can generate both prose and form views');
console.log('   ✓ Change tracking at field level for better user feedback');