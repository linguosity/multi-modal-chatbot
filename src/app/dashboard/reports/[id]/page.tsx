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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unstructuredInput, setUnstructuredInput] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [highlightedSections, setHighlightedSections] = useState<string[]>([]) // New state for highlighting
  const [showJson, setShowJson] = useState(false) // New state for showing JSON
  const [showReviewModal, setShowReviewModal] = useState(false); // State for review modal
  const [proposedSections, setProposedSections] = useState<ReportSection[] | null>(null); // AI proposed changes
  const [selectedSectionsToAccept, setSelectedSectionsToAccept] = useState<string[]>([]); // Sections selected in modal
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
        body: JSON.stringify({
          ...report,
          updated_at: new Date().toISOString(), // Ensure updated_at is always current
          tags: report.tags || [], // Ensure tags is an array, not null
        }),
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
      console.log("Received updatedSections from API:", updatedSections); // Debugging
      
      setProposedSections(updatedSections); // Store proposed changes
      console.log("Proposed sections set."); // Debugging
      setShowReviewModal(true); // Open the review modal
      console.log("setShowReviewModal called with true."); // Debugging
      setSelectedSectionsToAccept(updatedSections.map((sec: any) => sec.id)); // Select all by default

      setUnstructuredInput('') // Clear input after generation
    } catch (err: any) {
      setError(err.message)
      console.error("Error in handleGenerateAI:", err); // Debugging
    } finally {
      setAiGenerating(false)
      console.log("setAiGenerating called with false."); // Debugging
    }
  }

  const handleDelete = async () => {
    if (!report || !confirm('Are you sure you want to delete this report?')) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete report');
      }

      alert('Report deleted successfully!');
      router.push('/dashboard/reports'); // Redirect to reports list
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAIChanges = async () => {
    if (!report || !proposedSections) return;

    setReport(prevReport => {
      if (!prevReport) return null;
      let newSections = [...prevReport.sections];
      const newlyUpdatedIds: string[] = [];

      proposedSections.forEach(proposedSec => {
        if (selectedSectionsToAccept.includes(proposedSec.id)) {
          const index = newSections.findIndex(sec => sec.id === proposedSec.id);
          if (index !== -1) {
            newSections[index] = { ...proposedSec, lastUpdated: new Date().toISOString() };
            newlyUpdatedIds.push(proposedSec.id);
          }
        }
      });
      setHighlightedSections(newlyUpdatedIds); // Set sections to highlight
      setTimeout(() => setHighlightedSections([]), 3000); // Clear highlight after 3 seconds
      return { ...prevReport, sections: newSections };
    });

    setShowReviewModal(false); // Close the modal
    setProposedSections(null); // Clear proposed changes
    setSelectedSectionsToAccept([]); // Clear selected sections

    // Automatically save the report after accepting changes
    await handleSave();
  };

  const handleToggleSectionAccept = (sectionId: string) => {
    setSelectedSectionsToAccept(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleAcceptAll = () => {
    if (proposedSections) {
      setSelectedSectionsToAccept(proposedSections.map(sec => sec.id));
    }
  };

  const handleRejectAll = () => {
    setSelectedSectionsToAccept([]);
  };

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
        <div className="flex space-x-2">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Report'}
          </Button>
          <Button onClick={() => setShowJson(!showJson)}>
            {showJson ? 'Hide JSON' : 'Show JSON'}
          </Button>
          <Button onClick={handleDelete} variant="destructive">
            Delete Report
          </Button>
        </div>
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

      {showJson && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Full Report JSON</h2>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}

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

      {/* AI Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        {console.log("Dialog open prop value:", showReviewModal)} {/* Debugging line */}
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review AI Generated Content</DialogTitle>
            <DialogDescription>
              Review the proposed changes. Uncheck any sections you do not wish to accept.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {proposedSections?.map(section => (
              <div key={section.id} className="border p-3 rounded-md">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSectionsToAccept.includes(section.id)}
                    onChange={() => handleToggleSectionAccept(section.id)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="font-semibold text-lg">{section.title}</span>
                </label>
                <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                  <p className="whitespace-pre-wrap">{section.content}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
            <div className="flex space-x-2 mb-2 sm:mb-0">
              <Button variant="outline" onClick={handleAcceptAll}>Accept All</Button>
              <Button variant="outline" onClick={handleRejectAll}>Reject All</Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowReviewModal(false)}>Cancel</Button>
              <Button onClick={handleConfirmAIChanges}>Confirm Selected</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
