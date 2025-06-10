/**
 * Creates a proper DOCX file with template tags
 * Run this with Node.js: node src/lib/create-docx-template.js
 */
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// We need an existing DOCX file to start with
// This can be ANY valid DOCX file - we'll replace its content
const SAMPLE_DOCX_PATH = path.resolve(__dirname, '../../node_modules/docxtemplater/examples/tag-example.docx');
const OUTPUT_PATH = path.resolve(__dirname, '../../public/templates/report-template.docx');

// Check if the sample exists (it should come with docxtemplater)
if (!fs.existsSync(SAMPLE_DOCX_PATH)) {
  console.error('Sample DOCX not found. Creating a new one from scratch is complex...');
  process.exit(1);
}

try {
  // Read the sample DOCX file
  const content = fs.readFileSync(SAMPLE_DOCX_PATH, 'binary');
  const zip = new PizZip(content);
  
  // Create a new template by replacing the document.xml content
  // This simplifies the process by keeping the DOCX file structure intact
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" 
           xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
           xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
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
        <w:t>Date of Report: {header.studentInformation.reportDate}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>REASON FOR REFERRAL</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>{header.reasonForReferral}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>BACKGROUND INFORMATION</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>Educational History: {background.studentDemographicsAndBackground.educationalHistory}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>ASSESSMENT RESULTS</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading3"/>
      </w:pPr>
      <w:r>
        <w:t>Expressive Language</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>{assessmentResults.domains.expressive.topicSentence}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>Strengths:</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>{#assessmentResults.domains.expressive.strengthsList}• {text}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>{/assessmentResults.domains.expressive.strengthsList}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>CONCLUSION</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>{conclusion.conclusion.summary}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>RECOMMENDATIONS</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>Accommodations:</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>{#conclusion.recommendations.accommodationsList}• {text}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>{/conclusion.recommendations.accommodationsList}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`);

  // Generate the output document
  const buf = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  // Write the document to the file
  fs.writeFileSync(OUTPUT_PATH, buf);
  console.log(`Template created at: ${OUTPUT_PATH}`);

  console.log(`
SUCCESS: Created a valid DOCX template file with tags.

The template includes:
- Header section with student information
- Reason for referral section
- Background information section 
- Assessment results with expressive language domain
- Conclusion section
- Recommendations section with accommodations list

You can now use the ExportDocxButton component to export reports!
  `);

  // Also create a fixed LAS template with custom delimiters
  console.log("Creating fixed LAS template with custom delimiters...");
  
  const LAS_TEMPLATE_PATH = path.resolve(__dirname, '../../public/templates/las-assessment-report-template.docx');
  const LAS_FIXED_PATH = path.resolve(__dirname, '../../public/templates/las-assessment-report-template-fixed.docx');
  
  if (fs.existsSync(LAS_TEMPLATE_PATH)) {
    // Read the LAS template
    const lasContent = fs.readFileSync(LAS_TEMPLATE_PATH, 'binary');
    let lasZip;
    
    try {
      lasZip = new PizZip(lasContent);
      
      // Get the document content
      const documentXml = lasZip.files['word/document.xml'].asText();
      
      // Add custom delimiter at the beginning
      const modifiedXml = documentXml.replace(
        /(<w:body>)/,
        '$1<w:p><w:r><w:t>{=&lt;% %&gt;=}</w:t></w:r></w:p>'
      );
      
      // Replace all regular template tags with the new syntax
      const fixedXml = modifiedXml
        .replace(/\{header\.studentInformation\.firstName\}/g, '<%header.studentInformation.firstName%>')
        .replace(/\{header\.studentInformation\.lastName\}/g, '<%header.studentInformation.lastName%>')
        .replace(/\{studentFullName\}/g, '<%studentFullName%>')
        .replace(/\{studentDOB\}/g, '<%studentDOB%>')
        .replace(/\{evaluationDate\}/g, '<%evaluationDate%>')
        .replace(/\{reportDate\}/g, '<%reportDate%>')
        .replace(/\{header\.reasonForReferral\}/g, '<%header.reasonForReferral%>')
        .replace(/\{header\.confidentialityStatement\}/g, '<%header.confidentialityStatement%>')
        .replace(/\{#assessmentToolsList\}/g, '<%#assessmentToolsList%>')
        .replace(/\{\/assessmentToolsList\}/g, '<%/assessmentToolsList%>')
        .replace(/\{text\}/g, '<%text%>');
      
      // Add delimiter reset at the end
      const finalXml = fixedXml.replace(
        /(<\/w:body>)/,
        '<w:p><w:r><w:t>&lt;%={ }=%&gt;</w:t></w:r></w:p>$1'
      );
      
      // Update the document
      lasZip.file('word/document.xml', finalXml);
      
      // Generate the output
      const lasBuf = lasZip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });
      
      // Write the fixed LAS template
      fs.writeFileSync(LAS_FIXED_PATH, lasBuf);
      console.log(`Fixed LAS template created at: ${LAS_FIXED_PATH}`);
      
      console.log(`
SUCCESS: Created fixed LAS template with custom delimiters.

This template uses <%tag%> syntax instead of {tag} to avoid conflicts
with section headings like {II. BACKGROUND INFORMATION}.

You can now use the LAS export button with this template!
      `);
    } catch (error) {
      console.error('Error processing LAS template:', error);
      console.log('Creating a simple fixed LAS template instead...');
      
      // Create a simple LAS template with custom delimiters
      const sampleDoc = new Docxtemplater(new PizZip(content));
      
      sampleDoc.setData({
        simpleText: "This is a simple LAS template with custom delimiters: {=<% %>=}"
      });
      
      sampleDoc.render();
      
      const simpleBuf = sampleDoc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });
      
      fs.writeFileSync(LAS_FIXED_PATH, simpleBuf);
      console.log(`Simple LAS template created at: ${LAS_FIXED_PATH}`);
    }
  } else {
    console.log('LAS template not found. Skipping LAS template fix.');
  }
} catch (error) {
  console.error('Error creating DOCX template:', error);
}