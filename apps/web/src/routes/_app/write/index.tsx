import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../../lib/api'
import type { WritingFeedback } from '@zungo/core'

export const Route = createFileRoute('/_app/write/')({
  component: WritePage,
})

const API_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001'

function WritePage() {
  const { getAccessTokenSilently } = useAuth0()
  const [userText, setUserText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: promptData } = useQuery({
    queryKey: ['writing-prompt'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
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

    const token = await getAccessTokenSilently()
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Writing Practice</h1>
      {promptData && (
        <p className="text-indigo-700 bg-indigo-50 rounded-lg p-3 mb-4">
          <span className="font-semibold">Prompt:</span> {promptData.prompt}
        </p>
      )}

      <textarea
        className="w-full h-48 border border-gray-300 rounded-lg p-3 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Write in German (min 50 characters)…"
        value={userText}
        onChange={e => setUserText(e.target.value)}
        disabled={streaming}
      />
      <p className="text-xs text-gray-400 mb-3">{userText.length} characters</p>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={streaming || userText.length < 50}
        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 mb-8"
      >
        {streaming ? 'Correcting…' : 'Get correction'}
      </button>

      {feedback && (
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold text-lg mb-2">Overall Feedback</h2>
            <p className="text-gray-700">{feedback.overall_feedback}</p>
            <span className={`mt-2 inline-block text-xs rounded px-2 py-1 ${
              feedback.level_assessment === 'above_level' ? 'bg-green-100 text-green-700' :
              feedback.level_assessment === 'at_level' ? 'bg-blue-100 text-blue-700' :
              'bg-orange-100 text-orange-700'
            }`}>{feedback.level_assessment.replace('_', ' ')}</span>
          </div>

          {feedback.corrections.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-3">Corrections ({feedback.corrections.length})</h2>
              <div className="space-y-3">
                {feedback.corrections.map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex gap-2 flex-wrap mb-1">
                      <span className="line-through text-red-500">{c.original}</span>
                      <span className="text-green-600 font-medium">{c.corrected}</span>
                    </div>
                    <p className="text-sm text-gray-600">{c.explanation}</p>
                    <p className="text-xs text-indigo-500 mt-1">Rule: {c.rule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-lg mb-2">Corrected Text</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {feedback.corrected_text}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
