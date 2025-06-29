'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Report } from '@/lib/schemas/report'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import TiptapEditor from '@/components/TiptapEditor'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unstructuredInput, setUnstructuredInput] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [highlightedSections, setHighlightedSections] = useState<string[]>([]) // New state for highlighting
  const router = useRouter()

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/reports/${id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setReport(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [id])

  const handleSave = async () => {
    if (!report) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save report')
      }

      alert('Report saved successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSectionChange = (sectionId: string, newContent: string) => {
    setReport(prevReport => {
      if (!prevReport) return null
      const updatedSections = prevReport.sections.map(section =>
        section.id === sectionId ? { ...section, content: newContent } : section
      )
      return { ...prevReport, sections: updatedSections }
    })
  }

  const handleGenerateAI = async (primarySectionId: string) => { // sectionId parameter re-added
    if (!report || !unstructuredInput) return
    setAiGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report.id,
          sectionId: primarySectionId, // Pass the primary section ID
          unstructuredInput: unstructuredInput,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content with AI')
      }

      const { updatedSections } = await response.json()
      
      setReport(prevReport => {
        if (!prevReport) return null;
        let newSections = [...prevReport.sections];
        const newlyUpdatedIds: string[] = [];

        updatedSections.forEach((updatedSec: any) => {
          const index = newSections.findIndex(sec => sec.id === updatedSec.id);
          if (index !== -1) {
            newSections[index] = updatedSec;
            newlyUpdatedIds.push(updatedSec.id);
          }
        });
        setHighlightedSections(newlyUpdatedIds); // Set sections to highlight
        setTimeout(() => setHighlightedSections([]), 3000); // Clear highlight after 3 seconds
        return { ...prevReport, sections: newSections };
      });

      setUnstructuredInput('') // Clear input after generation
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAiGenerating(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading report...</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>
  }

  if (!report) {
    return <div className="p-6">Report not found.</div>
  }

  const reasonForReferralSection = report.sections.find(s => s.sectionType === 'reason_for_referral')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{report.title}</h1>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Report'}
        </Button>
      </div>

      {/* AI Input and Generate Button - Moved to a general location */}
      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
        <Label htmlFor="unstructured-input" className="text-md font-semibold mb-2 block">
          Unstructured Notes for AI Generation (Applies to entire report)
        </Label>
        <Textarea
          id="unstructured-input"
          value={unstructuredInput}
          onChange={(e) => setUnstructuredInput(e.target.value)}
          rows={4}
          placeholder="Enter notes, observations, or key points for AI generation. The AI will update relevant sections based on this input."
          className="w-full mb-2"
        />
        <Button
          onClick={() => handleGenerateAI(reasonForReferralSection?.id || '')} // Pass the ID of the Reason for Referral section
          disabled={aiGenerating || !unstructuredInput}
        >
          {aiGenerating ? 'Generating...' : 'Generate with AI'}
        </Button>
      </div>

      <div className="space-y-6 mt-6">
        {report.sections.map((section) => (
          <Card 
            key={section.id} 
            className={`border p-4 rounded-lg ${highlightedSections.includes(section.id) ? 'ai-highlight' : ''}`}
          >
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
            {section.sectionType === 'reason_for_referral' ? (
              <TiptapEditor
                content={section.content}
                onChange={(newContent) => handleSectionChange(section.id, newContent)}
              />
            ) : (
              <Textarea
                id={section.id}
                value={section.content}
                onChange={(e) => handleSectionChange(section.id, e.target.value)}
                rows={5}
                className="w-full"
              />
            )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
