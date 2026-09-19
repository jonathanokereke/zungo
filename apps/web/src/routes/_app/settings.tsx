import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/api'
import { useToken } from '../../lib/devAuth'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
})

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
type CefrLevel = typeof CEFR_LEVELS[number]

const LEVEL_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: 'Beginner — basic phrases and everyday expressions',
  A2: 'Elementary — familiar topics and simple communication',
  B1: 'Intermediate — main points on familiar matters',
  B2: 'Upper-intermediate — complex texts and fluent interaction',
  C1: 'Advanced — flexible and effective language use',
  C2: 'Mastery — effortless understanding of everything',
}

type UserData = {
  level: CefrLevel
}

function SettingsPage() {
  const getToken = useToken()
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)

  const { data: progress } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<{ user: UserData }>('/api/progress', {}, token)
    },
  })

  const currentLevel = progress?.user.level ?? 'B1'
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>(currentLevel)

  useEffect(() => {
    if (progress?.user.level) setSelectedLevel(progress.user.level)
  }, [progress?.user.level])

  const { mutate: saveLevel, isPending } = useMutation({
    mutationFn: async (level: CefrLevel) => {
      const token = await getToken()
      return apiFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify({ level }) }, token)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const isDirty = selectedLevel !== currentLevel

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-fraunces text-2xl font-bold text-text-1 mb-1">Settings</h1>
      <p className="text-sm text-text-3 mb-8">Adjust your learning preferences</p>

      {/* CEFR Level */}
      <section className="bg-surface rounded-2xl border border-[var(--c-border)] p-6 mb-4">
        <h2 className="font-semibold text-text-1 mb-1">CEFR Level</h2>
        <p className="text-sm text-text-3 mb-5">
          Your level determines vocabulary difficulty, writing prompts, and review pacing.
        </p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {CEFR_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`rounded-xl py-3 text-sm font-semibold border transition-all ${
                selectedLevel === level
                  ? 'bg-primary text-white border-primary'
                  : 'bg-bg border-[var(--c-border)] text-text-2 hover:border-primary/40 hover:text-primary'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-primary-light px-4 py-3 text-sm text-primary font-medium mb-5">
          {LEVEL_DESCRIPTIONS[selectedLevel]}
        </div>
        <button
          onClick={() => saveLevel(selectedLevel)}
          disabled={!isDirty || isPending}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
            isDirty && !isPending
              ? 'bg-primary text-white hover:opacity-90'
              : 'bg-bg text-text-3 border border-[var(--c-border)] cursor-not-allowed'
          }`}
        >
          {isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </section>

      {/* App info */}
      <section className="bg-surface rounded-2xl border border-[var(--c-border)] p-6">
        <h2 className="font-semibold text-text-1 mb-4">About</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-3">Version</span>
            <span className="text-text-1 font-medium">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-3">Algorithm</span>
            <span className="text-text-1 font-medium">SM-2 spaced repetition</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-3">Target range</span>
            <span className="text-text-1 font-medium">B1 → C2</span>
          </div>
        </div>
      </section>
    </div>
  )
}
