import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import type { RootStackParamList } from '../../navigation/RootNavigator'

type ExerciseRoute = RouteProp<RootStackParamList, 'Exercise'>

interface Question {
  id: number
  sentence: string
  options: { text: string; correct: boolean }[]
  explanation: string
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    sentence: 'Ich gebe ___ Buch.',
    options: [
      { text: 'dem Mann das', correct: true },
      { text: 'den Mann das', correct: false },
      { text: 'der Mann das', correct: false },
      { text: 'des Mannes das', correct: false },
    ],
    explanation: 'After "geben" (to give), the person receiving takes the Dativ case. "Mann" is masculine, so dative article is "dem".',
  },
  {
    id: 2,
    sentence: 'Wenn ich Zeit ___, würde ich reisen.',
    options: [
      { text: 'hätte', correct: true },
      { text: 'hatte', correct: false },
      { text: 'habe', correct: false },
      { text: 'haben', correct: false },
    ],
    explanation: 'Konjunktiv II of "haben" is "hätte". Used for hypothetical conditions in the present/future.',
  },
]

export function ExerciseScreen() {
  const route = useRoute<ExerciseRoute>()
  const { topic, subtitle } = route.params
  const { colors: C } = useTheme()
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const question = QUESTIONS[qIdx]

  function choose(optIdx: number) {
    if (selected !== null) return
    setSelected(optIdx)
    setShowExplanation(true)
    if (QUESTIONS[qIdx].options[optIdx].correct) setScore(s => s + 1)
  }

  function next() {
    if (qIdx + 1 >= QUESTIONS.length) { setDone(true); return }
    setQIdx(i => i + 1)
    setSelected(null)
    setShowExplanation(false)
  }

  function optionBorder(i: number) {
    if (selected === null) return C.border
    if (question.options[i].correct) return C.success
    if (selected === i) return C.error
    return C.border
  }

  function optionBg(i: number) {
    if (selected === null) return C.bg
    if (question.options[i].correct) return 'rgba(22,163,74,.06)'
    if (selected === i) return 'rgba(220,38,38,.06)'
    return C.bg
  }

  function letterBg(i: number) {
    if (selected === null) return C.bgAlt
    if (question.options[i].correct) return C.success
    if (selected === i) return C.error
    return C.bgAlt
  }

  function letterColor(i: number) {
    if (selected === null) return C.text2
    if (question.options[i].correct || selected === i) return '#FFFFFF'
    return C.text2
  }

  if (done) {
    const pct = Math.round((score / QUESTIONS.length) * 100)
    const trophyColor = pct >= 80 ? C.accentD : pct >= 60 ? C.warn : C.error
    return (
      <SafeAreaView style={[ex.center, { backgroundColor: C.bg }]}>
        <Icons.Trophy size={56} color={trophyColor} />
        <Text style={[ex.doneTitle, { color: C.text }]}>{pct >= 80 ? 'Ausgezeichnet!' : pct >= 60 ? 'Gut gemacht!' : 'Keep practicing!'}</Text>
        <Text style={[ex.donePct, { color: C.primary }]}>{pct}%</Text>
        <Text style={[ex.doneSub, { color: C.text2 }]}>{score} of {QUESTIONS.length} correct</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[ex.container, { backgroundColor: C.bg }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={ex.headerRow}>
          <View>
            <Text style={[ex.headerTopic, { color: C.text }]}>{topic}</Text>
            <Text style={[ex.headerSub, { color: C.text2 }]}>{subtitle}</Text>
          </View>
          <Text style={[ex.qCount, { color: C.text3 }]}>{qIdx + 1}/{QUESTIONS.length}</Text>
        </View>

        <View style={[ex.progressTrack, { backgroundColor: C.bgAlt }]}>
          <View style={[ex.progressFill, { width: `${((qIdx + 1) / QUESTIONS.length) * 100}%` as any, backgroundColor: C.primary }]} />
        </View>

        <View style={[ex.questionCard, { backgroundColor: C.surface }]}>
          <Text style={[ex.questionLabel, { color: C.primary }]}>Fill in the blank</Text>
          <Text style={[ex.questionSentence, { color: C.text }]}>{question.sentence}</Text>
        </View>

        <View style={{ gap: 10 }}>
          {question.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[ex.option, { borderColor: optionBorder(i), backgroundColor: optionBg(i) }]}
              onPress={() => choose(i)}
              activeOpacity={0.8}
              disabled={selected !== null}
            >
              <View style={[ex.letter, { backgroundColor: letterBg(i) }]}>
                <Text style={[ex.letterText, { color: letterColor(i) }]}>{String.fromCharCode(65 + i)}</Text>
              </View>
              <Text style={[ex.optionText, { color: selected !== null && opt.correct ? C.success : C.text },
                selected !== null && opt.correct && { fontFamily: Fonts.semibold }]}>
                {opt.text}
              </Text>
              {selected !== null && opt.correct && <Icons.CheckCircle size={18} color={C.success} />}
              {selected === i && !opt.correct && <Icons.XCircle size={18} color={C.error} />}
            </TouchableOpacity>
          ))}
        </View>

        {showExplanation && (
          <View style={[ex.explanationCard, { backgroundColor: 'rgba(22,163,74,.08)', borderColor: 'rgba(22,163,74,.2)' }]}>
            <View style={ex.explanationHeader}>
              <Icons.BookOpen size={14} color={C.success} />
              <Text style={[ex.explanationTitle, { color: C.success }]}>Erklärung</Text>
            </View>
            <Text style={[ex.explanationText, { color: C.text2 }]}>{question.explanation}</Text>
          </View>
        )}

        {selected !== null && (
          <TouchableOpacity style={[ex.nextBtn, { backgroundColor: C.primary }]} onPress={next}>
            <Text style={ex.nextBtnText}>{qIdx + 1 >= QUESTIONS.length ? 'See Results' : 'Next Question'}</Text>
            <Icons.ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const ex = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerTopic: { fontSize: 20, fontFamily: Fonts.semibold },
  headerSub: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  qCount: { fontSize: 14, fontFamily: Fonts.semibold },
  progressTrack: { height: 6, borderRadius: 99, overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: 6, borderRadius: 99 },
  questionCard: { borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  questionLabel: { fontSize: 11, fontFamily: Fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  questionSentence: { fontSize: 20, fontFamily: Fonts.semibold, lineHeight: 30 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, borderWidth: 1.5 },
  letter: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  letterText: { fontSize: 13, fontFamily: Fonts.bold },
  optionText: { flex: 1, fontSize: 15, fontFamily: Fonts.regular },
  explanationCard: { marginTop: 16, borderWidth: 1, borderRadius: 14, padding: 14 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  explanationTitle: { fontSize: 12, fontFamily: Fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  explanationText: { fontSize: 14, lineHeight: 22, fontFamily: Fonts.regular },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, borderRadius: 14, paddingVertical: 16 },
  nextBtnText: { fontSize: 16, fontFamily: Fonts.semibold, color: '#FFFFFF' },
  doneTitle: { fontSize: 26, fontFamily: Fonts.bold, marginTop: 20, marginBottom: 8, textAlign: 'center' },
  donePct: { fontSize: 52, fontFamily: Fonts.bold, lineHeight: 60 },
  doneSub: { fontSize: 16, marginTop: 8, fontFamily: Fonts.regular },
})
