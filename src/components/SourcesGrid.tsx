'use client'

import React from 'react'
import { FileText, Image, Volume2, File } from 'lucide-react'

interface SourceItem {
  id: string
  type: 'text' | 'pdf' | 'image' | 'audio'
  fileName: string
  uploadDate: string
  size?: number
  description?: string
}

interface SourcesGridProps {
  sources: SourceItem[]
  reportId: string
  sectionId: string
}

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf':
      return <FileText className="h-6 w-6 text-red-500" />
    case 'image':
      return <Image className="h-6 w-6 text-blue-500" />
    case 'audio':
      return <Volume2 className="h-6 w-6 text-green-500" />
    case 'text':
      return <FileText className="h-6 w-6 text-gray-500" />
    default:
      return <File className="h-6 w-6 text-gray-400" />
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

function SourceCard({ source }: { source: SourceItem }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getFileIcon(source.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {source.fileName}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {source.type.toUpperCase()} • {formatDate(source.uploadDate)}
          </p>
          {source.size && (
            <p className="text-xs text-gray-400 mt-1">
              {formatFileSize(source.size)}
            </p>
          )}
          {source.description && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
              {source.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function GhostCard() {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <File className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500 font-medium">No sources available</p>
        <p className="text-xs text-gray-400">
          Upload files or provide text input to see AI sources here
        </p>
      </div>
    </div>
  )
}

export default function SourcesGrid({ sources, reportId, sectionId }: SourcesGridProps) {
  if (!sources || sources.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">AI Input Sources</h3>
          <p className="text-sm text-gray-600 mt-1">
            Files and inputs used by AI to generate content for this report
          </p>
        </div>
        <GhostCard />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">AI Input Sources</h3>
        <p className="text-sm text-gray-600 mt-1">
          {sources.length} source{sources.length !== 1 ? 's' : ''} used by AI to generate content
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>
    </div>
  )
}