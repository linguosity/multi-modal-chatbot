"use client"

import Image from "next/image"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
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
              <CardTitle className="text-2xl font-semibold text-center">Create an account</CardTitle>
              <CardDescription className="text-center">
                Enter your information to create your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm />
            </CardContent>
            <CardFooter className="border-t p-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline underline-offset-4 ml-1">
                Sign in
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
          <div className="animate-fade-up rounded-lg bg-background/80 p-6 backdrop-blur-sm max-w-md">
            <blockquote className="space-y-2">
              <p className="text-lg">
                "Linguosity has revolutionized how I write and manage my speech-language reports. What used to take hours now takes minutes."
              </p>
              <footer className="text-sm text-muted-foreground">
                — Sarah T., Speech-Language Pathologist
              </footer>
            </blockquote>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
      </div>
    </div>
  )
}