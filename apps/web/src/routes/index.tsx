import { createFileRoute, redirect } from '@tanstack/react-router'
import { isDevMode } from '../lib/devAuth'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (isDevMode()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LandingPage,
})

function LandingPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, var(--c-primary-light) 0%, #fff 100%)' }}
    >
      <div className="max-w-2xl text-center">
        <h1 className="font-fraunces text-6xl font-bold text-primary mb-3">Zungo</h1>
        <p className="text-xl text-text-2 mb-8">
          German fluency from B1 to native. Reading, writing, and spaced repetition — powered by AI.
        </p>
        <button
          onClick={() => (window.location.href = '/login')}
          className="bg-primary text-white px-8 py-3.5 rounded-2xl text-lg font-semibold hover:bg-primary-dark transition-colors"
        >
          Get started
        </button>
      </div>
    </div>
  )
}
