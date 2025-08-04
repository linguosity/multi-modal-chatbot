'use client'

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronRight, GripVertical, Copy } from 'lucide-react'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import type { BaseEditorProps, EditorRef } from './BaseEditor'

export interface CardItem {
  id: string
  title: string
  content: string
  order: number
  isExpanded?: boolean
  metadata?: Record<string, any>
}

export interface CardStackEditorProps extends BaseEditorProps {
  /** Initial card items */
  initialCards?: CardItem[]
  /** Maximum number of cards */
  maxCards?: number
  /** Minimum number of cards */
  minCards?: number
  /** Whether cards are collapsible */
  collapsible?: boolean
  /** Whether to show drag handles */
  showDragHandles?: boolean
  /** Whether to allow card duplication */
  allowDuplication?: boolean
  /** Card title placeholder */
  titlePlaceholder?: string
  /** Card content placeholder */
  contentPlaceholder?: string
  /** Default card template */
  cardTemplate?: Partial<CardItem>
  /** Callback for cards change */
  onCardsChange?: (cards: CardItem[]) => void
  /** Custom card renderer */
  cardRenderer?: (card: CardItem, isEditing: boolean) => React.ReactNode
}

export const CardStackEditor = forwardRef<EditorRef, CardStackEditorProps>(
  (
    {
      initialCards = [],
      maxCards = 10,
      minCards = 0,
      collapsible = true,
      showDragHandles = true,
      allowDuplication = true,
      titlePlaceholder = 'Card title...',
      contentPlaceholder = 'Card content...',
      cardTemplate,
      variant = 'default',
      editable = true,
      className,
      disabled,
      loading,
      onCardsChange,
      cardRenderer,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [cards, setCards] = useState<CardItem[]>(
      initialCards.length > 0 
        ? initialCards 
        : minCards > 0 
          ? [createNewCard(0)]
          : []
    )
    const [editingCardId, setEditingCardId] = useState<string | null>(null)
    const [expandedCards, setExpandedCards] = useState<Set<string>>(
      new Set(initialCards.filter(card => card.isExpanded).map(card => card.id))
    )

    // Create new card
    function createNewCard(order: number): CardItem {
      return {
        id: crypto.randomUUID(),
        title: '',
        content: '',
        order,
        isExpanded: true,
        ...cardTemplate
      }
    }

    // Update cards when initialCards changes
    useEffect(() => {
      if (initialCards.length > 0) {
        setCards(initialCards)
        setExpandedCards(new Set(initialCards.filter(card => card.isExpanded).map(card => card.id)))
      }
    }, [initialCards])

    // Add new card
    const addCard = useCallback((afterIndex?: number) => {
      if (cards.length >= maxCards) return

      const newCard = createNewCard(
        afterIndex !== undefined ? afterIndex + 1 : cards.length
      )

      const newCards = [...cards]
      if (afterIndex !== undefined) {
        newCards.splice(afterIndex + 1, 0, newCard)
        // Update order for subsequent cards
        newCards.forEach((card, index) => {
          card.order = index
        })
      } else {
        newCards.push(newCard)
      }

      setCards(newCards)
      onCardsChange?.(newCards)
      setEditingCardId(newCard.id)
      setExpandedCards(prev => new Set([...prev, newCard.id]))
    }, [cards, maxCards, onCardsChange, cardTemplate])

    // Remove card
    const removeCard = useCallback((cardId: string) => {
      if (cards.length <= minCards) return

      const newCards = cards
        .filter(card => card.id !== cardId)
        .map((card, index) => ({ ...card, order: index }))

      setCards(newCards)
      onCardsChange?.(newCards)
      setExpandedCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })

      if (editingCardId === cardId) {
        setEditingCardId(null)
      }
    }, [cards, minCards, onCardsChange, editingCardId])

    // Update card
    const updateCard = useCallback((cardId: string, updates: Partial<CardItem>) => {
      const newCards = cards.map(card =>
        card.id === cardId ? { ...card, ...updates } : card
      )
      setCards(newCards)
      onCardsChange?.(newCards)
    }, [cards, onCardsChange])

    // Duplicate card
    const duplicateCard = useCallback((cardId: string) => {
      if (!allowDuplication || cards.length >= maxCards) return

      const cardToDuplicate = cards.find(card => card.id === cardId)
      if (!cardToDuplicate) return

      const newCard: CardItem = {
        ...cardToDuplicate,
        id: crypto.randomUUID(),
        title: `${cardToDuplicate.title} (Copy)`,
        order: cardToDuplicate.order + 1
      }

      const newCards = [...cards]
      const insertIndex = cards.findIndex(card => card.id === cardId) + 1
      newCards.splice(insertIndex, 0, newCard)
      
      // Update order for subsequent cards
      newCards.forEach((card, index) => {
        card.order = index
      })

      setCards(newCards)
      onCardsChange?.(newCards)
      setExpandedCards(prev => new Set([...prev, newCard.id]))
    }, [allowDuplication, cards, maxCards, onCardsChange])

    // Toggle card expansion
    const toggleCardExpansion = useCallback((cardId: string) => {
      if (!collapsible) return

      setExpandedCards(prev => {
        const newSet = new Set(prev)
        if (newSet.has(cardId)) {
          newSet.delete(cardId)
        } else {
          newSet.add(cardId)
        }
        return newSet
      })

      // Update card state
      updateCard(cardId, { isExpanded: !expandedCards.has(cardId) })
    }, [collapsible, expandedCards, updateCard])

    // Start editing card
    const startEditing = useCallback((cardId: string) => {
      setEditingCardId(cardId)
      if (!expandedCards.has(cardId)) {
        toggleCardExpansion(cardId)
      }
    }, [editingCardId, expandedCards, toggleCardExpansion])

    // Stop editing card
    const stopEditing = useCallback(() => {
      setEditingCardId(null)
    }, [])

    // Get variant classes
    const getVariantClasses = () => {
      switch (variant) {
        case 'clinical':
          return 'bg-blue-50/30'
        case 'compact':
          return 'space-y-2'
        case 'inline':
          return 'border-none bg-transparent p-0'
        default:
          return 'bg-white'
      }
    }

    // Render card content
    const renderCardContent = useCallback((card: CardItem, isEditing: boolean) => {
      if (cardRenderer) {
        return cardRenderer(card, isEditing)
      }

      if (isEditing) {
        return (
          <div className="space-y-4">
            <FormField
              label="Title"
              name={`${card.id}-title`}
              type="text"
              value={card.title}
              onChange={(value) => updateCard(card.id, { title: value })}
              placeholder={titlePlaceholder}
              disabled={disabled || loading || !editable}
            />
            <FormField
              label="Content"
              name={`${card.id}-content`}
              type="textarea"
              value={card.content}
              onChange={(value) => updateCard(card.id, { content: value })}
              placeholder={contentPlaceholder}
              disabled={disabled || loading || !editable}
              rows={4}
            />
          </div>
        )
      }

      return (
        <div className="space-y-2">
          {card.content && (
            <div className={cn(
              'whitespace-pre-wrap',
              getClinicalTypographyClass('bodyText')
            )}>
              {card.content}
            </div>
          )}
        </div>
      )
    }, [cardRenderer, updateCard, titlePlaceholder, contentPlaceholder, disabled, loading, editable])

    // Expose ref methods
    useImperativeHandle(ref, () => ({
      getContent: () => {
        return JSON.stringify(cards)
      },
      setContent: (content: string) => {
        try {
          const parsedCards = JSON.parse(content) as CardItem[]
          setCards(parsedCards)
          onCardsChange?.(parsedCards)
        } catch (error) {
          console.error('Invalid JSON content:', error)
        }
      },
      focus: () => {
        const firstCard = cards[0]
        if (firstCard) {
          startEditing(firstCard.id)
        }
      },
      blur: () => {
        stopEditing()
      },
      clear: () => {
        const emptyCards = minCards > 0 ? [createNewCard(0)] : []
        setCards(emptyCards)
        onCardsChange?.(emptyCards)
      },
      insertContent: (content: string) => {
        addCard()
        const lastCard = cards[cards.length - 1]
        if (lastCard) {
          updateCard(lastCard.id, { content })
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
        const validCards = cards.filter(card => card.title.trim() || card.content.trim())
        return validCards.length >= minCards
      },
      getWordCount: () => {
        const allText = cards.map(card => `${card.title} ${card.content}`).join(' ')
        return allText.trim().split(/\s+/).filter(word => word.length > 0).length
      },
      getCharCount: () => {
        return cards.reduce((total, card) => total + card.title.length + card.content.length, 0)
      }
    }))

    return (
      <div
        className={cn(
          'card-stack-editor',
          getVariantClasses(),
          variant !== 'inline' && 'border rounded-lg',
          disabled && 'opacity-50 cursor-not-allowed',
          loading && 'animate-pulse',
          className
        )}
        data-testid={testId}
        {...props}
      >
        {/* Header */}
        {variant !== 'inline' && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className={getClinicalTypographyClass('subsectionHeading')}>
              Cards ({cards.length}/{maxCards})
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCard()}
              disabled={cards.length >= maxCards || disabled || loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>
        )}

        {/* Cards */}
        <div className={cn(
          'space-y-4',
          variant !== 'inline' && 'p-4'
        )}>
          <AnimatePresence>
            {cards.map((card, index) => {
              const isExpanded = expandedCards.has(card.id)
              const isEditing = editingCardId === card.id

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm',
                    isEditing && 'ring-2 ring-blue-500 ring-opacity-50'
                  )}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      {showDragHandles && (
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                      )}
                      
                      {collapsible && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCardExpansion(card.id)}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      <div className={cn(
                        'font-medium truncate',
                        getClinicalTypographyClass('cardTitle')
                      )}>
                        {card.title || `Card ${index + 1}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {allowDuplication && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateCard(card.id)}
                          disabled={cards.length >= maxCards || disabled || loading}
                          className="h-6 w-6 p-0"
                          title="Duplicate card"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => isEditing ? stopEditing() : startEditing(card.id)}
                        disabled={disabled || loading}
                        className="h-6 w-6 p-0"
                        title={isEditing ? 'Stop editing' : 'Edit card'}
                      >
                        {isEditing ? (
                          <Save className="h-3 w-3" />
                        ) : (
                          <Edit3 className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCard(card.id)}
                        disabled={cards.length <= minCards || disabled || loading}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        title="Delete card"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4">
                          {renderCardContent(card, isEditing)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {cards.length === 0 && (
          <div className="text-center py-8">
            <div className={cn(
              'text-gray-500 mb-4',
              getClinicalTypographyClass('bodyText')
            )}>
              No cards yet. Add your first card to get started.
            </div>
            <Button
              variant="outline"
              onClick={() => addCard()}
              disabled={disabled || loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Card
            </Button>
          </div>
        )}

        {/* Footer */}
        {variant !== 'inline' && cards.length > 0 && (
          <div className={cn(
            'px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm text-gray-500',
            getClinicalTypographyClass('helpText')
          )}>
            <span>
              {cards.filter(card => card.title.trim() || card.content.trim()).length} active cards
            </span>
            <span>
              {cards.reduce((total, card) => {
                const text = `${card.title} ${card.content}`
                return total + text.trim().split(/\s+/).filter(word => word.length > 0).length
              }, 0)} words total
            </span>
          </div>
        )}
      </div>
    )
  }
)

CardStackEditor.displayName = 'CardStackEditor'