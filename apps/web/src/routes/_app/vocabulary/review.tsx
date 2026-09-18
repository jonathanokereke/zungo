import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import { apiFetch } from '../../../lib/api'

export const Route = createFileRoute('/_app/vocabulary/review')({
  component: ReviewPage,
})

type ReviewItem = {
  review: { id: string; word_id: string; ease_factor: number }
  word: { id: string; german: string; translation: string; example_sentence: string | null }
}

function ReviewPage() {
  const { getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, passed: 0 })
  const [done, setDone] = useState(false)

  const { data: queue, isLoading } = useQuery({
    queryKey: ['reviews', 'due'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      return apiFetch<ReviewItem[]>('/api/reviews/due', {}, token)
    },
  })

  const submitMutation = useMutation({
    mutationFn: async ({ wordId, quality }: { wordId: string; quality: number }) => {
      const token = await getAccessTokenSilently()
      return apiFetch(`/api/reviews/${wordId}`, { method: 'POST', body: JSON.stringify({ quality }) }, token)
    },
    onSuccess: (_, { quality }) => {
      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        passed: prev.passed + (quality >= 3 ? 1 : 0),
      }))
      const nextIndex = cardIndex + 1
      if (queue && nextIndex >= queue.length) {
        setDone(true)
        qc.invalidateQueries({ queryKey: ['reviews'] })
      } else {
        setCardIndex(nextIndex)
        setFlipped(false)
      }
    },
  })

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading reviews…</div>
  if (!queue?.length || done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Session complete!</h2>
        <p className="text-gray-500 mb-4">
          Reviewed {sessionStats.reviewed} cards · {sessionStats.passed} passed
        </p>
        <button onClick={() => navigate({ to: '/_app/dashboard' })} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          Back to dashboard
        </button>
      </div>
    )
  }

  const current = queue[cardIndex]!

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-sm text-gray-400 mb-4">{cardIndex + 1} / {queue.length}</div>

      <div
        className="bg-white rounded-2xl shadow-lg p-8 min-h-48 flex flex-col items-center justify-center cursor-pointer mb-6"
        onClick={() => setFlipped(true)}
      >
        <p className="text-3xl font-bold text-gray-900">{current.word.german}</p>
        {flipped && (
          <div className="mt-6 text-center">
            <p className="text-xl text-indigo-700">{current.word.translation}</p>
            {current.word.example_sentence && (
              <p className="text-sm text-gray-400 mt-3 italic">{current.word.example_sentence}</p>
            )}
          </div>
        )}
        {!flipped && <p className="text-gray-400 text-sm mt-4">Tap to reveal</p>}
      </div>

      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Again', quality: 0, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
            { label: 'Hard', quality: 3, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
            { label: 'Good', quality: 4, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
            { label: 'Easy', quality: 5, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
          ].map(({ label, quality, color }) => (
            <button
              key={label}
              onClick={() => submitMutation.mutate({ wordId: current.word.id, quality })}
              disabled={submitMutation.isPending}
              className={`${color} rounded-lg py-3 text-sm font-medium transition-colors`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
