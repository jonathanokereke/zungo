import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { apiFetch } from '../../lib/api'

export const Route = createFileRoute('/_app/progress')({
  component: ProgressPage,
})

function ProgressPage() {
  const { getAccessTokenSilently } = useAuth0()

  const { data } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      return apiFetch<{
        user: { level: string; streak: number; last_active: string | null }
        total_words: number
        total_writing_sessions: number
        retention_rate_30d: number
        reviews_30d: number
      }>('/api/progress', {}, token)
    },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Progress</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Stat label="CEFR Level" value={data?.user.level ?? '—'} />
        <Stat label="Streak" value={`${data?.user.streak ?? 0} days`} />
        <Stat label="Words saved" value={data?.total_words ?? 0} />
        <Stat label="Writing sessions" value={data?.total_writing_sessions ?? 0} />
        <Stat label="Reviews (30d)" value={data?.reviews_30d ?? 0} />
        <Stat label="Retention (30d)" value={`${data?.retention_rate_30d ?? 0}%`} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-indigo-700 mt-1">{value}</p>
    </div>
  )
}
