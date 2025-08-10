"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { useParams, useRouter } from 'next/navigation';
import type { Report } from '@/types/report-types';
import { useToast } from '@/lib/context/ToastContext';
import type { ReportContextType } from '@/types/report-context-types';
import type { Json } from '@/lib/types/json';
import { hasCircularReference, removeCircularReferences } from '@/lib/utils/clean-data';

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function useReport() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}

interface ReportProviderProps {
  children: React.ReactNode;
  initialReport?: Report | null;
}

export const ReportProvider: React.FC<ReportProviderProps> = ({ children, initialReport }) => {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reportId = params?.id;

  // Optional toast (guarded)
  let showToast: ((t: { type: string; title: string; description: string }) => void) | null = null;
  try {
    const toast = useToast();
    showToast = toast.showToast;
  } catch {}

  const [report, setReport] = useState<Report | null>(initialReport || null);
  const [loading, setLoading] = useState<boolean>(!initialReport);
  const [showJson, setShowJson] = useState<boolean>(false);

  // Fetch on client only when server-hydrated report wasn't provided
  useEffect(() => {
    if (initialReport) {
      setLoading(false);
      return;
    }
    if (!reportId || reportId === 'seed-report-demo') {
      setReport(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single();
        if (!mounted) return;
        if (error) {
          console.error('Error fetching report:', error);
          setReport(null);
        } else {
          setReport(data as Report);
        }
      } catch (e) {
        if (mounted) {
          console.error('Exception fetching report:', e);
          setReport(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [reportId, supabase, initialReport]);

  const handleSave = async (reportToSave: Report) => {
    if (!reportToSave) return;
    const cleaned = hasCircularReference(reportToSave) ? removeCircularReferences(reportToSave) : reportToSave;

    let { error } = await supabase
      .from('reports')
      .update(cleaned)
      .eq('id', cleaned.id);

    if (error && (error.message?.includes('metadata') || (error as any).code === 'PGRST204')) {
      const { metadata: _omit, ...withoutMeta } = cleaned as any;
      const retry = await supabase
        .from('reports')
        .update(withoutMeta)
        .eq('id', cleaned.id);
      error = retry.error;
      if (!retry.error && showToast) {
        showToast({ type: 'warning', title: 'Partial Save', description: 'Saved without metadata; DB migration recommended.' });
      }
    }

    if (error) {
      console.error('Error saving report:', error);
      if (showToast) showToast({ type: 'error', title: 'Save Failed', description: 'There was an error saving your changes.' });
    } else {
      setReport(reportToSave);
    }
  };

  const handleDelete = async () => {
    if (!report || !report.id) return;
    if (!confirm('Are you sure you want to delete this report?')) return;
    setLoading(true);
    const { error } = await supabase.from('reports').delete().eq('id', report.id);
    setLoading(false);
    if (error) {
      console.error('Error deleting report:', error);
    } else {
      if (showToast) showToast({ type: 'success', title: 'Report Deleted', description: 'The report has been deleted.' });
      router.push('/dashboard/reports');
    }
  };

  const updateSectionData = (sectionId: string, newStructuredData: Json, newContent: string) => {
    if (!report) return;
    const next = report.sections.map(s => s.id === sectionId ? { ...s, structured_data: newStructuredData, content: newContent } : s);
    setReport({ ...report, sections: next });
  };

  const refreshReport = async () => {
    if (!reportId || reportId === 'seed-report-demo') return;
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();
      if (error) {
        console.error('Error refreshing report:', error);
      } else {
        setReport(data as Report);
      }
    } catch (e) {
      console.error('Exception refreshing report:', e);
    }
  };

  return (
    <ReportContext.Provider value={{ report, handleSave, handleDelete, updateSectionData, refreshReport, setReport, showJson, setShowJson, loading }}>
      {children}
    </ReportContext.Provider>
  );
};

