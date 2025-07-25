import type { Metadata } from "next"
import "./globals.css"
import { createServerSupabase } from '@/lib/supabase/server';
import React from 'react';
import { UserSettingsProvider } from '@/lib/context/UserSettingsContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: "Linguosity",
  description: "A modular speech language report writer",
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  console.log('Rendering RootLayout');
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full m-0 flex flex-col bg-background text-foreground">
        
        <React.StrictMode>
          <UserSettingsProvider>
            <main className="flex-1">{children}</main>
          </UserSettingsProvider>
        </React.StrictMode>
      </body>
    </html>
  )
}
