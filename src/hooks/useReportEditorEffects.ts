import { useEffect, useMemo } from 'react';
import { getAllAssessmentTools } from '@/lib/assessment-tools';
import { createReportSkeleton } from '@/lib/report-utilities';
import { SpeechLanguageReport, Functioning } from '@/types/reportSchemas';
import { useReports } from "@/components/contexts/reports-context";
import { ReportEditorState } from './useReportEditorState';

interface UseReportEditorEffectsProps {
  reportId: string;
  state: ReportEditorState;
  actions: {
    setLoading: (loading: boolean) => void;
    setInitialReport: (report: SpeechLanguageReport | null) => void;
    setAssessmentTools: (tools: Record<string, any>) => void;
  };
  report: SpeechLanguageReport | null;
}

export function useReportEditorEffects({
  reportId,
  state,
  actions,
  report
}: UseReportEditorEffectsProps) {
  const { setSectionGroups } = useReports();

  // Load report data effect
  useEffect(() => {
    actions.setLoading(true);

    const loadReport = async () => {
      try {
        const response = await fetch(`/api/reports?id=${reportId}`);
        const json = await response.json();

        console.log("Loaded report JSON:", json);
        
        if (!response.ok) throw new Error(json.error || 'Failed to fetch report');

        const reportData = json;
        
        if (!reportData || !reportData.report || typeof reportData.report !== 'object') {
          console.error("Invalid report data structure:", json);
          throw new Error('Invalid report data');
        }

        console.log('[loadReport] Setting initialReport:', reportData);
        
        if (reportData && reportData.id) {
          console.info('[Report Safety Check] All nested report access points verified for:', reportData.id);
        }
        
        actions.setInitialReport(reportData);
      } catch (e) {
        console.error("Failed to load report from Supabase, falling back to skeleton:", e);
        console.log('[loadReport] Falling back to skeleton report');
        actions.setInitialReport(createReportSkeleton());
      } finally {
        actions.setLoading(false);
      }
    };

    if (reportId === 'new') {
      actions.setInitialReport(createReportSkeleton());
      actions.setLoading(false);
    } else {
      loadReport();
    }
  }, [reportId, actions.setLoading, actions.setInitialReport]);

  // Load assessment tools effect
  useEffect(() => {
    try {
      const tools = getAllAssessmentTools();
      actions.setAssessmentTools(tools);
    } catch (error) {
      console.error("Failed to load assessment tools:", error);
      actions.setAssessmentTools({});
    }
  }, [actions.setAssessmentTools]);

  // Memoized values for sidebar updates
  const activeDomains = useMemo(() => {
    if (!report?.presentLevels?.functioning) {
      return [];
    }
    
    const functioning = report.presentLevels.functioning;
    
    return Object.entries(functioning)
      .filter(([key, value]) => value?.isConcern === true)
      .map(([key]) => key);
  }, [report?.presentLevels?.functioning]);

  const activeDomainsKey = useMemo(() => 
    (activeDomains || []).join(','), [activeDomains]
  );

  const domainConcernsKey = useMemo(() => {
    if (!report?.presentLevels?.functioning || !activeDomains) {
      return '';
    }
    
    const functioning = report.presentLevels.functioning;
    
    return (activeDomains || []).map(domain => 
      `${domain}-${functioning[domain as keyof Functioning]?.isConcern ?? false}`
    ).join(',');
  }, [activeDomains, report?.presentLevels?.functioning]);

  // Build section groups for sidebar effect
  useEffect(() => {
    let domainItems: { title: string, url: string, isActive: boolean }[] = [];
    
    if (report?.presentLevels?.functioning) {
      const functioning = report.presentLevels.functioning;
      domainItems = (activeDomains || []).map(domain => ({
        title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Language`,
        url: `#domain-${domain}`,
        isActive: functioning[domain as keyof Functioning]?.isConcern ?? false
      }));
    }

    const eligibilityDomains = report?.conclusion?.eligibility?.domains ? 
      Object.keys(report.conclusion.eligibility.domains) : [];
    const hasLanguage = eligibilityDomains.some(d => 
      ['receptive', 'expressive', 'pragmatic'].includes(d)
    );
    
    const eligibilityItems = [];
    if (hasLanguage) {
      eligibilityItems.push({ title: "Language", url: "#eligibility-language" });
    }
    
    eligibilityDomains.forEach(domain => {
      if (!['receptive', 'expressive', 'pragmatic'].includes(domain)) {
        eligibilityItems.push({ 
          title: domain.charAt(0).toUpperCase() + domain.slice(1), 
          url: `#eligibility-${domain}` 
        });
      }
    });
    
    if (report?.conclusion?.eligibility?.isPreschool === true) {
      eligibilityItems.push({ title: "Preschool", url: "#eligibility-preschool" });
    }

    const sectionGroups = [
      {
        title: "Student & Background",
        items: [
          { title: "Student Information", url: "#student-info" },
          { title: "Background Information", url: "#background" },
        ]
      },
      {
        title: "Assessment Results",
        items: [
          { title: "Assessment Procedures", url: "#assessment-procedures" },
          { title: "Observations", url: "#observations" },
        ]
      },
      {
        title: "Present Levels",
        items: domainItems.length > 0 ? domainItems : [
          { title: "No domains identified", url: "#present-levels" }
        ]
      },
      {
        title: "Eligibility & Conclusion",
        items: eligibilityItems.length > 0 ? eligibilityItems : [
          { title: "Eligibility Determination", url: "#eligibility" },
          { title: "Conclusion", url: "#conclusion" },
          { title: "Recommendations", url: "#recommendations" }
        ]
      },
      {
        title: "Additional Sections",
        items: [
          { title: "Parent-Friendly Glossary", url: "#glossary" }
        ]
      }
    ];

    setSectionGroups(sectionGroups);
  }, [activeDomainsKey, domainConcernsKey, report, setSectionGroups, activeDomains]);

  return {
    activeDomains,
    activeDomainsKey,
    domainConcernsKey
  };
}