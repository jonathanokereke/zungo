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
import { BookOpenIcon, PenLineIcon, LayersIcon } from '../../lib/icons'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Intro'>

const { width: W } = Dimensions.get('window')

const NAVY    = '#12105A'
const AMBER   = '#F59E0B'
const INDIGO  = '#3730A3'
const OFF_WHITE = '#F9F8F6'

// ── Slide 1 — Feature-led split (Option B) ───────────────────────────────────

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const CEFR_HEIGHTS = [20, 28, 36, 44, 52, 60]
const CEFR_ACTIVE = 4 // C1

const USP_ITEMS = [
  { Icon: BookOpenIcon,  text: '10,593 words across all CEFR levels' },
  { Icon: PenLineIcon,   text: 'AI writing coach with real explanations' },
  { Icon: LayersIcon,    text: 'Spaced repetition so nothing gets forgotten' },
]

function Slide1() {
  return (
    <View style={[s.slide, { backgroundColor: OFF_WHITE }]}>
      {/* Top — navy */}
      <View style={s.s1Top}>
        <View style={s.cefrLadder}>
          {CEFR_LEVELS.map((lvl, i) => (
            <View key={lvl} style={s.cefrStep}>
              <View
                style={[
                  s.cefrBar,
                  { height: CEFR_HEIGHTS[i] },
                  i === CEFR_ACTIVE ? s.cefrBarActive : s.cefrBarInactive,
                ]}
              />
              <Text style={[s.cefrLabel, i === CEFR_ACTIVE && s.cefrLabelActive]}>
                {lvl}
              </Text>
            </View>
          ))}
        </View>
        <Text style={s.s1Headline}>Master German{'\n'}beyond the basics.</Text>
        <Text style={s.s1Sub}>Built for serious learners — A1 to C2.</Text>
      </View>

      {/* Bottom — white card */}
      <View style={s.s1Bottom}>
        {USP_ITEMS.map(({ Icon, text }) => (
          <View key={text} style={s.uspRow}>
            <Icon size={20} color={AMBER} />
            <Text style={s.uspText}>{text}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ── Slide 2 — AI Coach on navy bg (Option B content, Option A bg) ─────────────

function Slide2() {
  return (
    <View style={[s.slide, { backgroundColor: NAVY }]}>
      <View style={s.s2Content}>
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
                <Text style={s.highlight}>bin gegangen</Text>
                {' '}— movement verbs take{' '}
                <Text style={s.italic}>sein</Text>
                , not{' '}
                <Text style={s.italic}>haben</Text>.
              </Text>
            </View>
          </View>
        </View>

        <View style={s.s2Dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[s.dot, i === 1 ? s.dotActive : s.dotInactiveDark]} />
          ))}
        </View>

        <Text style={s.s2Headline}>Write. Get coached.{'\n'}Improve.</Text>
        <Text style={s.s2Sub}>
          Our AI explains every mistake so{'\n'}you learn the rule, not just the fix.
        </Text>
      </View>
    </View>
  )
}

// ── Slide 3 — Reading immersion on off-white ──────────────────────────────────

function Slide3() {
  return (
    <View style={[s.slide, { backgroundColor: OFF_WHITE }]}>
      <View style={s.s3Content}>
        <Text style={s.s3Eyebrow}>TAGESTEXT · B2</Text>
        <View style={s.articleCard}>
          <Text style={s.articleTitle}>Klimawandel und die Alpen</Text>
          <Text style={s.articleBody}>
            Die{' '}
            <Text style={s.wordHl}>Gletscher</Text>
            <View style={s.tooltip}><Text style={s.tooltipText}>glacier</Text></View>
            {' '}schmelzen schneller als je zuvor. Wissenschaftler sind{' '}
            <Text style={s.wordHl}>besorgt</Text>
            {' '}über die Folgen für den Tourismus und die{' '}
            <Text style={s.wordHl}>Wasserversorgung</Text>.
          </Text>
          <View style={s.levelRow}>
            {CEFR_LEVELS.map(lvl => (
              <View key={lvl} style={[s.levelChip, lvl === 'B2' && s.levelChipActive]}>
                <Text style={[s.levelChipText, lvl === 'B2' && s.levelChipTextActive]}>
                  {lvl}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.s3Dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[s.dot, i === 2 ? s.dotActiveNavy : s.dotInactiveLight]} />
          ))}
        </View>

        <Text style={s.s3Headline}>Read real German{'\n'}from day one.</Text>
        <Text style={s.s3Sub}>
          Graded texts at your level with instant{'\n'}word lookups — immersion without the overwhelm.
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
      scrollRef.current?.scrollTo({ x: next * W, animated: true })
      setCurrent(next)
    } else {
      navigation.navigate('Welcome')
    }
  }

  function onScroll(e: { nativeEvent: { contentOffset: { x: number } } }) {
    const page = Math.round(e.nativeEvent.contentOffset.x / W)
    setCurrent(page)
  }

  const isLast = current === LAST
  const isNavy = current === 1

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: current === 1 ? NAVY : OFF_WHITE }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((SlideComp, i) => <SlideComp key={i} />)}
      </ScrollView>

      {/* Dots — hidden on slides 2 & 3 which render their own dots inline */}
      {current === 0 && (
        <View style={s.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === current ? s.dotActiveNavy : s.dotInactiveLight]} />
          ))}
        </View>
      )}

      <View style={[s.footer, { backgroundColor: isNavy ? NAVY : OFF_WHITE }]}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: isLast ? AMBER : NAVY }]}
          onPress={advance}
          activeOpacity={0.85}
        >
          <Text style={[s.btnText, { color: isLast ? NAVY : '#FFFFFF' }]}>
            {isLast ? 'Get started' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  slide: { width: W, flex: 1 },

  // ── Slide 1 ──
  s1Top: {
    backgroundColor: NAVY,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  cefrLadder: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 20 },
  cefrStep: { alignItems: 'center', gap: 5 },
  cefrBar: { width: 28, borderRadius: 4 },
  cefrBarActive: { backgroundColor: AMBER },
  cefrBarInactive: { backgroundColor: 'rgba(255,255,255,.2)' },
  cefrLabel: { fontSize: 10, fontFamily: Fonts.medium, color: 'rgba(255,255,255,.5)' },
  cefrLabelActive: { color: AMBER, fontFamily: Fonts.bold },
  s1Headline: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 6,
  },
  s1Sub: { fontSize: 13, fontFamily: Fonts.regular, color: 'rgba(255,255,255,.55)' },
  s1Bottom: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 18,
    justifyContent: 'center',
  },
  uspRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  uspText: { fontSize: 14, fontFamily: Fonts.medium, color: NAVY, flex: 1, lineHeight: 20 },

  // ── Slide 2 ──
  s2Content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thread: { width: '100%', gap: 12, marginBottom: 24 },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: INDIGO,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  bubbleUserText: { fontSize: 14, fontFamily: Fonts.regular, color: '#FFFFFF', lineHeight: 21 },
  bubbleAiWrap: { alignSelf: 'flex-start', maxWidth: '88%' },
  bubbleAiLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,.4)',
    marginBottom: 4,
    marginLeft: 2,
  },
  bubbleAi: {
    backgroundColor: 'rgba(255,255,255,.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.15)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleAiText: { fontSize: 14, fontFamily: Fonts.regular, color: 'rgba(255,255,255,.85)', lineHeight: 21 },
  highlight: { fontFamily: Fonts.bold, color: AMBER, textDecorationLine: 'underline' },
  italic: { fontFamily: Fonts.italic, color: 'rgba(255,255,255,.85)' },
  s2Dots: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  s2Headline: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
  },
  s2Sub: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,.55)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Slide 3 ──
  s3Content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s3Eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: AMBER,
    letterSpacing: 1,
    marginBottom: 10,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    paddingVertical: 16,
    width: '100%',
    marginBottom: 20,
  },
  articleTitle: { fontSize: 15, fontFamily: Fonts.bold, color: NAVY, marginBottom: 10 },
  articleBody: { fontSize: 14, fontFamily: Fonts.regular, color: '#374151', lineHeight: 22 },
  wordHl: { color: AMBER, fontFamily: Fonts.semibold },
  tooltip: {
    display: 'none', // simplified — inline tooltip layout is complex in RN
  },
  tooltipText: { fontSize: 10, color: NAVY, fontFamily: Fonts.bold },
  levelRow: { flexDirection: 'row', gap: 5, marginTop: 12, flexWrap: 'wrap' },
  levelChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelChipActive: { backgroundColor: NAVY },
  levelChipText: { fontSize: 10, fontFamily: Fonts.medium, color: '#6B7280' },
  levelChipTextActive: { color: '#FFFFFF', fontFamily: Fonts.bold },
  s3Dots: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  s3Headline: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: NAVY,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
  },
  s3Sub: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Shared dots ──
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActiveNavy: { backgroundColor: NAVY },
  dotActive: { backgroundColor: '#FFFFFF' },
  dotInactiveLight: { backgroundColor: '#D1D5DB' },
  dotInactiveDark: { backgroundColor: 'rgba(255,255,255,.25)' },

  // ── Footer ──
  footer: { paddingHorizontal: 28, paddingBottom: 24, paddingTop: 8 },
  btn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  btnText: { fontSize: 17, fontFamily: Fonts.bold },
})
