'use client'

import { useReport } from '@/lib/context/ReportContext';
export function ColorSettings() {
  const { report } = useReport();

  if (!report) return null;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Section Colors (Simplified)</h2>
      <p>This is a simplified version to debug the build error.</p>
    </div>
  );
}