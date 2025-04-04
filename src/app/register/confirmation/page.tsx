"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function RegistrationConfirmationPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image
          src="/linguosity_logo.jpg"
          alt="Linguosity Logo"
          width={40}
          height={40}
          className="rounded-md object-contain"
        />
        <span className="font-medium text-xl">Linguosity</span>
      </Link>
      
      <Card className="w-full max-w-md mx-auto animate-fade-up">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex justify-center mb-2">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold text-center">Registration Successful</CardTitle>
          <CardDescription className="text-center">
            Your account has been created successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <p className="text-center text-muted-foreground">
            Please check your email for a verification link. Once verified, you can log in to your account.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center p-6 pt-4">
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}