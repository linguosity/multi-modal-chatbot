// File: src/app/auth/ClientRedirectIfLoggedIn.tsx
'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ClientRedirectIfLoggedIn({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Use the existing supabase client
    supabase.auth.getSession().then(({ data }) => {
      console.log('[ClientRedirect] session data:', data.session);
      if (data.session) {
        console.log('[ClientRedirect] redirecting to /dashboard');
        router.replace('/dashboard');
      } else {
        console.log('[ClientRedirect] no session, rendering auth UI');
        setChecked(true);
      }
    });
  }, [router]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Checking authentication…</div>
      </div>
    );
  }

  return <>{children}</>;
}