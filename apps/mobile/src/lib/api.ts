import Constants from 'expo-constants'

function resolveApiUrl(): string {
  // Production: always use the explicit env var (Railway URL)
  const envUrl = process.env['EXPO_PUBLIC_API_URL']
  if (envUrl && !envUrl.includes('localhost') && !envUrl.match(/\d+\.\d+\.\d+\.\d+/)) {
    return envUrl
  }

  // Development: derive host from the Expo dev-server so the IP auto-follows
  // the Mac's current address without manual .env.local edits.
  const debuggerHost =
    Constants.expoConfig?.hostUri ??          // Expo SDK 49+
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost ?? // legacy
    (Constants.manifest as any)?.debuggerHost  // very old SDK

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0]
    return `http://${host}:3001`
  }

  // Fallback for bare native builds or simulators where hostUri isn't set
  return envUrl ?? 'http://localhost:3001'
}

const API_URL = resolveApiUrl()

export const API_BASE = API_URL

export async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Request failed')
  return json.data as T
}
