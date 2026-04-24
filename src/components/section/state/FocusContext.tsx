'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type InspectorFacet = 'schema' | 'ai' | 'sources'

type FocusState = {
  focusedFieldKey: string | null
  facet: InspectorFacet
  structureMode: boolean
  inspectorOpen: boolean
  setFocusedField: (key: string | null) => void
  setFacet: (facet: InspectorFacet) => void
  toggleStructureMode: () => void
  setInspectorOpen: (open: boolean) => void
}

const Ctx = createContext<FocusState | null>(null)

const LS_INSPECTOR = 'linguo-section-v2-inspector-open'

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [focusedFieldKey, setFocusedField] = useState<string | null>(null)
  const [facet, setFacet] = useState<InspectorFacet>('schema')
  const [structureMode, setStructureMode] = useState(false)
  const [inspectorOpen, setInspectorOpenState] = useState(true)

  // Restore inspector open state from localStorage so reviewers don't have to
  // re-collapse it every page load.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_INSPECTOR)
      if (saved !== null) setInspectorOpenState(saved === 'true')
    } catch {
      /* no-op */
    }
  }, [])

  const setInspectorOpen = useCallback((open: boolean) => {
    setInspectorOpenState(open)
    try {
      localStorage.setItem(LS_INSPECTOR, String(open))
    } catch {
      /* no-op */
    }
  }, [])

  const toggleStructureMode = useCallback(() => setStructureMode((v) => !v), [])

  const value = useMemo<FocusState>(
    () => ({
      focusedFieldKey,
      facet,
      structureMode,
      inspectorOpen,
      setFocusedField,
      setFacet,
      toggleStructureMode,
      setInspectorOpen,
    }),
    [focusedFieldKey, facet, structureMode, inspectorOpen, toggleStructureMode, setInspectorOpen],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFocusedField(): FocusState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useFocusedField must be used inside <FocusProvider>')
  return ctx
}
