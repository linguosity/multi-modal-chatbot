// src/app/api/reports/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabaseTypes'

export async function GET(req: Request) {
  const url        = new URL(req.url)
  const reportId   = url.searchParams.get('id')      // optional specific report
  // Initialize Supabase client with manual cookie handling (v0.6.1)
  const cookieStore = await cookies()
  const supabase    = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Read all Supabase cookies from Next.js
          return cookieStore.getAll().map(c => ({ name: c.name, value: c.value! }))
        },
        setAll(toSet) {
          // Write cookies back (e.g. after refresh)
          toSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set({ name, value, ...(options ?? {}) })
            } catch {
              // In Server Components, cookieStore.set may be read-only—ignore safely
            }
          })
        },
      },
    }
  )

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const authenticatedUserId = user.id

  // If a specific report ID is given, fetch that one
  if (reportId) {
    const { data, error } = await supabase
      .from('speech_language_reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', authenticatedUserId)
      .single()

    if (error) {
      console.error('Error fetching report by ID:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Detailed logging
    console.log('Fetched report (by ID):', JSON.stringify(data, null, 2))

    // Return full report row
    return NextResponse.json(data)
  }

  // Otherwise, fetch list of all reports for this user
  const { data, error } = await supabase
    .from('speech_language_reports')
    .select('id, report')
    .eq('user_id', authenticatedUserId)

  if (error) {
    console.error('Error fetching reports list:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform for list view
  const result = data.map(entry => ({
    id: entry.id,
    title: entry.report?.header?.studentInformation?.fullName ?? 'Untitled',
    type: 'speech-language',
    createDate: entry.report?.metadata?.createdAt ?? '',
    updateDate: entry.report?.metadata?.lastUpdated ?? '',
    studentName: entry.report?.header?.studentInformation?.fullName ?? '',
    studentAge: entry.report?.header?.studentInformation?.age ?? '',
  }))

  return NextResponse.json(result)
}