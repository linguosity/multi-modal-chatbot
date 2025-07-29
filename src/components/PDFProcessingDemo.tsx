'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PDFProcessingDemoProps {
  reportId: string;
}

export default function PDFProcessingDemo({ reportId }: PDFProcessingDemoProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult('')
      setError('')
    }
  }

  const processFile = async () => {
    if (!file) return

    setProcessing(true)
    setError('')
    setResult('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('reportId', reportId)
      formData.append('prompt', 'Analyze this speech-language pathology document. Extract key assessment information, scores, and recommendations.')

      const response = await fetch('/api/ai/process-pdf', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed')
      }

      setResult(JSON.stringify(data.analysis, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">PDF Processing Demo</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select PDF File
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}

          <Button 
            onClick={processFile} 
            disabled={!file || processing}
            className="w-full"
          >
            {processing ? 'Processing...' : 'Analyze PDF with Claude'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-medium mb-2">Analysis Result</h3>
          <div className="text-green-700 text-sm whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </div>
  )
}