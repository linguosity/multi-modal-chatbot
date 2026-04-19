'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [signInLoading, setSignInLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createBrowserSupabase()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/dashboard')
      } else {
        setLoading(false)
      }
    }
    checkUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="wf-spinner" />
      </div>
    )
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setSignInLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] p-4">
      <div className="w-full max-w-md">
        {/* Brand mark + heading */}
        <div className="text-center mb-8">
          <div className="mb-3 flex justify-center">
            <div
              className="wf-ico"
              style={{ background: 'var(--terracotta)', color: '#fff', width: 48, height: 48, fontSize: 26, fontFamily: 'var(--font-display)' }}
            >
              L
            </div>
          </div>
          <div className="wf-label mb-2">sign in</div>
          <h1 className="wf-heading" style={{ fontSize: 30 }}>Welcome to Linguosity.</h1>
          <p className="wf-sm mt-2">Speech-language evaluation platform for SLPs.</p>
        </div>

        {/* Sign-in card */}
        <div className="wf-box p-7">
          <GoogleSignInButton />

          <div className="wf-divider my-5 relative flex items-center">
            <div className="flex-1 h-px bg-[var(--line-2)]" />
            <span className="px-3 wf-sm bg-[var(--card-surface)]" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 10 }}>
              or with email
            </span>
            <div className="flex-1 h-px bg-[var(--line-2)]" />
          </div>

          {error && (
            <div className="wf-box terra mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--terracotta-ink)' }} />
              <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--terracotta-ink)' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="wf-label bold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@clinic.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[var(--line)] rounded-[3px] bg-[var(--card-surface)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="wf-label bold">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[var(--line)] rounded-[3px] bg-[var(--card-surface)] pr-10"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" style={{ color: 'var(--ink-3)' }} />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: 'var(--ink-3)' }} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="wf-btn primary w-full justify-center mt-2"
              disabled={signInLoading}
            >
              {signInLoading ? (
                <>
                  <div className="wf-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Signing in…
                </>
              ) : (
                'Sign in →'
              )}
            </button>
          </form>

          <div className="wf-sm text-center mt-5">
            Don't have an account? Contact your administrator.
          </div>
        </div>
      </div>
    </div>
  )
}
