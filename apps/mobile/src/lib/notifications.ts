import * as Notifications from 'expo-notifications'
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
