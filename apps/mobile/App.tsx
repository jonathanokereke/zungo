import { registerRootComponent } from 'expo'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts, OpenSans_400Regular, OpenSans_500Medium, OpenSans_600SemiBold, OpenSans_700Bold, OpenSans_400Regular_Italic } from '@expo-google-fonts/open-sans'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import * as Notifications from 'expo-notifications'
import { Auth0Provider } from 'react-native-auth0'
import { RootNavigator } from './src/navigation/RootNavigator'
import { OnboardingNavigator } from './src/navigation/OnboardingNavigator'
import { ThemeProvider, useTheme } from './src/lib/ThemeContext'
import { requestPermissionsAndScheduleReminder, registerForPushNotificationsAsync } from './src/lib/notifications'
import { apiFetch } from './src/lib/api'
import { useAuth } from './src/lib/useAuth'
import { LoginScreen } from './src/screens/auth/LoginScreen'
import type { RootStackParamList } from './src/navigation/RootNavigator'
import { NetworkProvider, useNetwork } from './src/lib/NetworkContext'
import { OfflineBanner } from './src/components/OfflineBanner'
import { useOfflineStore } from './src/lib/offlineStore'

const AUTH0_DOMAIN = process.env['EXPO_PUBLIC_AUTH0_DOMAIN'] ?? ''
const AUTH0_CLIENT_ID = process.env['EXPO_PUBLIC_AUTH0_CLIENT_ID'] ?? ''

const navigationRef = createNavigationContainerRef<RootStackParamList>()

type UserPrefs = {
  onboarding_complete?: boolean
  reminder_hour?: number
  reminder_minute?: number
}

function AppShell() {
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_500Medium,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
    OpenSans_400Regular_Italic,
  })
  const { isDark, colors } = useTheme()
  const { isLoading: authLoading, isAuthenticated, getAccessToken, user: authUser, logout } = useAuth()
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | undefined>(undefined)
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)
  // Safety valve: if Auth0 isLoading never resolves (stale keychain session), clear it and unblock after 4s
  const [authTimedOut, setAuthTimedOut] = useState(false)
  useEffect(() => {
    if (!authLoading) return
    const t = setTimeout(() => {
      logout().catch(() => {})
      setAuthTimedOut(true)
    }, 4000)
    return () => clearTimeout(t)
  }, [authLoading])

  // Once authenticated, sync user to server and check onboarding state
  useEffect(() => {
    if (!isAuthenticated) {
      setOnboardingDone(null)
      return
    }

    async function syncAndCheck() {
      try {
        const token = await getAccessToken()

        // Ensure user row exists, then sync name/email from ID token
        const [me] = await Promise.all([
          apiFetch<{ preferences_json?: UserPrefs | null }>('/api/users/me', {}, token),
          authUser?.name || authUser?.email
            ? apiFetch('/api/users/profile', {
                method: 'POST',
                body: JSON.stringify({ name: authUser.name, email: authUser.email }),
              }, token).catch(() => {})
            : Promise.resolve(),
        ])

        const prefs = me.preferences_json
        if (prefs?.onboarding_complete) {
          await requestPermissionsAndScheduleReminder(prefs.reminder_hour ?? 19, prefs.reminder_minute ?? 0)
          // Register Expo push token and store server-side (non-blocking)
          registerForPushNotificationsAsync().then(pushToken => {
            if (pushToken) {
              apiFetch('/api/push/token', {
                method: 'POST',
                body: JSON.stringify({ token: pushToken }),
              }, token).catch(() => {})
            }
          }).catch(() => {})
          setOnboardingDone(true)
        } else {
          setOnboardingDone(false)
        }
      } catch (e: any) {
        console.warn('syncAndCheck error:', e?.message ?? e)
        setOnboardingDone(false)
      }
    }
    syncAndCheck()

    notificationListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen
      if (screen === 'Review' && navigationRef.isReady()) {
        navigationRef.navigate('Review')
      }
    })

    return () => { notificationListener.current?.remove() }
  }, [isAuthenticated])

  const ready = fontsLoaded && (!authLoading || authTimedOut)

  if (!ready) {
    return (
      <View style={[s.splash, { backgroundColor: colors.primaryD }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    )
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    )
  }

  if (onboardingDone === null) {
    return (
      <View style={[s.splash, { backgroundColor: colors.primaryD }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    )
  }

  if (!onboardingDone) {
    return (
      <NavigationContainer>
        <OnboardingNavigator onComplete={() => setOnboardingDone(true)} />
      </NavigationContainer>
    )
  }

  return (
    <NetworkProvider>
      <AuthenticatedShell isDark={isDark} getAccessToken={getAccessToken} />
    </NetworkProvider>
  )
}

function AuthenticatedShell({ isDark, getAccessToken }: { isDark: boolean; getAccessToken: () => Promise<string> }) {
  const { isOnline } = useNetwork()
  const { reviewQueue, removeFromQueue } = useOfflineStore()
  const prevOnlineRef = useRef(false)

  // Flush queued reviews when transitioning from offline -> online
  useEffect(() => {
    if (isOnline && !prevOnlineRef.current && reviewQueue.length > 0) {
      ;(async () => {
        try {
          const token = await getAccessToken()
          for (const item of reviewQueue) {
            try {
              await apiFetch(`/api/reviews/${item.word_id}`, {
                method: 'POST',
                body: JSON.stringify({ quality: item.quality }),
              }, token)
              removeFromQueue(item.word_id)
            } catch {
              // keep in queue on failure
            }
          }
        } catch {
          // no token yet, skip
        }
      })()
    }
    prevOnlineRef.current = isOnline
  }, [isOnline])

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
      <OfflineBanner isOnline={isOnline} queueLength={reviewQueue.length} />
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
    </>
  )
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Auth0Provider domain={AUTH0_DOMAIN} clientId={AUTH0_CLIENT_ID}>
          <AppShell />
        </Auth0Provider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

const s = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})

registerRootComponent(App)
