"use client"

import Image from "next/image"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/login-form"
import { TypingAnimation } from "@/components/auth/typing-animation"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
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
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-center">Sign in to your account</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
            <CardFooter className="border-t p-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary underline underline-offset-4 ml-1">
                Sign up
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium mb-2">AI-Powered Language Tools</h3>
            <div className="text-muted-foreground">
              <TypingAnimation 
                text="Linguosity uses advanced AI to help speech-language pathologists streamline report writing, assessment tools, and narrative generation. Save time and deliver better outcomes with our intelligent platform." 
              />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
      </div>
    </div>
  )
}
