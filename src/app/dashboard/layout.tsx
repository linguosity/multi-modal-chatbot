'use client';

import { ReportProvider } from '@/lib/context/ReportContext';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { ColorSettings } from '@/components/ColorSettings';
import { SignOutButton } from '@/components/ui/SignOutButton';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

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
                />
              </div>
            </div>
            <div className="border-t border-gray-100 px-2">
              <div className="py-4">
                <Link href="/dashboard" className="group flex justify-center rounded-sm bg-blue-50 px-2 py-1.5 text-blue-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5 opacity-75"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span
                    className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible"
                  >
                    Dashboard
                  </span>
                </Link>
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
