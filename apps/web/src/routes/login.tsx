import { createFileRoute } from '@tanstack/react-router'
import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { loginWithRedirect, isAuthenticated } = useAuth0()

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/dashboard'
    } else {
      loginWithRedirect()
    }
  }, [isAuthenticated, loginWithRedirect])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting to login…</p>
    </div>
  )
}
