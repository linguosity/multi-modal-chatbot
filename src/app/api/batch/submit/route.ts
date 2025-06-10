// src/app/api/batch/submit/route.ts
'use server'

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabaseTypes'
import { normalizeInput } from '@/lib/report-utilities';
import { generateMCPInstructions, getFullSchemaOutline } from '@/lib/batchApiHelper'
import { processReportWithTextEditor } from '@/lib/claudeTextEditorHelper'

/**
 * Safely parse JSON body, returning `null` on failure.
 */
async function safeJsonParse<T>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const requestId = uuidv4()
  console.log(`[${requestId}] Batch submit received`)

  // — Initialize Supabase with SSR cookie support —
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // In Server Components, setAll may be a no-op
          }
        },
      },
    }
  )

  // Debugging outputs so we can see what's happening in the test
  console.log(`[${requestId}] Checking auth...`);

  // — Authenticate user —
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log(`[${requestId}] Auth result:`, user ? `User ${user.id}` : 'No user', authError);

  if (authError || !user) {
    console.error(`[${requestId}] Unauthorized`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // — Safely parse request body —
  const body = await safeJsonParse<{
    input?: string
    pdfData?: unknown
    reportId?: string
  }>(request)
  if (!body) {
    console.error(`[${requestId}] Invalid JSON body`)
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }
  const { input, pdfData, reportId, currentReport } = body

  // — Validate presence of required data —
  if (!input && !pdfData) {
    console.warn(`[${requestId}] Missing both text input and PDF data`)
    return NextResponse.json(
      { error: 'Missing text input or PDF data' },
      { status: 400 }
    )
  }

  if (!currentReport) {
    console.warn(`[${requestId}] Missing current report data`)
    return NextResponse.json(
      { error: 'Current report data is required' },
      { status: 400 }
    )
  }

  console.log(`[${requestId}] Processing input of length: ${input?.length || 'N/A (PDF mode)'}`)

  try {
    // — Process with Claude Text Editor Tool —
    let updatedReport;

import { DEFAULT_ANTHROPIC_MODEL } from '@/lib/config';
// src/app/api/batch/submit/route.ts
'use server'

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabaseTypes'
import { normalizeInput } from '@/lib/report-utilities';
import { generateMCPInstructions, getFullSchemaOutline } from '@/lib/batchApiHelper'
import { processReportWithTextEditor } from '@/lib/claudeTextEditorHelper'

/**
 * Safely parse JSON body, returning `null` on failure.
 */
async function safeJsonParse<T>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const requestId = uuidv4()
  console.log(`[${requestId}] Batch submit received`)

  // — Initialize Supabase with SSR cookie support —
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // In Server Components, setAll may be a no-op
          }
        },
      },
    }
  )

  // Debugging outputs so we can see what's happening in the test
  console.log(`[${requestId}] Checking auth...`);
  
  // — Authenticate user —
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  
  console.log(`[${requestId}] Auth result:`, user ? `User ${user.id}` : 'No user', authError);
  
  if (authError || !user) {
    console.error(`[${requestId}] Unauthorized`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // — Safely parse request body —
  const body = await safeJsonParse<{
    input?: string
    pdfData?: unknown
    reportId?: string
  }>(request)
  if (!body) {
    console.error(`[${requestId}] Invalid JSON body`)
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }
  const { input, pdfData, reportId, currentReport } = body

  // — Validate presence of required data —
  if (!input && !pdfData) {
    console.warn(`[${requestId}] Missing both text input and PDF data`)
    return NextResponse.json(
      { error: 'Missing text input or PDF data' },
      { status: 400 }
    )
  }

  if (!currentReport) {
    console.warn(`[${requestId}] Missing current report data`)
    return NextResponse.json(
      { error: 'Current report data is required' },
      { status: 400 }
    )
  }

  console.log(`[${requestId}] Processing input of length: ${input?.length || 'N/A (PDF mode)'}`)

  try {
    // — Process with Claude Text Editor Tool —
    let updatedReport;
    
    if (input) {
      console.log(`[${requestId}] Using text editor tool for text input`)
      updatedReport = await processReportWithTextEditor(input, currentReport, DEFAULT_ANTHROPIC_MODEL)
    } else if (pdfData) {
      console.log(`[${requestId}] Using text editor tool for PDF data`)
      // For PDF data, we'll process it as text input to the text editor
      updatedReport = await processReportWithTextEditor(
        `PDF Content: ${pdfData}`, 
        currentReport, 
        DEFAULT_ANTHROPIC_MODEL
      )
    }

    if (!updatedReport) {
      throw new Error('Failed to process report with text editor tool')
    }

    console.log(`[${requestId}] Report successfully updated with text editor tool`)

    // — Store updated report in database —
    try {
      if (reportId && reportId !== 'new') {
        // Update existing report
        const { error: reportError } = await supabase
          .from('speech_language_reports')
          .update({
            report: updatedReport,
            processing_status: 'completed',
            last_updated: new Date().toISOString()
          })
          .eq('id', reportId)
          .eq('user_id', user.id)

        if (reportError) {
          console.warn(`[${requestId}] Failed to update report in database:`, reportError)
          // Continue anyway - we have the updated report to return
        } else {
          console.log(`[${requestId}] Successfully updated report ${reportId} in database`)
        }
      }
    } catch (dbError) {
      console.warn(`[${requestId}] Database update failed:`, dbError)
      // Don't fail the request for DB issues - we have the updated report
    }

    return NextResponse.json({ 
      status: 'completed', 
      requestId,
      report: updatedReport,
      message: 'Report updated successfully using text editor tool'
    })

  } catch (error) {
    console.error(`[${requestId}] Batch processing failed:`, error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId 
      },
      { status: 500 }
    )
  }
}