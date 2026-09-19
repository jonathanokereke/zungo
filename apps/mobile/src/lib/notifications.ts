import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export async function requestPermissionsAndScheduleReminder(): Promise<void> {
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
      hour: 19,
      minute: 0,
      repeats: true,
    } as Notifications.DailyTriggerInput,
  })
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}
