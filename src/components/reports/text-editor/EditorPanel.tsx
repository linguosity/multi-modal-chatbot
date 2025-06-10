// FILE: src/components/reports/text-editor/EditorPanel.tsx
// (Corrected Dropdown Options)

'use client';

import React, { useState, useEffect /* Added useEffect if needed later */ } from 'react';
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button"; // Import buttonVariants
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PdfUploader } from "@/components/reports/PdfUploader";
import { ExportDocxButton } from "@/components/reports/ExportDocxButton";
import { Edit3, Zap, ChevronDown, X, Check, FileText, Target, PenLine, Wand2 } from "lucide-react";
// Use types derived from your Zod schema file
import { SpeechLanguageReport } from '@/types/reportSchemas'; // Adjust path if needed
import BatchRequestStatus from './BatchRequestStatus';
import SummarizePanel from './SummarizePanel';
import { cn } from "@/lib/utils";

/**
 * Status alert component for showing success or error messages
 */
const StatusAlert = ({ type, message }: { type: 'success' | 'error' | null; message: string | null; }) => {
   if (!message) return null;
    return (
      <div className={cn( "mt-6 p-4 rounded-lg flex items-start gap-3 text-sm animate-fadeIn", type === 'success' ? "bg-[#EDF2EF] text-[#3C6E58] border border-[#C8DFD4]" : type === 'error' ? "bg-[#F9EFED] text-[#9C4226] border border-[#EBCCC4]" : "" )}>
        {type === 'success' ? <Check className="h-4 w-4 mt-0.5 stroke-[#3C6E58]" /> : <X className="h-4 w-4 mt-0.5 stroke-[#9C4226]" />}
        <span className="leading-relaxed">{message}</span>
      </div>
    );
};

interface EditorPanelProps {
  report: SpeechLanguageReport;
  onReportUpdate: (report: SpeechLanguageReport) => void;
  batchStatus: any;
  isUpdating: boolean;
  processText?: (text: string, section: string) => Promise<void>;
  processPdf?: (pdfData: string) => Promise<void>;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  report,
  onReportUpdate,
  batchStatus,
  isUpdating,
  processText,
  processPdf
}) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'update' | 'summarize'>('update');
  const [inputText, setInputText] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localBatchStatus, setLocalBatchStatus] = useState<{
    active: boolean;
    batchId: string;
    sections: string[];
  }>({ active: false, batchId: '', sections: [] });

  // Handler functions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedSection || !processText) return;
    
    try {
      setError(null);
      await processText(inputText, selectedSection);
      setSuccess('Report updated successfully!');
      setInputText('');
      setTimeout(() => {
        setSuccess(null);
        setEditorOpen(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report');
    }
  };

  const onExportHtml = () => {
    // Add export logic here
  };

  const onClearReport = () => {
    // Add clear logic here
  };

  const onViewJson = () => {
    // Add view JSON logic here
  };

  const onPdfUpload = async (pdfData: string) => {
    if (!processPdf) return;
    
    try {
      setError(null);
      const result = await processPdf(pdfData);
      // Return result for batch status handling
      return result;
    } catch (err) {
      throw err; // Let parent handle error
    }
  };

  const onBatchComplete = (updatedReport: any, commands: any[], affectedDomains: string[]) => {
    // Add batch complete logic here
  };

  const onBatchError = (error: string) => {
    setError(error);
  };

  // Determine if we should use batch mode (auto-detect) or standard mode
  const shouldUseBatchMode = selectedSection === 'auto-detect';

  // Handle PDF upload - trigger batch processing via parent prop
  const handlePdfSubmit = async (pdfData: string) => {
    if (isUpdating) return;
    setEditorOpen(false); // Close editor panel

    try {
      // Call parent handler, which should make the API call
      const data = await onPdfUpload(pdfData); // Expect potential batch info back

      // If parent handler returned batch info, start polling
      if (data?.batch?.id) {
        console.log(`Starting batch polling for PDF upload. ID: ${data.batch.id}`);
        setLocalBatchStatus({
          active: true,
          batchId: data.batch.id,
          // Determine sections based on response or default
          sections: data.batch.sections || ['header', 'background', 'presentLevels', 'assessmentResults', 'conclusion']
        });
      } else {
         console.log("PDF Upload successful (standard processing or no batch info returned).");
         // Handle success indication if needed, parent might do this via 'success' prop
      }
    } catch (err) {
      console.error('PDF processing error caught in EditorPanel:', err);
      onBatchError(err instanceof Error ? err.message : 'Failed to process PDF');
      setLocalBatchStatus({ active: false, batchId: '', sections: [] }); // Reset batch status on error
    }
  };


   // Handle summary generation - Sets input/section and triggers standard submit
   const handleSummarize = (summaryText: string) => {
    if (!summaryText) return;
    console.log("Summarize button clicked, setting input and section...");
    // We want to update the conclusion summary
    setSelectedSection('conclusion.conclusion.summary'); // Use correct path
    setInputText(summaryText);
    setActiveTab('update'); // Switch back to update tab to show the text
    // We don't auto-submit here, user can review/edit then press Update Report
    // // Trigger the submit process
    // handleSubmit(new Event('submit') as unknown as React.FormEvent);
  };

  // Determine if the user has had a successful result (e.g., for progressive disclosure of actions)
  // This relies on the 'success' prop from the parent.
  const hasSuccessfulResult = success !== null;

  return (
    <div className="sticky top-4 left-0 z-50 max-w-4xl px-6">
      <div className="flex justify-between items-center">
        {/* Dialog Trigger Button */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen} modal={true}>
        
        {/* === Workaround: Use asChild with native button + variants === */}
        <DialogTrigger asChild>
          <button
            type="button" // Add type="button" for non-submit buttons
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }), // Apply variants
              "rounded-full bg-[#F1EEE9]/80 shadow-lg p-2.5 hover:bg-[#E6E0D6] transition-all", // Your specific styles
              "border border-[#E6E0D6] hover:border-[#D8CFC1]", // Your specific styles
              batchStatus.active ? "invisible pointer-events-none" : "" // Your conditional styles
            )}
            aria-label="Open Report Editor"
          >
            <Edit3 className="h-4 w-4 text-[#6C8578]" />
          </button>
        </DialogTrigger>
        {/*}
        <button
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "ml-2 rounded-full bg-[#F1EEE9]/80 shadow-lg p-2.5 hover:bg-[#E6E0D6] transition-all",
            "border border-[#E6E0D6] hover:border-[#D8CFC1]"
          )}
          aria-label="Save Report"
        >
          {savingReport ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#6C8578]" />
          ) : (
            <Save className="h-4 w-4 text-[#6C8578]" />
          )} 
        </button>
        */}
        
        {/* ========================================================== */}
        <DialogContent className="max-w-4xl w-full p-0 rounded-xl border-0 animate-fadeIn">
          <DialogTitle className="sr-only">Update Report</DialogTitle>
          <DialogDescription className="sr-only">Edit and update your speech language report sections with text input or PDF upload</DialogDescription>
          <Card className="rounded-xl px-8 py-8 border border-[#E6E0D6] bg-[#F8F7F4] shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-medium text-foreground tracking-tight">Update Report</h2>
              {/* === Workaround: Use asChild with native button + variants === */}
              <DialogClose asChild>
                <button
                  type="button" // Add type="button"
                  className={cn(
                      buttonVariants({ variant: 'ghost', size: 'sm' }), // Apply variants
                      "h-7 w-7 p-0 rounded-full hover:bg-[#E6E0D6]/50" // Your specific styles
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
              {/* ========================================================== */}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'update' | 'summarize')} className="mb-6" >
              <TabsList className="grid grid-cols-2 bg-[#F1EEE9] p-1 rounded-lg w-full max-w-md mx-auto">
                 {/* TabsTrigger Update */}
                <TabsTrigger value="update" className={`rounded-md text-sm ${ activeTab === 'update' ? 'bg-white text-[#3C6E58] shadow-sm border border-[#E6E0D6]' : 'text-muted-foreground hover:text-[#5A7164]' }`} >
                  <PenLine className="h-4 w-4 mr-2" /> Update Sections
                </TabsTrigger>
                 {/* TabsTrigger Summarize */}
                <TabsTrigger value="summarize" className={`rounded-md text-sm ${ activeTab === 'summarize' ? 'bg-white text-[#3C6E58] shadow-sm border border-[#E6E0D6]' : 'text-muted-foreground hover:text-[#5A7164]' }`} >
                  <Wand2 className="h-4 w-4 mr-2" /> Generate Summary
                </TabsTrigger>
              </TabsList>

              {/* Update Tab Content */}
              <TabsContent value="update" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Input Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Text Input */}
                    <div className="flex flex-col space-y-3">
                      <Label className="font-display text-base font-medium text-foreground">Text Input</Label>
                      <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Enter observation or assessment data..." className="min-h-[180px] border border-[#E6E0D6] rounded-lg text-sm shadow-none focus-visible:ring-[#6C8578] bg-white focus-visible:border-transparent" disabled={isUpdating} />
                      <div className="flex justify-between items-center"> {/* Character count */} </div>
                    </div>
                    {/* PDF Upload */}
                    <div className="flex flex-col space-y-3">
                      <Label className="font-display text-base font-medium text-foreground">PDF Upload</Label>
                      <div className="min-h-[180px] flex items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#F1EEE9]/70">
                        <PdfUploader onUpload={handlePdfSubmit} disabled={isUpdating} />
                      </div>
                      <span className="text-xs text-muted-foreground"> Upload assessment reports or test protocols for batch processing </span>
                    </div>
                  </div>

                  {/* Controls Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-6">
                    {/* Target section dropdown */}
                    <div>
                      <Label className="font-display text-base font-medium flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-[#6C8578]" /> <span>Target Section</span>
                        <span className={cn( "text-xs font-sans ml-1.5 px-2 py-0.5 rounded-full", shouldUseBatchMode ? "bg-[#F0DDC5] text-[#8A6534]" : "bg-[#D1E7DD] text-[#0F5132]" )}>
                          {shouldUseBatchMode ? 'Batch Processing' : 'Standard Processing'}
                        </span>
                      </Label>
                      <div className="relative">
                        {/* === CORRECTED DROPDOWN OPTIONS === */}
                        <select
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          disabled={isUpdating}
                          className="w-full h-11 rounded-lg border border-[#E6E0D6] bg-white px-4 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6C8578] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="auto-detect">Auto-detect section (for batch processing)</option>
                          <optgroup label="Header">
                            <option value="header.reasonForReferral">Reason For Referral</option>
                            <option value="header.confidentialityStatement">Confidentiality Statement</option>
                            {/* Add header.studentInformation if needed, though complex */}
                          </optgroup>
                          <optgroup label="Background">
                            <option value="background.studentDemographicsAndBackground.educationalHistory">Educational History</option>
                            <option value="background.healthReport.medicalHistory">Medical History</option>
                            <option value="background.healthReport.visionAndHearingScreening">Vision/Hearing</option>
                             <option value="background.earlyInterventionHistory">Early Intervention</option>
                             <option value="background.familyHistory.familyStructure">Family Structure</option>
                             <option value="background.familyHistory.languageAndCulturalBackground">Family Language</option>
                            <option value="background.parentGuardianConcerns">Parent/Guardian Concerns</option>
                          </optgroup>
                           {/* --- NEW: Present Levels Section Options --- */}
                          <optgroup label="Present Levels">
                            <option value="presentLevels.functioning.receptive">Receptive Language</option>
                            <option value="presentLevels.functioning.expressive">Expressive Language</option>
                            <option value="presentLevels.functioning.pragmatic">Pragmatic Language</option>
                            <option value="presentLevels.functioning.articulation">Articulation</option>
                            <option value="presentLevels.functioning.voice">Voice</option>
                            <option value="presentLevels.functioning.fluency">Fluency</option>
                          </optgroup>
                          {/* --- UPDATED: Assessment Tools/Obs Section Options --- */}
                          <optgroup label="Assessment Tools/Observations">
                             {/* Note: Targeting individual observations might be tricky if keys change */}
                            <option value="assessmentResults.observations.classroomObservations">Classroom Observations</option>
                            <option value="assessmentResults.observations.playBasedInformalObservations">Play-Based Observations</option>
                             <option value="assessmentResults.observations.socialInteractionObservations">Social Interaction Observations</option>
                            <option value="assessmentResults.assessmentProceduresAndTools.overviewOfAssessmentMethods">Assessment Methods/Validity</option>
                             {/* Targeting specific tools used isn't practical via dropdown */}
                          </optgroup>
                          <optgroup label="Conclusion">
                            <option value="conclusion.conclusion.summary">Conclusion Summary</option>
                            <option value="conclusion.recommendations.services">Service Recommendations</option>
                            <option value="conclusion.recommendations.accommodations">Accommodations</option>
                            <option value="conclusion.recommendations.facilitationStrategies">Facilitation Strategies</option>
                            <option value="conclusion.eligibility.californiaEdCode">Eligibility Determination (Ed Code)</option>
                            <option value="conclusion.parentFriendlyGlossary.terms">Glossary Terms</option>
                          </optgroup>
                        </select>
                         {/* ===================================== */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"> <ChevronDown className="h-4 w-4 text-[#6C8578] opacity-70" /> </div>
                      </div>
                    </div>

                    {/* Submit button */}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isUpdating || !inputText.trim()} className={cn( "h-11 px-6 text-white rounded-lg font-medium transition-all shadow-sm", shouldUseBatchMode ? "bg-[#6C8578] hover:bg-[#5A7164] border border-[#5A7164]" : "bg-[#785F73] hover:bg-[#654D60] border border-[#654D60]" )} >
                        {isUpdating ? ( <div className="flex items-center gap-2"> <Spinner className="h-4 w-4" /> <span>Processing...</span> </div> )
                         : ( <div className="flex items-center gap-2"> {shouldUseBatchMode && <Zap className="h-4 w-4" />} <span>{shouldUseBatchMode ? 'Process in Batch' : 'Update Report'}</span> </div> )}
                      </Button>
                    </div>
                  </div>

                  {/* Status alerts */}
                  {(error || success) && ( <StatusAlert type={error ? 'error' : 'success'} message={error || success} /> )}
                </form>
              </TabsContent>

              {/* Summarize Tab Content */}
              <TabsContent value="summarize" className="mt-6">
                <SummarizePanel report={report} onSummarize={handleSummarize} />
              </TabsContent>
            </Tabs>

            {/* Action buttons */}
             {(hasSuccessfulResult || report.presentLevels?.functioning?.receptive?.topicSentence) && ( // Example condition for showing actions
              <div className="pt-6 mt-8 border-t border-[#E6E0D6]">
                <h3 className="text-base font-display font-medium mb-4">Report Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <ExportDocxButton reportData={report} className="text-xs h-9 bg-[#F1EEE9] border-[#E6E0D6] text-[#6C8578] hover:bg-[#E6E0D6] hover:text-[#5A7164] rounded-lg transition-colors" />
                  <Button variant="outline" size="sm" className="text-xs h-9 border-[#D1E7DD] bg-[#F8F9F8] text-[#0F5132] hover:bg-[#D1E7DD]/50 hover:text-[#0A3622] rounded-lg transition-colors" onClick={onExportHtml} > <FileText className="h-3.5 w-3.5 mr-1.5" /> Export HTML </Button>
                  <Button variant="outline" size="sm" className="text-xs h-9 border-[#F8D7DA] bg-[#FEF6F7] text-[#842029] hover:bg-[#F8D7DA]/50 hover:text-[#65191F] rounded-lg transition-colors" onClick={onClearReport} > <X className="h-3.5 w-3.5 mr-1.5" /> Clear Report </Button>
                  <Button variant="outline" size="sm" className="text-xs h-9 border-[#CFE2FF] bg-[#F7FAFF] text-[#084298] hover:bg-[#CFE2FF]/50 hover:text-[#062C6B] rounded-lg transition-colors" onClick={onViewJson} > View JSON </Button>
                </div>
              </div>
            )}
          </Card>
        </DialogContent>
      </Dialog>

      {/* Batch status component */}
      {batchStatus.active && (
        <div className="mb-6 animate-fadeIn">
          <BatchRequestStatus
            batchId={batchStatus.batchId}
            originalReport={report} // Pass current report state
            sections={batchStatus.sections} // Pass sections being processed
            onComplete={(updatedReport, commands, affectedDomains) => {
              setLocalBatchStatus({ active: false, batchId: '', sections: [] });
              // Call parent onBatchComplete to update the main report state
              onBatchComplete(updatedReport, commands, affectedDomains);
            }}
            onError={(errorMsg) => { // Renamed variable for clarity
              setLocalBatchStatus({ active: false, batchId: '', sections: [] });
              // Call parent onBatchError to handle the error display
              onBatchError(errorMsg);
            }}
          />
        </div>
      )}

      {/* Glossary Drawer removed */}
      </div>
    </div>
  );
};

export default EditorPanel; // Ensure component is exported