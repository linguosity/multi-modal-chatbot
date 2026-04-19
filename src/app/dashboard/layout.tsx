'use client';

import { ReportProvider } from '@/lib/context/ReportContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { LinguosityChat } from '@/components/LinguosityChat';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReportProvider>
      <div className="flex h-screen bg-[#f7f5f0]">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <LinguosityChat />
    </ReportProvider>
  );
}

