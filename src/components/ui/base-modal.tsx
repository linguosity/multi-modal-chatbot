'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import { modalVariants, transitionClasses } from '@/lib/animations/transitions'
import type { BaseComponentProps } from '@/lib/design-system/types'

export interface BaseModalProps extends BaseComponentProps {
  /** Whether modal is open */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Modal title */
  title: string
  /** Modal content */
  children: React.ReactNode
  /** Modal footer content */
  footer?: React.ReactNode
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Modal variant for different styling */
  variant?: 'default' | 'clinical' | 'warning' | 'error'
  /** Whether to show close button */
  showCloseButton?: boolean
  /** Whether to close on overlay click */
  closeOnOverlayClick?: boolean
  /** Whether to close on escape key */
  closeOnEscape?: boolean
  /** Whether to use portal rendering */
  usePortal?: boolean
  /** Custom overlay className */
  overlayClassName?: string
  /** Custom content className */
  contentClassName?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
}

const variantClasses = {
  default: 'bg-white border-gray-200',
  clinical: 'bg-gray-50 border-gray-300',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200'
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  usePortal = true,
  className,
  overlayClassName,
  contentClassName,
  'data-testid': testId
}: BaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Prevent body scroll and manage focus when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      
      // Focus the modal container for accessibility
      setTimeout(() => {
        modalRef.current?.focus()
      }, 100)
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset'
      
      // Restore focus to previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Focus trap within modal
  useEffect(() => {
    if (!isOpen) return

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm",
            overlayClassName
          )}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          data-testid={testId}
          {...modalVariants.backdrop}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />

          {/* Modal */}
          <motion.div 
            ref={modalRef}
            tabIndex={-1}
            className={cn(
              "relative w-full max-h-[90vh] rounded-lg shadow-xl overflow-hidden z-10",
              "focus:outline-none",
              sizeClasses[size],
              variantClasses[variant],
              className
            )}
            {...modalVariants.modal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <motion.div 
              className={cn(
                "flex items-center justify-between p-6 border-b",
                variant === 'default' ? 'border-gray-200' : 'border-current/20'
              )}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <h2 
                id="modal-title" 
                className={cn(
                  "font-semibold",
                  getClinicalTypographyClass('modalTitle'),
                  variant === 'default' ? 'text-gray-900' : 
                  variant === 'clinical' ? 'text-gray-800' :
                  variant === 'warning' ? 'text-yellow-800' :
                  'text-red-800'
                )}
              >
                {title}
              </h2>
              {showCloseButton && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className={cn(
                      "h-8 w-8 p-0 hover:bg-gray-100 transition-colors duration-200",
                      transitionClasses.focus.ring
                    )}
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Content */}
            <motion.div 
              className={cn(
                "overflow-y-auto",
                footer ? "max-h-[calc(90vh-140px)]" : "max-h-[calc(90vh-80px)]",
                contentClassName
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.2 }}
            >
              {children}
            </motion.div>

            {/* Footer */}
            {footer && (
              <motion.div 
                className={cn(
                  "flex items-center justify-end gap-3 p-6 border-t bg-gray-50",
                  variant === 'default' ? 'border-gray-200' : 'border-current/20'
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.2 }}
              >
                {footer}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Use portal rendering by default for better z-index management
  if (usePortal && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}