import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { useRouter, useParams } from 'next/navigation';
import { Report } from '@/lib/schemas/report';
import { createToast } from '@/lib/hooks/use-toast';

interface ReportContextType {
  report: Report | null;
  handleSave: (reportToSave: Report) => Promise<void>;
  handleDelete: () => Promise<void>;
  showJson: boolean;
  setShowJson: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  setReport: React.Dispatch<React.SetStateAction<Report | null>>; // Add setReport to context
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const useReport = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};

interface ReportProviderProps {
  children: React.ReactNode;
  initialReport?: Report | null;
}

export const ReportProvider: React.FC<ReportProviderProps> = ({ children, initialReport }) => {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reportId = params.id;

  const [report, setReport] = useState<Report | null>(initialReport || null);
  const [loading, setLoading] = useState(initialReport ? false : true);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    // Skip fetching if we already have an initialReport
    if (initialReport) {
      return;
    }
    
    if (!reportId || reportId === 'seed-report-demo') {
      setReport(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single();

        if (isMounted) {
          if (error) {
            console.error('Error fetching report:', error);
            setReport(null);
          } else {
            setReport(data);
          }
        }
      } catch (e) {
        if (isMounted) {
          console.error('Exception fetching report:', e);
          setReport(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [reportId, supabase]);

  const handleSave = async (reportToSave: Report) => {
    // Don't set loading to true for auto-saves to prevent UI disruption
    if (reportToSave) {
      // First, try to save with metadata
      let { error } = await supabase
        .from('reports')
        .update(reportToSave)
        .eq('id', reportToSave.id);
      
      // If metadata column doesn't exist, try saving without it
      if (error && (error.message?.includes("metadata") || error.code === "PGRST204")) {
        console.warn('Metadata column not found, saving without metadata. Please run database migration.');
        const { metadata, ...reportWithoutMetadata } = reportToSave;
        const { error: retryError } = await supabase
          .from('reports')
          .update(reportWithoutMetadata)
          .eq('id', reportToSave.id);
        error = retryError;
        
        // Show a toast about the missing metadata column
        if (!retryError) {
          createToast({
            title: "Partial Save",
            description: "Report saved, but student bio data requires database update. Please contact admin.",
            variant: "default"
          });
        }
      }
      
      if (error) {
        console.error('Error saving report:', error);
        createToast({
          title: "Save Failed",
          description: "There was an error saving your changes.",
          variant: "destructive"
        });
      } else {
        // Subtle success indication - no toast for auto-saves
        console.log('✅ Report auto-saved successfully');
        // Update local state to reflect the save
        setReport(reportToSave);
      }
    }
  };

  const handleDelete = async () => {
    if (!report || !report.id) return;
    if (!confirm('Are you sure you want to delete this report?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', report.id);

    if (error) {
      console.error('Error deleting report:', error);
    } else {
      createToast({
        title: "Report Deleted!",
        description: "The report has been successfully deleted.",
      });
      router.push('/dashboard/reports');
    }
    setLoading(false);
  };

  return (
    <ReportContext.Provider value={{ report, handleSave, handleDelete, showJson, setShowJson, loading, setReport }}>
      {children}
    </ReportContext.Provider>
  );
};
