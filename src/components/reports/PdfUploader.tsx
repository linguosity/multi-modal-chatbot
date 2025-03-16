import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface PdfUploaderProps {
  onUpload: (pdfData: string) => Promise<void>;
  disabled?: boolean;
}

/**
 * Component to handle PDF uploads and convert to base64 for Claude processing
 */
export function PdfUploader({ onUpload, disabled = false }: PdfUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLButtonElement>(null);

  /**
   * Process the uploaded file
   */
  const processFile = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setFileName(file.name);
    setIsUploading(true);

    try {
      // Convert the file to a base64 string
      const base64Data = await fileToBase64(file);
      
      // Call the parent component's upload handler
      await onUpload(base64Data);
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Error processing the PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  /**
   * Handles the file input change event
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };
  
  /**
   * Drag event handlers
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled || isUploading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  }, [disabled, isUploading, processFile]);

  /**
   * Converts a file object to a base64 string
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Extract the base64 part from the data URL
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  /**
   * Triggers the file input click
   */
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <Button
        ref={dropzoneRef}
        onClick={triggerFileInput}
        disabled={disabled || isUploading}
        className={`flex items-center gap-2 w-full h-36 justify-center bg-white hover:bg-gray-50 border-2 border-dashed 
          ${isDragging 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-purple-200 hover:border-purple-400'
          } 
          text-purple-700 transition-all duration-200`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Spinner className="h-8 w-8 text-purple-600 mb-3" />
            <span className="font-medium">Processing PDF...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="mb-3 text-purple-500"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="M12 18v-6"/>
              <path d="m9 15 3 3 3-3"/>
            </svg>
            <span className="font-medium text-base">{fileName ? 'Change PDF' : 'Upload PDF'}</span>
            <span className="text-xs text-purple-500 mt-1">
              {isDragging ? 'Drop PDF here' : 'Click or drag file to upload'}
            </span>
          </div>
        )}
      </Button>
      
      {fileName && !isUploading && (
        <div className="flex items-center mt-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-green-500 mr-2"
          >
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          <p className="text-sm font-medium text-gray-700">{fileName}</p>
        </div>
      )}
    </div>
  );
}