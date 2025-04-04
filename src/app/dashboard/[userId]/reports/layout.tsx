'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname, useParams } from "next/navigation";

export default function UserReportsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const userId = params?.userId as string;
  const pathname = usePathname();
  const isReportDetail = pathname.includes("/reports/") && pathname.split("/").length > 4;

  return (
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-30 flex h-12 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Breadcrumb className="mb-1">
            <BreadcrumbList>
              {/* "Home" link */}
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              {/* Main "Reports" link */}
              <BreadcrumbItem>
                <BreadcrumbLink href={`/dashboard/${userId}/reports`}>My Reports</BreadcrumbLink>
              </BreadcrumbItem>
              
              {/* If on a detail page, show an extra breadcrumb */}
              {isReportDetail && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Report Details</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          {/*<h1 className="text-xl font-bold">
            {isReportDetail ? "Edit Report" : "My Reports"}
          </h1>*/}
        </div>
        <div className="relative flex-1 overflow-auto px-4 md:px-6 py-4">
          {children}
        </div>
      </div>
  );
}