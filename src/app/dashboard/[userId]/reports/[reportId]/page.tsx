"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // 1) Import the Skeleton component
import { useReports } from "@/components/contexts/reports-context";
import { getAllAssessmentTools } from '@/lib/assessment-tools';
import { SpeechLanguageReport } from '@/types/reportTypes';
import { useParams } from 'next/navigation';
import EditorPanel from "@/components/reports/text-editor/EditorPanel";
import StudentInformationSection from "@/components/reports/text-editor/StudentInformationSection";
import BackgroundSection from "@/components/reports/text-editor/BackgroundSection";
import AssessmentResultsSection from "@/components/reports/text-editor/AssessmentResultsSection";
import ConclusionSection from "@/components/reports/text-editor/ConclusionSection";
import GlossarySection from "@/components/reports/text-editor/GlossarySection";
import JsonViewerDialog from "@/components/reports/text-editor/JsonViewerDialog";
import CommandDetailsCard from "@/components/reports/text-editor/CommandDetailsCard";
import { AssessmentLibraryPanel } from "@/components/reports/AssessmentLibraryPanel";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
        assessmentToolsUsed: []
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

// Mock data for demonstration
const MOCK_REPORT: SpeechLanguageReport = {
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
        impactStatement: ""
      },
      expressive: {
        isConcern: true,
        topicSentence: 'Student shows mild deficits in expressive language.',
        strengths: ['Uses simple sentences to communicate needs'],
        needs: ['Difficulty with complex sentence structures', 'Limited vocabulary for academic concepts'],
        impactStatement: "Expressive language difficulties impact the student's ability to fully participate in classroom discussions"
      },
      pragmatic: {
        isConcern: false,
        topicSentence: '',
        strengths: [],
        needs: [],
        impactStatement: ""
      },
      articulation: {
        isConcern: true,
        topicSentence: 'Student presents with multiple articulation errors affecting intelligibility.',
        strengths: [],
        needs: ['Produces /s/ and /z/ with lateral distortion', 'Fronting of velar sounds /k/ and /g/'],
        impactStatement: 'These errors significantly impact intelligibility in the classroom.'
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
    lastUpdated: "2024-03-16T00:00:00.000Z",
    version: 1
  }
};

// Helper function to truncate text with ellipsis
function truncateText(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength - 3) + '...';
}

export default function ReportEditor() {
  const params = useParams();
  const userId = params?.userId as string;
  const reportId = params?.reportId as string;
  const isNewReport = reportId === 'new';

  // Get context for sidebar integration - this will enable section navigation
  const { setSectionGroups } = useReports();

  // Input form state
  const [inputText, setInputText] = useState('');
  const [selectedSection, setSelectedSection] = useState('auto-detect');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 2) Loading state to control skeleton vs. real content
  const [loading, setLoading] = useState(true);

  // Report state - start with a skeleton and update from DB if needed
  const [report, setReport] = useState<SpeechLanguageReport>(createReportSkeleton());

  // UI state
  const [commandDetails, setCommandDetails] = useState<any>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [assessmentTools, setAssessmentTools] = useState<Record<string, any>>({});
  const [savingReport, setSavingReport] = useState(false);

  // 3) Load mock report data with simulated network delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isNewReport) {
        setReport(createReportSkeleton());
      } else {
        setReport(MOCK_REPORT);
      }
      setLoading(false); // After data is ready, turn off loading
    }, 800);

    return () => clearTimeout(timer);
  }, [reportId, isNewReport]);

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

  // Identify active domains
  const activeDomains = Object.keys(report.assessmentResults.domains || {}).filter(
    domain => report.assessmentResults.domains[domain] && (
      report.assessmentResults.domains[domain].topicSentence ||
      (report.assessmentResults.domains[domain].strengths &&
        report.assessmentResults.domains[domain].strengths.length > 0) ||
      (report.assessmentResults.domains[domain].needs &&
        report.assessmentResults.domains[domain].needs.length > 0)
    )
  );

  // For updating the sidebar
  const activeDomainsKey = React.useMemo(() => {
    return activeDomains.join(',');
  }, [activeDomains]);

  const domainConcernsKey = React.useMemo(() => {
    return activeDomains
      .map(domain => `${domain}:${report.assessmentResults.domains[domain].isConcern}`)
      .join(',');
  }, [activeDomains, report.assessmentResults.domains]);

  // 4) Build section groups for sidebar
  useEffect(() => {
    const newSectionGroups = [
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
    setSectionGroups(newSectionGroups);
  }, [setSectionGroups, activeDomainsKey, domainConcernsKey]);

  // 5) Form submission logic (unchanged)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isUpdating) return;
    
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    setCommandDetails(null);

    try {
      const response = await fetch('/api/text-editor-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: inputText,
          report: report,
          updateSection: selectedSection === 'auto-detect' ? undefined : selectedSection,
          userId,
          reportId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update report');
      }

      const data = await response.json();
      if (data.report) {
        setReport(data.report);
        setInputText('');
        if (data.command) {
          setCommandDetails(data.command);
          if (data.affectedDomain) {
            setSuccess(`Report updated in "${data.affectedDomain}" domain using Claude's ${data.command.command} command.`);
          } else {
            setSuccess(`Report updated using Claude's ${data.command.command} command.`);
          }
        } else if (data.simulated) {
          setSuccess(`Report updated with simulated changes in the "${data.affectedDomain}" domain.`);
        } else {
          setSuccess('Report updated successfully');
        }
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  // 6) Other existing handlers (omitted for brevity)
  const handlePdfUpload = async (pdfData: string) => { /* ... */ };
  const handleSaveReport = async () => { /* ... */ };
  const handleAddToolToGlobal = (tool: string) => { /* ... */ };
  const handleToggleDomainEligibility = (domain: string, value: boolean) => { /* ... */ };
  const handleAddTool = (toolId: string) => { /* ... */ };
  const handleExportHtml = () => { /* ... */ };
  const handleClearReport = () => { /* ... */ };
  const handleOpenLibrary = () => { /* ... */ };

  return (
    <div className="w-full">
      <Card className="relative border-0 shadow-sm overflow-auto" style={{ height: "calc(100vh - 180px)" }}>
        
        {/* 7) Save button remains visible at top-right */}
        <div className="absolute top-2 right-2 z-10">
          <Button onClick={handleSaveReport} disabled={savingReport} variant="default" size="sm">
            {savingReport ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save Report
          </Button>
        </div>

        {/* Editor panel remains unchanged */}
        <EditorPanel
          inputText={inputText}
          setInputText={setInputText}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          isUpdating={isUpdating}
          error={error}
          success={success}
          handleSubmit={handleSubmit}
          onExportHtml={handleExportHtml}
          onClearReport={handleClearReport}
          onViewJson={() => setShowJsonPreview(true)}
          report={report}
          onPdfUpload={handlePdfUpload}
          onBatchComplete={(updatedReport, commands, affectedDomains) => {
            setReport(updatedReport);
            const domainsText = affectedDomains.length > 0 
              ? affectedDomains.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
              : 'multiple sections';
            setSuccess(`Batch processing completed successfully! Updated ${domainsText}.`);
            if (commands && commands.length > 0) {
              setCommandDetails({
                command: 'batch_update',
                updates: commands.length,
                domains: affectedDomains,
                path: commands[0].path,
                sample: commands[0].value
              });
            }
          }}
          onBatchError={(errorMessage) => {
            setError(errorMessage);
          }}
        />

        {/* 8) Conditional rendering: If loading is true, show skeleton placeholders. Otherwise show real sections. */}
        {loading ? (
          <div className="p-6 space-y-4">
            {/* Student Info skeleton */}
            <div className="bg-gray-50 p-4 rounded">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            {/* Background skeleton */}
            <div className="bg-gray-50 p-4 rounded">
              <Skeleton className="h-5 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
            {/* Assessment skeleton */}
            <div className="bg-gray-50 p-4 rounded">
              <Skeleton className="h-5 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-1" />
            </div>
            {/* Conclusion skeleton */}
            <div className="bg-gray-50 p-4 rounded">
              <Skeleton className="h-5 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            {/* Glossary skeleton */}
            <div className="bg-gray-50 p-4 rounded">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ) : (
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
        )}
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
          const updatedReport = { ...report };
          if (!updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.includes(tool.id)) {
            updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.push(tool.id);
          }
          if (selectedSection && selectedSection.startsWith('assessmentResults.domains.')) {
            const domain = selectedSection.split('.').pop();
            if (domain && updatedReport.assessmentResults.domains[domain]) {
              const domainTools = updatedReport.assessmentResults.domains[domain].assessmentTools || [];
              if (!domainTools.includes(tool.name)) {
                updatedReport.assessmentResults.domains[domain].assessmentTools = [...domainTools, tool.name];
              }
            }
          }
          setReport(updatedReport);
          setSuccess(`Added ${tool.name} to assessment tools`);
        }}
        selectedDomain={
          selectedSection && selectedSection.startsWith('assessmentResults.domains.')
            ? selectedSection.split('.').pop()
            : undefined
        }
      />
    </div>
  );
}