import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../../../lib/api'
import { useToken } from '../../../lib/devAuth'
import type { Word } from '@zungo/core'

export const Route = createFileRoute('/_app/vocabulary/')({
  component: VocabularyPage,
})

const FILTERS = ['All', 'Noun', 'Verb', 'Adjective', 'Other'] as const
type Filter = typeof FILTERS[number]

function VocabularyPage() {
  const getToken = useToken()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('All')

  const { data: words, isLoading } = useQuery({
    queryKey: ['words'],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<Word[]>('/api/words', {}, token)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      return apiFetch(`/api/words/${id}`, { method: 'DELETE' }, token)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['words'] }),
  })

  const filtered = words?.filter(w => {
    if (filter === 'All') return true
    if (filter === 'Noun') return w.part_of_speech?.toLowerCase().includes('noun')
    if (filter === 'Verb') return w.part_of_speech?.toLowerCase().includes('verb')
    if (filter === 'Adjective') return w.part_of_speech?.toLowerCase().includes('adj')
    return !['noun', 'verb', 'adjective', 'adverb'].some(p => w.part_of_speech?.toLowerCase().includes(p))
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-fraunces text-2xl font-bold text-text-1">Vocabulary</h1>
          <p className="text-sm text-text-3">{words?.length ?? 0} words saved</p>
        </div>
        <Link
          to="/vocabulary/review"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Review
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-surface border border-[var(--c-border)] text-text-2 hover:border-primary/40'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Word list */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-2xl border border-[var(--c-border)] p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !filtered?.length && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📚</div>
          <p className="font-fraunces text-lg text-text-2 mb-1">No words yet</p>
          <p className="text-sm text-text-3 mb-4">Go to Reading mode to save words from text.</p>
          <Link
            to="/read"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Start reading
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {filtered?.map(word => (
          <div
            key={word.id}
            className="bg-surface rounded-2xl border border-[var(--c-border)] p-4 flex items-center justify-between hover:border-primary/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-fraunces text-lg font-semibold text-text-1">{word.german}</span>
                <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full">
                  {word.part_of_speech}
                </span>
              </div>
              <p className="text-sm text-text-2 mt-0.5 truncate">{word.translation}</p>
              {word.example_sentence && (
                <p className="text-xs text-text-3 mt-1 italic truncate">{word.example_sentence}</p>
              )}
            </div>
            <button
              onClick={() => deleteMutation.mutate(word.id)}
              disabled={deleteMutation.isPending}
              className="ml-3 p-2 text-text-3 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
