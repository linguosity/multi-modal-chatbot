import PDFProcessingDemo from '@/components/dev/PDFProcessingDemo'

export default function TestPDFPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PDF Processing Test</h1>
          <p className="text-gray-600 mt-2">
            Test Claude's PDF analysis capabilities for SLP documents
          </p>
        </div>
        
        <PDFProcessingDemo />
      </div>
    </div>
  )
}