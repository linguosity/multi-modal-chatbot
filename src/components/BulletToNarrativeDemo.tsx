'use client'

import React, { useState } from 'react'
import { InlineBulletEditor } from './InlineBulletEditor'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ArrowDown } from 'lucide-react'

interface BulletPoint {
  id: string
  text: string
  domain?: 'receptive' | 'expressive' | 'pragmatic' | 'articulation' | 'voice' | 'fluency'
}

export function BulletToNarrativeDemo() {
  const [receptiveBullets, setReceptiveBullets] = useState<BulletPoint[]>([])
  const [expressiveBullets, setExpressiveBullets] = useState<BulletPoint[]>([])
  const [pragmaticBullets, setPragmaticBullets] = useState<BulletPoint[]>([])
  const [generatedNarrative, setGeneratedNarrative] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateNarrativeFromBullets = async (bullets: BulletPoint[], domain: string) => {
    setIsGenerating(true)
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const bulletTexts = bullets.map(b => b.text).join('; ')
    const mockNarrative = `During ${domain} language assessment tasks, the following observations were noted: ${bulletTexts}. These findings suggest areas that may benefit from targeted intervention and support.`
    
    setGeneratedNarrative(mockNarrative)
    setIsGenerating(false)
  }

  const generateComprehensiveNarrative = async () => {
    setIsGenerating(true)
    
    // Simulate comprehensive AI generation from all bullets
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const allBullets = [...receptiveBullets, ...expressiveBullets, ...pragmaticBullets]
    if (allBullets.length === 0) {
      setGeneratedNarrative('No observations available for narrative generation.')
      setIsGenerating(false)
      return
    }

    // Group by domain for better narrative structure
    const receptiveTexts = receptiveBullets.map(b => b.text)
    const expressiveTexts = expressiveBullets.map(b => b.text)
    const pragmaticTexts = pragmaticBullets.map(b => b.text)

    let narrative = "Assessment results revealed the following patterns across language domains:\n\n"
    
    if (receptiveTexts.length > 0) {
      narrative += `In receptive language tasks, the student ${receptiveTexts.join(', and ')}. `
    }
    
    if (expressiveTexts.length > 0) {
      narrative += `Expressive language abilities were characterized by ${expressiveTexts.join(', while also showing ')}. `
    }
    
    if (pragmaticTexts.length > 0) {
      narrative += `Pragmatic language skills demonstrated ${pragmaticTexts.join(', with evidence of ')}.`
    }

    narrative += "\n\nThese observations provide valuable insights for developing targeted intervention strategies."
    
    setGeneratedNarrative(narrative)
    setIsGenerating(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bullet Points → AI Narrative Demo
        </h2>
        <p className="text-gray-600">
          Jot down quick observations, then generate polished clinical prose
        </p>
      </div>

      {/* Bullet Point Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200">
          <InlineBulletEditor
            title="Receptive Language"
            placeholder="e.g., needed frequent repetition..."
            domain="receptive"
            onBulletsChange={setReceptiveBullets}
            onGenerateNarrative={(bullets) => generateNarrativeFromBullets(bullets, 'receptive')}
          />
        </div>

        <div className="bg-green-50/50 p-4 rounded-lg border border-green-200">
          <InlineBulletEditor
            title="Expressive Language"
            placeholder="e.g., limited vocabulary use..."
            domain="expressive"
            onBulletsChange={setExpressiveBullets}
            onGenerateNarrative={(bullets) => generateNarrativeFromBullets(bullets, 'expressive')}
          />
        </div>

        <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-200">
          <InlineBulletEditor
            title="Pragmatic Language"
            placeholder="e.g., good eye contact when engaged..."
            domain="pragmatic"
            onBulletsChange={setPragmaticBullets}
            onGenerateNarrative={(bullets) => generateNarrativeFromBullets(bullets, 'pragmatic')}
          />
        </div>
      </div>

      {/* Generate Comprehensive Narrative */}
      {(receptiveBullets.length > 0 || expressiveBullets.length > 0 || pragmaticBullets.length > 0) && (
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <ArrowDown className="h-6 w-6 text-gray-400 mx-auto" />
            <button
              onClick={generateComprehensiveNarrative}
              disabled={isGenerating}
              className="px-6 py-3 bg-[var(--clr-accent)] text-white rounded-lg hover:bg-[var(--clr-accent)]/90 disabled:opacity-50 flex items-center gap-2 mx-auto transition-all duration-200"
            >
              <FileText className="h-5 w-5" />
              {isGenerating ? 'Generating...' : 'Generate Comprehensive Narrative'}
            </button>
          </motion.div>
        </div>
      )}

      {/* Generated Narrative */}
      <AnimatePresence>
        {(generatedNarrative || isGenerating) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Generated Clinical Narrative</h3>
            </div>
            
            {isGenerating ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-blue-700">Generating professional narrative from your observations...</span>
              </div>
            ) : (
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {generatedNarrative}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Usage Tips */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">💡 Usage Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Press Enter</strong> to quickly add bullet points</li>
          <li>• <strong>Click text</strong> to edit existing observations</li>
          <li>• <strong>Drag bullets</strong> to reorder by importance</li>
          <li>• <strong>Generate per domain</strong> or create comprehensive narrative</li>
          <li>• <strong>Domain tags</strong> help AI understand context</li>
        </ul>
      </div>
    </div>
  )
}