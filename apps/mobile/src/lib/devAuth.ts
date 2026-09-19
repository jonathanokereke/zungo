export const DEV_TOKEN = 'dev-token'

export function isDevMode(): boolean {
  return (
    process.env['EXPO_PUBLIC_AUTH0_DOMAIN'] === 'REPLACE_ME' ||
    !process.env['EXPO_PUBLIC_AUTH0_DOMAIN']
  )
}

export function useToken(): () => Promise<string> {
  return async () => DEV_TOKEN
}
