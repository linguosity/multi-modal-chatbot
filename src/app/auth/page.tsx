"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/app/auth/login-form"
import { RegisterForm } from "@/app/auth/signup-form"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabaseTypes'

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // More robust auth check with direct cookie inspection
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    let isMounted = true;

    const checkAuth = async () => {
      try {
        console.log("Auth page: Checking login status");
        
        // Create Supabase client
        const supabase = createClientComponentClient<Database>();
        
        // Strategy 1: Check for session
        const { data: sessionData } = await supabase.auth.getSession();
        
        // If we find an active session
        if (sessionData?.session) {
          console.log("Auth page: Found active session, redirecting to dashboard");
          
          if (isMounted) {
            // Clear loading state first (prevent flash of login form)
            setLoading(false);
            setAuthChecked(true);
            
            // Use a brief timeout to ensure UI updates
            redirectTimer = setTimeout(() => {
              if (isMounted) {
                router.replace('/dashboard');
              }
            }, 50);
          }
          return;
        }
        
        // Strategy 2: Try getUser but ignore expected errors
        try {
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user && isMounted) {
            console.log("Auth page: Found user via getUser, redirecting to dashboard");
            // Clear loading state first
            setLoading(false);
            setAuthChecked(true);
            
            redirectTimer = setTimeout(() => {
              if (isMounted) {
                router.replace('/dashboard');
              }
            }, 50);
            return;
          }
        } catch (userError) {
          // Ignore "Auth session missing" error - it's expected
          console.log("Auth page: No user found (expected)");
        }
        
        // Strategy 3: Check localStorage directly as a fallback
        if (typeof window !== 'undefined') {
          // Look for Supabase auth item in localStorage
          const localStorageKeys = Object.keys(localStorage);
          const supabaseAuthKey = localStorageKeys.find(key => 
            key.startsWith('sb-') && key.endsWith('-auth-token')
          );
          
          if (supabaseAuthKey && isMounted) {
            try {
              // Try to parse the auth data
              const authData = JSON.parse(localStorage.getItem(supabaseAuthKey) || '{}');
              
              if (authData?.access_token || authData?.refresh_token) {
                console.log("Auth page: Found auth token in localStorage, redirecting");
                
                // Clear loading state first
                setLoading(false);
                setAuthChecked(true);
                
                redirectTimer = setTimeout(() => {
                  if (isMounted) {
                    router.replace('/dashboard');
                  }
                }, 50);
                return;
              }
            } catch (storageError) {
              console.warn("Auth page: Error parsing localStorage auth data");
            }
          }
        }
        
        // Not authenticated, show login form
        if (isMounted) {
          console.log("Auth page: No authentication found, showing login form");
          setLoading(false);
          setAuthChecked(true);
        }
      } catch (e) {
        console.error("Auth page: Error in auth check:", e);
        
        if (isMounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };
    
    checkAuth();
    
    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(redirectTimer);
    };
  }, [router]);
  
  // If still checking auth, show loading indicator
  if (loading && !authChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="mb-4 text-xl font-medium">Linguosity</div>
        <div className="animate-pulse text-gray-500">Checking login status...</div>
      </div>
    );
  }
  
  // Login form (only shown if user is not authenticated)
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Column (Auth Form) */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Logo Area */}
        <div className="p-6 md:p-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/linguosity_logo.jpg"
              alt="Linguosity Logo"
              width={40}
              height={40}
              className="rounded-md object-contain"
            />
            <span className="font-medium text-xl">Linguosity</span>
          </Link>
        </div>
        
        {/* Card Container - No max-width constraint */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-12 py-8">
          <Card className="w-full shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-center">
                {view === 'login' ? 'Sign in' : 'Create account'}
              </CardTitle>
              <CardDescription className="text-center">
                {view === 'login' 
                  ? 'Enter your credentials below' 
                  : 'Enter your details to register'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-2 pb-6 px-6">
              {view === 'login' ? (
                <LoginForm onSwitchToSignup={() => setView('signup')} />
              ) : (
                <RegisterForm onSwitchToLogin={() => setView('login')} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Right Column (Image) */}
      <div className="hidden lg:block lg:w-1/2">
        <div className="relative w-full h-full">
          <Image
            src="/landing-page-image.png"
            alt="Linguosity platform illustration"
            fill
            sizes="50vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      </div>
    </div>
  );
}