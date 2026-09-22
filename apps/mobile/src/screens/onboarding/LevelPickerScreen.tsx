import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useState } from 'react'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'LevelPicker'>
type Route = RouteProp<OnboardingStackParamList, 'LevelPicker'>

const LEVELS = [
  { code: 'A1', label: 'Beginner', desc: 'I know very little German', emoji: '🌱' },
  { code: 'A2', label: 'Elementary', desc: 'I can handle simple everyday phrases', emoji: '🌿' },
  { code: 'B1', label: 'Intermediate', desc: 'I can talk about familiar topics', emoji: '🌳' },
  { code: 'B2', label: 'Upper Intermediate', desc: 'I understand complex texts', emoji: '🌲' },
  { code: 'C1', label: 'Advanced', desc: 'I can express ideas fluently', emoji: '🏔️' },
  { code: 'C2', label: 'Proficient', desc: 'Near-native fluency', emoji: '⭐' },
  { code: 'unsure', label: "I'm not sure", desc: 'Take a quick assessment quiz', emoji: '🤔' },
]

export function LevelPickerScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { preferred_name } = route.params
  const { colors: C } = useTheme()
  const [selected, setSelected] = useState<string | null>(null)

  function proceed() {
    if (!selected) return
    if (selected === 'unsure') {
      navigation.navigate('Assessment', { preferred_name })
    } else {
      navigation.navigate('Goal', { preferred_name, level: selected as any })
    }
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: C.text }]}>What's your German level?</Text>
        <Text style={[s.subtitle, { color: C.text2 }]}>
          We'll personalise your vocabulary and exercises accordingly.
        </Text>

        <View style={s.list}>
          {LEVELS.map(l => {
            const active = selected === l.code
            return (
              <TouchableOpacity
                key={l.code}
                style={[s.card, { borderColor: active ? C.primary : C.border, backgroundColor: active ? C.primary + '12' : C.surface }]}
                onPress={() => setSelected(l.code)}
                activeOpacity={0.8}
              >
                <Text style={s.emoji}>{l.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={s.cardRow}>
                    <Text style={[s.cardLabel, { color: C.text }]}>{l.label}</Text>
                    {l.code !== 'unsure' && (
                      <View style={[s.badge, { backgroundColor: active ? C.primary : C.bgAlt }]}>
                        <Text style={[s.badgeText, { color: active ? '#FFFFFF' : C.text2 }]}>{l.code}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.cardDesc, { color: C.text3 }]}>{l.desc}</Text>
                </View>
                {active && (
                  <View style={[s.check, { backgroundColor: C.primary }]}>
                    <Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      <View style={[s.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: selected ? C.primary : C.bgAlt }]}
          onPress={proceed}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={[s.btnText, { color: selected ? '#FFFFFF' : C.text3 }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 20 },
  title: { fontSize: 28, fontFamily: Fonts.bold, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: Fonts.regular, lineHeight: 22, marginBottom: 28 },
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1.5 },
  emoji: { fontSize: 24, width: 36, textAlign: 'center' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  cardLabel: { fontSize: 16, fontFamily: Fonts.semibold },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontFamily: Fonts.bold },
  cardDesc: { fontSize: 13, fontFamily: Fonts.regular },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { fontSize: 16, fontFamily: Fonts.semibold },
})
