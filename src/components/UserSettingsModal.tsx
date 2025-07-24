'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Settings } from 'lucide-react'
import { useUserSettings } from '@/lib/context/UserSettingsContext'
import { getAvailableStates } from '@/lib/structured-schemas'

interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { settings, updateSettings } = useUserSettings()
  const [localSettings, setLocalSettings] = useState(settings)
  const availableStates = getAvailableStates()

  if (!isOpen) return null

  const handleSave = () => {
    updateSettings(localSettings)
    onClose()
  }

  const handleCancel = () => {
    setLocalSettings(settings) // Reset to original settings
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">User Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* State Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred State
            </label>
            <select
              value={localSettings.preferredState}
              onChange={(e) => setLocalSettings({ ...localSettings, preferredState: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This will determine which state's eligibility criteria are used in reports
            </p>
          </div>

          {/* Evaluator Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluator Name
              </label>
              <input
                type="text"
                value={localSettings.evaluatorName}
                onChange={(e) => setLocalSettings({ ...localSettings, evaluatorName: e.target.value })}
                placeholder="Your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credentials
              </label>
              <input
                type="text"
                value={localSettings.evaluatorCredentials}
                onChange={(e) => setLocalSettings({ ...localSettings, evaluatorCredentials: e.target.value })}
                placeholder="M.S., CCC-SLP, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School/Organization
            </label>
            <input
              type="text"
              value={localSettings.schoolName}
              onChange={(e) => setLocalSettings({ ...localSettings, schoolName: e.target.value })}
              placeholder="School or organization name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* State Information Preview */}
          {localSettings.preferredState && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                {localSettings.preferredState} Eligibility Preview
              </h3>
              <p className="text-sm text-blue-800">
                Eligibility criteria and language will be automatically updated to match {localSettings.preferredState} requirements when you create new reports or add eligibility sections.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            onClick={handleCancel}
            variant="default"
            className="bg-gray-500 hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

// Settings trigger button component
export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        <Settings className="h-4 w-4" />
        Settings
      </button>
      <UserSettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}