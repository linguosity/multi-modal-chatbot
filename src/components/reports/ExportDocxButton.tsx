import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateReportDocx } from '@/lib/docx-generator';
import { Download } from 'lucide-react';

interface ExportDocxButtonProps {
  reportData: Record<string, any>;
  templateUrl?: string;
  className?: string;
}

export const ExportDocxButton: React.FC<ExportDocxButtonProps> = ({
  reportData,
  templateUrl = '/templates/las-assessment-report-template.docx', // Changed from report-template.docx which is not a valid DOCX file
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      
      console.log(`Fetching template from: ${templateUrl}`);
      
      // Fetch the template file with explicit arraybuffer response type
      // This ensures proper binary file handling
      const response = await fetch(templateUrl, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
      }
      
      // Log content type to debug
      const contentType = response.headers.get('Content-Type');
      console.log(`Template Content-Type: ${contentType}`);
      
      // Convert to ArrayBuffer and check size
      const templateBuffer = await response.arrayBuffer();
      console.log(`Template buffer size: ${templateBuffer.byteLength} bytes`);
      
      if (templateBuffer.byteLength === 0) {
        throw new Error('Template file is empty');
      }
      
      // Verify DOCX file signature (first bytes of a proper DOCX file)
      // DOCX files start with "PK" header (bytes: [0x50, 0x4B, 0x03, 0x04])
      const firstBytes = new Uint8Array(templateBuffer.slice(0, 4));
      console.log('First bytes of template:', Array.from(firstBytes).map(b => b.toString(16)));
      
      // Check if the file has the proper DOCX/ZIP signature
      if (!(firstBytes[0] === 0x50 && firstBytes[1] === 0x4B)) {
        console.error('Invalid DOCX file signature. First bytes:', Array.from(firstBytes));
        throw new Error('The file does not appear to be a valid DOCX file (missing PK signature)');
      }
      
      // Generate the DOCX file
      await generateReportDocx(reportData, templateBuffer);
      console.log('Document generated successfully');
      
    } catch (error: any) {
      console.error('Error exporting to DOCX:', error);
      
      // More descriptive error message
      let errorMessage = 'Failed to export report to DOCX. ';
      
      if (error instanceof Error) {
        // Extract more detailed error information if available
        let detailedError = error.message;
        
        // Special handling for Docxtemplater's Multi error
        if (error.message.includes("Multi error") && error.properties && error.properties.errors) {
          const firstError = error.properties.errors[0];
          if (firstError && firstError.properties && firstError.properties.explanation) {
            detailedError = `Template error: ${firstError.properties.explanation}`;
            
            // Add tag info if available
            if (firstError.properties.xtag) {
              detailedError += ` (in tag: ${firstError.properties.xtag})`;
            }
          }
        }
        
        setErrorMsg(detailedError);
        
        if (error.message.includes("zip file") || error.message.includes("DOCX file")) {
          errorMessage += "The template file could not be read as a valid DOCX file. ";
          
          // Try alternative template as fallback
          try {
            console.log('Attempting to use fallback template: las-assessment-report-template-fixed.docx');
            const altResponse = await fetch('/templates/las-assessment-report-template-fixed.docx', {
              cache: 'no-cache',
              headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              }
            });
            
            if (altResponse.ok) {
              const altBuffer = await altResponse.arrayBuffer();
              console.log(`Alternative template buffer size: ${altBuffer.byteLength} bytes`);
              
              if (altBuffer.byteLength > 0) {
                // Try to generate with the alternative template
                await generateReportDocx(reportData, altBuffer);
                console.log('Document generated successfully with alternative template');
                return;
              }
            }
          } catch (fallbackError) {
            console.error('Fallback template also failed:', fallbackError);
            errorMessage += "Alternative template also failed.";
          }
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleExport}
        disabled={isLoading}
        className={className}
        variant="outline"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Exporting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export DOCX
          </span>
        )}
      </Button>
      
      {errorMsg && (
        <div className="text-red-500 text-xs mt-1">
          Error: {errorMsg}
        </div>
      )}
    </div>
  );
};

export default ExportDocxButton;