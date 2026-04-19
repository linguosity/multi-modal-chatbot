"use client";

import ReportView from './ReportView';
import { useReport } from '@/lib/context/ReportContext';

export default function Page() {
  const { report, loading } = useReport();
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[var(--paper)]">
        <div className="flex flex-col items-center gap-3">
          <div className="wf-spinner" />
          <div className="wf-sm">Loading report…</div>
        </div>
      </div>
    );
  }
  if (!report) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[var(--paper)] p-8">
        <div className="wf-box text-center max-w-md">
          <div className="wf-label mb-2">404</div>
          <h1 className="wf-heading mb-2" style={{ fontSize: 22 }}>Report not found.</h1>
          <p className="wf-sm">The requested report could not be loaded. It may have been deleted or you may not have access.</p>
        </div>
      </div>
    );
  }
  return <ReportView />;
}
