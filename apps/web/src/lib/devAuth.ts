// When Auth0 credentials are not configured (REPLACE_ME), use this dev token
// which the server accepts in development mode.
export const DEV_TOKEN = 'dev-token'

export function isDevMode(): boolean {
  return (
    import.meta.env['VITE_AUTH0_DOMAIN'] === 'REPLACE_ME' ||
    !import.meta.env['VITE_AUTH0_DOMAIN']
  )
}

export function useToken(): () => Promise<string> {
  return async () => DEV_TOKEN
}
