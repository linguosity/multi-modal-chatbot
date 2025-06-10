// src/components/auth/LoginForm.tsx (Assuming you moved it)
"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons" // Keep this for spinner (and fix google!)
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabaseTypes'
// Server action for login
import { loginUser } from "@/app/auth/actions"
// --- Add Alert Imports ---
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
// --- End Alert Imports ---

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onSuccess?: () => void
  onSwitchToSignup: () => void;
}

export function LoginForm({ className, onSuccess, onSwitchToSignup, ...props }: LoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null) // Clear previous errors
    try {
      console.log('Login attempt for:', values.email);
      
      // Create a FormData object for the server action
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('password', values.password);
      
      // Call the server action directly
      const result = await loginUser(formData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log('Login successful, redirecting to dashboard');
      
      // Small delay to ensure auth cookies are set, then force full page navigation
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.href = "/dashboard"
        }
      }, 100)
      
    } catch (error: any) {
      setError(error.message || "Failed to sign in") // Set error state here
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOAuthLogin() {
    setIsOAuthLoading(true);
    setError(null); // Clear previous errors
    try {
      console.log("Initiating Google OAuth flow");
      
      // Set the callback URL with origin
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log("Redirect URL:", redirectTo);
      
      // Start the OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { 
          redirectTo,
          // Add these parameters to help with possible certificate issues
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error("OAuth error:", error);
        throw error;
      }
      
      // If we have a URL to redirect to, use it
      if (data?.url) {
        console.log("OAuth flow started, redirecting to provider");
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("OAuth error:", error);
      setError(error.message || "Failed to sign in with Google");
      setIsOAuthLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {/* --- Display Error Alert --- */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Login Failed</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      {/* --- End Error Alert --- */}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {/* Email Field */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="name@example.com" type="email" autoCapitalize="none" autoComplete="email" autoCorrect="off" disabled={isLoading || isOAuthLoading} {...form.register("email")} />
            {form.formState.errors.email && (<p className="text-sm text-red-500">{form.formState.errors.email.message}</p>)}
          </div>
          {/* Password Field */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button variant="link" type="button" className="px-0 h-auto text-xs" onClick={() => router.push("/forgot-password")}> Forgot password? </Button>
            </div>
            <Input id="password" placeholder="••••••••" type="password" autoCapitalize="none" autoComplete="current-password" disabled={isLoading || isOAuthLoading} {...form.register("password")} />
            {form.formState.errors.password && (<p className="text-sm text-red-500">{form.formState.errors.password.message}</p>)}
          </div>
          {/* REMOVED old error display div */}
          {/* Submit Button */}
          <Button type="submit" disabled={isLoading || isOAuthLoading} className="w-full">
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />} Sign In
          </Button>
        </div>
      </form>
      {/* OAuth Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground"> Or continue with </span></div>
      </div>
      {/* Google OAuth Button */}
      <Button variant="outline" type="button" disabled={isLoading || isOAuthLoading} onClick={handleOAuthLogin}>
        {isOAuthLoading ? (<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />) : (<Icons.google className="mr-2 h-4 w-4" /> /* <<< Remember to fix this icon name */)}{" "} Google
      </Button>
      {/* Switch to Signup Button */}
      <div className="text-center text-sm"> Don&apos;t have an account?{" "} <button type="button" onClick={onSwitchToSignup} className="font-medium text-primary underline underline-offset-4 hover:text-primary/90" disabled={isLoading || isOAuthLoading} > Sign up </button> </div>
    </div>
  )
}