"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { useParams, useRouter } from 'next/navigation';
import type { Report, Section } from '@/types/report-types';
import { useToast } from '@/lib/context/ToastContext';
import type { ReportContextType } from '@/types/report-context-types';
import type { Json } from '@/lib/types/json';

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

/**
 * Transform a report_sections DB row into a frontend Section type.
 */
function dbRowToSection(row: any): Section {
  return {
    id: row.id,
    report_id: row.report_id,
    sectionType: row.section_type,
    title: row.title,
    order: row.order ?? 0,
    content: row.content || null,
    structured_data: row.structured_data || null,
    extraction_confidence: row.extraction_confidence || null,
    source_refs: row.source_refs || null,
    change_tracking: row.change_tracking || null,
    isCompleted: row.is_completed ?? false,
    isRequired: row.is_required ?? true,
    isGenerated: row.is_generated ?? false,
  };
}

export const ReportProvider: React.FC<ReportProviderProps> = ({ children, initialReport }) => {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reportId = params?.id;

  // Optional toast (guarded)
  let showToast: ((t: any) => void) | null = null;
  try {
    const toast = useToast();
    showToast = toast.showToast;
  } catch {}

  const [report, setReport] = useState<Report | null>(initialReport || null);
  const [loading, setLoading] = useState<boolean>(!initialReport);
  const [showJson, setShowJson] = useState<boolean>(false);
  const [realtime, setRealtime] = useState<{ broadcast?: string; pg?: string }>({ broadcast: 'INIT', pg: process?.env?.NEXT_PUBLIC_SUPABASE_PG_CHANGES === 'true' ? 'INIT' : 'DISABLED' });

  // Fetch report metadata + sections on client when server-hydrated report wasn't provided
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
        // Fetch report metadata
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single();

        if (!mounted) return;
        if (reportError || !reportData) {
          console.error('Error fetching report:', reportError);
          setReport(null);
          return;
        }

        // Fetch sections from report_sections (sole source of truth)
        const { data: sectionRows, error: sectionsError } = await supabase
          .from('report_sections')
          .select('*')
          .eq('report_id', reportId)
          .order('order', { ascending: true });

        if (!mounted) return;
        if (sectionsError) {
          console.error('Error fetching sections:', sectionsError);
        }

        const sections: Section[] = (sectionRows || []).map(dbRowToSection);

        setReport({ ...reportData, sections } as Report);
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

  /**
   * Save report metadata only. Section saves go through saveSection().
   */
  const handleSave = async (reportToSave: Report) => {
    if (!reportToSave) return;

    const { error } = await supabase
      .from('reports')
      .update({
        title: reportToSave.title,
        type: reportToSave.type,
        status: reportToSave.status,
        student_id: reportToSave.student_id,
        student_name: reportToSave.student_name,
        metadata: reportToSave.metadata,
        tags: reportToSave.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportToSave.id);

    if (error) {
      console.error('Error saving report metadata:', error);
      if (showToast) showToast({ type: 'error', title: 'Save Failed', description: 'There was an error saving your changes.' });
    } else {
      setReport(reportToSave);
    }
  };

  /**
   * Save an individual section to report_sections.
   */
  const saveSection = async (sectionId: string, data: Partial<{
    content: string;
    structured_data: Json;
    title: string;
    is_completed: boolean;
    is_generated: boolean;
    hydrated_html: string;
    extraction_confidence: Json;
    source_refs: Json;
    change_tracking: Json;
  }>) => {
    if (!reportId) return;

    const updatePayload: Record<string, any> = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('report_sections')
      .update(updatePayload)
      .eq('id', sectionId)
      .eq('report_id', reportId);

    if (error) {
      console.error('Error saving section:', error);
      if (showToast) showToast({ type: 'error', title: 'Section Save Failed', description: 'There was an error saving section changes.' });
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

  /**
   * Update section data in memory AND persist to report_sections.
   */
  const updateSectionData = (sectionId: string, newStructuredData: Json, newContent: string) => {
    if (!report) return;

    // Update in-memory state
    const next = report.sections.map(s =>
      s.id === sectionId ? { ...s, structured_data: newStructuredData, content: newContent } : s
    );
    setReport({ ...report, sections: next });

    // Persist to report_sections
    saveSection(sectionId, {
      structured_data: newStructuredData,
      content: newContent,
    });
  };

  const refreshReport = async () => {
    if (!reportId || reportId === 'seed-report-demo') return;
    try {
      // Fetch report metadata
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError || !reportData) {
        console.error('Error refreshing report:', reportError);
        return;
      }

      // Fetch sections from report_sections
      const { data: sectionRows, error: sectionsError } = await supabase
        .from('report_sections')
        .select('*')
        .eq('report_id', reportId)
        .order('order', { ascending: true });

      if (sectionsError) {
        console.error('Error refreshing sections:', sectionsError);
      }

      const sections: Section[] = (sectionRows || []).map(dbRowToSection);
      setReport({ ...reportData, sections } as Report);
    } catch (e) {
      console.error('Exception refreshing report:', e);
    }
  };

  // Realtime: subscribe to report_sections changes
  useEffect(() => {
    if (!reportId) return;
    const DEBUG = process?.env?.NEXT_PUBLIC_DEBUG === 'true';
    const ENABLE_PG_CHANGES = process?.env?.NEXT_PUBLIC_SUPABASE_PG_CHANGES === 'true';
    const ENABLE_BROADCAST = process?.env?.NEXT_PUBLIC_SUPABASE_BROADCAST !== 'false';

    let setStatus: (next: any) => void = () => {};
    try { setStatus = (next: any) => setRealtime((prev) => ({ ...prev, ...next })); } catch {}

    try {
      let pgChannel: any = null;
      if (ENABLE_PG_CHANGES) {
        pgChannel = supabase
          .channel(`report_sections:${reportId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'report_sections', filter: `report_id=eq.${reportId}` },
            (payload: any) => {
              try {
                const row = payload.new || payload.old;
                if (!row?.id) return;
                setReport(prev => {
                  if (!prev) return prev;
                  const next = { ...prev, sections: [...prev.sections] } as Report;
                  const idx = next.sections.findIndex(s => s.id === row.id);
                  if (idx >= 0) {
                    // Update existing section from DB row
                    next.sections[idx] = dbRowToSection(row);
                    if (DEBUG) console.log('🔔 Realtime update for section', row.id);
                  } else if (payload.eventType === 'INSERT') {
                    // New section added
                    next.sections.push(dbRowToSection(row));
                    next.sections.sort((a, b) => a.order - b.order);
                  }
                  return next;
                });
              } catch (e) {
                console.warn('⚠️ Failed merging realtime update:', e);
              }
            }
          )
          .subscribe((status: string) => {
            if (DEBUG) console.log('🔔 report_sections realtime status:', status);
            try { setStatus({ pg: status }); } catch {}
          });
      }

      // Broadcast channel for cross-tab updates
      let bc: any = null;
      if (ENABLE_BROADCAST) {
        try {
          bc = supabase
            .channel(`report:${reportId}`)
            .on('broadcast', { event: 'section_update' }, (payload: any) => {
              try {
                const { sectionId } = payload?.payload || payload;
                if (!sectionId) return;
                // Re-fetch the single section
                supabase
                  .from('report_sections')
                  .select('*')
                  .eq('id', sectionId)
                  .single()
                  .then(({ data }) => {
                    if (!data) return;
                    setReport(prev => {
                      if (!prev) return prev;
                      const next = { ...prev, sections: [...prev.sections] } as Report;
                      const idx = next.sections.findIndex(s => s.id === data.id);
                      if (idx >= 0) {
                        next.sections[idx] = dbRowToSection(data);
                        if (DEBUG) console.log('📡 Broadcast merged for section', data.id);
                      }
                      return next;
                    });
                  });
              } catch {}
            })
            .subscribe((status: string) => {
              if (DEBUG) console.log('📡 broadcast status:', status);
              try { setStatus({ broadcast: status }); } catch {}
            });
        } catch (e) {
          console.warn('⚠️ Broadcast subscribe failed (non-fatal):', e instanceof Error ? e.message : String(e));
          try { setStatus({ broadcast: 'FAILED' }); } catch {}
        }
      }

      return () => {
        try { if (pgChannel) supabase.removeChannel(pgChannel); } catch {}
        try { if (bc) supabase.removeChannel(bc); } catch {}
      };
    } catch (e) {
      console.warn('⚠️ Realtime subscription failed (non-fatal):', e instanceof Error ? e.message : String(e));
    }
  }, [supabase, reportId]);

  // Debug logging
  useEffect(() => {
    if (!report) return;
    const DEBUG = process?.env?.NEXT_PUBLIC_DEBUG === 'true';
    if (!DEBUG) return;

    try {
      const summary = (report.sections || []).map((s) => ({
        id: s.id,
        title: s.title,
        sectionType: s.sectionType,
        structuredKeys: s.structured_data && typeof s.structured_data === 'object' ? Object.keys(s.structured_data as any) : [],
        hasHydratedHtml: !!(s as any).hydratedHtml,
      }));
      console.log('🔑 Structured data keys by section:', summary);
    } catch {}
  }, [report]);

  return (
    <ReportContext.Provider value={{ report, handleSave, handleDelete, updateSectionData, refreshReport, setReport, showJson, setShowJson, loading, realtime }}>
      {children}
    </ReportContext.Provider>
  );
};
