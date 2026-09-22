import { useAuth0 } from 'react-native-auth0'

export type AuthUser = {
  sub: string
  name?: string
  email?: string
  picture?: string
}

const AUDIENCE = process.env['EXPO_PUBLIC_AUTH0_AUDIENCE'] ?? ''

// Cache the access token from the most recent login so getAccessToken()
// doesn't rely on the credentials manager returning stale/opaque tokens.
let _cachedAccessToken: string | null = null

export function useAuth() {
  const { user, authorize, clearSession, getCredentials, isLoading } = useAuth0()

  async function login() {
    const credentials = await authorize({ scope: 'openid profile email', audience: AUDIENCE })
    if (!credentials?.accessToken) throw new Error('Login failed or was cancelled')
    _cachedAccessToken = credentials.accessToken
  }

  async function logout() {
    _cachedAccessToken = null
    await clearSession()
  }

  async function getAccessToken(): Promise<string> {
    if (_cachedAccessToken) return _cachedAccessToken
    const credentials = await getCredentials('openid profile email')
    if (!credentials?.accessToken) throw new Error('Not authenticated')
    _cachedAccessToken = credentials.accessToken
    return credentials.accessToken
  }

  return {
    user: user as AuthUser | null | undefined,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    getAccessToken,
  }
}
