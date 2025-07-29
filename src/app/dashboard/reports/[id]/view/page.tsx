// src/app/dashboard/reports/[id]/view/page.tsx
import { getReportForView } from '@/lib/server/getReportForView';
import ReportView from './ReportView';

type Params = { id: string };

export default async function Page({
  params                      // 👈 promise
}: {
  params: Promise<Params>;    // 👈 note Promise
}) {
  const { id } = await params;          // 👈 await it
  const report = await getReportForView(id);

  return <ReportView report={report} />;
}