'use client';

import { ReportSidebar } from "@/components/report-sidebar";
import { ReportEditSidebar } from "@/components/report-edit-sidebar";
import { 
  SidebarInset, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { usePathname } from 'next/navigation';
import { ReportsProvider, useReports } from "@/components/contexts/reports-context";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function ReportsContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditPage = pathname?.includes('/edit');
  const isReportDetailPage = pathname?.includes('/reports/') && !pathname?.endsWith('/reports');
  
  // Use the context for sidebar data
  const { reportSections, sectionGroups, currentSectionId, handleSectionChange } = useReports();
  
  return (
    <div className="flex min-h-screen">
      {isReportDetailPage && (
        isEditPage ? (
          <ReportEditSidebar 
            sections={reportSections}
            currentSectionId={currentSectionId}
            onSectionChange={handleSectionChange}
          />
        ) : (
          pathname?.includes('/text-editor-test') ? 
            // For text-editor-test page, use the new sectionGroups property
            <ReportSidebar 
              sectionGroups={sectionGroups}
              sections={reportSections.length > 0 ? reportSections : undefined} 
            />
          :
            // For other report pages, use the traditional sections property
            <ReportSidebar sections={reportSections} />
        )
      )}
      <SidebarInset>
        <div className="flex flex-col h-full">
          <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1 flex justify-between items-center">
              <div>
                <Breadcrumb className="mb-1">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/reports">Reports</BreadcrumbLink>
                    </BreadcrumbItem>
                    {pathname?.includes('/text-editor-test') && (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>Text Editor Test</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-xl font-bold">{isEditPage ? 'Edit Report' : (isReportDetailPage ? (pathname?.includes('/text-editor-test') ? 'Data Structure Editing' : 'Report') : 'Reports')}</h1>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 md:p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <ReportsProvider>
        <ReportsContent>
          {children}
        </ReportsContent>
      </ReportsProvider>
    </SidebarProvider>
  );
}