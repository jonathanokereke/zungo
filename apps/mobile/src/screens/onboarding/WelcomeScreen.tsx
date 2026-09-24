import { useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Fonts } from '../../lib/theme'
import { LayersIcon, PenLineIcon, BarChart2Icon, UserIcon } from '../../lib/icons'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>

const NAVY        = '#12105A'
const CARD_BG     = '#222166'
const ICON_COLOR  = '#111059'
const AMBER       = '#F59E0B'
const OFF_WHITE   = '#F9F8F6'

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
  const [name, setName] = useState('')

  function proceed() {
    const trimmed = name.trim()
    if (!trimmed) return
    navigation.navigate('LevelPicker', { preferred_name: trimmed })
  }

  const hasName = name.trim().length > 0

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <UserIcon size={28} color={AMBER} />
        </View>
        <Text style={s.greeting}>Guten Tag!</Text>
        <Text style={s.headerSub}>Here's what makes Zungo different</Text>
      </View>

      {/* Feature cards */}
      <View style={s.cards}>
        {FEATURES.map(({ Icon, title, desc }) => (
          <View key={title} style={s.card}>
            <View style={s.cardIcon}>
              <Icon size={22} color={ICON_COLOR} />
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
          style={[s.nameInput, { borderColor: hasName ? AMBER : '#D1D5DB' }]}
          placeholder="Your first name"
          placeholderTextColor="#9CA3AF"
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
          style={[s.btn, { opacity: hasName ? 1 : 0.45 }]}
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
  container: { flex: 1, backgroundColor: OFF_WHITE },

  // Header
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 20, paddingHorizontal: 28 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 2,
    borderColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  greeting:  { fontSize: 26, fontFamily: Fonts.bold,    color: NAVY,      marginBottom: 4 },
  headerSub: { fontSize: 14, fontFamily: Fonts.regular, color: '#6B7280' },

  // Cards
  cards: { paddingHorizontal: 20, gap: 10, flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardIcon:  { width: 36, alignItems: 'center' },
  cardText:  { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: Fonts.semibold, color: '#FFFFFF',               marginBottom: 3 },
  cardDesc:  { fontSize: 12, fontFamily: Fonts.regular,  color: 'rgba(255,255,255,0.55)', lineHeight: 18 },

  // Input
  inputWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  inputLabel: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: NAVY,
  },

  // Footer
  footer: { paddingHorizontal: 20, paddingBottom: 20 },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: ICON_COLOR,
  },
  btnText: { fontSize: 16, fontFamily: Fonts.bold, color: '#FFFFFF' },
})
