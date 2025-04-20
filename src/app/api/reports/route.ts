// FILE: src/app/api/reports/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })
  const { data, error } = await supabase
    .from('speech_language_reports')
    .select('id, report')
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = data.map(entry => ({
    id: entry.id,
    title: entry.report?.header?.studentInformation?.fullName ?? 'Untitled',
    type: 'speech-language',
    createDate: entry.report?.metadata?.createdAt ?? '',
    updateDate: entry.report?.metadata?.lastUpdated ?? '',
    studentName: entry.report?.header?.studentInformation?.fullName ?? '',
    studentAge: entry.report?.header?.studentInformation?.age ?? ''
  }))

  return NextResponse.json(result)
}