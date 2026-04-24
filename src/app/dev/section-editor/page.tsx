'use client'

/**
 * Dev-only preview of the outline ⇄ prose SectionEditor shell.
 * Throwaway route — delete once the editor is wired into a real report
 * route behind a flag (spec §15.12).
 */

import React, { useState } from 'react'
import SectionEditor from '@/components/report/section-editor/SectionEditor'
import type { SectionTree } from '@/components/report/section-editor/types'
import {
  makeCriterion,
  makeParagraph,
  makeScoreCard,
  type ParagraphBlock,
} from '@/components/report/section-editor/types'

const topic = (text: string, id = 't'): ParagraphBlock => ({
  kind: 'paragraph',
  id,
  text,
  children: [],
})

const SAMPLES: Record<string, SectionTree> = {
  'Lucia — flat': {
    id: 's1',
    topic: topic('Lucia presents with reduced intelligibility.', 't1'),
    blocks: [
      makeParagraph('p1', 'She attends second grade at Lincoln Elementary.'),
      makeParagraph('p2', 'Medical history is unremarkable.'),
      makeParagraph('p3', 'Parent reports sound substitutions since age three.'),
    ],
  },
  'Lucia — nested': {
    id: 's2',
    topic: topic('Lucia presents with reduced intelligibility.', 't2'),
    blocks: [
      {
        ...makeParagraph('p1', 'Articulation errors are primarily phonological in nature.'),
        children: [
          makeParagraph('p1a', 'Fronting of /k/ and /g/ to /t/ and /d/.'),
          makeParagraph('p1b', 'Stopping of fricatives.'),
        ],
      },
      makeParagraph('p3', 'Medical history is unremarkable.'),
    ],
  },
  'Scores + criteria': (() => {
    const sc = makeScoreCard('sc1')
    sc.testName = 'Goldman-Fristoe-3'
    sc.standardScore = '78'
    sc.percentile = '7'
    sc.interpretation = 'More than one standard deviation below the mean.'
    const crit = makeCriterion('c1', 'Communication impairment is present')
    crit.met = true
    crit.justification = 'Intelligibility reduced in connected speech; Goldman-Fristoe-3 SS = 78.'
    return {
      id: 's3',
      topic: topic('Standardized measures converge on a moderate articulation delay.', 't3'),
      blocks: [sc, crit, makeParagraph('p4', 'Receptive language fell within the average range.')],
    }
  })(),
  Empty: {
    id: 's4',
    topic: topic('', 't4'),
    blocks: [],
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
