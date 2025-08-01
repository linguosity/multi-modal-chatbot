'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useLogSimulator, useProgressToasts } from '@/lib/context/ProgressToastContext'

export default function TestProgressToastsPage() {
  const { clearAllToasts } = useProgressToasts()
  const { simulateProcessing, simulateError, simulateTimeout } = useLogSimulator()

  const handleSimulateAssessment = () => {
    const sectionId = 'assessment-' + Date.now().toString(36)
    const fields = [
      'language_criteria',
      'articulation_scores',
      'fluency_assessment',
      'voice_quality',
      'pragmatic_skills'
    ]
    simulateProcessing(sectionId, fields)
  }

  const handleSimulateEligibility = () => {
    const sectionId = 'eligibility-' + Date.now().toString(36)
    const fields = [
      'eligibility_criteria',
      'educational_impact',
      'service_recommendations'
    ]
    simulateProcessing(sectionId, fields)
  }

  const handleSimulateError = () => {
    const sectionId = 'error-' + Date.now().toString(36)
    simulateError(sectionId, 'problematic_field')
  }

  const handleSimulateTimeout = () => {
    const sectionId = 'timeout-' + Date.now().toString(36)
    simulateTimeout(sectionId, 'slow_field')
  }

  const handleSimulateMixed = () => {
    // Simulate multiple sections processing simultaneously
    handleSimulateAssessment()
    setTimeout(() => handleSimulateEligibility(), 1000)
    setTimeout(() => handleSimulateError(), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Real-time Progress Toasts Test
          </h1>
          
          <div className="prose max-w-none mb-8">
            <p>
              This page demonstrates the real-time field-level progress toast system. 
              Click the buttons below to simulate different AI processing scenarios.
            </p>
            
            <h3>Features Demonstrated:</h3>
            <ul>
              <li><strong>Individual field updates</strong> - Shows progress for each field being processed</li>
              <li><strong>Coalescing</strong> - Multiple updates in the same section get combined</li>
              <li><strong>Success states</strong> - Green checkmarks when updates complete</li>
              <li><strong>Error handling</strong> - Red alerts for failed updates</li>
              <li><strong>Timeout detection</strong> - Orange warnings for stalled updates</li>
              <li><strong>Throttling</strong> - Maximum 5 concurrent toasts</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Button 
              onClick={handleSimulateAssessment}
              className="h-auto p-4 flex flex-col items-start"
            >
              <span className="font-semibold">Assessment Processing</span>
              <span className="text-xs opacity-75 mt-1">
                Simulates 5 field updates with realistic timing
              </span>
            </Button>

            <Button 
              onClick={handleSimulateEligibility}
              variant="secondary"
              className="h-auto p-4 flex flex-col items-start"
            >
              <span className="font-semibold">Eligibility Update</span>
              <span className="text-xs opacity-75 mt-1">
                Simulates 3 field updates in eligibility section
              </span>
            </Button>

            <Button 
              onClick={handleSimulateError}
              variant="destructive"
              className="h-auto p-4 flex flex-col items-start"
            >
              <span className="font-semibold">Error Scenario</span>
              <span className="text-xs opacity-75 mt-1">
                Simulates a failed field update
              </span>
            </Button>

            <Button 
              onClick={handleSimulateTimeout}
              variant="secondary"
              className="h-auto p-4 flex flex-col items-start"
            >
              <span className="font-semibold">Timeout Scenario</span>
              <span className="text-xs opacity-75 mt-1">
                Simulates a stalled update (30s timeout)
              </span>
            </Button>

            <Button 
              onClick={handleSimulateMixed}
              className="h-auto p-4 flex flex-col items-start"
            >
              <span className="font-semibold">Mixed Scenario</span>
              <span className="text-xs opacity-75 mt-1">
                Multiple sections + error simultaneously
              </span>
            </Button>

            <Button 
              onClick={clearAllToasts}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start"
            >
              <span className="font-semibold">Clear All Toasts</span>
              <span className="text-xs opacity-75 mt-1">
                Removes all active progress toasts
              </span>
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Log Format Examples:</h3>
            <div className="font-mono text-xs space-y-1 text-gray-600">
              <div>📝 Processing update: ebddbf13-....language_criteria ... replace</div>
              <div>✅ Updated ebddbf13-....language_criteria</div>
              <div>❌ Failed to update ebddbf13-....articulation_scores</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}