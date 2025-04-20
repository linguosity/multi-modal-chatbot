// FILE: src/app/reports/dummy/page.tsx
'use client';

import dynamic from 'next/dynamic';

const ReportEditor = dynamic(() => import('@/components/reports/ReportEditor'), {
  ssr: false,
});

export default function DummyReportPage() {
  return <ReportEditor />;
}