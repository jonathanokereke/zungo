import { useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { LayersIcon, PenLineIcon, BarChart2Icon, UserIcon } from '../../lib/icons'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>

const NAVY = '#12105A'

const FEATURES = [
  {
    Icon: LayersIcon,
    title: 'Smarter vocabulary',
    desc: 'SM-2 spaced repetition — words appear when you\'re about to forget them.',
  },
  {
    Icon: PenLineIcon,
    title: 'AI writing coach',
    desc: 'Write in German, get explanations — not just corrections.',
  },
  {
    Icon: BarChart2Icon,
    title: 'Track everything',
    desc: 'XP, streaks, retention rate — see your progress daily.',
  },
]

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>()
  const { colors: C } = useTheme()
  const [name, setName] = useState('')

  function proceed() {
    const trimmed = name.trim()
    if (!trimmed) return
    navigation.navigate('LevelPicker', { preferred_name: trimmed })
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.primaryD }]}>
      <View style={s.circle1} />
      <View style={s.circle2} />

      {/* Header */}
      <View style={s.header}>
        <View style={[s.avatar, { borderColor: C.accent }]}>
          <UserIcon size={28} color={C.accent} />
        </View>
        <Text style={s.greeting}>Guten Tag!</Text>
        <Text style={s.headerSub}>Here's what makes Zungo different</Text>
      </View>

      {/* Feature cards */}
      <View style={s.cards}>
        {FEATURES.map(({ Icon, title, desc }) => (
          <View key={title} style={s.card}>
            <View style={s.cardIcon}>
              <Icon size={22} color={C.accent} />
            </View>
            <View style={s.cardText}>
              <Text style={s.cardTitle}>{title}</Text>
              <Text style={s.cardDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Name input */}
      <View style={s.inputWrap}>
        <Text style={s.inputLabel}>What should we call you?</Text>
        <TextInput
          style={[
            s.nameInput,
            {
              backgroundColor: 'rgba(255,255,255,.1)',
              color: '#FFFFFF',
              borderColor: name.trim() ? C.accent : 'rgba(255,255,255,.2)',
            },
          ]}
          placeholder="Your first name"
          placeholderTextColor="rgba(255,255,255,.35)"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={proceed}
        />
      </View>

      {/* CTA */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[
            s.btn,
            {
              backgroundColor: C.accent,
              opacity: name.trim() ? 1 : 0.5,
            },
          ]}
          onPress={proceed}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>Start learning →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  circle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,.03)',
    top: -60,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(245,158,11,.06)',
    bottom: 80,
    left: -50,
  },

  // Header
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 20, paddingHorizontal: 28 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245,158,11,.15)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  greeting: { fontSize: 26, fontFamily: Fonts.bold, color: '#FFFFFF', marginBottom: 4 },
  headerSub: { fontSize: 14, fontFamily: Fonts.regular, color: 'rgba(255,255,255,.5)' },

  // Cards
  cards: { paddingHorizontal: 20, gap: 10, flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,.07)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardIcon: { width: 36, alignItems: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: Fonts.semibold, color: '#FFFFFF', marginBottom: 3 },
  cardDesc: { fontSize: 12, fontFamily: Fonts.regular, color: 'rgba(255,255,255,.5)', lineHeight: 18 },

  // Input
  inputWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  inputLabel: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: 'rgba(255,255,255,.4)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  nameInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },

  // Footer
  footer: { paddingHorizontal: 20, paddingBottom: 20 },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: { fontSize: 16, fontFamily: Fonts.bold, color: NAVY },
})
