"use client";

import ReportView from './ReportView';
import { useReport } from '@/lib/context/ReportContext';

export default function Page() {
  const { report, loading } = useReport();
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }
  if (!report) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Report Not Found</h1>
        <p className="text-gray-600">The requested report could not be loaded.</p>
      </div>
    );
  }
  return <ReportView />;
}
