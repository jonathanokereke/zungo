import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'
import { useToken } from '../../lib/devAuth'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

type ProgressData = {
  user: { level: string; streak: number; last_active: string | null }
  total_words: number
  total_writing_sessions: number
  retention_rate_30d: number
  reviews_30d: number
}

function DashboardPage() {
  const getToken = useToken()

  const { data: progress } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<ProgressData>('/api/progress', {}, token)
    },
  })

  const { data: dueReviews } = useQuery({
    queryKey: ['reviews', 'due'],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<unknown[]>('/api/reviews/due', {}, token)
    },
  })

  const streak = progress?.user.streak ?? 0
  const level = progress?.user.level ?? 'B1'
  const totalWords = progress?.total_words ?? 0
  const due = dueReviews?.length ?? 0

  const isActiveToday = progress?.user.last_active
    ? new Date(progress.user.last_active).toDateString() === new Date().toDateString()
    : false
  const showStreakBanner = progress !== undefined && !isActiveToday

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Streak reminder banner */}
      {showStreakBanner && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4 text-sm">
          <span className="text-xl flex-shrink-0">🔥</span>
          <div className="flex-1">
            <span className="font-semibold text-amber-900">You haven't practiced today.</span>
            <span className="text-amber-700 ml-1">
              {streak > 0 ? `Don't break your ${streak}-day streak!` : 'Start your streak today!'}
            </span>
          </div>
          <a href="/_app/vocabulary/review" className="flex-shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2">
            Review now
          </a>
        </div>
      )}

      {/* Hero banner */}
      <div
        className="rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-dark) 100%)' }}
      >
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-80 mb-1">Good morning, learner!</p>
          <h1 className="font-fraunces text-3xl font-bold mb-4">Keep the streak alive</h1>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-xs opacity-70">day streak</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-2xl font-bold">{level}</p>
              <p className="text-xs opacity-70">current level</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-2xl font-bold">{totalWords}</p>
              <p className="text-xs opacity-70">words saved</p>
            </div>
          </div>
        </div>
        {/* decorative circle */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 bottom-4 w-24 h-24 rounded-full bg-white/5" />
      </div>

      {/* Today's plan */}
      <h2 className="font-fraunces text-xl font-semibold text-text-1 mb-3">Today's plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <PlanCard
          href="/_app/vocabulary/review"
          emoji="🃏"
          title="Review"
          subtitle={due > 0 ? `${due} cards due` : 'All caught up!'}
          accent={due > 0}
        />
        <PlanCard
          href="/_app/write/"
          emoji="✍️"
          title="Write"
          subtitle="Practice writing"
          accent={false}
        />
        <PlanCard
          href="/_app/read/"
          emoji="📖"
          title="Read"
          subtitle="Look up words"
          accent={false}
        />
      </div>

      {/* Word of the day */}
      <div className="bg-surface rounded-2xl border border-[var(--c-border)] p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✨</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-text-3">Word of the day</span>
        </div>
        <p className="font-fraunces text-3xl text-text-1 mb-1">Weltanschauung</p>
        <p className="text-text-2 mb-2">worldview / philosophy of life</p>
        <p className="text-sm text-text-3 italic">"Jeder Mensch hat seine eigene Weltanschauung."</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Reviews (30d)" value={progress?.reviews_30d ?? 0} unit="" />
        <StatCard label="Retention" value={progress?.retention_rate_30d ?? 0} unit="%" />
      </div>
    </div>
  )
}

function PlanCard({
  href,
  emoji,
  title,
  subtitle,
  accent,
}: {
  href: string
  emoji: string
  title: string
  subtitle: string
  accent: boolean
}) {
  return (
    <Link
      to={href}
      className={`rounded-2xl p-4 flex items-center gap-3 border transition-all hover:scale-[1.02] ${
        accent
          ? 'bg-accent/10 border-accent/30'
          : 'bg-surface border-[var(--c-border)]'
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className={`font-semibold text-sm ${accent ? 'text-accent' : 'text-text-1'}`}>{title}</p>
        <p className="text-xs text-text-3">{subtitle}</p>
      </div>
    </Link>
  )
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-surface rounded-2xl border border-[var(--c-border)] p-4">
      <p className="text-xs text-text-3 mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}{unit}</p>
    </div>
  )
}
