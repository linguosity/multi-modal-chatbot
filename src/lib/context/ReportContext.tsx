import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { useRouter, useParams } from 'next/navigation';
import { Report } from '@/lib/schemas/report';

interface ReportContextType {
  report: Report | null;
  handleSave: () => Promise<void>;
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
}

export const ReportProvider: React.FC<ReportProviderProps> = ({ children }) => {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reportId = params.id;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    setLoading(true); // Always set loading to true when effect runs

    if (!reportId) {
      setReport(null); // Set report to null if no reportId
      setLoading(false); // Set loading to false
      return;
    }

    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('Error fetching report:', error);
        setReport(null);
      } else {
        setReport(data);
      }
      setLoading(false);
    };

    fetchReport();
  }, [reportId, supabase]);

  const handleSave = async () => {
    setLoading(true);
    if (report) {
      const { error } = await supabase
        .from('reports')
        .update(report)
        .eq('id', report.id);
      if (error) {
        console.error('Error saving report:', error);
      } else {
        alert('Report saved!');
      }
    }
    setLoading(false);
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
      alert('Report deleted!');
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
