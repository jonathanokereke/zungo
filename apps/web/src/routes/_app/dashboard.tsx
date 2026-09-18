import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { apiFetch } from '../../lib/api'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { getAccessTokenSilently } = useAuth0()

  const { data: progress } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      return apiFetch<{
        user: { level: string; streak: number }
        total_words: number
        retention_rate_30d: number
        reviews_30d: number
      }>('/api/progress', {}, token)
    },
  })

  const { data: dueReviews } = useQuery({
    queryKey: ['reviews', 'due'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()
      return apiFetch<unknown[]>('/api/reviews/due', {}, token)
    },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Reviews due" value={dueReviews?.length ?? 0} />
        <StatCard label="Streak" value={`${progress?.user.streak ?? 0} days`} />
        <StatCard label="Words saved" value={progress?.total_words ?? 0} />
        <StatCard label="Retention (30d)" value={`${progress?.retention_rate_30d ?? 0}%`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionCard href="/_app/read" title="Read" description="Paste German text and look up words" />
        <ActionCard href="/_app/vocabulary/review" title="Review" description={`${dueReviews?.length ?? 0} cards due`} />
        <ActionCard href="/_app/write" title="Write" description="Practice with AI correction" />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-indigo-700 mt-1">{value}</p>
    </div>
  )
}

function ActionCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link to={href} className="bg-indigo-600 text-white rounded-xl p-5 hover:bg-indigo-700 transition-colors block">
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-indigo-200 text-sm">{description}</p>
    </Link>
  )
}
