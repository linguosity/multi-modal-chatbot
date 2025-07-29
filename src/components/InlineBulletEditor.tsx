'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, X, Plus, GripVertical, Sparkles } from 'lucide-react'
import { Button } from './ui/button'

interface BulletPoint {
  id: string
  text: string
  domain?: 'receptive' | 'expressive' | 'pragmatic' | 'articulation' | 'voice' | 'fluency'
}

interface InlineBulletEditorProps {
  initialBullets?: BulletPoint[]
  placeholder?: string
  title?: string
  domain?: string
  onBulletsChange?: (bullets: BulletPoint[]) => void
  onGenerateNarrative?: (bullets: BulletPoint[]) => void
  className?: string
}

const domainColors = {
  receptive: 'bg-blue-100 text-blue-800 border-blue-200',
  expressive: 'bg-green-100 text-green-800 border-green-200',
  pragmatic: 'bg-purple-100 text-purple-800 border-purple-200',
  articulation: 'bg-orange-100 text-orange-800 border-orange-200',
  voice: 'bg-pink-100 text-pink-800 border-pink-200',
  fluency: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export function InlineBulletEditor({
  initialBullets = [],
  placeholder = "Enter key data point...",
  title = "Assessment Observations",
  domain,
  onBulletsChange,
  onGenerateNarrative,
  className = ""
}: InlineBulletEditorProps) {
  const [bullets, setBullets] = useState<BulletPoint[]>(initialBullets)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newBulletText, setNewBulletText] = useState('')
  const [showNewInput, setShowNewInput] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  
  const newInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus new input when it appears
  useEffect(() => {
    if (showNewInput && newInputRef.current) {
      newInputRef.current.focus()
    }
  }, [showNewInput])

  // Auto-focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // Notify parent of changes
  useEffect(() => {
    onBulletsChange?.(bullets)
  }, [bullets, onBulletsChange])

  const addBullet = () => {
    if (newBulletText.trim()) {
      const newBullet: BulletPoint = {
        id: `bullet_${Date.now()}`,
        text: newBulletText.trim(),
        domain: domain as any
      }
      setBullets(prev => [...prev, newBullet])
      setNewBulletText('')
      // Keep input open for rapid entry
      newInputRef.current?.focus()
    }
  }

  const updateBullet = (id: string, newText: string) => {
    setBullets(prev => prev.map(bullet => 
      bullet.id === id ? { ...bullet, text: newText } : bullet
    ))
    setEditingId(null)
  }

  const deleteBullet = (id: string) => {
    setBullets(prev => prev.filter(bullet => bullet.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: 'add' | 'edit', id?: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (action === 'add') {
        addBullet()
      } else if (action === 'edit' && id) {
        const input = e.target as HTMLInputElement
        updateBullet(id, input.value)
      }
    } else if (e.key === 'Escape') {
      if (action === 'add') {
        setNewBulletText('')
        setShowNewInput(false)
      } else if (action === 'edit') {
        setEditingId(null)
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetId) return

    const draggedIndex = bullets.findIndex(b => b.id === draggedItem)
    const targetIndex = bullets.findIndex(b => b.id === targetId)
    
    const newBullets = [...bullets]
    const [draggedBullet] = newBullets.splice(draggedIndex, 1)
    newBullets.splice(targetIndex, 0, draggedBullet)
    
    setBullets(newBullets)
    setDraggedItem(null)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <div className="w-2 h-2 bg-[var(--clr-accent)] rounded-full"></div>
          {title}
        </h3>
        {bullets.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onGenerateNarrative?.(bullets)}
            className="flex items-center gap-1 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            Generate Paragraph
          </Button>
        )}
      </div>

      {/* Bullet Points */}
      <div className="space-y-2">
        <AnimatePresence>
          {bullets.map((bullet, index) => (
            <motion.div
              key={bullet.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`group flex items-start gap-2 p-2 rounded-lg border transition-all duration-200 ${
                draggedItem === bullet.id ? 'opacity-50' : 'hover:bg-gray-50'
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, bullet.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, bullet.id)}
            >
              {/* Drag Handle */}
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
              
              {/* Bullet Point */}
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {editingId === bullet.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    defaultValue={bullet.text}
                    onBlur={(e) => updateBullet(bullet.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'edit', bullet.id)}
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-start justify-between group">
                    <span 
                      className="text-sm text-gray-700 cursor-pointer hover:text-gray-900 flex-1"
                      onClick={() => setEditingId(bullet.id)}
                    >
                      {bullet.text}
                    </span>
                    
                    {/* Domain Tag */}
                    {bullet.domain && (
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full border ${domainColors[bullet.domain]}`}>
                        {bullet.domain}
                      </span>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(bullet.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteBullet(bullet.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* New Bullet Input */}
        <AnimatePresence>
          {showNewInput && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-2"
            >
              <div className="w-4 h-4"></div> {/* Spacer for drag handle */}
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-0.5"></div>
              <input
                ref={newInputRef}
                type="text"
                value={newBulletText}
                onChange={(e) => setNewBulletText(e.target.value)}
                onBlur={() => {
                  if (!newBulletText.trim()) {
                    setShowNewInput(false)
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, 'add')}
                placeholder={placeholder}
                className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Button */}
        {!showNewInput && (
          <button
            onClick={() => setShowNewInput(true)}
            className="flex items-center gap-2 p-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
          >
            <div className="w-4 h-4"></div> {/* Spacer */}
            <Plus className="h-4 w-4" />
            Add another observation...
          </button>
        )}
      </div>

      {/* Generate Narrative Section */}
      {bullets.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {bullets.length} observation{bullets.length !== 1 ? 's' : ''} ready for narrative generation
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onGenerateNarrative?.(bullets)}
              className="flex items-center gap-1"
            >
              <Sparkles className="h-4 w-4" />
              Generate Paragraph
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}