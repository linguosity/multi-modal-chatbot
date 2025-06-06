/**
 * This file contains utilities for generating LAS Assessment reports from templates
 */
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

/**
 * Generate a docx file from the LAS Assessment Report template 
 * @param reportData - The report data from the application
 * @returns Promise resolving to the generated file as a Blob
 */
export async function generateLASReportDocx(reportData) {
  try {
    // Create a very simple template for now instead of using the complex one
    // This will at least allow testing the functionality
    const simpleTemplate = `
    <html>
      <body>
        <h1>LAS Assessment Report</h1>
        <p>Student: ${reportData.header?.studentInformation?.firstName || ''} ${reportData.header?.studentInformation?.lastName || ''}</p>
        <p>DOB: ${reportData.header?.studentInformation?.DOB || ''}</p>
        <p>Report Date: ${reportData.header?.studentInformation?.reportDate || ''}</p>
        
        <h2>Assessment Results</h2>
        ${Object.entries(reportData.assessmentResults?.domains || {})
          .filter(([_, domain]) => domain.topicSentence || domain.strengths?.length || domain.needs?.length)
          .map(([domain, data]) => `
            <h3>${domain.charAt(0).toUpperCase() + domain.slice(1)} Language</h3>
            <p>${data.topicSentence || ''}</p>
            ${data.strengths?.length ? `
              <h4>Strengths:</h4>
              <ul>
                ${data.strengths.map(item => `<li>${item}</li>`).join('')}
              </ul>
            ` : ''}
            ${data.needs?.length ? `
              <h4>Needs:</h4>
              <ul>
                ${data.needs.map(item => `<li>${item}</li>`).join('')}
              </ul>
            ` : ''}
          `).join('')}
        
        <h2>Conclusion</h2>
        <p>${reportData.conclusion?.conclusion?.summary || ''}</p>
        
        <h2>Recommendations</h2>
        ${reportData.conclusion?.recommendations?.accommodations?.length ? `
          <h3>Accommodations:</h3>
          <ul>
            ${reportData.conclusion.recommendations.accommodations.map(item => `<li>${item}</li>`).join('')}
          </ul>
        ` : ''}
      </body>
    </html>
    `;
    
    // Convert the HTML to a Blob
    const blob = new Blob([simpleTemplate], { type: 'text/html' });
    
    // Generate filename
    const studentName = reportData.header?.studentInformation?.firstName 
      ? `${reportData.header.studentInformation.firstName}_${reportData.header.studentInformation.lastName}`
      : 'student';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${studentName.replace(/\s+/g, '_')}_LAS_report_${timestamp}.html`;
    
    // Save as HTML for now (as a workaround)
    if (typeof window !== 'undefined') {
      const saveAs = (await import('file-saver')).saveAs;
      saveAs(blob, filename);
    }
    
    // Return the blob
    return blob;
  } catch (error) {
    console.error('Error generating LAS report:', error);
    throw error;
  }
}

/**
 * Helper function to format dates nicely (not currently used but kept for future reference)
 * @param dateStr String date to format
 * @returns Formatted date string
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Helper function to export the LAS report with a button click
 * @param reportData - The report data to export
 */
export function exportLASReport(reportData) {
  if (!reportData) {
    console.error('No report data provided for export');
    return;
  }
  
  console.log('Generating simple HTML report as a temporary solution...');
  return generateLASReportDocx(reportData);
}