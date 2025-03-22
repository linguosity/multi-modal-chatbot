import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

/**
 * Generate a docx file from a template and data
 * @param templateBuffer - The binary template file as an ArrayBuffer
 * @param data - The data to inject into the template
 * @param outputFilename - The name of the file to save
 * @param debugMode - Whether to enable extra debugging information
 * @returns Promise resolving to the generated file as a Blob
 */
export async function generateDocxFromTemplate(
  templateBuffer: ArrayBuffer,
  data: Record<string, any>,
  outputFilename: string = 'report.docx',
  debugMode: boolean = true // Enable debug mode by default to help diagnose template issues
): Promise<Blob> {
  try {
    console.log(`Attempting to create PizZip instance with buffer size: ${templateBuffer.byteLength} bytes`);
    
    // Output debug information if debug mode is enabled
    if (debugMode) {
      console.log('Data being passed to template:', JSON.stringify(data, null, 2));
      console.log('Template buffer size:', templateBuffer.byteLength);
      // Log the first 20 bytes of the template to verify it's a proper DOCX file
      const firstBytes = new Uint8Array(templateBuffer.slice(0, 20));
      console.log('First 20 bytes of template (hex):', Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
    }
    
    // Validate that we have a proper buffer
    if (!templateBuffer || templateBuffer.byteLength === 0) {
      throw new Error('Invalid template buffer: Empty or undefined');
    }
    
    // Verify the buffer has a ZIP signature (first bytes of a proper DOCX/ZIP file)
    const firstBytes = new Uint8Array(templateBuffer.slice(0, 4));
    if (!(firstBytes[0] === 0x50 && firstBytes[1] === 0x4B)) {
      console.error('Invalid ZIP file signature in template. First bytes:', Array.from(firstBytes));
      throw new Error('The template does not appear to be a valid ZIP/DOCX file (missing PK signature)');
    }
    
    // Create a new PizZip instance with the template content
    // Use a try-catch specifically for the PizZip instantiation
    let zip;
    try {
      // Convert ArrayBuffer to Uint8Array to ensure proper binary handling
      const arrayBuffer = new Uint8Array(templateBuffer);
      zip = new PizZip(arrayBuffer);
      
      // If in debug mode, examine the structure of the document
      if (debugMode) {
        console.log('PizZip opened successfully, inspecting contents:');
        
        // List all files in the DOCX (which is a ZIP)
        const files = Object.keys(zip.files);
        console.log(`DOCX contains ${files.length} files:`);
        
        // Log the document structure (first 10 files)
        files.slice(0, 10).forEach(file => {
          const fileEntry = zip.files[file];
          console.log(` - ${file} (${fileEntry.name}, size: ${fileEntry._data ? fileEntry._data.length : 'unknown'} bytes)`);
        });
        
        // Specifically check for document.xml (main content file)
        if (zip.files['word/document.xml']) {
          try {
            const documentContent = zip.files['word/document.xml'].asText();
            
            // Log a snippet of the document.xml for template debugging
            const snippet = documentContent.substring(0, 500) + '... [truncated]';
            console.log('Document content preview:', snippet);
            
            // Look for template tag patterns
            const tagMatches = documentContent.match(/\{[^{}]+\}/g);
            if (tagMatches && tagMatches.length > 0) {
              console.log(`Found ${tagMatches.length} template tags:`, tagMatches.slice(0, 20));
            } else {
              console.warn('No template tags found in document.xml - template may not be properly set up!');
            }
          } catch (documentError) {
            console.error('Error examining document.xml:', documentError);
          }
        } else {
          console.warn('No word/document.xml found in the template - invalid DOCX structure!');
        }
      }
    } catch (zipError) {
      console.error('Error creating PizZip instance:', zipError);
      throw new Error(`Failed to create ZIP from template: ${zipError instanceof Error ? zipError.message : 'Unknown error'}`);
    }
    
    console.log('PizZip instance created successfully');
    
    // Create a new Docxtemplater instance with improved error handling
    let doc;
    try {
      // Add modules and options for better error handling and debugging
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        errorLogging: true,
        // Better handling of missing/null values
        nullGetter: function(part: any) {
          if (debugMode) {
            console.log('Null value encountered for tag:', part);
          }
          if (!part.module) {
            return "";
          }
          if (part.module === "rawxml") {
            return "";
          }
          return "";
        },
        // Delimiter options - support both underscore and dot notation
        delimiters: {
          start: '{',  // Default opening delimiter
          end: '}'     // Default closing delimiter
        }
      });
      
      // Log the template tags found in the document for debugging
      if (debugMode) {
        try {
          const docXml = zip.files['word/document.xml'];
          if (docXml) {
            const content = docXml.asText();
            const tagPattern = /\{([^{}]+)\}/g;
            const tags = [];
            let match;
            
            while ((match = tagPattern.exec(content)) !== null) {
              tags.push(match[1]);
            }
            
            if (tags.length > 0) {
              console.log(`Found ${tags.length} tags in template:`, tags.slice(0, 10), tags.length > 10 ? '... and more' : '');
              
              // Check if tags use underscore notation
              const underscorePattern = /_/;
              const hasUnderscoreTags = tags.some(tag => underscorePattern.test(tag));
              
              console.log(`Template uses ${hasUnderscoreTags ? 'underscore' : 'dot'} notation.`);
            } else {
              console.warn('No tags found in template document.xml');
            }
          }
        } catch (e) {
          console.error('Error analyzing template tags:', e);
        }
      }
      console.log('Docxtemplater instance created successfully');
    } catch (docxError: any) {
      console.error('Error creating Docxtemplater instance:', docxError);
      
      // Special handling for Multi error (which contains multiple errors)
      if (docxError && docxError.properties && docxError.properties.errors) {
        console.log('Docxtemplater reported multiple errors:');
        
        // Log each individual error for debugging
        docxError.properties.errors.forEach((error: any, index: number) => {
          console.log(`Error ${index + 1}:`, error);
          
          // Log detailed information if available
          if (error.properties) {
            if (error.properties.explanation) {
              console.log(`Explanation: ${error.properties.explanation}`);
            }
            if (error.properties.id) {
              console.log(`Error ID: ${error.properties.id}`);
            }
            if (error.properties.xtag) {
              console.log(`Tag with error: ${error.properties.xtag}`);
            }
            if (error.properties.postparsed) {
              console.log('Template structure around error:');
              console.log(error.properties.postparsed.slice(Math.max(0, error.properties.offset - 5), error.properties.offset + 5));
            }
          }
        });
        
        // Throw a more detailed error
        const firstError = docxError.properties.errors[0] || {};
        const explanation = firstError.properties?.explanation || 'Unknown template issues';
        throw new Error(`Template errors detected: ${explanation} (See console for full details)`);
      }
      
      throw new Error(`Failed to create Docxtemplater: ${docxError instanceof Error ? docxError.message : 'Unknown error'}`);
    }
    
    try {
      // Render the document with the provided data
      doc.render(data);
      console.log('Template rendered with data');
    } catch (renderError: any) {
      console.error('Error rendering template:', renderError);
      
      // Special handling for Multi error (which contains multiple errors)
      if (renderError && renderError.properties && renderError.properties.errors) {
        console.log('Docxtemplater reported multiple render errors:');
        
        // Log each individual error for debugging
        renderError.properties.errors.forEach((error: any, index: number) => {
          console.log(`Render Error ${index + 1}:`, error);
          
          // Log detailed information if available
          if (error.properties) {
            if (error.properties.explanation) {
              console.log(`Explanation: ${error.properties.explanation}`);
            }
            if (error.properties.id) {
              console.log(`Error ID: ${error.properties.id}`);
            }
            if (error.properties.xtag) {
              console.log(`Tag with error: ${error.properties.xtag}`);
            }
            // Log the data path that caused the issue if known
            if (error.properties.tag) {
              console.log(`Template tag: ${error.properties.tag}`);
              console.log(`Raw tag: ${error.properties.raw}`);
            }
          }
        });
        
        // Throw a more detailed error
        const firstError = renderError.properties.errors[0] || {};
        const explanation = firstError.properties?.explanation || 'Unknown template rendering issues';
        throw new Error(`Template rendering errors: ${explanation} (See console for full details)`);
      }
      
      // Special handling for individual Docxtemplater errors with properties
      if (renderError instanceof Error && 'properties' in renderError) {
        const props = renderError.properties || {};
        console.log('Detailed render error properties:', props);
        throw new Error(`Template render error: ${props.explanation || renderError.message}`);
      }
      
      throw new Error(`Failed to render template: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`);
    }
    
    // Generate the output document
    let output;
    try {
      output = doc.getZip().generate({
        type: 'blob',
        compression: 'DEFLATE',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      console.log(`Output document generated successfully (${output.size} bytes)`);
    } catch (genError) {
      console.error('Error generating output document:', genError);
      throw new Error(`Failed to generate output: ${genError instanceof Error ? genError.message : 'Unknown error'}`);
    }
    
    // If running in browser, save the file
    if (typeof window !== 'undefined') {
      try {
        saveAs(output, outputFilename);
        console.log(`File saved as ${outputFilename}`);
      } catch (saveError) {
        console.error('Error saving file:', saveError);
        throw new Error(`Failed to save file: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
      }
    }
    
    return output;
  } catch (error) {
    console.error('Error in generateDocxFromTemplate:', error);
    
    // If it's a PizZip error (likely invalid template)
    if (error instanceof Error && error.message.includes('zip')) {
      console.error('PizZip error - invalid template file structure');
      throw new Error(`Template file is not a valid DOCX/ZIP file: ${error.message}`);
    }
    
    // Rethrow the error
    throw error;
  }
}

/**
 * Generate a fallback HTML report when DOCX template fails
 * @param reportData - The report data to export
 * @returns A blob with HTML content
 */
function generateFallbackHtmlReport(reportData: Record<string, any>): Blob {
  const studentName = reportData.header?.studentInformation?.firstName 
    ? `${reportData.header.studentInformation.firstName} ${reportData.header.studentInformation.lastName}`
    : 'Student';
  
  // Create a simple HTML representation of the report
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Report for ${studentName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1, h2, h3 { color: #444; }
        .section { margin-bottom: 30px; }
        .domain { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; }
        .domain-header { display: flex; justify-content: space-between; align-items: center; }
        .concern { color: #f59e0b; font-size: 14px; }
        .no-concern { color: #10b981; font-size: 14px; }
        ul { margin-top: 5px; }
        @media print {
          body { margin: 0.5in; }
          .domain { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>Report for ${studentName}</h1>
      <div class="section">
        <h2>Student Information</h2>
        <p><strong>DOB:</strong> ${reportData.header?.studentInformation?.DOB || 'N/A'}</p>
        <p><strong>Report Date:</strong> ${reportData.header?.studentInformation?.reportDate || 'N/A'}</p>
        <p><strong>Reason for Referral:</strong> ${reportData.header?.reasonForReferral || 'N/A'}</p>
      </div>
  `;
  
  // Add domains section
  if (reportData.assessmentResults?.domains) {
    html += `<div class="section"><h2>Assessment Results</h2>`;
    
    Object.entries(reportData.assessmentResults.domains).forEach(([domainName, domain]: [string, any]) => {
      if (domain.topicSentence || domain.strengths?.length || domain.needs?.length) {
        html += `
          <div class="domain">
            <div class="domain-header">
              <h3>${domainName.charAt(0).toUpperCase() + domainName.slice(1)} Language</h3>
              ${domain.isConcern !== undefined ? 
                `<span class="${domain.isConcern ? 'concern' : 'no-concern'}">${domain.isConcern ? 'Area of Concern' : 'No Concern'}</span>` : 
                ''}
            </div>
            ${domain.topicSentence ? `<p>${domain.topicSentence}</p>` : ''}
            
            ${domain.strengths?.length ? `
              <h4>Strengths:</h4>
              <ul>
                ${domain.strengths.map((item: string) => `<li>${item}</li>`).join('')}
              </ul>
            ` : ''}
            
            ${domain.needs?.length ? `
              <h4>Needs:</h4>
              <ul>
                ${domain.needs.map((item: string) => `<li>${item}</li>`).join('')}
              </ul>
            ` : ''}
            
            ${domain.impactStatement ? `
              <h4>Educational Impact:</h4>
              <p>${domain.impactStatement}</p>
            ` : ''}
          </div>
        `;
      }
    });
    
    html += `</div>`;
  }
  
  // Add recommendations
  if (reportData.conclusion?.recommendations) {
    html += `
      <div class="section">
        <h2>Recommendations</h2>
        ${reportData.conclusion.recommendations.accommodations?.length ? `
          <h3>Accommodations:</h3>
          <ul>
            ${reportData.conclusion.recommendations.accommodations.map((item: string) => `<li>${item}</li>`).join('')}
          </ul>
        ` : ''}
        
        ${reportData.conclusion.recommendations.facilitationStrategies?.length ? `
          <h3>Facilitation Strategies:</h3>
          <ul>
            ${reportData.conclusion.recommendations.facilitationStrategies.map((item: string) => `<li>${item}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `;
  }
  
  html += `
      <footer>
        <p><em>This is a fallback HTML report generated because the DOCX template could not be processed. 
        You can print this HTML file to create a PDF.</em></p>
      </footer>
    </body>
    </html>
  `;
  
  return new Blob([html], { type: 'text/html' });
}

/**
 * Create a simple empty DOCX template programmatically
 * This is a last-resort fallback when all template files fail to load
 */
function createEmptyTemplate(): ArrayBuffer {
  // Define a minimal valid DOCX file structure as a base64 string
  // This is a simplified empty DOCX file with minimal content
  const minimalDocxBase64 = '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';
  
  // Convert base64 to ArrayBuffer
  const binaryString = window.atob(minimalDocxBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Generate a report docx from the report data
 * @param reportData - The report data from the application
 * @param templateBuffer - The binary template file as an ArrayBuffer (optional)
 * @returns Promise resolving to the generated file as a Blob
 */
export async function generateReportDocx(
  reportData: Record<string, any>,
  templateBuffer?: ArrayBuffer
): Promise<Blob> {
  // Generate the filename based on report data
  const studentName = reportData.header?.studentInformation?.firstName 
    ? `${reportData.header.studentInformation.firstName}_${reportData.header.studentInformation.lastName}`
    : 'student';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${studentName.replace(/\s+/g, '_')}_report_${timestamp}.docx`;
  
  try {
    // If no template buffer is provided, use a default template
    if (!templateBuffer) {
      // Use fetch to get the template if we're in the browser
      if (typeof window !== 'undefined') {
        try {
          console.log('No template buffer provided, fetching default template');
          
          // Try to use response.arrayBuffer() which ensures binary data handling
          // Use las-assessment-report-template.docx instead of report-template.docx (which is a text file, not a DOCX)
          const response = await fetch('/templates/las-assessment-report-template.docx', {
            method: 'GET',
            cache: 'no-cache',
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch default template: ${response.status}`);
          }
          
          console.log('Default template fetched successfully');
          templateBuffer = await response.arrayBuffer();
          
          console.log(`Default template buffer size: ${templateBuffer.byteLength} bytes`);
          if (templateBuffer.byteLength === 0) {
            throw new Error('Default template file is empty');
          }
          
          // Verify the template has a proper DOCX signature
          const firstBytes = new Uint8Array(templateBuffer.slice(0, 4));
          if (!(firstBytes[0] === 0x50 && firstBytes[1] === 0x4B)) {
            console.error('Invalid DOCX file signature in default template. First bytes:', Array.from(firstBytes));
            throw new Error('Default template is not a valid DOCX file');
          }
          
        } catch (error) {
          console.error('Error loading default template:', error);
          
          // Try alternative template as a last resort
          try {
            console.log('Attempting to load alternative template: las-assessment-report-template-fixed.docx');
            const altResponse = await fetch('/templates/las-assessment-report-template-fixed.docx', {
              cache: 'no-cache',
              headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Cache-Control': 'no-cache'
              }
            });
            
            if (!altResponse.ok) {
              throw new Error(`Failed to fetch alternative template: ${altResponse.status}`);
            }
            
            templateBuffer = await altResponse.arrayBuffer();
            console.log(`Alternative template buffer size: ${templateBuffer.byteLength} bytes`);
            
            // Verify the alternative template
            const altFirstBytes = new Uint8Array(templateBuffer.slice(0, 4));
            if (!(altFirstBytes[0] === 0x50 && altFirstBytes[1] === 0x4B)) {
              console.error('Invalid DOCX file signature in alternative template');
              throw new Error('Alternative template is not a valid DOCX file');
            }
            
          } catch (altError) {
            console.error('Error loading alternative template:', altError);
            
            // As a last resort, create a minimal valid DOCX template
            console.log('Creating minimal empty DOCX template');
            templateBuffer = createEmptyTemplate();
            console.log(`Created minimal template with size: ${templateBuffer.byteLength} bytes`);
            
            if (!templateBuffer || templateBuffer.byteLength === 0) {
              // All template attempts failed, fall back to HTML
              throw new Error('All template attempts failed');
            }
          }
        }
      } else {
        // Server-side handling would be different
        throw new Error('Template buffer is required when running on server');
      }
    }

    // Format and prepare data for the template
    const formattedData = formatReportDataForDocx(reportData);
    console.log('Data formatted for DOCX template');

    // First try with the provided template
    try {
      // Try with the provided/fetched template
      console.log('Attempting to generate DOCX with primary template');
      return await generateDocxFromTemplate(templateBuffer, formattedData, filename);
    } catch (templateError) {
      console.error('Error using the provided template:', templateError);
      
      // For any error when processing the template, try with a minimal template
      // that doesn't rely on complex formatting or tags
      if (templateError instanceof Error) {
        // Log the full error to help diagnose template issues
        console.warn('Template error details:');
        console.log('Error message:', templateError.message);
        
        // Log detailed error properties if available
        if ('properties' in templateError) {
          const errorProps = (templateError as any).properties;
          if (errorProps && errorProps.errors) {
            console.log('Template contains multiple errors:');
            errorProps.errors.forEach((err: any, i: number) => {
              console.log(`Error ${i+1}:`, err);
              if (err.properties) {
                console.log('Properties:', err.properties);
              }
            });
          }
        }
        
        console.warn('Attempting to use minimal template without complex formatting...');
        
        // Use the createEmptyTemplate function to generate a minimal template
        try {
          console.log('Creating minimal empty DOCX template');
          const minimalTemplateBuffer = createEmptyTemplate();
          console.log(`Minimal template created (${minimalTemplateBuffer.byteLength} bytes)`);
          
          // Try again with the minimal template
          return await generateDocxFromTemplate(minimalTemplateBuffer, formattedData, filename);
        } catch (minimalError) {
          console.error('Error with minimal template:', minimalError);
          // Let the outer catch handle the fallback to HTML
          throw minimalError;
        }
      } else {
        // Rethrow to let the outer catch handle it
        throw templateError;
      }
    }
  } catch (error) {
    console.error('Error in generateReportDocx:', error);
    
    // If all DOCX generation attempts failed, fall back to HTML
    console.warn('All DOCX generation attempts failed, falling back to HTML export');
    const htmlBlob = generateFallbackHtmlReport(reportData);
    const htmlFilename = `${studentName.replace(/\s+/g, '_')}_report_${timestamp}.html`;
    
    if (typeof window !== 'undefined') {
      saveAs(htmlBlob, htmlFilename);
    }
    
    return htmlBlob;
  }
}

/**
 * Flattens a nested object structure, converting nested properties to underscore notation
 * This ensures compatibility with docxtemplater templates that use underscore notation
 * 
 * @param obj - The object to flatten
 * @param prefix - Optional prefix for the current level of nesting (used in recursion)
 * @param result - Accumulator for the flattened object (used in recursion)
 * @returns A flattened object with underscore notation keys
 */
function flattenObject(obj: Record<string, any>, prefix = '', result: Record<string, any> = {}): Record<string, any> {
  // Skip null or undefined objects
  if (obj == null) return result;
  
  // Process each key in the object
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      // Recursively flatten nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey, result);
      } else {
        // For arrays, keep them as is (docxtemplater can handle arrays)
        result[newKey] = value;
        
        // If this is an array, add a _list version for template loop compatibility
        if (Array.isArray(value) && key.toLowerCase().endsWith('s') && !key.endsWith('List') && !key.endsWith('list')) {
          // Create a list version with objects containing a text property
          const singularKey = key.slice(0, -1); // Remove trailing 's'
          const listKey = `${newKey}List`;
          
          result[listKey] = value.map((item: any) => {
            // If the item is already an object, use it; otherwise wrap it
            if (typeof item === 'object' && item !== null) {
              return item;
            }
            return { text: item };
          });
        }
      }
    }
  }
  
  return result;
}

/**
 * Format the report data for docx template rendering
 * @param reportData - The raw report data from the application
 * @returns Formatted data ready for docx template
 */
function formatReportDataForDocx(reportData: Record<string, any>): Record<string, any> {
  // Create a deep copy of the report data
  const formattedData = JSON.parse(JSON.stringify(reportData));

  // Format arrays to be more docx-template friendly
  // Arrays in docxtemplater are typically handled with loops, so we'll format them
  // to be ready for the template syntax

  // Process strength and needs lists for each domain
  Object.keys(formattedData.assessmentResults?.domains || {}).forEach(domain => {
    const domainData = formattedData.assessmentResults.domains[domain];
    
    // Format strengths as bullet points for DOCX
    if (Array.isArray(domainData.strengths) && domainData.strengths.length > 0) {
      domainData.strengthsList = domainData.strengths.map((item: string) => ({ text: item }));
    } else {
      // Ensure empty array has right format for templates that expect it
      domainData.strengthsList = [];
    }

    // Format needs as bullet points for DOCX
    if (Array.isArray(domainData.needs) && domainData.needs.length > 0) {
      domainData.needsList = domainData.needs.map((item: string) => ({ text: item }));
    } else {
      // Ensure empty array has right format for templates that expect it
      domainData.needsList = [];
    }
  });

  // Format accommodation and facilitation strategies
  if (Array.isArray(formattedData.conclusion?.recommendations?.accommodations)) {
    formattedData.conclusion.recommendations.accommodationsList = 
      formattedData.conclusion.recommendations.accommodations.map((item: string) => ({ text: item }));
  } else if (formattedData.conclusion?.recommendations) {
    formattedData.conclusion.recommendations.accommodationsList = [];
  }

  if (Array.isArray(formattedData.conclusion?.recommendations?.facilitationStrategies)) {
    formattedData.conclusion.recommendations.facilitationStrategiesList = 
      formattedData.conclusion.recommendations.facilitationStrategies.map((item: string) => ({ text: item }));
  } else if (formattedData.conclusion?.recommendations) {
    formattedData.conclusion.recommendations.facilitationStrategiesList = [];
  }

  // Convert parents array to string if needed
  if (Array.isArray(formattedData.header?.studentInformation?.parents)) {
    formattedData.header.studentInformation.parentsString = 
      formattedData.header.studentInformation.parents.join(', ');
  } else if (formattedData.header?.studentInformation) {
    formattedData.header.studentInformation.parentsString = '';
  }

  // Add full student name for convenience
  if (formattedData.header?.studentInformation?.firstName) {
    formattedData.header.studentInformation.fullName = 
      `${formattedData.header.studentInformation.firstName} ${formattedData.header.studentInformation.lastName || ''}`;
  } else if (formattedData.header?.studentInformation) {
    formattedData.header.studentInformation.fullName = 'Student';
  }

  // Create both flattened and nested versions of the data to support different template styles
  // Flattened data for templates with underscore notation: {header_studentInformation_firstName}
  const flattenedData = flattenObject(formattedData);
  
  // Log the flattened data structure for debugging
  console.log('Flattened data ready for template:');
  console.log('Keys:', Object.keys(flattenedData).slice(0, 10), '... and more');
  
  // Combine both formats into a single object to support both notations
  // This allows the template to use either {header.studentInformation.firstName} 
  // or {header_studentInformation_firstName} notation
  const combinedData = {
    ...formattedData,  // Original nested structure for dot notation
    ...flattenedData   // Flattened structure for underscore notation
  };
  
  return combinedData;
}