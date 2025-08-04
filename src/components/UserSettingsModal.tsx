'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { BaseModal } from '@/components/ui/base-modal'
import { FormField, SelectField } from '@/components/ui/form-field'
import { useUserSettings } from '@/lib/context/UserSettingsContext'
import { getAvailableStates } from '@/lib/structured-schemas'
import { useFormState, useModal } from '@/lib/hooks'
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator'
import { Switch } from '@/components/ui/switch'

interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SettingsFormData {
  preferredState: string
  evaluatorName: string
  evaluatorCredentials: string
  schoolName: string
  showToastNotifications: boolean
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { settings, updateSettings } = useUserSettings()
  const availableStates = getAvailableStates()
  
  const formState = useFormState<SettingsFormData>({
    preferredState: settings.preferredState,
    evaluatorName: settings.evaluatorName,
    evaluatorCredentials: settings.evaluatorCredentials,
    schoolName: settings.schoolName,
    showToastNotifications: settings.showToastNotifications
  })

  // Reset form when modal opens or settings change
  useEffect(() => {
    if (isOpen) {
      formState.updateData({
        preferredState: settings.preferredState,
        evaluatorName: settings.evaluatorName,
        evaluatorCredentials: settings.evaluatorCredentials,
        schoolName: settings.schoolName,
        showToastNotifications: settings.showToastNotifications
      })
    }
  }, [isOpen, settings.preferredState, settings.evaluatorName, settings.evaluatorCredentials, settings.schoolName, settings.showToastNotifications])

  const handleSave = () => {
    updateSettings(formState.data)
    onClose()
  }

  const handleCancel = () => {
    formState.reset()
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="User Settings"
      size="lg"
      className="w-[600px]"
    >
      <div className="p-6">
        {/* Auto-save indicator */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Configure your preferences</span>
          </div>
          {formState.isDirty && (
            <AutoSaveIndicator status="pending" />
          )}
        </div>

        <div className="space-y-6">
          {/* State Selection */}
          <SelectField
            label="Preferred State"
            name="preferredState"
            value={formState.data.preferredState}
            onChange={(value) => formState.updateField('preferredState', value)}
            required
            helpText="This will determine which state's eligibility criteria are used in reports"
            options={availableStates.map(state => ({
              value: state,
              label: state
            }))}
            data-testid="preferred-state-select"
          />

          {/* Evaluator Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Evaluator Name"
              name="evaluatorName"
              type="text"
              value={formState.data.evaluatorName}
              onChange={(value) => formState.updateField('evaluatorName', value)}
              placeholder="Your full name"
              helpText="This will appear on all reports you create"
              data-testid="evaluator-name-input"
            />
            
            <FormField
              label="Credentials"
              name="evaluatorCredentials"
              type="text"
              value={formState.data.evaluatorCredentials}
              onChange={(value) => formState.updateField('evaluatorCredentials', value)}
              placeholder="M.S., CCC-SLP, etc."
              helpText="Professional credentials and certifications"
              data-testid="evaluator-credentials-input"
            />
          </div>

          <FormField
            label="School/Organization"
            name="schoolName"
            type="text"
            value={formState.data.schoolName}
            onChange={(value) => formState.updateField('schoolName', value)}
            placeholder="School or organization name"
            helpText="Institution where evaluations are conducted"
            data-testid="school-name-input"
          />

          {/* State Information Preview */}
          {formState.data.preferredState && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                {formState.data.preferredState} Eligibility Preview
              </h3>
              <p className="text-sm text-blue-800">
                Eligibility criteria and language will be automatically updated to match {formState.data.preferredState} requirements when you create new reports or add eligibility sections.
              </p>
            </div>
          )}

          {/* Toast Notifications Setting */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enable API Toast Notifications
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Show a notification when an API call succeeds or fails.
              </p>
            </div>
            <Switch
              checked={formState.data.showToastNotifications}
              onCheckedChange={(checked) => formState.updateField('showToastNotifications', checked)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button
            onClick={handleCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formState.isDirty}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}

// Settings trigger button component
export function SettingsButton() {
  const modal = useModal()

  return (
    <>
      <button
        onClick={modal.open}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        <Settings className="h-4 w-4" />
        Settings
      </button>
      <UserSettingsModal isOpen={modal.isOpen} onClose={modal.close} />
    </>
  )
}