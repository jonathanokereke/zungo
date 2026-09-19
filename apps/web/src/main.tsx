import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/api'
import { isDevMode } from './lib/devAuth'
import './index.css'

if (!isDevMode()) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.2,
    })
  }

  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://app.posthog.com',
      capture_pageview: false, // manual capture via router
    })
  }
}

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function mount() {
  let app = (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )

  if (!isDevMode()) {
    // Only wrap with Auth0 when real credentials are present
    const { Auth0Provider } = await import('@auth0/auth0-react')
    const { auth0Config } = await import('./lib/auth0')
    app = <Auth0Provider {...auth0Config}>{app}</Auth0Provider>
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>{app}</React.StrictMode>,
  )
}

mount()
