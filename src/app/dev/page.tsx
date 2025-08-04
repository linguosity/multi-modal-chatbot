'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FeedbackDemo, BulletToNarrativeDemo, PDFProcessingDemo } from '@/components/dev'
import { FileText, MessageSquare, Upload, Code } from 'lucide-react'

// Only show in development
if (process.env.NODE_ENV === 'production') {
  throw new Error('Dev dashboard not available in production')
}

type DemoComponent = 'feedback' | 'narrative' | 'pdf' | null

export default function DevDashboard() {
  const [activeDemo, setActiveDemo] = useState<DemoComponent>(null)

  const demos = [
    {
      id: 'feedback' as const,
      title: 'Feedback System Demo',
      description: 'Test the three-layer feedback system with interactive examples',
      icon: MessageSquare,
      component: FeedbackDemo
    },
    {
      id: 'narrative' as const,
      title: 'Bullet to Narrative Demo',
      description: 'Convert bullet points to professional clinical narratives',
      icon: FileText,
      component: BulletToNarrativeDemo
    },
    {
      id: 'pdf' as const,
      title: 'PDF Processing Demo',
      description: 'Test PDF upload and AI analysis capabilities',
      icon: Upload,
      component: PDFProcessingDemo
    }
  ]

  if (activeDemo) {
    const demo = demos.find(d => d.id === activeDemo)
    if (demo) {
      const Component = demo.component
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <demo.icon className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold">{demo.title}</h1>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setActiveDemo(null)}
              >
                ← Back to Dashboard
              </Button>
            </div>
          </div>
          <Component reportId="demo-report-id" />
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Development Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Interactive demos and testing tools for Linguosity features
          </p>
          <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full inline-block">
            Development Environment Only
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demos.map((demo) => (
            <Card 
              key={demo.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveDemo(demo.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <demo.icon className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">{demo.title}</CardTitle>
                </div>
                <CardDescription>{demo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Launch Demo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg p-6 border">
          <h2 className="text-lg font-semibold mb-4">Development Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Available Demos</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Feedback system with toast notifications</li>
                <li>• AI narrative generation from bullet points</li>
                <li>• PDF processing and content extraction</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Testing Features</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Interactive UI component testing</li>
                <li>• API endpoint validation</li>
                <li>• Real-time feedback mechanisms</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}