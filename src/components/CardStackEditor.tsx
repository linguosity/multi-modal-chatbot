'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Edit3, List } from 'lucide-react'
import TiptapEditor from './TiptapEditor'

interface CardData {
  key: string
  value: any
  type: 'string' | 'boolean' | 'number' | 'object' | 'array'
  children?: CardData[]
  parent?: string
}

interface CardStackEditorProps {
  data: any
  schema: any
  onChange: (newData: any) => void
}

export default function CardStackEditor({ data, schema, onChange }: CardStackEditorProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right')

  // Convert JSON data to card structure
  const buildCardStack = (obj: any, path: string[] = []): CardData[] => {
    return Object.entries(obj).map(([key, value]) => ({
      key,
      value,
      type: getValueType(value),
      children: typeof value === 'object' && value !== null ? buildCardStack(value, [...path, key]) : undefined,
      parent: path.join('.')
    }))
  }

  const getValueType = (value: any): CardData['type'] => {
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object' && value !== null) return 'object'
    return 'string'
  }

  const getCurrentCards = (): CardData[] => {
    let current = data
    for (const pathSegment of currentPath) {
      current = current[pathSegment]
    }
    return buildCardStack(current, currentPath)
  }

  const navigateToCard = (cardKey: string) => {
    setAnimationDirection('right')
    setCurrentPath([...currentPath, cardKey])
  }

  const navigateBack = () => {
    setAnimationDirection('left')
    setCurrentPath(currentPath.slice(0, -1))
  }

  const updateValue = (cardKey: string, newValue: any) => {
    // Safe deep clone to avoid circular reference issues
    let newData;
    try {
      newData = JSON.parse(JSON.stringify(data));
    } catch (e) {
      console.warn('Circular reference detected in CardStackEditor, using structuredClone fallback');
      newData = structuredClone ? structuredClone(data) : { ...data };
    }
    let current = newData
    
    // Navigate to the correct nested location
    for (const pathSegment of currentPath) {
      current = current[pathSegment]
    }
    
    current[cardKey] = newValue
    onChange(newData)
  }

  const currentCards = getCurrentCards()

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with breadcrumb */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentPath.length > 0 && (
            <button
              onClick={navigateBack}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <span className="font-medium text-sm">
            {currentPath.length === 0 ? 'Root' : currentPath[currentPath.length - 1]}
          </span>
        </div>
        
        {/* Breadcrumb dots */}
        <div className="flex gap-1">
          {Array.from({ length: currentPath.length + 1 }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentPath.length ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative h-96 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath.join('.')}
            initial={{ 
              x: animationDirection === 'right' ? 300 : -300,
              opacity: 0 
            }}
            animate={{ 
              x: 0,
              opacity: 1 
            }}
            exit={{ 
              x: animationDirection === 'right' ? -300 : 300,
              opacity: 0 
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30 
            }}
            className="absolute inset-0 p-4 space-y-3 overflow-y-auto"
          >
            {currentCards.map((card, index) => (
              <motion.div
                key={card.key}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800">{card.key}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {card.type}
                    </span>
                    {card.children && (
                      <button
                        onClick={() => navigateToCard(card.key)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Body - Value Editor */}
                <div className="space-y-2">
                  {card.type === 'boolean' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateValue(card.key, true)}
                        className={`px-3 py-1 rounded text-sm ${
                          card.value === true
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => updateValue(card.key, false)}
                        className={`px-3 py-1 rounded text-sm ${
                          card.value === false
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  )}

                  {card.type === 'string' && (
                    <input
                      type="text"
                      value={card.value || ''}
                      onChange={(e) => updateValue(card.key, e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter text..."
                    />
                  )}

                  {card.type === 'number' && (
                    <input
                      type="number"
                      value={card.value || 0}
                      onChange={(e) => updateValue(card.key, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {card.type === 'object' && (
                    <div className="text-sm text-gray-600">
                      {Object.keys(card.value || {}).length} properties
                      <div className="text-xs text-gray-400 mt-1">
                        Tap → to explore
                      </div>
                    </div>
                  )}

                  {card.type === 'array' && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Array with {(card.value || []).length} items
                      </div>
                      <button
                        onClick={() => updateValue(card.key, [...(card.value || []), ''])}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Add Item
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer with current path */}
      <div className="bg-gray-50 px-4 py-2 border-t text-xs text-gray-500">
        Path: {currentPath.length === 0 ? 'root' : currentPath.join(' → ')}
      </div>
    </div>
  )
}