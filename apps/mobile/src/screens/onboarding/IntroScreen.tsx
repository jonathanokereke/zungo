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

const NAVY     = '#12105A'
const AMBER    = '#F59E0B'
const INDIGO   = '#3730A3'
const OFF_WHITE = '#F9F8F6'

// ── Dots ─────────────────────────────────────────────────────────────────────

function Dots({ current, onDark }: { current: number; onDark: boolean }) {
  return (
    <View style={ds.row}>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={[
            ds.dot,
            i === current
              ? (onDark ? ds.activeDark : ds.activeLight)
              : (onDark ? ds.inactiveDark : ds.inactiveLight),
          ]}
        />
      ))}
    </View>
  )
}

const ds = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  activeDark:    { backgroundColor: AMBER },
  activeLight:   { backgroundColor: NAVY },
  inactiveDark:  { backgroundColor: 'rgba(255,255,255,.25)' },
  inactiveLight: { backgroundColor: '#C9C9C9' },
})

// ── Slide 1 — Option A: Vocabulary focus ────────────────────────────────────

function Slide1({ current }: { current: number }) {
  return (
    <View style={[s.slide, { backgroundColor: NAVY }]}>
      {/* Flashcard area */}
      <View style={s.s1CardArea}>
        {/* Ghost cards behind */}
        <View style={[s.ghostCard, s.ghostRight]} />
        <View style={[s.ghostCard, s.ghostLeft]} />
        {/* Main card */}
        <View style={s.mainCard}>
          <View style={s.cefrBadge}>
            <Text style={s.cefrBadgeText}>B2</Text>
          </View>
          <Text style={s.cardWord}>die Nostalgie</Text>
          <Text style={s.cardTrans}>nostalgia</Text>
          <Text style={s.cardEx}>"Diese Musik weckt Nostalgie."</Text>
        </View>
      </View>

      {/* Footer text */}
      <View style={s.slideFooter}>
        <Dots current={current} onDark={true} />
        <Text style={s.headlineDark}>10,000+ words,{'\n'}learned at your pace</Text>
        <Text style={s.subDark}>
          Spaced repetition delivers each word at exactly the right moment — so it moves from recognition to memory.
        </Text>
      </View>
    </View>
  )
}

// ── Slide 2 — Option B: AI coach on navy ────────────────────────────────────

function Slide2({ current }: { current: number }) {
  return (
    <View style={[s.slide, { backgroundColor: NAVY }]}>
      {/* Chat thread */}
      <View style={s.s2ChatArea}>
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
              <Text style={s.bubbleHighlight}>bin gegangen</Text>
              {' '}— movement verbs take{' '}
              <Text style={s.bubbleItalic}>sein</Text>
              {', not '}
              <Text style={s.bubbleItalic}>haben</Text>.
            </Text>
          </View>
        </View>
      </View>

      {/* Footer text */}
      <View style={s.slideFooter}>
        <Dots current={current} onDark={true} />
        <Text style={s.headlineDark}>Write in German.{'\n'}Get coached, not just corrected.</Text>
        <Text style={s.subDark}>
          Our AI explains every mistake so you understand the rule, not just the fix.
        </Text>
      </View>
    </View>
  )
}

// ── Slide 3 — Option D: Reading immersion on off-white ───────────────────────

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function Slide3({ current }: { current: number }) {
  return (
    <View style={[s.slide, { backgroundColor: OFF_WHITE }]}>
      <View style={s.s3Body}>
        <Text style={s.s3Eyebrow}>TAGESTEXT · B2</Text>
        <View style={s.articleCard}>
          <Text style={s.articleTitle}>Klimawandel und die Alpen</Text>
          <Text style={s.articleBody}>
            {'Die '}
            <Text style={s.wordHl}>Gletscher</Text>
            {' schmelzen schneller als je zuvor. Wissenschaftler sind '}
            <Text style={s.wordHl}>besorgt</Text>
            {' über die Folgen für den Tourismus und die '}
            <Text style={s.wordHl}>Wasserversorgung</Text>.
          </Text>
          <View style={s.levelRow}>
            {CEFR_LEVELS.map(lvl => (
              <View key={lvl} style={[s.levelChip, lvl === 'B2' && s.levelChipActive]}>
                <Text style={[s.levelChipText, lvl === 'B2' && s.levelChipTextActive]}>{lvl}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Footer text */}
      <View style={s.slideFooter}>
        <Dots current={current} onDark={false} />
        <Text style={s.headlineLight}>Read real German{'\n'}from day one.</Text>
        <Text style={s.subLight}>
          Graded texts at your level with instant word lookups — immersion without the overwhelm.
        </Text>
      </View>
    </View>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function IntroScreen() {
  const navigation = useNavigation<Nav>()
  const scrollRef  = useRef<ScrollView>(null)
  const [current, setCurrent] = useState(0)

  function advance() {
    if (current < 2) {
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

  const isLast   = current === 2
  // Slide 3 is off-white — use navy button. Slides 1 & 2 are navy — use amber button.
  const btnBg    = current === 2 ? NAVY : AMBER
  const btnColor = current === 2 ? '#FFFFFF' : NAVY
  const safeBg   = current === 2 ? OFF_WHITE : NAVY

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: safeBg }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        <Slide1 current={current} />
        <Slide2 current={current} />
        <Slide3 current={current} />
      </ScrollView>

      <View style={[s.btnRow, { backgroundColor: safeBg }]}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: btnBg }]}
          onPress={advance}
          activeOpacity={0.85}
        >
          <Text style={[s.btnText, { color: btnColor }]}>
            {isLast ? 'Get started' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },
  slide: { width: W, flex: 1 },

  // ── Slide 1: Vocabulary ──
  s1CardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ghostCard: {
    position: 'absolute',
    width: 220,
    height: 140,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,.18)',
  },
  ghostRight: { transform: [{ rotate: '6deg' }], top: '35%', right: W * 0.05 },
  ghostLeft:  { transform: [{ rotate: '-6deg' }], top: '38%', left: W * 0.05 },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 24,
    width: 240,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    zIndex: 2,
  },
  cefrBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: AMBER,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cefrBadgeText: { fontSize: 11, fontFamily: Fonts.bold, color: NAVY },
  cardWord:  { fontSize: 22, fontFamily: Fonts.bold,    color: NAVY, marginBottom: 6 },
  cardTrans: { fontSize: 14, fontFamily: Fonts.regular, color: '#6B7280', marginBottom: 12 },
  cardEx:    { fontSize: 12, fontFamily: Fonts.italic,  color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },

  // ── Slide 2: AI chat ──
  s2ChatArea: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 14,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: INDIGO,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  bubbleUserText: { fontSize: 15, fontFamily: Fonts.regular, color: '#FFFFFF', lineHeight: 22 },
  bubbleAiWrap: { alignSelf: 'flex-start', maxWidth: '88%' },
  bubbleAiLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,.4)',
    marginBottom: 4,
    marginLeft: 4,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleAiText:    { fontSize: 15, fontFamily: Fonts.regular, color: '#374151', lineHeight: 22 },
  bubbleHighlight: { fontFamily: Fonts.bold, color: '#D97706', textDecorationLine: 'underline' },
  bubbleItalic:    { fontFamily: Fonts.italic, color: '#374151' },

  // ── Slide 3: Reading ──
  s3Body: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  s3Eyebrow: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: AMBER,
    letterSpacing: 1.2,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: '100%',
  },
  articleTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: NAVY,
    marginBottom: 10,
  },
  articleBody: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#374151',
    lineHeight: 24,
  },
  wordHl: {
    backgroundColor: 'rgba(245,158,11,0.25)',
    color: '#B45309',
    fontFamily: Fonts.semibold,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  levelChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelChipActive:     { backgroundColor: NAVY },
  levelChipText:       { fontSize: 11, fontFamily: Fonts.medium, color: '#6B7280' },
  levelChipTextActive: { color: '#FFFFFF', fontFamily: Fonts.bold },

  // ── Shared slide footer (inside scroll area) ──
  slideFooter: {
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  headlineDark: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    lineHeight: 30,
    marginBottom: 8,
  },
  subDark: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,.55)',
    lineHeight: 21,
  },
  headlineLight: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: NAVY,
    lineHeight: 30,
    marginBottom: 8,
  },
  subLight: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#6B7280',
    lineHeight: 21,
  },

  // ── Bottom button (outside ScrollView) ──
  btnRow: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    paddingTop: 8,
  },
  btn:     { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  btnText: { fontSize: 17, fontFamily: Fonts.bold },
})
