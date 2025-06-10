'use client';

import React from 'react';
import { WordListsProvider } from '@/components/contexts/wordlists-context';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname, useParams } from "next/navigation";

export default function ListsLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const params = useParams();
  const userId = params?.userId as string;
  const pathname = usePathname();

  // Check if we're on a word list detail page (e.g. /dashboard/[userId]/lists/[listId])
  const isListDetail = pathname.includes("/lists/") && pathname.split("/").length > 4;
  
  // Get list ID from URL if on a detail page
  let listId: string | null = null;
  if (isListDetail) {
    const pathParts = pathname.split("/");
    listId = pathParts[pathParts.length - 1];
  }

  return (
    <WordListsProvider>
      <div className="flex flex-col h-full">
        {/* Sticky top bar with border, matching the Reports layout style */}
        <div className="sticky top-0 z-30 flex h-12 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Breadcrumb className="mb-1">
            <BreadcrumbList>
              {/* "Home" link */}
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              {/* Main "Word Lists" link */}
              <BreadcrumbItem>
                <BreadcrumbLink href={`/dashboard/${userId}/lists`}>
                  Word Lists
                </BreadcrumbLink>
              </BreadcrumbItem>

              {/* If on a detail page, show an extra breadcrumb */}
              {isListDetail && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>List Details</BreadcrumbPage>
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
    </WordListsProvider>
  );
}