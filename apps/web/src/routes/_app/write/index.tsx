import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../../lib/api'
import { useToken } from '../../../lib/devAuth'
import type { WritingFeedback } from '@zungo/core'

export const Route = createFileRoute('/_app/write/')({
  component: WritePage,
})

const API_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001'

function WritePage() {
  const getToken = useToken()
  const [userText, setUserText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: promptData } = useQuery({
    queryKey: ['writing-prompt'],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<{ prompt: string; level: string }>('/api/writing/prompt', {}, token)
    },
  })

  async function handleSubmit() {
    if (userText.length < 50) {
      setError('Please write at least 50 characters.')
      return
    }
    setError(null)
    setStreaming(true)
    setFeedback(null)

    const token = await getToken()
    let buffer = ''

    const response = await fetch(`${API_URL}/api/writing/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt: promptData?.prompt ?? '', user_text: userText }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) { setStreaming(false); return }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data)
          if (parsed.chunk) buffer += parsed.chunk
        } catch {}
      }
    }

    try {
      setFeedback(JSON.parse(buffer))
    } catch {
      setError('Could not parse AI response.')
    }
    setStreaming(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-text-1 mb-1">Writing Practice</h1>
        <p className="text-sm text-text-3">Get AI corrections on your German writing</p>
      </div>

      {/* Prompt card */}
      {promptData && (
        <div className="bg-accent-light border border-accent/30 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-accent text-sm">✨</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Today's prompt</span>
            <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">{promptData.level}</span>
          </div>
          <p className="text-text-1 font-medium">{promptData.prompt}</p>
        </div>
      )}

      {/* Text area */}
      <div className="bg-surface rounded-2xl border border-[var(--c-border)] overflow-hidden mb-4">
        <textarea
          className="w-full p-4 text-sm text-text-1 placeholder-text-3 resize-none focus:outline-none"
          rows={8}
          placeholder="Schreiben Sie auf Deutsch… (min. 50 Zeichen)"
          value={userText}
          onChange={e => setUserText(e.target.value)}
          disabled={streaming}
        />
        <div className="px-4 pb-3 flex items-center justify-between border-t border-[var(--c-border)]">
          <span className={`text-xs ${userText.length >= 50 ? 'text-primary' : 'text-text-3'}`}>
            {userText.length} / 50 min
          </span>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={streaming || userText.length < 50}
        className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40 mb-8 flex items-center justify-center gap-2"
      >
        {streaming ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Correcting…
          </>
        ) : (
          'Get AI correction'
        )}
      </button>

      {/* Feedback */}
      {feedback && (
        <div className="space-y-5">
          {/* Overall */}
          <div className="bg-surface rounded-2xl border border-[var(--c-border)] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-fraunces text-lg font-semibold text-text-1">Feedback</h2>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                feedback.level_assessment === 'above_level'
                  ? 'bg-green-100 text-green-700'
                  : feedback.level_assessment === 'at_level'
                  ? 'bg-primary-light text-primary'
                  : 'bg-accent-light text-accent'
              }`}>
                {feedback.level_assessment.replace('_', ' ')}
              </span>
            </div>
            <p className="text-text-2 text-sm leading-relaxed">{feedback.overall_feedback}</p>
          </div>

          {/* Corrections */}
          {feedback.corrections.length > 0 && (
            <div>
              <h2 className="font-fraunces text-lg font-semibold text-text-1 mb-3">
                Corrections ({feedback.corrections.length})
              </h2>
              <div className="space-y-3">
                {feedback.corrections.map((c, i) => (
                  <div key={i} className="bg-surface rounded-2xl border border-[var(--c-border)] p-4">
                    <div className="flex gap-2 flex-wrap items-center mb-2">
                      <span className="line-through text-red-400 text-sm">{c.original}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-text-3">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span className="text-primary font-semibold text-sm">{c.corrected}</span>
                    </div>
                    <p className="text-sm text-text-2">{c.explanation}</p>
                    <p className="text-xs text-text-3 mt-1">Rule: {c.rule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corrected text */}
          <div>
            <h2 className="font-fraunces text-lg font-semibold text-text-1 mb-3">Corrected text</h2>
            <div className="bg-primary-light border border-primary/20 rounded-2xl p-4 text-sm text-text-1 whitespace-pre-wrap leading-relaxed">
              {feedback.corrected_text}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
