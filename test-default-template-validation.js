// Simple test to verify default template structure
const { createDefaultTemplate } = require('./src/lib/structured-schemas.ts');

console.log('Testing default template...');

try {
  const template = createDefaultTemplate();
  console.log('✅ Template created successfully');
  console.log('📊 Template structure:');
  
  template.sections.forEach((section, index) => {
    console.log(`${index + 1}. ${section.title} (${section.sectionType}) - Order: ${section.order}`);
    
    // Check for validation issues
    if (section.sectionType === 'header') {
      console.log(`❌ Invalid sectionType: ${section.sectionType} should be 'heading'`);
    }
    if (typeof section.order !== 'number') {
      console.log(`❌ Missing order field: ${typeof section.order}`);
    }
  });
  
} catch (error) {
  console.error('❌ Template creation failed:', error);
}