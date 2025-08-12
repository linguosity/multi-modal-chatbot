"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { useParams, useRouter } from 'next/navigation';
import type { Report } from '@/types/report-types';
import { useToast } from '@/lib/context/ToastContext';
import type { ReportContextType } from '@/types/report-context-types';
import type { Json } from '@/lib/types/json';
import { hasCircularReference, removeCircularReferences } from '@/lib/utils/clean-data';
import { normalizeReport } from '@/lib/utils/normalize-report';
import { safeStringify } from '@/lib/utils/safeStringify';

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
  const [realtime, setRealtime] = useState<{ broadcast?: string; pg?: string }>({ broadcast: 'INIT', pg: process?.env?.NEXT_PUBLIC_SUPABASE_PG_CHANGES === 'true' ? 'INIT' : 'DISABLED' });

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
          // Normalize malformed keys before storing
          let normalized = normalizeReport(data as any) as Report;

          // Overlay row-based report_sections as canonical structured_data
          try {
            const { data: rowSections } = await supabase
              .from('report_sections')
              .select('id, title, section_type, structured_data')
              .eq('report_id', reportId);
            if (Array.isArray(rowSections) && normalized?.sections) {
              const byId = new Map(normalized.sections.map((s) => [s.id, s] as const));
              for (const row of rowSections) {
                const match = byId.get(row.id);
                if (match) {
                  match.structured_data = (row as any).structured_data && typeof (row as any).structured_data === 'object' ? (row as any).structured_data : {};
                  if (!match.sectionType && (row as any).section_type) match.sectionType = (row as any).section_type;
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ Overlay from report_sections failed (non-fatal):', e instanceof Error ? e.message : String(e));
          }

          setReport(normalized);
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
    // Normalize keys before saving, then clean for circular refs
    const normalized = normalizeReport(reportToSave) as Report;
    const cleaned = hasCircularReference(normalized) ? removeCircularReferences(normalized) : normalized;

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
      // Keep our client copy normalized
      setReport(normalized);
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
        let normalized = normalizeReport(data as any) as Report;
        try {
          const { data: rowSections } = await supabase
            .from('report_sections')
            .select('id, title, section_type, structured_data')
            .eq('report_id', reportId);
          if (Array.isArray(rowSections) && normalized?.sections) {
            const byId = new Map(normalized.sections.map((s) => [s.id, s] as const));
            for (const row of rowSections) {
              const match = byId.get(row.id);
              if (match) {
                match.structured_data = (row as any).structured_data && typeof (row as any).structured_data === 'object' ? (row as any).structured_data : {};
                if (!match.sectionType && (row as any).section_type) match.sectionType = (row as any).section_type;
              }
            }
          }
        } catch (e) {
          console.warn('⚠️ Overlay from report_sections failed (non-fatal):', e instanceof Error ? e.message : String(e));
        }
        setReport(normalized);
      }
    } catch (e) {
      console.error('Exception refreshing report:', e);
    }
  };

  // Realtime: subscribe to report_sections changes to reflect updates immediately
  useEffect(() => {
    if (!reportId) return;
    const DEBUG = process?.env?.NEXT_PUBLIC_DEBUG === 'true';
    const ENABLE_PG_CHANGES = process?.env?.NEXT_PUBLIC_SUPABASE_PG_CHANGES === 'true';
    // Default broadcast to ON unless explicitly disabled
    const ENABLE_BROADCAST = process?.env?.NEXT_PUBLIC_SUPABASE_BROADCAST !== 'false';
    // Track connection status for UI badge
    let setStatus: (next: any) => void = () => {};
    try { setStatus = (next: any) => setRealtime((prev) => ({ ...prev, ...next })); } catch {}
    try {
      let pgChannel: any = null
      if (ENABLE_PG_CHANGES) {
        pgChannel = supabase
          .channel(`report_sections:${reportId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'report_sections', filter: `report_id=eq.${reportId}` },
            (payload: any) => {
              try {
                const row = (payload.new || payload.old);
                if (!row?.id) return;
                setReport(prev => {
                  if (!prev) return prev;
                  const next = { ...prev, sections: [...prev.sections] } as Report;
                  const idx = next.sections.findIndex(s => s.id === row.id);
                  if (idx >= 0) {
                    const s = { ...next.sections[idx] };
                    if (row.structured_data && typeof row.structured_data === 'object') {
                      s.structured_data = row.structured_data as any;
                    }
                    if (!s.sectionType && row.section_type) s.sectionType = row.section_type;
                    if (row.title && row.title !== s.title) s.title = row.title;
                    next.sections[idx] = s;
                    if (DEBUG) {
                      console.log('🔔 Realtime update merged for section', s.id, { keys: Object.keys((s.structured_data || {}) as any) });
                    }
                  }
                  return next;
                });
              } catch (e) {
                console.warn('⚠️ Failed merging realtime update:', e);
              }
            }
          )
          .subscribe((status) => {
            if (DEBUG) console.log('🔔 report_sections realtime status:', status);
            try { setStatus({ pg: status }) } catch {}
          });
      }

      // Optional: broadcast channel for higher reliability (default ON)
      let bc: any = null
      if (ENABLE_BROADCAST) {
        try {
          bc = supabase
            .channel(`report:${reportId}`)
            .on('broadcast', { event: 'section_update' }, (payload: any) => {
              try {
                const { sectionId, fieldPath } = payload?.payload || payload
                if (!sectionId) return
                // On any broadcast, do a light refresh for the single section by merging row
                supabase
                  .from('report_sections')
                  .select('id, title, section_type, structured_data')
                  .eq('id', sectionId)
                  .single()
                  .then(({ data }) => {
                    if (!data) return
                    setReport(prev => {
                      if (!prev) return prev
                      const next = { ...prev, sections: [...prev.sections] } as Report
                      const idx = next.sections.findIndex(s => s.id === data.id)
                      if (idx >= 0) {
                        const s = { ...next.sections[idx] }
                        s.structured_data = (data.structured_data && typeof data.structured_data === 'object') ? (data.structured_data as any) : {}
                        if (!s.sectionType && (data as any).section_type) s.sectionType = (data as any).section_type
                        if (data.title && data.title !== s.title) s.title = data.title
                        next.sections[idx] = s
                        if (DEBUG) console.log('📡 Broadcast merged for section', s.id, { fieldPath })
                      }
                      return next
                    })
                  })
              } catch {}
            })
            .subscribe((status: string) => {
              if (DEBUG) console.log('📡 broadcast status:', status)
              try { setStatus({ broadcast: status }) } catch {}
            })
        } catch (e) {
          console.warn('⚠️ Broadcast subscribe failed (non-fatal):', e instanceof Error ? e.message : String(e))
          try { setStatus({ broadcast: 'FAILED' }) } catch {}
        }
      }

      return () => {
        try { if (pgChannel) supabase.removeChannel(pgChannel); } catch {}
        try { if (bc) supabase.removeChannel(bc) } catch {}
      };
    } catch (e) {
      console.warn('⚠️ Realtime subscription failed (non-fatal):', e instanceof Error ? e.message : String(e));
    }
  }, [supabase, reportId]);

  // Debug logging: snapshot + structured_data keys per section
  useEffect(() => {
    if (!report) return;
    const DEBUG = process?.env?.NEXT_PUBLIC_DEBUG === 'true';
    if (!DEBUG) return;

    try {
      console.log('🧭 ReportContext debug snapshot:', safeStringify(report));
    } catch {}

    try {
      const summary = (report.sections || []).map((s) => ({
        id: s.id,
        title: s.title,
        sectionType: (s as any).sectionType || (s as any).section_type,
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
