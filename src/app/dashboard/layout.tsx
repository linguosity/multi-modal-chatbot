'use client';

import { ReportProvider } from '@/lib/context/ReportContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { LinguosityChat } from '@/components/LinguosityChat';
import { WorkflowStepper } from '@/components/WorkflowStepper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReportProvider>
      <div className="flex h-screen bg-[#f7f5f0]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          {/* Stepper renders itself conditionally — visible only inside a
              report, invisible on /dashboard, /tools, /templates, etc. */}
          <WorkflowStepper />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <LinguosityChat />
    </ReportProvider>
  );
}

