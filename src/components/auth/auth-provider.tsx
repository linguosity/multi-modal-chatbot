"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    // Get initial session and refresh if needed
    const getInitialSession = async () => {
      try {
        console.log("Auth Provider: Getting initial session")
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting initial session:", error)
          throw error
        }
        
        if (session) {
          console.log("Auth Provider: Initial session found")
          setSession(session)
          setUser(session?.user ?? null)
          
          // Also verify with getUser for better confidence
          try {
            const { data, error: userError } = await supabase.auth.getUser()
            if (userError) {
              console.warn("Auth Provider: getUser error after getSession success:", userError)
            } else if (data?.user) {
              console.log("Auth Provider: User verified with getUser")
            }
          } catch (userError) {
            console.warn("Auth Provider: getUser exception:", userError)
          }
        } else {
          console.log("Auth Provider: No session found")
        }
      } catch (error) {
        console.error("Auth Provider: Error getting initial session:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    getInitialSession()
    
    // Set up auth listener with better logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth Provider: Auth state changed: ${event}`)
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
        
        // If signed out, make sure to refresh the page state
        if (event === 'SIGNED_OUT') {
          console.log("Auth Provider: User signed out, refreshing app state")
          router.refresh()
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  const signOut = async () => {
    try {
      console.log("Auth Provider: Signing out...");
      
      // Call the server API endpoint to handle cookie clearing
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important for cookies
      });
      
      // Also clear client-side auth state
      await supabase.auth.signOut();
      
      // Force refresh all browser data
      router.refresh();
      
      // Redirect to auth page
      router.push("/auth");
    } catch (error) {
      console.error("Auth Provider: Error in signOut process:", error);
      
      // Try to redirect anyway as a fallback
      router.push("/auth");
    }
  }
  
  const value = {
    user,
    session,
    isLoading,
    signOut,
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}