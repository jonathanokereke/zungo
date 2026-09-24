import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { requestPermissionsAndScheduleReminder } from '../../lib/notifications'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import {
  ClockIcon,
  BookOpenIcon,
  TargetIcon,
  ZapIcon,
  SunriseIcon,
  CoffeeIcon,
  SunsetIcon,
  MoonIcon,
} from '../../lib/icons'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type GoalRoute = RouteProp<OnboardingStackParamList, 'Goal'>

const GOALS = [
  { minutes: 5,  label: '5 min / day',    desc: 'Light — great for beginners', Icon: ClockIcon    },
  { minutes: 15, label: '15 min / day',   desc: 'Regular — steady progress',   Icon: BookOpenIcon },
  { minutes: 30, label: '30 min / day',   desc: 'Focused — recommended',       Icon: TargetIcon   },
  { minutes: 60, label: '1 hour / day',   desc: 'Intensive — fast results',    Icon: ZapIcon      },
]

const REMINDER_TIMES = [
  { label: 'Morning',   hour: 8,  minute: 0,  Icon: SunriseIcon },
  { label: 'Lunchtime', hour: 12, minute: 30, Icon: CoffeeIcon  },
  { label: 'Evening',   hour: 19, minute: 0,  Icon: SunsetIcon  },
  { label: 'Night',     hour: 21, minute: 0,  Icon: MoonIcon    },
]

export function GoalScreen({ onComplete }: { onComplete: () => void }) {
  const route = useRoute<GoalRoute>()
  const { preferred_name, level } = route.params
  const { getAccessToken } = useAuth()
  const { colors: C } = useTheme()
  const [goalMinutes, setGoalMinutes] = useState(30)
  const [reminderIdx, setReminderIdx] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function finish() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const token = await getAccessToken()
      const rt = REMINDER_TIMES[reminderIdx]!
      await apiFetch('/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({
          preferred_name,
          level,
          daily_goal_minutes: goalMinutes,
          reminder_hour: rt.hour,
          reminder_minute: rt.minute,
        }),
      }, token)
      await requestPermissionsAndScheduleReminder(rt.hour, rt.minute)
      onComplete()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: C.text }]}>Set your goals</Text>
        <Text style={[s.subtitle, { color: C.text2 }]}>
          You're starting at{' '}
          <Text style={{ color: C.primary, fontFamily: Fonts.bold }}>{level}</Text>
          . How much time can you commit each day?
        </Text>

        <Text style={[s.sectionLabel, { color: C.text3 }]}>Daily Goal</Text>
        <View style={s.grid}>
          {GOALS.map(g => {
            const active = goalMinutes === g.minutes
            return (
              <TouchableOpacity
                key={g.minutes}
                style={[
                  s.goalCard,
                  {
                    borderColor: active ? C.primary : C.border,
                    backgroundColor: active ? C.primary + '12' : C.surface,
                  },
                ]}
                onPress={() => setGoalMinutes(g.minutes)}
              >
                {active && (
                  <View style={[s.goalCheck, { backgroundColor: C.primary }]}>
                    <Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text>
                  </View>
                )}
                <g.Icon size={24} color={active ? C.primary : C.text2} />
                <Text style={[s.goalLabel, { color: C.text }]}>{g.label}</Text>
                <Text style={[s.goalDesc, { color: C.text3 }]}>{g.desc}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={[s.sectionLabel, { color: C.text3, marginTop: 24 }]}>Daily Reminder</Text>
        <View style={{ gap: 10 }}>
          {REMINDER_TIMES.map((rt, i) => {
            const active = reminderIdx === i
            const timeStr = `${String(rt.hour).padStart(2, '0')}:${String(rt.minute).padStart(2, '0')}`
            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.reminderRow,
                  {
                    borderColor: active ? C.primary : C.border,
                    backgroundColor: active ? C.primary + '12' : C.surface,
                  },
                ]}
                onPress={() => setReminderIdx(i)}
              >
                <rt.Icon size={22} color={active ? C.primary : C.text2} />
                <Text style={[s.reminderLabel, { color: C.text }]}>{rt.label}</Text>
                <Text style={[s.reminderTime, { color: C.text2 }]}>{timeStr}</Text>
                {active && (
                  <View style={[s.goalCheck, { backgroundColor: C.primary }]}>
                    <Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      <View style={[s.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
        {error && <Text style={[s.errorText, { color: C.error }]}>{error}</Text>}
        <TouchableOpacity
          style={[s.btn, { backgroundColor: C.primary, opacity: loading ? 0.6 : 1 }]}
          onPress={finish}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={s.btnText}>Start Learning 🎉</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll:    { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 20 },
  title:     { fontSize: 28, fontFamily: Fonts.bold,    marginBottom: 8 },
  subtitle:  { fontSize: 15, fontFamily: Fonts.regular, lineHeight: 22, marginBottom: 28 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalCard: {
    width: '47.5%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  goalCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLabel: { fontSize: 14, fontFamily: Fonts.semibold },
  goalDesc:  { fontSize: 12, fontFamily: Fonts.regular  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  reminderLabel: { flex: 1, fontSize: 15, fontFamily: Fonts.regular },
  reminderTime:  { fontSize: 14, fontFamily: Fonts.semibold },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    gap: 10,
  },
  errorText: { fontSize: 13, fontFamily: Fonts.regular, textAlign: 'center' },
  btn:       { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText:   { fontSize: 16, fontFamily: Fonts.bold, color: '#FFFFFF' },
})
