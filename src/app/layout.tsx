import type { Metadata } from "next"
import { Inconsolata, Gloock, Caveat } from 'next/font/google'
import "./globals.css"

const inconsolata = Inconsolata({ subsets: ['latin'], variable: '--font-mono' })
const gloock = Gloock({ weight: '400', subsets: ['latin'], variable: '--font-display' })
const caveat = Caveat({ weight: ['500', '700'], subsets: ['latin'], variable: '--font-hand' })
import { createSupabaseServerClient } from '@/lib/supabase/server';
import React from 'react';
import { UserSettingsProvider } from '@/lib/context/UserSettingsContext';
import { RecentUpdatesProvider } from '@/lib/context/RecentUpdatesContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import { FeedbackProvider } from '@/lib/context/FeedbackContext';
import { ProgressToastProvider } from '@/lib/context/ProgressToastContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: "Linguosity",
  description: "A modular speech language report writer",
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${inconsolata.variable} ${gloock.variable} ${caveat.variable} h-full scroll-smooth`}>
      <body className="h-full m-0 flex flex-col bg-background text-foreground">
        
        <UserSettingsProvider>
          <RecentUpdatesProvider>
            <ToastProvider>
              <FeedbackProvider>
                <ProgressToastProvider>
                  <main className="flex-1">{children}</main>
                </ProgressToastProvider>
              </FeedbackProvider>
            </ToastProvider>
          </RecentUpdatesProvider>
        </UserSettingsProvider>
      </body>
    </html>
  )
}
