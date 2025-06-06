"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Import your actual form components (assuming they are modified as per previous step)
import { LoginForm } from "@/app/auth/login-form" // Ensure path is correct
import { RegisterForm } from "@/app/auth/signup-form" // Ensure path is correct

// Rename the component if you renamed the file (e.g., AuthPage)
export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup'>('login');

  return (
    <div className="grid min-h-svh lg:grid-cols-2">

      {/* Left Column (Combined Auth Form) */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Logo */}
        <div className="flex justify-center md:justify-start">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/linguosity_logo.jpg" // Logo image
              alt="Linguosity Logo"
              width={40}
              height={40}
              className="rounded-md object-contain"
            />
            <span className="font-medium text-xl">Linguosity</span>
          </Link>
        </div>
        
        {/* Centered Auth Card */}
        <div className="flex flex-1 items-center justify-center py-12">
          <Card className="w-full max-w-xsm mx-auto">
            {/* Conditionally render Header based on view */}
            {view === 'login' ? (
               <CardHeader>
                 <CardTitle className="text-2xl font-semibold text-center">Sign in</CardTitle>
                 <CardDescription className="text-center pt-1">Enter your credentials below</CardDescription>
               </CardHeader>
            ) : (
               <CardHeader>
                 <CardTitle className="text-2xl font-semibold text-center">Create account</CardTitle>
                 <CardDescription className="text-center pt-1">Enter your details to register</CardDescription>
               </CardHeader>
            )}

            {/* Using min-height helps prevent jarring size changes */}
            <CardContent className="pt-2 pb-4 px-6 min-h-[420px]"> {/* Adjust min-height based on form sizes */}
              {view === 'login' ? (
                // Pass the function to switch view TO signup
                <LoginForm onSwitchToSignup={() => setView('signup')} />
              ) : (
                // Pass the function to switch view TO login
                <RegisterForm onSwitchToLogin={() => setView('login')} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column (Full Height Image) */}
      {/* Using absolute positioning for the image - might be more reliable than fill */}
      <div className="relative hidden lg:block h-full overflow-hidden">
         <Image
            src="/landing-page-image.png" // Ensure this is in /public
            alt="Linguosity platform illustration"
            layout="fill" // Use layout="fill" OR absolute positioning below
            objectFit="cover" // Use objectFit with layout="fill"
            priority
            // Alternatively, use absolute positioning (remove layout/objectFit):
            // className="absolute inset-0 w-full h-full object-cover"
         />
         {/* Optional: Add a subtle overlay if needed */}
         {/* <div className="absolute inset-0 bg-black/10" /> */}
      </div>
    </div>
  )
}