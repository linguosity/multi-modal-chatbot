'use client';

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { useReports } from "@/components/contexts/reports-context";
import { getAllAssessmentTools } from '@/lib/assessment-tools';
import { SpeechLanguageReport, DomainSection } from '@/types/reportTypes';

// Import our new components
import EditorPanel from "@/components/reports/text-editor/EditorPanel";
import StudentInformationSection from "@/components/reports/text-editor/StudentInformationSection";
import BackgroundSection from "@/components/reports/text-editor/BackgroundSection";
import AssessmentResultsSection from "@/components/reports/text-editor/AssessmentResultsSection";
import ConclusionSection from "@/components/reports/text-editor/ConclusionSection";
import GlossarySection from "@/components/reports/text-editor/GlossarySection";
import JsonViewerDialog from "@/components/reports/text-editor/JsonViewerDialog";
import CommandDetailsCard from "@/components/reports/text-editor/CommandDetailsCard";
import { AssessmentLibraryPanel } from "@/components/reports/AssessmentLibraryPanel";

/**
 * Create a default report skeleton
 */
function createReportSkeleton(): SpeechLanguageReport {
  return {
    header: {
      studentInformation: {
        firstName: "",
        lastName: "",
        DOB: "",
        reportDate: "",
        evaluationDate: "",
        parents: [],
        homeLanguage: ""
      },
      reasonForReferral: "",
      confidentialityStatement: ""
    },
    background: {
      studentDemographicsAndBackground: {
        educationalHistory: ""
      },
      healthReport: {
        medicalHistory: "",
        visionAndHearingScreening: "",
        medicationsAndAllergies: ""
      },
      earlyInterventionHistory: "",
      familyHistory: {
        familyStructure: "",
        languageAndCulturalBackground: "",
        socioeconomicFactors: ""
      },
      parentGuardianConcerns: ""
    },
    assessmentResults: {
      observations: {
        classroomObservations: "",
        playBasedInformalObservations: "",
        socialInteractionObservations: ""
      },
      assessmentProceduresAndTools: {
        overviewOfAssessmentMethods: "",
        assessmentToolsUsed: [] // IDs of assessment tools
      },
      domains: {
        receptive: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        },
        expressive: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        },
        pragmatic: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        },
        articulation: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        },
        voice: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        },
        fluency: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        }
      }
    },
    conclusion: {
      eligibility: {
        domains: {
          receptive: false,
          expressive: false,
          pragmatic: false,
          articulation: false,
          voice: false,
          fluency: false
        },
        californiaEdCode: ""
      },
      conclusion: {
        summary: ""
      },
      recommendations: {
        services: {
          typeOfService: "",
          frequency: "",
          setting: ""
        },
        accommodations: [],
        facilitationStrategies: []
      },
      parentFriendlyGlossary: {
        terms: {}
      }
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      version: 1
    }
  };
}

// Helper function to truncate text with ellipsis
function truncateText(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Test component for Claude's JSON-based text editor tool
 */
export default function TextEditorTestPage() {
  // Get context for sidebar integration
  const { setSectionGroups } = useReports();
  
  // Input form state
  const [inputText, setInputText] = useState('');
  const [selectedSection, setSelectedSection] = useState('auto-detect');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Report state
  const [report, setReport] = useState<SpeechLanguageReport>({
    header: {
      studentInformation: {
        firstName: "Sample",
        lastName: "Student",
        DOB: "2018-05-15",
        reportDate: "2024-03-15",
        evaluationDate: "2024-03-10",
        parents: ["Parent Name"],
        homeLanguage: "English"
      },
      reasonForReferral: "Teacher referral due to concerns about articulation and language skills",
      confidentialityStatement: "This report contains confidential information..."
    },
    background: {
      studentDemographicsAndBackground: {
        educationalHistory: "Currently enrolled in 1st grade at Sample Elementary"
      },
      healthReport: {
        medicalHistory: "No significant medical history reported",
        visionAndHearingScreening: "Passed school screening on 2023-09-15",
        medicationsAndAllergies: "None reported"
      },
      earlyInterventionHistory: "No previous speech services",
      familyHistory: {
        familyStructure: "Lives with both parents and younger sibling",
        languageAndCulturalBackground: "English is the primary language spoken at home",
        socioeconomicFactors: ""
      },
      parentGuardianConcerns: "Parents report difficulty understanding child's speech at times"
    },
    assessmentResults: {
      observations: {
        classroomObservations: "Student needs repetition of directions in large group setting",
        playBasedInformalObservations: "Engages well in structured play activities",
        socialInteractionObservations: "Initiates interactions with peers appropriately"
      },
      assessmentProceduresAndTools: {
        overviewOfAssessmentMethods: "A combination of standardized tests, language samples, and observations were used",
        assessmentToolsUsed: []
      },
      domains: {
        receptive: {
          isConcern: false,
          topicSentence: 'Student demonstrates age-appropriate receptive language skills.',
          strengths: ['Follows 2-step directions consistently'],
          needs: [],
          impactStatement: "",
          assessmentTools: ["Clinical Evaluation of Language Fundamentals-5 (CELF-5)"]
        },
        expressive: {
          isConcern: true,
          topicSentence: 'Student shows mild deficits in expressive language.',
          strengths: ['Uses simple sentences to communicate needs'],
          needs: ['Difficulty with complex sentence structures', 'Limited vocabulary for academic concepts'],
          impactStatement: "Expressive language difficulties impact the student's ability to fully participate in classroom discussions",
          assessmentTools: ["Clinical Evaluation of Language Fundamentals-5 (CELF-5)"]
        },
        pragmatic: {
          isConcern: false,
          topicSentence: '',
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        },
        articulation: {
          isConcern: true,
          topicSentence: 'Student presents with multiple articulation errors affecting intelligibility.',
          strengths: [],
          needs: ['Produces /s/ and /z/ with lateral distortion', 'Fronting of velar sounds /k/ and /g/'],
          impactStatement: 'These errors significantly impact intelligibility in the classroom.',
          assessmentTools: ["Goldman-Fristoe Test of Articulation-3 (GFTA-3)"]
        },
        voice: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        },
        fluency: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        }
      }
    },
    conclusion: {
      eligibility: {
        domains: {
          receptive: false,
          expressive: true,
          pragmatic: false,
          articulation: true,
          voice: false,
          fluency: false
        },
        californiaEdCode: "Student meets eligibility criteria for speech or language impairment under California Ed Code Section 56333"
      },
      conclusion: {
        summary: "Based on assessment results and clinical observations, student demonstrates significant speech sound production errors and expressive language deficits that adversely affect educational performance."
      },
      recommendations: {
        services: {
          typeOfService: "Direct speech-language therapy",
          frequency: "2x weekly for 30 minutes",
          setting: "Pull-out and classroom-based"
        },
        accommodations: ["Preferential seating", "Visual supports for instruction"],
        facilitationStrategies: ["Allow extended time for verbal responses", "Provide language models"]
      },
      parentFriendlyGlossary: {
        terms: {
          "Articulation": "The physical production of speech sounds",
          "Phonological Process": "Error patterns in speech sound production"
        }
      }
    },
    metadata: {
      lastUpdated: "2024-03-16T00:00:00.000Z", // Static timestamp to avoid hydration errors
      version: 1
    }
  });
  
  // UI state
  const [commandDetails, setCommandDetails] = useState<any>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [assessmentTools, setAssessmentTools] = useState<Record<string, any>>({});
  
  // Get active domains for display
  const activeDomains = Object.keys(report.assessmentResults.domains || {}).filter(
    domain => report.assessmentResults.domains[domain] && (
      report.assessmentResults.domains[domain].topicSentence || 
      (report.assessmentResults.domains[domain].strengths && report.assessmentResults.domains[domain].strengths.length > 0) ||
      (report.assessmentResults.domains[domain].needs && report.assessmentResults.domains[domain].needs.length > 0)
    )
  );
  
  // Create a stable dependency for active domains
  const activeDomainsKey = React.useMemo(() => {
    return activeDomains.join(',');
  }, [activeDomains]);
  
  // Create a stable dependency for domain concerns
  const domainConcernsKey = React.useMemo(() => {
    return activeDomains
      .map(domain => `${domain}:${report.assessmentResults.domains[domain].isConcern}`)
      .join(',');
  }, [activeDomains, report.assessmentResults.domains]);

  // Load assessment tools
  useEffect(() => {
    try {
      const tools = getAllAssessmentTools();
      setAssessmentTools(tools);
    } catch (error) {
      console.error("Failed to load assessment tools:", error);
      setAssessmentTools({});
    }
  }, []);
  
  // Initialize sidebar section groups based on report structure
  useEffect(() => {
    // Create section groups for the sidebar
    const sectionGroups = [
      {
        title: "Student Information",
        items: [
          { title: "Demographics", url: "#demographics" },
          { title: "Referral Reason", url: "#referral" }
        ]
      },
      {
        title: "Background",
        items: [
          { title: "Educational History", url: "#educational-history" },
          { title: "Health Information", url: "#health-info" },
          { title: "Family Information", url: "#family-info" },
          { title: "Parent Concerns", url: "#parent-concerns" }
        ]
      },
      {
        title: "Assessment Results",
        items: [
          ...activeDomains.map(domain => ({
            title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Language`,
            url: `#domain-${domain}`,
            isActive: report.assessmentResults.domains[domain].isConcern
          })),
          { title: "Observations", url: "#observations" },
          { title: "Assessment Tools", url: "#assessment-tools" }
        ]
      },
      {
        title: "Conclusions",
        items: [
          { title: "Eligibility", url: "#eligibility" },
          { title: "Summary", url: "#summary" },
          { title: "Recommendations", url: "#recommendations" }
        ]
      },
      {
        title: "Glossary",
        items: [
          { title: "Terms", url: "#glossary" }
        ]
      }
    ];
    
    // Update the context with our section groups
    setSectionGroups(sectionGroups);
  }, [setSectionGroups, activeDomainsKey, domainConcernsKey]);
  
  /**
   * Handle form submission to update report using Claude's text editor
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isUpdating) return;
    
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    setCommandDetails(null);
    
    const clientRequestId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[${clientRequestId}] 🚀 Starting report update request`);
    console.log(`[${clientRequestId}] 📝 Input: "${inputText.substring(0, 50)}${inputText.length > 50 ? '...' : ''}"`);
    console.log(`[${clientRequestId}] 🎯 Target section: ${selectedSection}`);
    
    try {
      console.log(`[${clientRequestId}] 📤 Sending API request...`);
      // Call API endpoint that will use Claude's text editor tool
      const response = await fetch('/api/text-editor-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: inputText,
          report: report,
          updateSection: selectedSection === 'auto-detect' ? undefined : selectedSection
        }),
      });
      
      console.log(`[${clientRequestId}] 📥 Received API response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${clientRequestId}] ❌ API error:`, errorData);
        throw new Error(errorData.error || 'Failed to update report');
      }
      
      const data = await response.json();
      console.log(`[${clientRequestId}] 📦 Response data:`, {
        hasReport: !!data.report,
        hasCommand: !!data.command,
        commandType: data.command?.command,
        affectedDomain: data.affectedDomain,
        simulated: data.simulated,
        error: data.error
      });
      
      // Update the report state with the result from Claude's text editor
      if (data.report) {
        console.log(`[${clientRequestId}] 🔄 Updating report state with new data`);
        console.log(`[${clientRequestId}] 📊 Updated domains:`, 
          Object.keys(data.report.assessmentResults.domains).filter(domain => 
            JSON.stringify(data.report.assessmentResults.domains[domain]) !== 
            JSON.stringify(report.assessmentResults.domains[domain])
          )
        );
        
        setReport(data.report);
        setInputText(''); // Clear the input field
        
        // Set command details and success message
        if (data.command) {
          console.log(`[${clientRequestId}] 📋 Setting command details`);
          setCommandDetails(data.command);
          
          if (data.affectedDomain) {
            console.log(`[${clientRequestId}] ✅ Success: Updated ${data.affectedDomain} domain`);
            setSuccess(`Report updated successfully in the "${data.affectedDomain}" domain using Claude's ${data.command.command} command.`);
          } else {
            console.log(`[${clientRequestId}] ✅ Success: Report updated`);
            setSuccess(`Report updated successfully using Claude's ${data.command.command} command.`);
          }
        } else if (data.simulated) {
          console.log(`[${clientRequestId}] ⚠️ Using simulated response`);
          setSuccess(`Report updated with simulated changes (API fallback mode) in the "${data.affectedDomain}" domain.`);
        } else {
          console.log(`[${clientRequestId}] ✅ Success: Generic update`);
          setSuccess('Report updated successfully');
        }
      } else if (data.error) {
        console.error(`[${clientRequestId}] ❌ Error from API:`, data.error);
        setError(data.error);
      }
    } catch (err) {
      console.error(`[${clientRequestId}] ❌ Exception:`, err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      console.log(`[${clientRequestId}] 🏁 Request complete`);
      setIsUpdating(false);
    }
  };

  // Handle PDF upload
  const handlePdfUpload = async (pdfData: string) => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    setCommandDetails(null);

    try {
      // Get a client request ID for logging
      const clientRequestId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[${clientRequestId}] 🚀 Starting PDF processing request`);
      
      const response = await fetch('/api/text-editor-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData: pdfData,
          report: report,
          updateSection: selectedSection === 'auto-detect' ? undefined : selectedSection
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${clientRequestId}] ❌ PDF processing error:`, errorData);
        throw new Error(errorData.error || 'Failed to process PDF');
      }

      const data = await response.json();
      console.log(`[${clientRequestId}] 📦 PDF processing response:`, {
        hasReport: !!data.report,
        hasCommand: !!data.command,
        hasBatch: !!data.batch,
        batchId: data.batch?.id,
        commandType: data.command?.command,
        affectedDomain: data.affectedDomain
      });

      // If we have a batch response, don't update the report yet
      // The batch status component will handle polling and updating
      if (data.batch && data.batch.id) {
        console.log(`[${clientRequestId}] 🔄 Batch processing started with ID: ${data.batch.id}`);
        // EditorPanel will handle the actual batch status display
      }
      // Otherwise update the report state with the result from Claude's processing
      else if (data.report) {
        console.log(`[${clientRequestId}] 📝 Updating report with PDF processing results`);
        setReport(data.report);

        // Set command details and success message
        if (data.command) {
          setCommandDetails(data.command);

          if (data.affectedDomain) {
            setSuccess(`Report updated successfully in the "${data.affectedDomain}" domain from PDF.`);
          } else {
            setSuccess(`Report updated successfully from PDF using ${data.command.command} command.`);
          }
        } else {
          setSuccess('Report updated successfully from PDF');
        }
      } else if (data.error) {
        console.error(`[${clientRequestId}] ❌ Error from PDF processing:`, data.error);
        setError(data.error);
      }
      
      return data; // Return data for EditorPanel to handle batch status
    } catch (err) {
      console.error("PDF processing error:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred processing the PDF');
      throw err; // Rethrow for EditorPanel to handle
    } finally {
      // Only set isUpdating to false if we're not doing batch processing
      // Otherwise, this will be handled when batch completes
      if (selectedSection !== 'auto-detect') {
        setIsUpdating(false);
      }
    }
  };

  // Handle exporting HTML
  const handleExportHtml = () => {
    // Import and use on demand to avoid potential import issues
    import('@/lib/las-report-generator').then(module => {
      module.exportLASReport(report);
      setSuccess("Generated HTML report as a temporary solution");
    }).catch(error => {
      console.error('Error loading LAS report generator:', error);
      setError('Failed to load LAS report generator. Please try again.');
    });
  };

  // Handle clearing the report
  const handleClearReport = () => {
    if (window.confirm("Are you sure you want to clear the report? This cannot be undone.")) {
      // Reset report to initial empty state
      setReport(createReportSkeleton());
      setSuccess("Report has been cleared successfully");
      setError(null);
      setCommandDetails(null);
    }
  };
  
  // Handle adding tool to global list
  const handleAddToolToGlobal = (tool: string) => {
    const updatedReport = { ...report };
    if (!updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.includes(tool)) {
      updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.push(tool);
      setReport(updatedReport);
      setSuccess(`Added ${tool} to global assessment tools list`);
    }
  };

  // Handle toggling domain eligibility
  const handleToggleDomainEligibility = (domain: string, value: boolean) => {
    const updatedReport = JSON.parse(JSON.stringify(report));
    updatedReport.conclusion.eligibility.domains[domain] = value;
    setReport(updatedReport);
  };

  // Handle adding a tool to the report
  const handleAddTool = (toolId: string) => {
    const updatedReport = { ...report };
    if (!updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.includes(toolId)) {
      updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.push(toolId);
      setReport(updatedReport);
      setSuccess(`Added ${assessmentTools[toolId]?.name || toolId} to assessment tools`);
    } else {
      setSuccess(`${assessmentTools[toolId]?.name || toolId} is already in your assessment tools`);
    }
  };

  // Handle opening the assessment library
  const handleOpenLibrary = () => {
    document.getElementById('assessment-search-modal')?.click();
  };
  
  return (
    <div className="w-full">
      {/* Report card with scrollable content */}
      <Card className="relative border-0 shadow-sm overflow-auto" style={{ height: "calc(100vh - 180px)" }}>
        
        {/* Editor panel component */}
        <EditorPanel 
          inputText={inputText}
          setInputText={setInputText}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          isUpdating={isUpdating}
          error={error}
          success={success}
          handleSubmit={handleSubmit}  // The EditorPanel now decides between standard/batch based on section
          onExportHtml={handleExportHtml}
          onClearReport={handleClearReport}
          onViewJson={() => setShowJsonPreview(true)}
          report={report}
          onPdfUpload={handlePdfUpload}
          onBatchComplete={(updatedReport, commands, affectedDomains) => {
            // Update the report with batch results
            setReport(updatedReport);
            
            // Set success message
            const domainsText = affectedDomains.length > 0 
              ? `${affectedDomains.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')} domains`
              : 'multiple sections';
            setSuccess(`Batch processing completed successfully! Updated ${domainsText}.`);
            
            // Show command details for the first command if available
            if (commands && commands.length > 0) {
              setCommandDetails({
                command: 'batch_update',
                updates: commands.length,
                domains: affectedDomains,
                path: commands[0].path,
                sample: commands[0].value
              });
            }
            
            // Clear the updating state
            setIsUpdating(false);
          }}
          onBatchError={(errorMessage) => {
            setError(errorMessage);
            // Clear the updating state
            setIsUpdating(false);
          }}
        />
       
        <div className="p-6">
          {/* Empty state */}
          {activeDomains.length === 0 && 
           Object.keys(report.assessmentResults.observations || {}).length === 0 && 
           !report.conclusion.conclusion.summary && 
           report.conclusion.recommendations.accommodations.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-2">No report sections available yet</p>
              <p className="text-gray-400 text-sm">Enter observations above to start building your report</p>
            </div>
          )}

          {/* Report sections */}
          <div className="space-y-4">
            {/* Student Information Section */}
            <StudentInformationSection header={report.header} />
            
            {/* Background Section */}
            <BackgroundSection background={report.background} />
            
            {/* Assessment Results Section */}
            <AssessmentResultsSection 
              assessmentResults={report.assessmentResults}
              allTools={assessmentTools}
              onAddToolToGlobal={handleAddToolToGlobal}
              onOpenLibrary={handleOpenLibrary}
              onAddTool={handleAddTool}
            />
            
            {/* Conclusion Section */}
            <ConclusionSection 
              conclusion={report.conclusion}
              onToggleDomainEligibility={handleToggleDomainEligibility}
            />

            {/* Glossary Section */}
            <div id="glossary">
              <GlossarySection glossary={report.conclusion.parentFriendlyGlossary} />
            </div>
          </div>
        </div>
      </Card>
      
      {/* JSON Viewer Dialog */}
      <JsonViewerDialog 
        data={report}
        isOpen={showJsonPreview}
        onClose={() => setShowJsonPreview(false)}
      />
      
      {/* Tool Command Details */}
      {commandDetails && (
        <CommandDetailsCard 
          commandDetails={commandDetails}
          truncateText={truncateText}
        />
      )}
      
      {/* Assessment Library Panel integration */}
      <AssessmentLibraryPanel 
        onAddTool={(tool) => {
          // Create an updated copy of the report
          const updatedReport = { ...report };
          
          // Add tool to the global assessment tools list if not already included
          if (!updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.includes(tool.id)) {
            updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.push(tool.id);
          }
          
          // If a domain is selected, also add to that domain's tools
          if (selectedSection && selectedSection.startsWith('assessmentResults.domains.')) {
            const domain = selectedSection.split('.').pop();
            if (domain && updatedReport.assessmentResults.domains[domain]) {
              const domainTools = updatedReport.assessmentResults.domains[domain].assessmentTools || [];
              if (!domainTools.includes(tool.name)) {
                updatedReport.assessmentResults.domains[domain].assessmentTools = [...domainTools, tool.name];
              }
            }
          }
          
          // Update the report state
          setReport(updatedReport);
          setSuccess(`Added ${tool.name} to assessment tools`);
        }}
        selectedDomain={selectedSection && selectedSection.startsWith('assessmentResults.domains.') 
          ? selectedSection.split('.').pop() 
          : undefined}
      />
    </div>
  );
}