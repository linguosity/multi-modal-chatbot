'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface UserSettings {
  preferredState: string
  evaluatorName: string
  evaluatorCredentials: string
  schoolName: string
  showToastNotifications: boolean;
}

interface UserSettingsContextType {
  settings: UserSettings
  updateSettings: (newSettings: Partial<UserSettings>) => void
  loading: boolean
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

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('linguosity-user-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save settings to localStorage when they change
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    try {
      localStorage.setItem('linguosity-user-settings', JSON.stringify(updatedSettings))
    } catch (error) {
      console.error('Error saving user settings:', error)
    }
  }

  return (
    <UserSettingsContext.Provider value={{ settings, updateSettings, loading }}>
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