'use client'

import { NavigationProvider } from '@/lib/context/NavigationContext';

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
        {children}
    </NavigationProvider>
  );
}


