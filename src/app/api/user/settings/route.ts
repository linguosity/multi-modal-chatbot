import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'

type UpsertSettingsBody = {
  evaluator_name?: string
  evaluator_credentials?: string
  preferred_state?: string
  asha_number?: string
  state_license_number?: string
  show_toast_notifications?: boolean
  schoolSites?: Array<{ id?: string; name: string; is_default?: boolean }>
  defaultSiteId?: string | null
}

export async function GET() {
  const supabase = await createRouteSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Settings row
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // School sites
  const { data: sites } = await supabase
    .from('user_school_sites' as any)
    .select('id, name, is_default, created_at, updated_at')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  return NextResponse.json({
    success: true,
    settings: settings || null,
    schoolSites: sites || []
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createRouteSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as UpsertSettingsBody

  // Upsert settings row
  const settingsPayload: Record<string, any> = {
    user_id: user.id,
  }
  const allowed = [
    'evaluator_name', 'evaluator_credentials', 'preferred_state',
    'asha_number', 'state_license_number', 'show_toast_notifications'
  ] as const
  for (const k of allowed) {
    if (body[k] !== undefined) settingsPayload[k] = body[k]
  }

  if (Object.keys(settingsPayload).length > 1) {
    const { error: upsertErr } = await supabase
      .from('user_settings')
      .upsert(settingsPayload, { onConflict: 'user_id' })
    if (upsertErr) {
      return NextResponse.json({ success: false, error: upsertErr.message }, { status: 400 })
    }
  }

  // Upsert school sites if provided
  const sites = body.schoolSites || []
  if (Array.isArray(sites) && sites.length > 0) {
    const inserts: any[] = []
    const updates: any[] = []
    for (const s of sites) {
      if (!s.name || !s.name.trim()) continue
      if (s.id) {
        updates.push({ id: s.id, user_id: user.id, name: s.name.trim(), is_default: !!s.is_default })
      } else {
        inserts.push({ user_id: user.id, name: s.name.trim(), is_default: !!s.is_default })
      }
    }
    if (inserts.length) {
      const { error } = await supabase.from('user_school_sites' as any).insert(inserts)
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    if (updates.length) {
      for (const u of updates) {
        const { error } = await supabase
          .from('user_school_sites' as any)
          .update({ name: u.name, is_default: u.is_default })
          .eq('id', u.id)
          .eq('user_id', user.id)
        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }
    }
  }

  // Handle explicit default site selection
  const defaultSiteId = body.defaultSiteId
  if (defaultSiteId) {
    const { error: setDefErr } = await supabase
      .from('user_school_sites' as any)
      .update({ is_default: true })
      .eq('id', defaultSiteId)
      .eq('user_id', user.id)
    if (setDefErr) return NextResponse.json({ success: false, error: setDefErr.message }, { status: 400 })
    // The DB trigger enforces single default per user
  }

  // Return latest
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: sitesOut } = await supabase
    .from('user_school_sites' as any)
    .select('id, name, is_default, created_at, updated_at')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  return NextResponse.json({ success: true, settings, schoolSites: sitesOut || [] })
}

