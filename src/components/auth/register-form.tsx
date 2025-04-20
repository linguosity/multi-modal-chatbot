// components/auth/register-form.tsx (or wherever it's located)
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
// Removed Link import as it's replaced by a button
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { signupUser } from "@/app/auth/actions" // Assuming this action exists
import { Icons } from "@/components/ui/icons"; // Import Icons if needed for spinner

const formSchema = z.object({
  // Removed name field for simplicity, add back if needed
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email("Invalid email address"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

// --- Add onSwitchToLogin to props ---
interface RegisterFormProps {
    className?: string;
    onSwitchToLogin: () => void; // Add this line
}

export function RegisterForm({ className, onSwitchToLogin }: RegisterFormProps) { // Destructure here
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('email', values.email)
      formData.append('password', values.password)
      formData.append('confirmPassword', values.confirmPassword)
      const result = await signupUser(formData)
      if (result.error) throw new Error(result.error)
      router.push("/register/confirmation") // Redirect on success
    } catch (error: any) {
      setError(error.message || "Failed to sign up")
      console.error("Registration error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Adjust layout if needed, removed outer div with space-y-6 to match LoginForm structure better
  return (
    <div className={cn("grid gap-6", className)}>
      {/* Removed extra title/description as it's handled by CardHeader in parent */}
      {/* <div className="space-y-2 text-center">...</div> */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}
      <Form {...form}>
        {/* Using grid gap-4 like LoginForm for consistency */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-2"> {/* Apply grid gap here */}
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="m@example.com"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="grid gap-2"> {/* Apply grid gap here */}
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="grid gap-2"> {/* Apply grid gap here */}
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> }
            Create Account
          </Button>
        </form>
      </Form>
       {/* --- Add Switch to Login --- */}
      <div className="text-center text-sm">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin} // Call the passed function
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
          disabled={isLoading} // Disable during loading
        >
          Sign in
        </button>
      </div>
       {/* --- End Switch to Login --- */}
    </div>
  )
}