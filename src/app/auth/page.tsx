"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/app/auth/login-form"
import { RegisterForm } from "@/app/auth/signup-form"
import { ClientRedirectIfLoggedIn } from "./ClientRedirectIfLoggedIn"

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup'>('login');

  return (
    <>
      <ClientRedirectIfLoggedIn>
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
      </ClientRedirectIfLoggedIn>
    </>
  )
}