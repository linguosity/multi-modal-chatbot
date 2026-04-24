'use client'

import type { HTMLAttributes } from 'react'

export type EvidenceKind = 'pdf' | 'audio' | 'image' | 'note' | 'transcript' | 'document'

const FILE_LETTERS: Record<EvidenceKind, string> = {
  pdf: 'PDF',
  audio: 'M4A',
  image: 'JPG',
  note: 'TXT',
  transcript: 'SLT',
  document: 'DOC',
}

export interface EvidenceChipProps extends HTMLAttributes<HTMLDivElement> {
  kind?: EvidenceKind
  name: string
  meta?: string
  tone?: 'default' | 'terra' | 'tan'
  focused?: boolean
}

export function EvidenceChip({
  kind = 'pdf',
  name,
  meta,
  tone = 'default',
  focused = false,
  className = '',
  ...rest
}: EvidenceChipProps) {
  const toneClass = tone === 'default' ? '' : tone
  const focusClass = focused ? 'ring-2 ring-offset-2' : ''
  const cls = ['wf-chip', kind, toneClass, focusClass, className].filter(Boolean).join(' ')
  return (
    <div className={cls} {...rest}>
      <span className="file-ic">
        <span className="file-letters">{FILE_LETTERS[kind]}</span>
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="file-name">{name}</div>
        {meta && <div className="file-type">{meta}</div>}
      </div>
    </div>
  )
}

export function fileKindFromType(mime: string): EvidenceKind {
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('text/')) return 'note'
  return 'document'
}
