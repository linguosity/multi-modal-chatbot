import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PdfUploader } from "@/components/reports/PdfUploader";
import { ExportDocxButton } from "@/components/reports/ExportDocxButton";
import { Pencil, Zap } from "lucide-react";
import { SpeechLanguageReport } from '@/types/reportTypes';
import BatchRequestStatus from './BatchRequestStatus';

interface EditorPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  isUpdating: boolean;
  error: string | null;
  success: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  onExportHtml: () => void;
  onClearReport: () => void;
  onViewJson: () => void;
  report: SpeechLanguageReport;
  onPdfUpload: (pdfData: string) => Promise<void>;
  onBatchComplete: (updatedReport: SpeechLanguageReport, commands: any[], affectedDomains: string[]) => void;
  onBatchError: (error: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  inputText, 
  setInputText, 
  selectedSection, 
  setSelectedSection, 
  isUpdating, 
  error, 
  success, 
  handleSubmit,
  onExportHtml,
  onClearReport,
  onViewJson,
  report,
  onPdfUpload,
  onBatchComplete,
  onBatchError
}) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'pdf'>('text');
  const [processingMode, setProcessingMode] = useState<'standard' | 'batch'>('standard');
  const [batchStatus, setBatchStatus] = useState<{
    active: boolean;
    batchId: string;
    sections: string[];
  }>({
    active: false,
    batchId: '',
    sections: []
  });

  // Handle batch submit
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isUpdating) return;
    
    try {
      // Prepare the same payload used in standard mode
      const payload = {
        input: inputText,
        report: report,
        updateSection: selectedSection === 'auto-detect' ? undefined : selectedSection
      };
      
      // Call the batch API endpoint
      const response = await fetch('/api/text-editor-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start batch processing');
      }
      
      const data = await response.json();
      
      // If we have a batch ID, start the polling component
      if (data.batch && data.batch.id) {
        // Validate the batch ID format - for debugging
        if (!data.batch.id.startsWith('msgbatch_') && !data.batch.id.startsWith('simulated_')) {
          console.warn(`⚠️ Unexpected batch ID format from API: ${data.batch.id}`);
          console.warn(`⚠️ Expected formats are msgbatch_* for Anthropic or simulated_* for simulation`);
          // Continue anyway as the status endpoint can handle invalid formats
        }
        
        setBatchStatus({
          active: true,
          batchId: data.batch.id,
          sections: data.batch.sections || []
        });
        
        // Clear input text and hide editor
        setInputText('');
        setEditorOpen(false);
      } else {
        throw new Error('No batch ID received from API');
      }
    } catch (err) {
      onBatchError(err instanceof Error ? err.message : 'Failed to start batch processing');
    }
  };

  return (
    <div className="sticky top-4 left-4 z-50 ml-4 mr-4">
      {/* Pencil icon - always rendered but visibility toggled with CSS */}
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full bg-white border border-gray-200 shadow p-2 hover:bg-gray-100 ${
          editorOpen || batchStatus.active ? "invisible pointer-events-none" : ""
        }`}
        aria-label="Claude JSON Report Editor"
        onClick={() => {
          console.log("[Pencil Button] clicked!");
          setEditorOpen(true);
        }}
      >
        <Pencil className="h-4 w-4 text-gray-500" />
      </Button>
      
      {/* Batch status component */}
      {batchStatus.active && (
        <div className="mb-4">
          <BatchRequestStatus
            batchId={batchStatus.batchId}
            originalReport={report}
            sections={batchStatus.sections}
            onComplete={(updatedReport, commands, affectedDomains) => {
              setBatchStatus({ active: false, batchId: '', sections: [] });
              onBatchComplete(updatedReport, commands, affectedDomains);
            }}
            onError={(error) => {
              setBatchStatus({ active: false, batchId: '', sections: [] });
              onBatchError(error);
            }}
          />
        </div>
      )}
      
      {/* Editor panel - always rendered but visibility toggled with CSS */}
      <div className={`bg-white border shadow-lg rounded-md p-4 w-full absolute 
          top-0 
          left-0 
          right-0 
          p-4 
          bg-white 
          shadow 
          z-[9999] ${
            editorOpen ? "" : "invisible pointer-events-none"
          }`}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant={processingMode === 'standard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProcessingMode('standard')}
                className="text-xs h-7"
              >
                Standard
              </Button>
              <Button
                variant={processingMode === 'batch' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProcessingMode('batch')}
                className="text-xs h-7"
              >
                <Zap className="h-3 w-3 mr-1" />
                Batch Mode
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                console.log("[Editor panel] Close button clicked");
                setEditorOpen(false);
              }}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
          
          {/* Processing mode explainer */}
          {processingMode === 'batch' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-700">
              <strong>Batch Mode:</strong> Processes multiple sections in parallel for faster results. 
              The editor will close and show a progress tracker while your report is being updated.
            </div>
          )}
          
          {/* Input form */}
          <div className="mb-6">
            <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'text' | 'pdf')} className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="text" className="flex-1">Text Input</TabsTrigger>
                <TabsTrigger value="pdf" className="flex-1">PDF Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <form onSubmit={processingMode === 'standard' ? handleSubmit : handleBatchSubmit} className="w-full">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
                    <div>
                      <Input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter observation or assessment data..."
                        className="w-full mb-2"
                        disabled={isUpdating}
                      />

                      {/* Section selector */}
                      <div className="relative w-full">
                        <select
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          disabled={isUpdating}
                          className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="auto-detect">Auto-detect section</option>
                          <optgroup label="Header">
                            <option value="header.reasonForReferral">Reason For Referral</option>
                            <option value="header.confidentialityStatement">Confidentiality Statement</option>
                          </optgroup>
                          <optgroup label="Background">
                            <option value="background.studentDemographicsAndBackground.educationalHistory">Educational History</option>
                            <option value="background.healthReport.medicalHistory">Medical History</option>
                            <option value="background.parentGuardianConcerns">Parent/Guardian Concerns</option>
                          </optgroup>
                          <optgroup label="Assessment Results">
                            <option value="assessmentResults.domains.receptive">Receptive Language</option>
                            <option value="assessmentResults.domains.expressive">Expressive Language</option>
                            <option value="assessmentResults.domains.pragmatic">Pragmatic Language</option>
                            <option value="assessmentResults.domains.articulation">Articulation</option>
                            <option value="assessmentResults.domains.voice">Voice</option>
                            <option value="assessmentResults.domains.fluency">Fluency</option>
                            <option value="assessmentResults.observations.classroomObservations">Classroom Observations</option>
                            <option value="assessmentResults.observations.playBasedInformalObservations">Play-Based Observations</option>
                          </optgroup>
                          <optgroup label="Conclusion">
                            <option value="conclusion.conclusion.summary">Conclusion Summary</option>
                            <option value="conclusion.recommendations.services">Service Recommendations</option>
                            <option value="conclusion.eligibility.californiaEdCode">Eligibility Determination</option>
                          </optgroup>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
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
                            className="opacity-50"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isUpdating || !inputText.trim()}
                      className={`${processingMode === 'standard' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-blue-600 hover:bg-blue-700'} text-white h-10`}
                    >
                      {isUpdating ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {processingMode === 'batch' && <Zap className="h-4 w-4 mr-1" />}
                          {processingMode === 'standard' ? 'Update Report' : 'Process in Batch'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="pdf">
                <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
                  <div>
                    <PdfUploader 
                      onUpload={onPdfUpload}
                      disabled={isUpdating}
                    />

                    {/* Section selector */}
                    <div className="relative w-full mt-3">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Target Section (Optional)
                      </label>
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        disabled={isUpdating}
                        className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="auto-detect">Auto-detect section</option>
                        <optgroup label="Assessment Results">
                          <option value="assessmentResults.domains.receptive">Receptive Language</option>
                          <option value="assessmentResults.domains.expressive">Expressive Language</option>
                          <option value="assessmentResults.domains.pragmatic">Pragmatic Language</option>
                          <option value="assessmentResults.domains.articulation">Articulation</option>
                          <option value="assessmentResults.domains.voice">Voice</option>
                          <option value="assessmentResults.domains.fluency">Fluency</option>
                        </optgroup>
                      </select>
                      <div className="absolute right-3 top-[calc(50%+0.5rem)] -translate-y-1/2 pointer-events-none">
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
                          className="opacity-50"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="mt-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md text-sm">
                {success}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <ExportDocxButton 
              reportData={report} 
              className="text-xs h-8"
            />
            <Button
              variant="outline"
              className="text-xs h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              onClick={onExportHtml}
            >
              Export as HTML
            </Button>
            <Button
              variant="outline"
              className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={onClearReport}
            >
              Clear Report
            </Button>
            <Button
              variant="outline"
              className="text-xs h-8"
              onClick={onViewJson}
            >
              View JSON
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;