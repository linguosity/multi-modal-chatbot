'use client'

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Sparkles, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import { Button } from '@/components/ui/button'
import type { BaseEditorProps, EditorRef } from './BaseEditor'

export interface BulletItem {
  id: string
  content: string
  order: number
}

export interface BulletListEditorProps extends BaseEditorProps {
  /** Initial bullet items */
  initialItems?: BulletItem[]
  /** Maximum number of items */
  maxItems?: number
  /** Minimum number of items */
  minItems?: number
  /** Whether to show drag handles */
  showDragHandles?: boolean
  /** Whether to show reorder buttons */
  showReorderButtons?: boolean
  /** Whether to show AI assistance */
  showAIAssist?: boolean
  /** Whether to auto-focus new items */
  autoFocusNew?: boolean
  /** Placeholder for empty items */
  itemPlaceholder?: string
  /** Callback for items change */
  onItemsChange?: (items: BulletItem[]) => void
  /** Callback for AI assistance */
  onAIAssist?: (items: BulletItem[]) => Promise<BulletItem[]>
}

export const BulletListEditor = forwardRef<EditorRef, BulletListEditorProps>(
  (
    {
      initialItems = [],
      maxItems = 20,
      minItems = 0,
      showDragHandles = true,
      showReorderButtons = false,
      showAIAssist = false,
      autoFocusNew = true,
      itemPlaceholder = 'Enter bullet point...',
      variant = 'default',
      editable = true,
      className,
      disabled,
      loading,
      onItemsChange,
      onAIAssist,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [items, setItems] = useState<BulletItem[]>(
      initialItems.length > 0 
        ? initialItems 
        : [{ id: crypto.randomUUID(), content: '', order: 0 }]
    )
    const [focusedItemId, setFocusedItemId] = useState<string | null>(null)
    const [isAIProcessing, setIsAIProcessing] = useState(false)
    const inputRefs = useRef<Record<string, HTMLTextAreaElement>>({})

    // Update items when initialItems changes
    useEffect(() => {
      if (initialItems.length > 0) {
        setItems(initialItems)
      }
    }, [initialItems])

    // Auto-resize textareas
    const autoResize = useCallback((textarea: HTMLTextAreaElement) => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }, [])

    // Add new item
    const addItem = useCallback((afterIndex?: number) => {
      if (items.length >= maxItems) return

      const newItem: BulletItem = {
        id: crypto.randomUUID(),
        content: '',
        order: afterIndex !== undefined ? afterIndex + 1 : items.length
      }

      const newItems = [...items]
      if (afterIndex !== undefined) {
        newItems.splice(afterIndex + 1, 0, newItem)
        // Update order for subsequent items
        newItems.forEach((item, index) => {
          item.order = index
        })
      } else {
        newItems.push(newItem)
      }

      setItems(newItems)
      onItemsChange?.(newItems)

      if (autoFocusNew) {
        setTimeout(() => {
          inputRefs.current[newItem.id]?.focus()
        }, 100)
      }
    }, [items, maxItems, onItemsChange, autoFocusNew])

    // Remove item
    const removeItem = useCallback((itemId: string) => {
      if (items.length <= minItems) return

      const newItems = items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, order: index }))

      setItems(newItems)
      onItemsChange?.(newItems)

      // If we removed the last item and there are no items left, add one
      if (newItems.length === 0 && minItems === 0) {
        addItem()
      }
    }, [items, minItems, onItemsChange, addItem])

    // Update item content
    const updateItem = useCallback((itemId: string, content: string) => {
      const newItems = items.map(item =>
        item.id === itemId ? { ...item, content } : item
      )
      setItems(newItems)
      onItemsChange?.(newItems)
    }, [items, onItemsChange])

    // Move item up
    const moveItemUp = useCallback((itemId: string) => {
      const currentIndex = items.findIndex(item => item.id === itemId)
      if (currentIndex <= 0) return

      const newItems = [...items]
      const [movedItem] = newItems.splice(currentIndex, 1)
      newItems.splice(currentIndex - 1, 0, movedItem)
      
      // Update order
      newItems.forEach((item, index) => {
        item.order = index
      })

      setItems(newItems)
      onItemsChange?.(newItems)
    }, [items, onItemsChange])

    // Move item down
    const moveItemDown = useCallback((itemId: string) => {
      const currentIndex = items.findIndex(item => item.id === itemId)
      if (currentIndex >= items.length - 1) return

      const newItems = [...items]
      const [movedItem] = newItems.splice(currentIndex, 1)
      newItems.splice(currentIndex + 1, 0, movedItem)
      
      // Update order
      newItems.forEach((item, index) => {
        item.order = index
      })

      setItems(newItems)
      onItemsChange?.(newItems)
    }, [items, onItemsChange])

    // Handle key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent, itemId: string) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const currentIndex = items.findIndex(item => item.id === itemId)
        addItem(currentIndex)
      } else if (e.key === 'Backspace') {
        const item = items.find(item => item.id === itemId)
        if (item && item.content === '' && items.length > minItems) {
          e.preventDefault()
          removeItem(itemId)
        }
      }
    }, [items, addItem, removeItem, minItems])

    // Handle AI assistance
    const handleAIAssist = useCallback(async () => {
      if (!onAIAssist || isAIProcessing) return

      setIsAIProcessing(true)
      try {
        const enhancedItems = await onAIAssist(items)
        setItems(enhancedItems)
        onItemsChange?.(enhancedItems)
      } catch (error) {
        console.error('AI assistance failed:', error)
      } finally {
        setIsAIProcessing(false)
      }
    }, [onAIAssist, isAIProcessing, items, onItemsChange])

    // Get variant classes
    const getVariantClasses = () => {
      switch (variant) {
        case 'clinical':
          return 'bg-blue-50/30 border-blue-200'
        case 'compact':
          return 'space-y-2'
        case 'inline':
          return 'border-none bg-transparent p-0'
        default:
          return 'bg-white border-gray-300'
      }
    }

    // Expose ref methods
    useImperativeHandle(ref, () => ({
      getContent: () => {
        return items.map(item => item.content).filter(content => content.trim()).join('\n• ')
      },
      setContent: (content: string) => {
        const lines = content.split('\n').filter(line => line.trim())
        const newItems: BulletItem[] = lines.map((line, index) => ({
          id: crypto.randomUUID(),
          content: line.replace(/^[•\-\*]\s*/, '').trim(),
          order: index
        }))
        setItems(newItems.length > 0 ? newItems : [{ id: crypto.randomUUID(), content: '', order: 0 }])
      },
      focus: () => {
        const firstItem = items[0]
        if (firstItem) {
          inputRefs.current[firstItem.id]?.focus()
        }
      },
      blur: () => {
        Object.values(inputRefs.current).forEach(input => input.blur())
      },
      clear: () => {
        const emptyItem: BulletItem = { id: crypto.randomUUID(), content: '', order: 0 }
        setItems([emptyItem])
        onItemsChange?.([emptyItem])
      },
      insertContent: (content: string) => {
        addItem()
        const lastItem = items[items.length - 1]
        if (lastItem) {
          updateItem(lastItem.id, content)
        }
      },
      getSelection: () => null,
      setSelection: () => {},
      undo: () => {
        // TODO: Implement undo functionality
      },
      redo: () => {
        // TODO: Implement redo functionality
      },
      isValid: () => {
        const nonEmptyItems = items.filter(item => item.content.trim())
        return nonEmptyItems.length >= minItems
      },
      getWordCount: () => {
        const allText = items.map(item => item.content).join(' ')
        return allText.trim().split(/\s+/).filter(word => word.length > 0).length
      },
      getCharCount: () => {
        return items.reduce((total, item) => total + item.content.length, 0)
      }
    }))

    return (
      <div
        className={cn(
          'bullet-list-editor',
          getVariantClasses(),
          variant !== 'inline' && 'border rounded-lg p-4',
          disabled && 'opacity-50 cursor-not-allowed',
          loading && 'animate-pulse',
          className
        )}
        data-testid={testId}
        {...props}
      >
        {/* Header with AI assist */}
        {showAIAssist && (
          <div className="flex justify-between items-center mb-4">
            <div className={getClinicalTypographyClass('subsectionHeading')}>
              Bullet Points
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIAssist}
              disabled={disabled || loading || isAIProcessing}
              className="flex items-center gap-2"
            >
              <Sparkles className={cn(
                'h-4 w-4',
                isAIProcessing && 'animate-spin'
              )} />
              {isAIProcessing ? 'Enhancing...' : 'AI Enhance'}
            </Button>
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 group"
              >
                {/* Drag handle */}
                {showDragHandles && (
                  <div className="flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                  </div>
                )}

                {/* Bullet point */}
                <div className="flex-shrink-0 mt-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={(el) => {
                      if (el) inputRefs.current[item.id] = el
                    }}
                    value={item.content}
                    onChange={(e) => {
                      updateItem(item.id, e.target.value)
                      autoResize(e.target)
                    }}
                    onKeyDown={(e) => handleKeyPress(e, item.id)}
                    onFocus={() => setFocusedItemId(item.id)}
                    onBlur={() => setFocusedItemId(null)}
                    placeholder={itemPlaceholder}
                    disabled={disabled || loading || !editable}
                    className={cn(
                      'w-full resize-none border-none bg-transparent focus:outline-none',
                      getClinicalTypographyClass('bodyText'),
                      'placeholder:text-gray-400'
                    )}
                    rows={1}
                    style={{ minHeight: '24px' }}
                  />
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {showReorderButtons && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItemUp(item.id)}
                        disabled={index === 0 || disabled || loading}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItemDown(item.id)}
                        disabled={index === items.length - 1 || disabled || loading}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= minItems || disabled || loading}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add button */}
        {items.length < maxItems && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addItem()}
              disabled={disabled || loading}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add bullet point
            </Button>
          </motion.div>
        )}

        {/* Footer stats */}
        <div className={cn(
          'mt-4 pt-3 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500',
          getClinicalTypographyClass('helpText')
        )}>
          <span>
            {items.filter(item => item.content.trim()).length} of {maxItems} items
          </span>
          <span>
            {items.reduce((total, item) => total + item.content.split(/\s+/).filter(word => word.length > 0).length, 0)} words
          </span>
        </div>
      </div>
    )
  }
)

BulletListEditor.displayName = 'BulletListEditor'