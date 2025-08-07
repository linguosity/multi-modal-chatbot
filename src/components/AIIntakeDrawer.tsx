'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Brain, FileText, Upload, Sparkles, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useProgressToasts } from '@/lib/context/ProgressToastContext'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'
import { eventBus } from '@/lib/event-bus'
interface StructuredData {
  studentName: string
  assessmentDate: string
  testResults: string[]
  observations: string
}

interface AIIntakeDrawerProps {
  onProcessData?: (data: string | Record<string, unknown>, type: 'structured' | 'unstructured') => void
}

export const AIIntakeDrawer: React.FC<AIIntakeDrawerProps> = ({
  onProcessData
}) => {
  const pathname = usePathname()
  const { processLogLine, clearAllToasts } = useProgressToasts()
  const { addRecentUpdate } = useRecentUpdates()
  
  const [isOpen, setIsOpen] = useState(false)
  const [unstructuredInput, setUnstructuredInput] = useState('')
  const [structuredData, setStructuredData] = useState<StructuredData>({
    studentName: '',
    assessmentDate: '',
    testResults: [],
    observations: ''
  })
  const [showPreview, setShowPreview] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResults, setProcessingResults] = useState<{
    successful: number
    failed: number
    sections: Array<{ sectionId: string; confidence: number }>
  } | null>(null)

  const handleProcessUnstructured = async () => {
    if (!unstructuredInput.trim()) return
    
    setIsProcessing(true)
    setProcessingResults(null)
    clearAllToasts()
    
    try {
      // Extract report ID from pathname
      const reportId = pathname.split('/')[3]
      
      // Start progress tracking
      processLogLine('🔍 AI Intake Processing Started')
      processLogLine('📝 Analyzing unstructured assessment data...')
      
      // Simulate processing steps with progress updates
      setTimeout(() => processLogLine('🤖 Extracting student information...'), 500)
      setTimeout(() => processLogLine('📊 Identifying assessment results...'), 1000)
      setTimeout(() => processLogLine('🏥 Processing health history...'), 1500)
      setTimeout(() => processLogLine('👨‍👩‍👧‍👦 Analyzing family background...'), 2000)
      
      const response = await fetch('/api/ai/process-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: unstructuredInput,
          type: 'unstructured',
          reportId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setProcessingResults(result.results)
        
        // Process each updated section with streaming toasts
        result.results.sections.forEach((section: any, index: number) => {
          setTimeout(() => {
            // Emit processing update event
            eventBus.emit('processing-update', {
              id: section.sectionId,
              sectionId: section.sectionId,
              fieldLabel: `Section ${index + 1}`,
              verb: 'updating',
              timestamp: Date.now()
            })
            
            // Mark section as recently updated with high importance
            addRecentUpdate(
              section.sectionId, 
              ['ai_extracted_data'], 
              'ai_update', 
              'critical'
            )
            
            // Complete the processing
            setTimeout(() => {
              eventBus.emit('processing-complete', {
                id: section.sectionId,
                success: true,
                timestamp: Date.now()
              })
              
              processLogLine(`✅ Updated section with ${section.confidence}% confidence`)
            }, 1000)
          }, index * 300)
        })
        
        processLogLine(`🎉 Successfully processed ${result.results.successful} sections`)
        onProcessData?.(unstructuredInput, 'unstructured')
        
        // Auto-close after successful processing
        setTimeout(() => {
          setIsOpen(false)
          setUnstructuredInput('')
          setProcessingResults(null)
        }, 4000)
      } else {
        processLogLine(`❌ Processing failed: ${result.error}`)
        console.error('Processing failed:', result.error)
      }
    } catch (error) {
      processLogLine(`❌ Error during processing: ${error}`)
      console.error('Error processing data:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcessStructured = async () => {
    setIsProcessing(true)
    setProcessingResults(null)
    clearAllToasts()
    
    try {
      // Extract report ID from pathname
      const reportId = pathname.split('/')[3]
      
      // Start progress tracking
      processLogLine('🔍 AI Intake Processing Started')
      processLogLine('📋 Processing structured assessment data...')
      
      // Simulate processing steps
      setTimeout(() => processLogLine('👤 Processing student information...'), 300)
      setTimeout(() => processLogLine('🏥 Processing health observations...'), 600)
      setTimeout(() => processLogLine('📅 Processing assessment dates...'), 900)
      
      const response = await fetch('/api/ai/process-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: structuredData,
          type: 'structured',
          reportId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setProcessingResults(result.results)
        
        // Process each updated section with streaming toasts
        result.results.sections.forEach((section: any, index: number) => {
          setTimeout(() => {
            // Emit processing update event
            eventBus.emit('processing-update', {
              id: section.sectionId,
              sectionId: section.sectionId,
              fieldLabel: `Section ${index + 1}`,
              verb: 'updating',
              timestamp: Date.now()
            })
            
            // Mark section as recently updated
            addRecentUpdate(
              section.sectionId, 
              ['structured_data_import'], 
              'ai_update', 
              'notice'
            )
            
            // Complete the processing
            setTimeout(() => {
              eventBus.emit('processing-complete', {
                id: section.sectionId,
                success: true,
                timestamp: Date.now()
              })
              
              processLogLine(`✅ Updated section with ${section.confidence}% confidence`)
            }, 800)
          }, index * 200)
        })
        
        processLogLine(`🎉 Successfully processed ${result.results.successful} sections`)
        onProcessData?.(structuredData, 'structured')
        
        // Auto-close after successful processing
        setTimeout(() => {
          setIsOpen(false)
          setStructuredData({
            studentName: '',
            assessmentDate: '',
            testResults: [],
            observations: ''
          })
          setProcessingResults(null)
        }, 4000)
      } else {
        processLogLine(`❌ Processing failed: ${result.error}`)
        console.error('Processing failed:', result.error)
      }
    } catch (error) {
      processLogLine(`❌ Error during processing: ${error}`)
      console.error('Error processing data:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const mockStructuredPreview = {
    sections: [
      { title: 'Background Information', confidence: 95 },
      { title: 'Assessment Results', confidence: 88 },
      { title: 'Clinical Observations', confidence: 92 }
    ]
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          AI Intake
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Assessment Intake
          </SheetTitle>
          <SheetDescription>
            Process assessment data using AI to automatically populate report sections
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 h-full">
          <Tabs defaultValue="unstructured" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unstructured" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Unstructured
              </TabsTrigger>
              <TabsTrigger value="structured" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Structured
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unstructured" className="flex-1 flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Raw Assessment Data</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Paste your assessment notes, observations, or test results. AI will structure this data automatically.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Example: Student showed difficulty with /r/ sound production during conversation. GFTA-3 results: /r/ in initial position 20% accuracy, medial 45%, final 60%. Stimulability testing positive with tactile cues..."
                    value={unstructuredInput}
                    onChange={(e) => setUnstructuredInput(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {unstructuredInput.length} characters
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2"
                      >
                        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPreview ? 'Hide' : 'Preview'}
                      </Button>
                      
                      <Button
                        onClick={handleProcessUnstructured}
                        disabled={!unstructuredInput.trim() || isProcessing}
                        className="flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {isProcessing ? 'Processing...' : 'Process with AI'}
                      </Button>
                    </div>
                  </div>

                  {showPreview && unstructuredInput && (
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-sm">AI Preview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {mockStructuredPreview.sections.map((section, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                            <span className="text-sm">{section.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {section.confidence}% confidence
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="structured" className="flex-1 flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Structured Data Entry</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Enter assessment data in organized fields for precise AI processing.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Student Name</label>
                      <input
                        type="text"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        value={structuredData.studentName}
                        onChange={(e) => setStructuredData(prev => ({
                          ...prev,
                          studentName: e.target.value
                        }))}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Assessment Date</label>
                      <input
                        type="date"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        value={structuredData.assessmentDate}
                        onChange={(e) => setStructuredData(prev => ({
                          ...prev,
                          assessmentDate: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Clinical Observations</label>
                    <Textarea
                      className="mt-1"
                      placeholder="Detailed observations during assessment..."
                      value={structuredData.observations}
                      onChange={(e) => setStructuredData(prev => ({
                        ...prev,
                        observations: e.target.value
                      }))}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleProcessStructured}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {isProcessing ? 'Processing...' : 'Generate Report Sections'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Processing Results */}
          {processingResults && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-green-800">Processing Complete!</h3>
              </div>
              
              <div className="text-sm text-green-700 space-y-1">
                <p>✅ {processingResults.successful} sections updated successfully</p>
                {processingResults.failed > 0 && (
                  <p className="text-orange-600">⚠️ {processingResults.failed} sections failed to update</p>
                )}
                
                <div className="mt-2">
                  <p className="font-medium mb-1">Updated sections:</p>
                  <div className="space-y-1">
                    {processingResults.sections.map((section, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span>Section {index + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {section.confidence}% confidence
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-green-600 mt-2">
                This drawer will close automatically in a few seconds...
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}