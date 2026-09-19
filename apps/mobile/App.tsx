import { registerRootComponent } from 'expo'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts, OpenSans_400Regular, OpenSans_500Medium, OpenSans_600SemiBold, OpenSans_700Bold, OpenSans_400Regular_Italic } from '@expo-google-fonts/open-sans'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { RootNavigator } from './src/navigation/RootNavigator'
import { ThemeProvider, useTheme } from './src/lib/ThemeContext'
import { requestPermissionsAndScheduleReminder } from './src/lib/notifications'
import type { RootStackParamList } from './src/navigation/RootNavigator'

const navigationRef = createNavigationContainerRef<RootStackParamList>()

function AppShell() {
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_500Medium,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
    OpenSans_400Regular_Italic,
  })
  const { isDark, colors } = useTheme()
  const notificationListener = useRef<Notifications.Subscription>()

  useEffect(() => {
    requestPermissionsAndScheduleReminder()

    // Navigate to Review when user taps the daily reminder notification
    notificationListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen
      if (screen === 'Review' && navigationRef.isReady()) {
        navigationRef.navigate('Review')
      }
    })

    return () => {
      notificationListener.current?.remove()
    }
  }, [])

  if (!fontsLoaded) {
    return (
      <View style={[s.splash, { backgroundColor: colors.primaryD }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    )
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="light" backgroundColor="transparent" translucent />
    </>
  )
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

const s = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})

registerRootComponent(App)
