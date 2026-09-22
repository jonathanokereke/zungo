import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Assessment'>
type Route = RouteProp<OnboardingStackParamList, 'Assessment'>
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2'

const QUIZ: { level: CefrLevel; sentence: string; options: { text: string; correct: boolean }[] }[] = [
  {
    level: 'A1',
    sentence: 'Ich ___ aus Deutschland.',
    options: [
      { text: 'komme', correct: true },
      { text: 'kommt', correct: false },
      { text: 'kommen', correct: false },
      { text: 'kam', correct: false },
    ],
  },
  {
    level: 'A1',
    sentence: '___ heißt du?',
    options: [
      { text: 'Wie', correct: true },
      { text: 'Was', correct: false },
      { text: 'Wo', correct: false },
      { text: 'Wann', correct: false },
    ],
  },
  {
    level: 'A2',
    sentence: 'Gestern ___ ich ins Kino gegangen.',
    options: [
      { text: 'bin', correct: true },
      { text: 'habe', correct: false },
      { text: 'war', correct: false },
      { text: 'wurde', correct: false },
    ],
  },
  {
    level: 'A2',
    sentence: 'Das Buch liegt ___ dem Tisch.',
    options: [
      { text: 'auf', correct: true },
      { text: 'an', correct: false },
      { text: 'in', correct: false },
      { text: 'unter', correct: false },
    ],
  },
  {
    level: 'B1',
    sentence: 'Wenn ich Zeit hätte, ___ ich mehr reisen.',
    options: [
      { text: 'würde', correct: true },
      { text: 'werde', correct: false },
      { text: 'wird', correct: false },
      { text: 'wäre', correct: false },
    ],
  },
  {
    level: 'B1',
    sentence: 'Ich gebe ___ Buch zurück.',
    options: [
      { text: 'dem Mann das', correct: true },
      { text: 'den Mann das', correct: false },
      { text: 'der Mann das', correct: false },
      { text: 'des Mannes das', correct: false },
    ],
  },
  {
    level: 'B2',
    sentence: 'Das Projekt ___ bis Ende des Jahres abgeschlossen werden.',
    options: [
      { text: 'muss', correct: true },
      { text: 'soll', correct: false },
      { text: 'kann', correct: false },
      { text: 'darf', correct: false },
    ],
  },
  {
    level: 'B2',
    sentence: 'Der Zeuge, ___ Aussage entscheidend war, blieb anonym.',
    options: [
      { text: 'dessen', correct: true },
      { text: 'dem', correct: false },
      { text: 'der', correct: false },
      { text: 'den', correct: false },
    ],
  },
]

function scoreToLevel(score: number): CefrLevel {
  if (score >= 7) return 'B2'
  if (score >= 5) return 'B1'
  if (score >= 3) return 'A2'
  return 'A1'
}

export function AssessmentScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { preferred_name } = route.params
  const { colors: C } = useTheme()
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const q = QUIZ[qIdx]!
  const resultLevel = scoreToLevel(score)

  function choose(i: number) {
    if (selected !== null) return
    setSelected(i)
    if (q.options[i]!.correct) setScore(s => s + 1)
  }

  function next() {
    if (qIdx + 1 >= QUIZ.length) { setDone(true); return }
    setQIdx(i => i + 1)
    setSelected(null)
  }

  if (done) {
    return (
      <SafeAreaView style={[s.center, { backgroundColor: C.bg }]}>
        <Text style={[s.resultEmoji]}>🎯</Text>
        <Text style={[s.resultTitle, { color: C.text }]}>Your level is</Text>
        <Text style={[s.resultLevel, { color: C.primary }]}>{resultLevel}</Text>
        <Text style={[s.resultSub, { color: C.text2 }]}>
          {score}/{QUIZ.length} correct
        </Text>
        <Text style={[s.resultDesc, { color: C.text3 }]}>
          {LEVEL_DESCRIPTIONS[resultLevel]}
        </Text>
        <TouchableOpacity
          style={[s.resultBtn, { backgroundColor: C.primary }]}
          onPress={() => navigation.navigate('Goal', { preferred_name, level: resultLevel })}
        >
          <Text style={s.resultBtnText}>Continue with {resultLevel}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={[s.progressTrack, { backgroundColor: C.bgAlt }]}>
          <View style={[s.progressFill, { width: `${((qIdx + 1) / QUIZ.length) * 100}%` as any, backgroundColor: C.primary }]} />
        </View>
        <Text style={[s.counter, { color: C.text3 }]}>{qIdx + 1} / {QUIZ.length}</Text>
        <Text style={[s.levelTag, { color: C.primary }]}>{q.level} Level</Text>

        <View style={[s.questionCard, { backgroundColor: C.surface }]}>
          <Text style={[s.sentence, { color: C.text }]}>{q.sentence}</Text>
        </View>

        <View style={{ gap: 10 }}>
          {q.options.map((opt, i) => {
            const isCorrect = opt.correct
            const isSelected = selected === i
            const revealed = selected !== null
            return (
              <TouchableOpacity
                key={i}
                style={[s.option,
                  { borderColor: !revealed ? C.border : isCorrect ? C.success : isSelected ? C.error : C.border },
                  { backgroundColor: !revealed ? C.bg : isCorrect ? 'rgba(22,163,74,.07)' : isSelected ? 'rgba(220,38,38,.06)' : C.bg },
                ]}
                onPress={() => choose(i)}
                disabled={revealed}
              >
                <View style={[s.letter, { backgroundColor: !revealed ? C.bgAlt : isCorrect ? C.success : isSelected ? C.error : C.bgAlt }]}>
                  <Text style={[s.letterText, { color: (revealed && (isCorrect || isSelected)) ? '#FFF' : C.text2 }]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={[s.optText, { color: C.text, fontFamily: revealed && isCorrect ? Fonts.semibold : Fonts.regular }]}>{opt.text}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {selected !== null && (
          <TouchableOpacity style={[s.nextBtn, { backgroundColor: C.primary }]} onPress={next}>
            <Text style={s.nextBtnText}>{qIdx + 1 >= QUIZ.length ? 'See Result' : 'Next'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const LEVEL_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: "Great starting point! You'll begin with essential everyday vocabulary.",
  A2: "You know the basics. We'll build on your foundation with common phrases.",
  B1: 'Solid intermediate level. You can handle real-world German conversations.',
  B2: "Upper intermediate. You're ready for complex vocabulary and nuanced expression.",
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  progressTrack: { height: 6, borderRadius: 99, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 6, borderRadius: 99 },
  counter: { fontSize: 13, fontFamily: Fonts.regular, textAlign: 'right', marginBottom: 16 },
  levelTag: { fontSize: 12, fontFamily: Fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  questionCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  sentence: { fontSize: 22, fontFamily: Fonts.semibold, lineHeight: 32 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, borderWidth: 1.5 },
  letter: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontSize: 13, fontFamily: Fonts.bold },
  optText: { flex: 1, fontSize: 16 },
  nextBtn: { marginTop: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontFamily: Fonts.semibold, color: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  resultEmoji: { fontSize: 64, marginBottom: 16 },
  resultTitle: { fontSize: 20, fontFamily: Fonts.regular, marginBottom: 4 },
  resultLevel: { fontSize: 72, fontFamily: Fonts.bold, lineHeight: 80 },
  resultSub: { fontSize: 16, fontFamily: Fonts.regular, marginBottom: 16 },
  resultDesc: { fontSize: 14, lineHeight: 22, fontFamily: Fonts.regular, textAlign: 'center', marginBottom: 32 },
  resultBtn: { borderRadius: 14, paddingHorizontal: 32, paddingVertical: 16 },
  resultBtnText: { fontSize: 16, fontFamily: Fonts.semibold, color: '#FFFFFF' },
})
