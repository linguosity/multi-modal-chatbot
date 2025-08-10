'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SchoolSite {
  id: string
  name: string
  is_default?: boolean
}

interface UserSettings {
  preferredState: string
  evaluatorName: string
  evaluatorCredentials: string
  schoolName: string
  showToastNotifications: boolean;
}

interface UserSettingsContextType {
  settings: UserSettings
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>
  loading: boolean
  // Multi-site support
  schoolSites: SchoolSite[]
  addSchoolSite: (name: string, makeDefault?: boolean) => Promise<void>
  setDefaultSite: (siteId: string) => Promise<void>
  refresh: () => Promise<void>
}

const defaultSettings: UserSettings = {
  preferredState: 'California',
  evaluatorName: '',
  evaluatorCredentials: '',
  schoolName: '',
  showToastNotifications: true,
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [schoolSites, setSchoolSites] = useState<SchoolSite[]>([])

  // Load settings from API (with localStorage fallback)
  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/settings', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        const api = json.settings || {}
        const sites: SchoolSite[] = json.schoolSites || []

        setSchoolSites(sites)

        const defaultSite = sites.find(s => s.is_default) || sites[0]
        setSettings({
          preferredState: api.preferred_state || defaultSettings.preferredState,
          evaluatorName: api.evaluator_name || '',
          evaluatorCredentials: api.evaluator_credentials || '',
          schoolName: defaultSite ? defaultSite.name : (api.school_name || ''),
          showToastNotifications: typeof api.show_toast_notifications === 'boolean' ? api.show_toast_notifications : defaultSettings.showToastNotifications,
        })
        try { localStorage.setItem('linguosity-user-settings', JSON.stringify({
          preferredState: api.preferred_state,
          evaluatorName: api.evaluator_name,
          evaluatorCredentials: api.evaluator_credentials,
          schoolName: defaultSite ? defaultSite.name : (api.school_name || ''),
          showToastNotifications: api.show_toast_notifications,
        })) } catch {}
      } else {
        // fallback to localStorage
        const saved = localStorage.getItem('linguosity-user-settings')
        if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) })
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
      const saved = localStorage.getItem('linguosity-user-settings')
      if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  // Save settings via API, persist locally for quick access
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    try { localStorage.setItem('linguosity-user-settings', JSON.stringify(updated)) } catch {}

    try {
      const body: any = {
        evaluator_name: updated.evaluatorName,
        evaluator_credentials: updated.evaluatorCredentials,
        preferred_state: updated.preferredState,
        show_toast_notifications: updated.showToastNotifications,
      }
      const res = await fetch('/api/user/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) console.warn('Failed to persist user settings')
    } catch (e) {
      console.error('Error saving user settings:', e)
    }
  }

  const addSchoolSite = async (name: string, makeDefault?: boolean) => {
    const payload: any = { schoolSites: [{ name, is_default: !!makeDefault }] }
    const res = await fetch('/api/user/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      await refresh()
    } else {
      console.warn('Failed to add school site')
    }
  }

  const setDefaultSite = async (siteId: string) => {
    const res = await fetch('/api/user/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ defaultSiteId: siteId }) })
    if (res.ok) {
      await refresh()
    } else {
      console.warn('Failed to set default site')
    }
  }

  return (
    <UserSettingsContext.Provider value={{ settings, updateSettings, loading, schoolSites, addSchoolSite, setDefaultSite, refresh }}>
      {children}
    </UserSettingsContext.Provider>
  )
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider')
  }
  return context
}
