import { useRef, useState } from 'react'
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Fonts } from '../../lib/theme'
import { LayersIcon, PenLineIcon, BarChart2Icon } from '../../lib/icons'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Intro'>

const { width: SCREEN_W } = Dimensions.get('window')

const NAVY = '#12105A'
const AMBER = '#F59E0B'
const INDIGO = '#3730A3'

// ── Slide 1 — Brand ─────────────────────────────────────────────────────────

function Slide1() {
  return (
    <View style={[s.slide, { backgroundColor: '#FFFFFF' }]}>
      <View style={s.slideContent}>
        <View style={s.logoMark}>
          <Text style={s.logoZ}>Z</Text>
        </View>
        <Text style={s.logoName}>Zungo</Text>
        <Text style={s.headline}>German fluency,{'\n'}the smart way.</Text>
        <Text style={s.sub}>
          Vocabulary, writing, and grammar —{'\n'}personalised to your level.
        </Text>
      </View>
    </View>
  )
}

// ── Slide 2 — Vocabulary ─────────────────────────────────────────────────────

function Slide2() {
  return (
    <View style={[s.slide, { backgroundColor: '#FFFFFF' }]}>
      <View style={s.slideContent}>
        <View style={s.card}>
          <View style={s.cefrBadge}>
            <Text style={s.cefrText}>B2</Text>
          </View>
          <Text style={s.cardWord}>die Begeisterung</Text>
          <Text style={s.cardTrans}>enthusiasm</Text>
          <Text style={s.cardEx}>"Sie spricht mit großer Begeisterung über Kunst."</Text>
        </View>

        <View style={s.progressWrap}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Words learned</Text>
            <Text style={s.progressVal}>450 / 1,000</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: '45%' }]} />
          </View>
        </View>

        <Text style={s.headline}>Words that stick — for good.</Text>
        <Text style={s.sub}>
          Spaced repetition shows each word{'\n'}right before you'd forget it.
        </Text>
      </View>
    </View>
  )
}

// ── Slide 3 — AI Coach ───────────────────────────────────────────────────────

function Slide3() {
  return (
    <View style={[s.slide, { backgroundColor: '#FFFFFF' }]}>
      <View style={s.slideContent}>
        <View style={s.thread}>
          <View style={s.bubbleUser}>
            <Text style={s.bubbleUserText}>
              Ich habe gestern ins Kino gegangen.
            </Text>
          </View>
          <View style={s.bubbleAiWrap}>
            <Text style={s.bubbleAiLabel}>Zungo AI</Text>
            <View style={s.bubbleAi}>
              <Text style={s.bubbleAiText}>
                Almost! Use{' '}
                <Text style={s.bubbleAiHighlight}>bin gegangen</Text>
                {' '}— movement verbs take{' '}
                <Text style={s.bubbleAiItalic}>sein</Text>
                , not{' '}
                <Text style={s.bubbleAiItalic}>haben</Text>.
              </Text>
            </View>
          </View>
        </View>

        <Text style={s.headline}>Write. Get coached.{'\n'}Improve.</Text>
        <Text style={s.sub}>
          Our AI explains every mistake so{'\n'}you learn the rule, not just the fix.
        </Text>
      </View>
    </View>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

const SLIDES = [Slide1, Slide2, Slide3]
const LAST = SLIDES.length - 1

export function IntroScreen() {
  const navigation = useNavigation<Nav>()
  const scrollRef = useRef<ScrollView>(null)
  const [current, setCurrent] = useState(0)

  function advance() {
    if (current < LAST) {
      const next = current + 1
      scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true })
      setCurrent(next)
    } else {
      navigation.navigate('Welcome')
    }
  }

  function onScroll(e: { nativeEvent: { contentOffset: { x: number } } }) {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W)
    setCurrent(page)
  }

  const isLast = current === LAST

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((SlideComp, i) => (
          <SlideComp key={i} />
        ))}
      </ScrollView>

      <View style={s.footer}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === current ? s.dotActive : s.dotInactive]} />
          ))}
        </View>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: isLast ? AMBER : NAVY }]}
          onPress={advance}
          activeOpacity={0.85}
        >
          <Text style={[s.btnText, { color: isLast ? NAVY : '#FFFFFF' }]}>
            {isLast ? 'Get started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  slide: { width: SCREEN_W, flex: 1 },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },

  // Slide 1
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoZ: { fontSize: 34, fontFamily: Fonts.bold, color: AMBER, fontStyle: 'italic' },
  logoName: { fontSize: 28, fontFamily: Fonts.bold, color: NAVY, letterSpacing: -0.5, marginBottom: 16 },
  headline: { fontSize: 26, fontFamily: Fonts.bold, color: NAVY, textAlign: 'center', lineHeight: 34 },
  sub: { fontSize: 15, fontFamily: Fonts.regular, color: '#6B7280', textAlign: 'center', lineHeight: 23 },

  // Slide 2 — card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 4,
  },
  cefrBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: AMBER,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  cefrText: { fontSize: 10, fontFamily: Fonts.bold, color: NAVY },
  cardWord: { fontSize: 20, fontFamily: Fonts.bold, color: NAVY, marginBottom: 4 },
  cardTrans: { fontSize: 13, fontFamily: Fonts.regular, color: '#6B7280', marginBottom: 10 },
  cardEx: { fontSize: 11, fontFamily: Fonts.italic, color: '#9CA3AF', textAlign: 'center', lineHeight: 17 },
  progressWrap: { width: '100%' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontFamily: Fonts.regular, color: '#9CA3AF' },
  progressVal: { fontSize: 12, fontFamily: Fonts.medium, color: NAVY },
  progressBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: NAVY, borderRadius: 3 },

  // Slide 3 — chat
  thread: { width: '100%', gap: 10, marginBottom: 8 },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: NAVY,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  bubbleUserText: { fontSize: 13, fontFamily: Fonts.regular, color: '#FFFFFF', lineHeight: 20 },
  bubbleAiWrap: { alignSelf: 'flex-start', maxWidth: '85%' },
  bubbleAiLabel: { fontSize: 10, fontFamily: Fonts.medium, color: '#9CA3AF', marginBottom: 3, marginLeft: 2 },
  bubbleAi: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAiText: { fontSize: 13, fontFamily: Fonts.regular, color: '#374151', lineHeight: 20 },
  bubbleAiHighlight: { fontFamily: Fonts.bold, color: '#D97706', textDecorationLine: 'underline' },
  bubbleAiItalic: { fontFamily: Fonts.italic, color: '#374151' },

  // Footer
  footer: { paddingHorizontal: 28, paddingBottom: 24, backgroundColor: '#FFFFFF', paddingTop: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: NAVY },
  dotInactive: { backgroundColor: '#E5E7EB' },
  btn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  btnText: { fontSize: 17, fontFamily: Fonts.bold },
})
