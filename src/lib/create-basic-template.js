/**
 * This script creates a basic report template DOCX file using docxtemplater
 */
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Create a very simple DOCX content
const content = `
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Speech-Language Assessment Report</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Student: {header.studentInformation.firstName} {header.studentInformation.lastName}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>DOB: {header.studentInformation.DOB}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Reason for Referral: {header.reasonForReferral}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Background: {background.studentDemographicsAndBackground.educationalHistory}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Domain - Expressive: {assessmentResults.domains.expressive.topicSentence}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Conclusion: {conclusion.conclusion.summary}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>
`;

// Generate an empty DOCX file with the content
const OUTPUT_PATH = path.resolve(__dirname, '../../public/templates/report-template.docx');

// Create the document
// This is a simplified approach - normally you'd start with a real DOCX file
try {
  fs.writeFileSync(OUTPUT_PATH, content);
  console.log(`Created basic template at ${OUTPUT_PATH}`);
} catch (error) {
  console.error('Error creating basic template:', error);
}