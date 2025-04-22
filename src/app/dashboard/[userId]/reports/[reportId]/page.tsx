'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useParams } from 'next/navigation';

// Stub re-export for backward compatibility
export default function LegacyReportPage() {
  const params = useParams();
  const reportId = params.reportId;
  
  useEffect(() => {
    // Redirect to the new static route
    redirect(`/dashboard/reports/${reportId}`);
  }, [reportId]);
  
  // Return a loading state for the split second before redirect happens
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
      <p>Please wait while you are redirected to the new location.</p>
    </div>
  );
}