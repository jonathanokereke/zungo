import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../../../lib/api'
import { useToken } from '../../../lib/devAuth'

export const Route = createFileRoute('/_app/vocabulary/review')({
  component: ReviewPage,
})

type ReviewItem = {
  review: { id: string; word_id: string; ease_factor: number; interval: number }
  word: { id: string; german: string; translation: string; example_sentence: string | null }
}

const SRS_BUTTONS = [
  { label: 'Again', quality: 0, color: '#DC2626', bg: 'rgba(220,38,38,0.08)', interval: '1d' },
  { label: 'Hard',  quality: 3, color: '#D97706', bg: 'rgba(217,119,6,0.08)',  interval: '3d' },
  { label: 'Good',  quality: 4, color: '#0C6B6B', bg: 'rgba(12,107,107,0.08)', interval: '7d' },
  { label: 'Easy',  quality: 5, color: '#059669', bg: 'rgba(5,150,105,0.08)',  interval: '14d' },
] as const

function ReviewPage() {
  const getToken = useToken()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ reviewed: 0, passed: 0 })
  const [done, setDone] = useState(false)

  const { data: queue, isLoading } = useQuery({
    queryKey: ['reviews', 'due'],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<ReviewItem[]>('/api/reviews/due', {}, token)
    },
  })

  const submitMutation = useMutation({
    mutationFn: async ({ wordId, quality }: { wordId: string; quality: number }) => {
      const token = await getToken()
      return apiFetch(`/api/reviews/${wordId}`, { method: 'POST', body: JSON.stringify({ quality }) }, token)
    },
    onSuccess: (_, { quality }) => {
      setStats(prev => ({ reviewed: prev.reviewed + 1, passed: prev.passed + (quality >= 3 ? 1 : 0) }))
      const next = cardIndex + 1
      if (queue && next >= queue.length) {
        setDone(true)
        qc.invalidateQueries({ queryKey: ['reviews'] })
      } else {
        setCardIndex(next)
        setFlipped(false)
      }
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!queue?.length || done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-fraunces text-2xl font-bold text-text-1 mb-2">Session complete!</h2>
        <p className="text-text-3 mb-2">
          {stats.reviewed > 0
            ? `Reviewed ${stats.reviewed} cards · ${stats.passed} correct`
            : 'No cards due right now.'}
        </p>
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          className="mt-4 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          Back to home
        </button>
      </div>
    )
  }

  const current = queue[cardIndex]!
  const progress = ((cardIndex) / queue.length) * 100

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: '/vocabulary' })}
          className="p-2 text-text-3 hover:text-text-1 hover:bg-surface rounded-lg transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 h-2 bg-primary-light rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-text-3 tabular-nums">{cardIndex + 1}/{queue.length}</span>
      </div>

      {/* 3D Flip Card */}
      <div className="card-scene mb-6" style={{ height: 260 }}>
        <div className={`card-inner ${flipped ? 'flipped' : ''}`} style={{ height: 260 }}>
          {/* Front */}
          <div
            className="card-face bg-surface rounded-3xl border border-[var(--c-border)] shadow-sm flex flex-col items-center justify-center cursor-pointer p-8"
            onClick={() => !flipped && setFlipped(true)}
          >
            <p className="font-fraunces text-4xl font-bold text-text-1 mb-3">{current.word.german}</p>
            <p className="text-sm text-text-3">Tap to reveal meaning</p>
            <div className="mt-6 w-8 h-1 bg-primary-light rounded-full" />
          </div>

          {/* Back */}
          <div className="card-face card-back bg-surface rounded-3xl border border-[var(--c-border)] shadow-sm flex flex-col items-center justify-center p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-3 mb-2">Translation</p>
            <p className="font-fraunces text-3xl font-semibold text-primary text-center mb-4">{current.word.translation}</p>
            {current.word.example_sentence && (
              <p className="text-sm text-text-2 italic text-center">{current.word.example_sentence}</p>
            )}
          </div>
        </div>
      </div>

      {/* SRS buttons — only after flip */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {SRS_BUTTONS.map(({ label, quality, color, bg, interval }) => (
            <button
              key={label}
              onClick={() => submitMutation.mutate({ wordId: current.word.id, quality })}
              disabled={submitMutation.isPending}
              className="flex flex-col items-center py-3 px-2 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: bg, color }}
            >
              <span>{label}</span>
              <span className="text-xs opacity-60 mt-0.5">{interval}</span>
            </button>
          ))}
        </div>
      )}

      {!flipped && (
        <button
          onClick={() => setFlipped(true)}
          className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold hover:bg-primary-dark transition-colors"
        >
          Show answer
        </button>
      )}
    </div>
  )
}
