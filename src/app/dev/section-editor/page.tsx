'use client'

/**
 * Dev-only preview of the outline ⇄ prose SectionEditor shell.
 * Throwaway route — delete once the editor is wired into a real report
 * route behind a flag (spec §15.12).
 */

import React, { useState } from 'react'
import SectionEditor from '@/components/report/section-editor/SectionEditor'
import type { SectionTree } from '@/components/report/section-editor/types'

const SAMPLES: Record<string, SectionTree> = {
  'Lucia — flat': {
    id: 'section_1',
    topic: { id: 't1', text: 'Lucia presents with reduced intelligibility.' },
    points: [
      { id: 'p1', text: 'She attends second grade at Lincoln Elementary.', children: [] },
      { id: 'p2', text: 'Medical history is unremarkable.', children: [] },
      { id: 'p3', text: 'Parent reports sound substitutions since age three.', children: [] },
    ],
  },
  'Lucia — nested': {
    id: 'section_2',
    topic: { id: 't2', text: 'Lucia presents with reduced intelligibility.' },
    points: [
      {
        id: 'p1',
        text: 'Articulation errors are primarily phonological in nature.',
        children: [
          { id: 'p1a', text: 'Fronting of /k/ and /g/ to /t/ and /d/.', children: [] },
          { id: 'p1b', text: 'Stopping of fricatives.', children: [] },
        ],
      },
      {
        id: 'p2',
        text: 'Receptive language is within functional limits.',
        children: [
          { id: 'p2a', text: 'Standard score of 98 on the CELF-5 core subtests.', children: [] },
        ],
      },
      { id: 'p3', text: 'Medical history is unremarkable.', children: [] },
    ],
  },
  Empty: {
    id: 'section_3',
    topic: { id: 't3', text: '' },
    points: [],
  },
}

export default function SectionEditorDevPage() {
  const [key, setKey] = useState<keyof typeof SAMPLES>('Lucia — flat')
  const [tree, setTree] = useState<SectionTree>(SAMPLES[key])

  const pick = (k: keyof typeof SAMPLES) => {
    setKey(k)
    setTree(SAMPLES[k])
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        backgroundColor: '#f0e9d6',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <header style={{ marginBottom: 24 }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#8a7f6e',
              margin: 0,
            }}
          >
            Dev preview — throwaway route
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              lineHeight: 1.1,
              margin: '8px 0 0',
              color: '#2a241b',
            }}
          >
            Outline ⇄ Prose Section Editor
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: '#5c5244' }}>
            Shell only. No editing yet — the component renders a read-only preview of
            each view and exercises the mode toggle, palette, typography, and ARIA
            wiring. Docs: <code>docs/outline-prose-editor-spec.md</code>.
          </p>
        </header>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {Object.keys(SAMPLES).map((k) => {
            const sel = k === key
            return (
              <button
                key={k}
                type="button"
                onClick={() => pick(k as keyof typeof SAMPLES)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid #d4c9ad',
                  background: sel ? '#2a241b' : '#fff',
                  color: sel ? '#fff' : '#2a241b',
                  cursor: 'pointer',
                }}
              >
                {k}
              </button>
            )
          })}
        </div>

        <SectionEditor value={tree} onChange={setTree} label="Dev preview" />
      </div>
    </div>
  )
}
