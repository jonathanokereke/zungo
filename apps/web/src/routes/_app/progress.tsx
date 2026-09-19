import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'
import { useToken } from '../../lib/devAuth'

export const Route = createFileRoute('/_app/progress')({
  component: ProgressPage,
})

type ProgressData = {
  user: { level: string; streak: number; last_active: string | null }
  total_words: number
  total_writing_sessions: number
  retention_rate_30d: number
  reviews_30d: number
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LEVEL_LABELS: Record<string, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper-Intermediate',
  C1: 'Advanced',
  C2: 'Proficient',
}

function ProgressPage() {
  const getToken = useToken()

  const { data, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<ProgressData>('/api/progress', {}, token)
    },
  })

  const level = data?.user.level ?? 'B1'
  const levelIndex = LEVEL_ORDER.indexOf(level)
  const levelPct = ((levelIndex + 1) / LEVEL_ORDER.length) * 100

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-fraunces text-2xl font-bold text-text-1 mb-6">Progress</h1>

      {/* CEFR card */}
      <div
        className="rounded-2xl p-6 mb-5 text-white"
        style={{ background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-dark) 100%)' }}
      >
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm opacity-70 mb-1">Current level</p>
            <p className="font-fraunces text-5xl font-bold">{level}</p>
            <p className="text-sm opacity-80 mt-1">{LEVEL_LABELS[level]}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-70 mb-1">Streak</p>
            <p className="text-3xl font-bold">{data?.user.streak ?? 0}</p>
            <p className="text-xs opacity-60">days</p>
          </div>
        </div>
        {/* Level progress bar */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${levelPct}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          {LEVEL_ORDER.map(l => (
            <span key={l} className={`text-xs ${l === level ? 'opacity-100 font-bold' : 'opacity-40'}`}>{l}</span>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="Words saved" value={isLoading ? '—' : String(data?.total_words ?? 0)} icon="📚" />
        <StatCard label="Reviews (30d)" value={isLoading ? '—' : String(data?.reviews_30d ?? 0)} icon="🃏" />
        <StatCard label="Retention" value={isLoading ? '—' : `${data?.retention_rate_30d ?? 0}%`} icon="🎯" />
        <StatCard label="Writing sessions" value={isLoading ? '—' : String(data?.total_writing_sessions ?? 0)} icon="✍️" />
      </div>

      {/* Skill breakdown */}
      <div className="bg-surface rounded-2xl border border-[var(--c-border)] p-5">
        <h2 className="font-fraunces text-lg font-semibold text-text-1 mb-4">Skills</h2>
        <div className="space-y-3">
          <SkillBar label="Vocabulary" pct={Math.min(100, (data?.total_words ?? 0) / 2)} color="var(--c-primary)" />
          <SkillBar label="Writing" pct={Math.min(100, (data?.total_writing_sessions ?? 0) * 10)} color="var(--c-accent)" />
          <SkillBar label="Retention" pct={data?.retention_rate_30d ?? 0} color="#059669" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-surface rounded-2xl border border-[var(--c-border)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs text-text-3">{label}</p>
      </div>
      <p className="text-2xl font-bold text-text-1">{value}</p>
    </div>
  )
}

function SkillBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-text-2">{label}</span>
        <span className="text-sm font-medium text-text-1">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-[var(--c-primary-light)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
