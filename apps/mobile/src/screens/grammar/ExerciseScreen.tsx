import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import type { RootStackParamList } from '../../navigation/RootNavigator'

type ExerciseRoute = RouteProp<RootStackParamList, 'Exercise'>

interface Question {
  sentence: string
  options: string[]
  correct: number
  explanation: string
}

export function ExerciseScreen() {
  const route = useRoute<ExerciseRoute>()
  const navigation = useNavigation()
  const { topic, subtitle } = route.params
  const { colors: C } = useTheme()
  const { getAccessToken } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = await getAccessToken()
        const resp = await apiFetch<{ questions: Question[]; topic: string; level: string }>(
          `/api/grammar/exercises?topic=${encodeURIComponent(topic)}`,
          {},
          token,
        )
        setQuestions(resp.questions)
      } catch (e: any) {
        setError(e?.message ?? 'Could not load exercises')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [topic])

  useEffect(() => {
    if (!done || questions.length === 0) return
    getAccessToken().then(token =>
      apiFetch('/api/grammar/session', {
        method: 'POST',
        body: JSON.stringify({ topic, score, total: questions.length }),
      }, token)
    ).catch(() => {})
  }, [done])

  function choose(optIdx: number) {
    if (selected !== null) return
    setSelected(optIdx)
    if (optIdx === questions[qIdx]!.correct) setScore(s => s + 1)
  }

  function next() {
    if (qIdx + 1 >= questions.length) { setDone(true); return }
    setQIdx(i => i + 1)
    setSelected(null)
  }

  const question = questions[qIdx]

  if (loading) return (
    <SafeAreaView style={[ex.center, { backgroundColor: C.bg }]}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={[ex.loadingText, { color: C.text2 }]}>Generating {topic} exercises…</Text>
    </SafeAreaView>
  )

  if (error) return (
    <SafeAreaView style={[ex.center, { backgroundColor: C.bg }]}>
      <Icons.XCircle size={48} color={C.error} />
      <Text style={[ex.doneTitle, { color: C.text }]}>Couldn't load exercises</Text>
      <Text style={[ex.doneSub, { color: C.text2 }]}>{error}</Text>
      <TouchableOpacity style={[ex.backBtn, { backgroundColor: C.primary }]} onPress={() => navigation.goBack()}>
        <Text style={ex.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <SafeAreaView style={[ex.center, { backgroundColor: C.bg }]}>
        <Text style={{ fontSize: 56 }}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</Text>
        <Text style={[ex.doneTitle, { color: C.text }]}>{score}/{questions.length} correct</Text>
        <Text style={[ex.doneSub, { color: C.text2 }]}>
          {pct >= 80 ? 'Excellent mastery of ' : pct >= 60 ? 'Good progress on ' : 'Keep practising '}{topic}!
        </Text>
        <View style={[ex.scoreBar, { backgroundColor: C.bgAlt }]}>
          <View style={[ex.scoreFill, { width: `${pct}%`, backgroundColor: pct >= 80 ? C.success : pct >= 60 ? C.accentD : C.error }]} />
        </View>
        <TouchableOpacity style={[ex.backBtn, { backgroundColor: C.primary }]} onPress={() => navigation.goBack()}>
          <Text style={ex.backBtnText}>Back to Grammar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  if (!question) return null

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={ex.scroll}>
        {/* Header */}
        <View style={ex.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icons.ArrowLeft size={22} color={C.text2} />
          </TouchableOpacity>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <View style={[ex.progressTrack, { backgroundColor: C.bgAlt }]}>
              <View style={[ex.progressFill, { width: `${((qIdx + 1) / questions.length) * 100}%`, backgroundColor: C.primary }]} />
            </View>
          </View>
          <Text style={[ex.counter, { color: C.text3 }]}>{qIdx + 1}/{questions.length}</Text>
        </View>

        <Text style={[ex.topicLabel, { color: C.primary }]}>{topic}</Text>
        <Text style={[ex.subtitle, { color: C.text3 }]}>{subtitle}</Text>

        <View style={[ex.sentenceCard, { backgroundColor: C.surface }]}>
          <Text style={[ex.sentence, { color: C.text }]}>{question.sentence}</Text>
        </View>

        <View style={{ gap: 10 }}>
          {question.options.map((opt, i) => {
            const isCorrect = i === question.correct
            const isSelected = selected === i
            const revealed = selected !== null
            const borderColor = !revealed ? C.border : isCorrect ? C.success : isSelected ? C.error : C.border
            const bg = !revealed ? C.bg : isCorrect ? 'rgba(22,163,74,.07)' : isSelected ? 'rgba(220,38,38,.06)' : C.bg
            return (
              <TouchableOpacity
                key={i}
                style={[ex.option, { borderColor, backgroundColor: bg }]}
                onPress={() => choose(i)}
                disabled={revealed}
              >
                <View style={[ex.letter, {
                  backgroundColor: !revealed ? C.bgAlt : isCorrect ? C.success : isSelected ? C.error : C.bgAlt
                }]}>
                  <Text style={[ex.letterText, { color: (revealed && (isCorrect || isSelected)) ? '#FFF' : C.text2 }]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={[ex.optText, { color: C.text, fontFamily: revealed && isCorrect ? Fonts.semibold : Fonts.regular }]}>
                  {opt}
                </Text>
                {revealed && isCorrect && <Icons.CheckCircle size={18} color={C.success} />}
                {revealed && isSelected && !isCorrect && <Icons.XCircle size={18} color={C.error} />}
              </TouchableOpacity>
            )
          })}
        </View>

        {selected !== null && (
          <View style={[ex.explanationBox, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Icons.BookOpen size={14} color={C.primary} />
            <Text style={[ex.explanationText, { color: C.text2 }]}>{question.explanation}</Text>
          </View>
        )}

        {selected !== null && (
          <TouchableOpacity style={[ex.nextBtn, { backgroundColor: C.primary }]} onPress={next}>
            <Text style={ex.nextBtnText}>{qIdx + 1 >= questions.length ? 'See Results' : 'Next Question'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const ex = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  progressTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 99 },
  counter: { fontSize: 12, fontFamily: Fonts.regular, width: 36, textAlign: 'right' },
  topicLabel: { fontSize: 13, fontFamily: Fonts.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: Fonts.regular, marginBottom: 16 },
  sentenceCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  sentence: { fontSize: 20, fontFamily: Fonts.semibold, lineHeight: 30 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, borderWidth: 1.5 },
  letter: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  letterText: { fontSize: 13, fontFamily: Fonts.bold },
  optText: { flex: 1, fontSize: 16 },
  explanationBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 16 },
  explanationText: { flex: 1, fontSize: 13, fontFamily: Fonts.regular, lineHeight: 20 },
  nextBtn: { marginTop: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontFamily: Fonts.semibold, color: '#FFFFFF' },
  doneTitle: { fontSize: 24, fontFamily: Fonts.bold, textAlign: 'center' },
  doneSub: { fontSize: 15, fontFamily: Fonts.regular, textAlign: 'center' },
  loadingText: { fontSize: 14, fontFamily: Fonts.regular, marginTop: 12 },
  backBtn: { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  backBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 16 },
  scoreBar: { width: '100%', height: 8, borderRadius: 99, overflow: 'hidden', marginVertical: 8 },
  scoreFill: { height: 8, borderRadius: 99 },
})
