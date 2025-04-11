// src/components/auth/RegisterForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { signupUser } from "@/app/auth/actions"
import { Icons } from "@/components/ui/icons";
// --- Add Alert Imports ---
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
// --- End Alert Imports ---


const formSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email("Invalid email address"),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

interface RegisterFormProps {
    className?: string;
    onSwitchToLogin: () => void;
}

export function RegisterForm({ className, onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null) // Clear previous errors
    try {
      const formData = new FormData()
      formData.append('email', values.email)
      formData.append('password', values.password)
      formData.append('confirmPassword', values.confirmPassword)
      const result = await signupUser(formData)
      if (result.error) throw new Error(result.error) // Error is set in catch block
      // Consider redirecting based on result, e.g., if confirmationNeeded
      router.push("/auth/confirmation") // <<< Changed redirect path
    } catch (error: any) {
      setError(error.message || "Failed to sign up") // Set error state here
      console.error("Registration error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-6", className)}>
       {/* --- Display Error Alert --- */}
       {error && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Registration Failed</AlertTitle>
           <AlertDescription>
             {error}
           </AlertDescription>
         </Alert>
       )}
       {/* --- End Error Alert --- */}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {/* Email Field */}
          <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem className="grid gap-2"> <FormLabel>Email</FormLabel><FormControl><Input placeholder="name@example.com" {...field} disabled={isLoading} /></FormControl><FormMessage /> </FormItem>
          )}/>
          {/* Password Field */}
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem className="grid gap-2"> <FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} disabled={isLoading} /></FormControl><FormMessage /> </FormItem>
          )}/>
          {/* Confirm Password Field */}
          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem className="grid gap-2"> <FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} disabled={isLoading} /></FormControl><FormMessage /> </FormItem>
          )}/>
          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> } Create Account
          </Button>
        </form>
      </Form>
      {/* Switch to Login Button */}
      <div className="text-center text-sm">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className="font-medium text-primary underline underline-offset-4 hover:text-primary/90" disabled={isLoading}> Sign in </button>
      </div>
    </div>
  )
}