import Expo, { type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk'

const expo = new Expo()

export interface PushTarget {
  token: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function sendPushNotifications(targets: PushTarget[]): Promise<void> {
  const messages: ExpoPushMessage[] = targets
    .filter(t => Expo.isExpoPushToken(t.token))
    .map(t => ({
      to: t.token,
      sound: 'default',
      title: t.title,
      body: t.body,
      data: t.data ?? {},
    }))

  if (messages.length === 0) return

  const chunks = expo.chunkPushNotifications(messages)
  const tickets: ExpoPushTicket[] = []

  for (const chunk of chunks) {
    const chunkTickets = await expo.sendPushNotificationsAsync(chunk)
    tickets.push(...chunkTickets)
  }

  // Log any errors but don't throw — push delivery is best-effort
  for (const ticket of tickets) {
    if (ticket.status === 'error') {
      console.warn('[push] delivery error:', ticket.message, ticket.details)
    }
  }
}
