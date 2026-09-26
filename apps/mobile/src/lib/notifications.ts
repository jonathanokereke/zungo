import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export async function requestPermissionsAndScheduleReminder(hour = 19, minute = 0): Promise<void> {
  if (Platform.OS === 'web') return

  const { status: existing } = await Notifications.getPermissionsAsync()
  const status =
    existing === 'granted'
      ? existing
      : (await Notifications.requestPermissionsAsync()).status

  if (status !== 'granted') return

  // Cancel any previously scheduled reminder before re-scheduling
  await cancelDailyReminder()

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Zeit zum Lernen! 🇩🇪',
      body: 'Your daily German practice is waiting. Keep the streak alive!',
      data: { screen: 'Review' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

/**
 * Registers for Expo push notifications and returns the push token string,
 * or null when running on a simulator/emulator or permissions are denied.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  // Expo push tokens only work on physical devices
  if (Constants.isDevice === false) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  const status = existing === 'granted'
    ? existing
    : (await Notifications.requestPermissionsAsync()).status

  if (status !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    })
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) return null

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
    return data
  } catch {
    return null
  }
}
