'use client'

import { useState } from 'react'

export default function TestExportPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async (format: 'pdf' | 'docx') => {
    setLoading(format)
    setError(null)
    try {
      const response = await fetch(`/api/test/export?format=${format}`)
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error || err.details || `HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `test-export.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Test Harness</h1>
          <p className="text-sm text-gray-500 mt-1">
            Uses seed data (Brandon Brewer - Initial SLP Evaluation) to test export rendering.
            No authentication required.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
          <p><span className="font-medium">Report:</span> Brandon Brewer - Initial SLP Evaluation</p>
          <p><span className="font-medium">Sections:</span> 6 (Referral, History, Tools, Results, Conclusion, Recommendations)</p>
          <p><span className="font-medium">Type:</span> Initial Evaluation</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={loading !== null}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading === 'pdf' ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              'Download Test PDF'
            )}
          </button>

          <button
            onClick={() => handleDownload('docx')}
            disabled={loading !== null}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading === 'docx' ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Word Doc...
              </>
            ) : (
              'Download Test Word Doc'
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Dev-only test page. Uses <code>/api/test/export</code> endpoint.
        </p>
      </div>
    </div>
  )
}
