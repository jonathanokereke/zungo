import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth0 } from '@auth0/auth0-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const { loginWithRedirect, isAuthenticated } = useAuth0()

  if (isAuthenticated) {
    window.location.href = '/dashboard'
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-indigo-900 mb-4">Zungo</h1>
        <p className="text-xl text-indigo-700 mb-8">
          German fluency from B1 to native. Reading, writing, and spaced repetition — powered by AI.
        </p>
        <button
          onClick={() => loginWithRedirect()}
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Get started
        </button>
      </div>
    </div>
  )
}
