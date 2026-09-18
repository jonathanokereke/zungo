import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { apiFetch } from '../../../lib/api'
import type { Word } from '@german-app/core'

export const Route = createFileRoute('/_app/vocabulary/')({
  component: VocabularyPage,
})

function VocabularyPage() {
  const { getAccessTokenSilently } = useAuth0()
  const qc = useQueryClient()

  const { data: words } = useQuery({
    queryKey: ['words'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      return apiFetch<Word[]>('/api/words', {}, token)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessTokenSilently()
      return apiFetch(`/api/words/${id}`, { method: 'DELETE' }, token)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['words'] }),
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vocabulary</h1>
        <Link to="/_app/vocabulary/review" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          Review
        </Link>
      </div>

      {!words?.length && <p className="text-gray-400">No words saved yet. Go to Reading mode to save words.</p>}

      <div className="space-y-2">
        {words?.map(word => (
          <div key={word.id} className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
            <div>
              <span className="font-semibold text-gray-900">{word.german}</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-gray-600">{word.translation}</span>
              <span className="ml-2 text-xs bg-gray-100 rounded px-1.5 py-0.5">{word.part_of_speech}</span>
            </div>
            <button
              onClick={() => deleteMutation.mutate(word.id)}
              className="text-gray-300 hover:text-red-500 text-sm"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
