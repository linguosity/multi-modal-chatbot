"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname, useParams } from "next/navigation";

export default function UserStoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const userId = params?.userId as string;
  const pathname = usePathname();

  // Check if we're on a story detail page (e.g. /dashboard/[userId]/stories/[storyId])
  const isStoryDetail = pathname.includes("/stories/") && pathname.split("/").length > 4;
  
  // Get story ID from URL if on a detail page
  let storyId: string | null = null;
  if (isStoryDetail) {
    const pathParts = pathname.split("/");
    storyId = pathParts[pathParts.length - 1];
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky top bar with border, matching the Reports layout style */}
      <div className="sticky top-0 z-30 flex h-12 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Breadcrumb className="mb-1">
          <BreadcrumbList>
            {/* "Home" link, or link directly to your main dashboard if you prefer */}
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            {/* Main "Narratively" link */}
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/${userId}/stories`}>
                Narratively
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* If on a detail page, show an extra breadcrumb */}
            {isStoryDetail && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Narrative Details</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main content area */}
      <div className="relative flex-1 overflow-auto px-4 md:px-6 py-4">
        {children}
      </div>
    </div>
  );
}