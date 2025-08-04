'use client';

import { ReportProvider } from '@/lib/context/ReportContext';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { User, LayoutDashboard, FilePlus } from 'lucide-react';
import ReportDependentSidebarLinks from '@/components/ReportDependentSidebarLinks';
import { Drawer } from '@/components/ui/Drawer';
import { ColorSettings } from '@/components/ColorSettings';
import { SignOutButton } from '@/components/ui/SignOutButton';
import { Breadcrumb, useBreadcrumbs } from '@/components/ui/breadcrumb';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const pathname = usePathname();
  
  // Custom labels for better breadcrumb display
  const breadcrumbLabels = {
    'dashboard': 'Dashboard',
    'reports': 'Reports',
    'templates': 'Templates',
    'new': 'New Report',
    'view': 'View Report',
    'edit': 'Edit Report'
  };
  
  const breadcrumbItems = useBreadcrumbs(pathname, breadcrumbLabels);

  return (
    <ReportProvider>
      <div className="flex h-screen bg-gray-50">
        {/* ── SIDEBAR ── */}
        <div className="flex flex-col justify-between w-16 border-e border-gray-100 bg-white">
          {/* Top group: logo + nav */}
          <div>
            <div className="inline-flex h-16 w-full items-center justify-center">
              {/* wrapper to control size */}
              <div className="h-8 w-8 relative">
                <Image
                  src="/images/logo-animation.gif"
                  alt="Linguosity logo"
                  fill
                  sizes="32px"
                  className="object-contain text-teal-600"
                  unoptimized
                />
              </div>
            </div>
            <div className="border-t border-gray-100 px-2">
              <div className="py-4 space-y-2">
                <Link href="/dashboard" className="group flex justify-center rounded-sm bg-blue-50 px-2 py-1.5 text-blue-700">
                  <LayoutDashboard className="size-5 opacity-75" />
                  <span
                    className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
                  >
                    Dashboard
                  </span>
                </Link>
                <Link href="/dashboard/reports/new" className="group flex justify-center rounded-sm px-2 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                  <FilePlus className="size-5 opacity-75" />
                  <span
                    className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
                  >
                    New Report
                  </span>
                </Link>
                <ReportDependentSidebarLinks />
              </div>

              </div>
            </div>

          <div className="sticky inset-x-0 bottom-0 border-t border-gray-100 bg-white p-2">
            <button
              onClick={() => setShowSettingsDrawer(true)}
              className="group relative flex w-full justify-center rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <User className="size-5 opacity-75" />
              <span
                className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
              >
                Profile
              </span>
            </button>
            <div className="group relative flex w-full justify-center rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700">
              <SignOutButton />
            </div>
          </div>
        </div>

        {/* ── MAIN ── */}
        <main className="flex-1 overflow-y-auto">
          {/* Breadcrumb Navigation - Hide on report pages as they have their own detailed breadcrumbs */}
          {breadcrumbItems.length > 1 && !pathname.includes('/reports/') && (
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <Breadcrumb items={breadcrumbItems} showHome={false} />
            </div>
          )}
          
          <div className="p-6">
            {children}
          </div>
        </main>

        <Drawer isOpen={showSettingsDrawer} onClose={() => setShowSettingsDrawer(false)}>
          <ColorSettings />
        </Drawer>
      </div>
    </ReportProvider>
  );
}
