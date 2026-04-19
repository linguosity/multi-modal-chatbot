"use client"

import { useCallback, useRef, useState } from 'react'

export default function StructuredDemoPage() {
  const [inputText, setInputText] = useState(
    'Alice and Bob are going to a science fair on Friday.'
  )
  const [demoResult, setDemoResult] = useState<any>(null)
  const [streamEvents, setStreamEvents] = useState<any[]>([])
  const streamingRef = useRef(false)

  const runDemo = useCallback(async () => {
    setDemoResult(null)
    try {
      const res = await fetch('/api/structured/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })
      const json = await res.json()
      setDemoResult(json)
    } catch (e: any) {
      setDemoResult({ success: false, error: e?.message || String(e) })
    }
  }, [inputText])

  const runStream = useCallback(async () => {
    setStreamEvents([])
    streamingRef.current = true
    try {
      const res = await fetch('/api/structured/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (streamingRef.current) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let idx: number
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)

          const lines = rawEvent.split('\n')
          let eventType = 'message'
          let data = ''
          for (const l of lines) {
            if (l.startsWith('event:')) eventType = l.slice(6).trim()
            else if (l.startsWith('data:')) data += l.slice(5).trim()
          }

          try {
            const parsed = data ? JSON.parse(data) : null
            setStreamEvents(prev => [...prev, { event: eventType, data: parsed }])
          } catch {
            setStreamEvents(prev => [...prev, { event: eventType, data }])
          }
        }
      }
    } catch (e: any) {
      setStreamEvents(prev => [...prev, { event: 'error', data: e?.message || String(e) }])
    } finally {
      streamingRef.current = false
    }
  }, [inputText])

  const stopStream = useCallback(() => {
    streamingRef.current = false
  }, [])

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Structured Outputs Demo</h1>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Input text</label>
        <textarea
          className="w-full h-28 rounded border px-3 py-2 text-sm"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={runDemo}
          className="rounded bg-blue-600 px-3 py-2 text-white text-sm hover:bg-blue-700"
        >
          Run schema demo
        </button>
        <button
          onClick={runStream}
          className="rounded bg-emerald-600 px-3 py-2 text-white text-sm hover:bg-emerald-700"
        >
          Start streaming
        </button>
        <button
          onClick={stopStream}
          className="rounded bg-gray-600 px-3 py-2 text-white text-sm hover:bg-gray-700"
        >
          Stop
        </button>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Demo result</h2>
        <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto">
          {demoResult ? JSON.stringify(demoResult, null, 2) : '—'}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Streaming events</h2>
        <div className="space-y-2 max-h-96 overflow-auto">
          {streamEvents.length === 0 ? (
            <div className="text-sm text-gray-500">—</div>
          ) : (
            streamEvents.map((e, i) => (
              <pre key={i} className="bg-gray-50 border rounded p-2 text-xs">
                {JSON.stringify(e, null, 2)}
              </pre>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

