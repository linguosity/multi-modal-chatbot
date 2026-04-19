'use client'

import { useEffect, useRef, useState } from 'react'

type Message =
  | { from: 'ai' | 'user'; text: string; working?: false }
  | { from: 'ai'; working: true; text?: undefined }

const INITIAL: Message[] = [
  { from: 'ai', text: "Hi — I'm reading everything you've uploaded. Ask me anything, or tell me what to do next." },
  { from: 'ai', text: "Examples:\n• 'Summarize what the CELF-5 says'\n• 'Move the teacher email to Background'\n• 'Any conflicts in the evidence?'" },
]

const QUICK_REPLIES = ['Summarize CELF-5', 'Any conflicts?', 'Draft section 5']

/**
 * Placeholder canned responses — replace with real API call once chat endpoint exists.
 * Intentionally local so the chat widget is usable before the API is wired up.
 */
function canned(q: string): string {
  const qs = q.toLowerCase()
  if (qs.includes('celf')) return 'CELF-5 Core Language SS 72 (-1.87 SD, 3rd %ile). Receptive Index 76, Expressive Index 71 — both ≥1.5 SD below mean. Ready to drop this into §05 · Receptive & Expressive Language.'
  if (qs.includes('conflict')) return 'One conflict: GFTA-3 shows articulation WNL at single-word level (SS 88), but classroom_obs.m4a shows frequent final consonant deletion in connected speech. Worth flagging in §04.'
  if (qs.includes('draft')) return 'Drafting §05 · Receptive & Expressive Language now — standard 3-paragraph structure, cites CELF-5 + language sample. Preview will appear in the skeleton in ~6 s.'
  if (qs.includes('move')) return 'Moved teacher_email.txt → §02 Background. The adverse-impact quote is now tagged under §06 Pragmatic as a secondary reference.'
  return "Got it — I'll handle that and surface results in your working surface. Want me to explain my reasoning as I go?"
}

export function LinguosityChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Message[]>(INITIAL)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [msgs, open])

  const send = (text?: string) => {
    const q = (text ?? draft).trim()
    if (!q) return
    setMsgs(m => [...m, { from: 'user', text: q }])
    setDraft('')
    setTimeout(() => {
      setMsgs(m => [...m, { from: 'ai', working: true }])
    }, 200)
    setTimeout(() => {
      setMsgs(m => {
        const withoutWorking = m.filter(x => !('working' in x && x.working))
        return [...withoutWorking, { from: 'ai', text: canned(q) }]
      })
    }, 1400)
  }

  if (!open) {
    return (
      <button
        type="button"
        className="wf-chat-fab"
        onClick={() => setOpen(true)}
        aria-label="Open Linguosity chat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span>Ask Linguosity</span>
        <span className="wf-chat-fab-badge">AI</span>
      </button>
    )
  }

  return (
    <div className="wf-chat-panel" role="dialog" aria-label="Linguosity chat">
      <div className="wf-chat-header">
        <div className="flex items-center gap-2">
          <div className="wf-ico" style={{ background: 'var(--terracotta)', color: '#fff', borderColor: 'var(--line)' }}>L</div>
          <div className="flex flex-col gap-0.5">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>Linguosity</div>
            <div className="wf-sm" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              ● online · reading your report
            </div>
          </div>
        </div>
        <button
          type="button"
          className="wf-chat-close"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      <div className="wf-chat-scroll" ref={scrollRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`wf-chat-bubble ${m.from}`}>
            {'working' in m && m.working ? (
              <div className="flex items-center gap-2">
                <div className="wf-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span className="wf-sm">thinking…</span>
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
            )}
          </div>
        ))}
      </div>

      <div className="wf-chat-quick">
        {QUICK_REPLIES.map((q) => (
          <button key={q} type="button" onClick={() => send(q)}>
            {q}
          </button>
        ))}
      </div>

      <div className="wf-chat-input">
        <input
          type="text"
          placeholder="Ask or instruct…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              send()
            }
          }}
          aria-label="Chat message"
        />
        <button
          type="button"
          className="wf-btn sm primary"
          onClick={() => send()}
          disabled={!draft.trim()}
        >
          send ↵
        </button>
      </div>
    </div>
  )
}
