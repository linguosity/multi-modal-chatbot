import { useState, useCallback } from 'react'

export interface ModalState {
  isOpen: boolean
  data?: any
}

export interface ModalActions {
  open: (data?: any) => void
  close: () => void
  toggle: () => void
}

export function useModal(initialOpen = false): ModalState & ModalActions {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [data, setData] = useState<any>(undefined)

  const open = useCallback((modalData?: any) => {
    setIsOpen(true)
    if (modalData !== undefined) {
      setData(modalData)
    }
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setData(undefined)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return {
    isOpen,
    data,
    open,
    close,
    toggle
  }
}