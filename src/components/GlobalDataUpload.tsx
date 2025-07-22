'use client'

import React, { useState } from 'react'
import { Upload, ChevronDown, X } from 'lucide-react'
import UploadModal from './UploadModal'

interface GlobalDataUploadProps {
  onDataReceived: (data: any, targetSections?: string[]) => void
  availableSections: { id: string; title: string }[]
}

export default function GlobalDataUpload({ onDataReceived, availableSections }: GlobalDataUploadProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [showSectionDropdown, setShowSectionDropdown] = useState(false)

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleUploadClick = () => {
    setShowUploadModal(true)
    setIsExpanded(false)
  }

  return (
    <>
      {/* Floating Upload Widget */}
      <div className="fixed top-4 right-4 z-40">
        <div 
          className={`bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300 ${
            isExpanded ? 'w-80' : 'w-12'
          }`}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => {
            setIsExpanded(false)
            setShowSectionDropdown(false)
          }}
        >
          {!isExpanded ? (
            /* Collapsed State - Just Icon */
            <div className="p-3 cursor-pointer">
              <Upload className="h-6 w-6 text-gray-600" />
            </div>
          ) : (
            /* Expanded State - Full Interface */
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Upload Data</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Section Selector */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Target Sections:</label>
                <div className="relative">
                  <button
                    onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs border border-gray-300 rounded-md hover:border-gray-400 transition-colors"
                  >
                    <span className="text-gray-700">
                      {selectedSections.length === 0 
                        ? 'All sections' 
                        : selectedSections.length === 1 
                          ? availableSections.find(s => s.id === selectedSections[0])?.title
                          : `${selectedSections.length} sections selected`
                      }
                    </span>
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </button>

                  {showSectionDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        <label className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded text-xs">
                          <input
                            type="checkbox"
                            checked={selectedSections.length === 0}
                            onChange={() => setSelectedSections([])}
                            className="rounded"
                          />
                          <span>All sections</span>
                        </label>
                        {availableSections.map(section => (
                          <label key={section.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded text-xs">
                            <input
                              type="checkbox"
                              checked={selectedSections.includes(section.id)}
                              onChange={() => handleSectionToggle(section.id)}
                              className="rounded"
                            />
                            <span>{section.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUploadClick}
                className="w-full bg-blue-600 text-white text-xs py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="h-3 w-3" />
                Upload Files/Text
              </button>

              {/* Quick Info */}
              <p className="text-xs text-gray-500">
                Upload files or text to automatically populate selected report sections
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onDataReceived={(data) => {
            onDataReceived(data, selectedSections.length > 0 ? selectedSections : undefined)
            setShowUploadModal(false)
          }}
          sectionType="multiple"
        />
      )}
    </>
  )
}