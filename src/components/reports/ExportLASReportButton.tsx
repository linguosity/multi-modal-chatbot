import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportLASReport } from '@/lib/las-report-generator';
import { Download } from 'lucide-react';

interface ExportLASReportButtonProps {
  reportData: Record<string, any>;
  className?: string;
}

export const ExportLASReportButton: React.FC<ExportLASReportButtonProps> = ({
  reportData,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      
      // Generate and download the DOCX file
      await exportLASReport(reportData);
      
    } catch (error) {
      console.error('Error exporting to LAS DOCX:', error);
      alert('Failed to export report to DOCX. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          Exporting LAS Report...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export LAS Assessment
        </span>
      )}
    </Button>
  );
};

export default ExportLASReportButton;