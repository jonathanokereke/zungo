import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Speech from 'expo-speech'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Track {
  id: string; title: string; level: string; topic: string
  word_count: number; estimated_minutes: number; best_pct: number | null
}
interface Article {
  id: string; title: string; level: string; topic: string
  text: string; word_count: number; estimated_minutes: number
}
interface MCQ {
  question: string; options: string[]; correct: number; explanation: string
}

type ScreenView = 'picker' | 'player' | 'quiz' | 'results'

// ── Constants ─────────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: 'rgba(34,197,94,.15)',   text: '#16A34A' },
  A2: { bg: 'rgba(34,197,94,.15)',   text: '#16A34A' },
  B1: { bg: 'rgba(59,130,246,.15)',  text: '#2563EB' },
  B2: { bg: 'rgba(59,130,246,.15)',  text: '#2563EB' },
  C1: { bg: 'rgba(168,85,247,.15)',  text: '#9333EA' },
  C2: { bg: 'rgba(168,85,247,.15)',  text: '#9333EA' },
}
const SPEEDS = [{ label: '0.7×', rate: 0.7 }, { label: '1×', rate: 1.0 }, { label: '1.2×', rate: 1.2 }]
const ACCENT = '#6366F1'

// ── Component ─────────────────────────────────────────────────────────────────
export function ListenScreen() {
  const { colors: C } = useTheme()
  const { getAccessToken } = useAuth()

  // Picker state
  const [view, setView]             = useState<ScreenView>('picker')
  const [tracks, setTracks]         = useState<Track[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('All')
  const levels = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

  // Player state
  const [article, setArticle]       = useState<Article | null>(null)
  const [questions, setQuestions]   = useState<MCQ[]>([])
  const [loadingTrack, setLoadingTrack] = useState(false)
  const [playing, setPlaying]       = useState(false)
  const [finished, setFinished]     = useState(false)
  const [speedIdx, setSpeedIdx]     = useState(1)
  const [playProgress, setPlayProgress] = useState(0)  // 0-1 fraction through sentences
  const sentencesRef = useRef<string[]>([])
  const sentenceIdxRef = useRef(0)

  // Quiz state
  const [qIdx, setQIdx]             = useState(0)
  const [selected, setSelected]     = useState<number | null>(null)
  const [score, setScore]           = useState(0)
  const [savingScore, setSavingScore] = useState(false)

  // ── Load track list ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessToken()
        const data = await apiFetch<{ tracks: Track[] }>('/api/listening/tracks', {}, token)
        setTracks(data.tracks)
      } catch {} finally { setListLoading(false) }
    }
    load()
  }, [])

  // ── Cleanup speech on unmount ────────────────────────────────────────────────
  useEffect(() => { return () => { Speech.stop() } }, [])

  // ── Open a track ────────────────────────────────────────────────────────────
  async function openTrack(track: Track) {
    setLoadingTrack(true)
    setView('player')
    setArticle(null)
    setQuestions([])
    setPlaying(false)
    setFinished(false)
    setPlayProgress(0)
    setQIdx(0)
    setSelected(null)
    setScore(0)
    sentencesRef.current = []
    sentenceIdxRef.current = 0
    try {
      const token = await getAccessToken()
      const data = await apiFetch<{ article: Article; questions: MCQ[] }>(
        `/api/listening/tracks/${track.id}/questions`,
        {},
        token,
      )
      setArticle(data.article)
      setQuestions(data.questions)
      sentencesRef.current = splitSentences(data.article.text)
    } catch {} finally { setLoadingTrack(false) }
  }

  // ── Split text into sentences ───────────────────────────────────────────────
  function splitSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  // ── Play / pause ────────────────────────────────────────────────────────────
  function startPlayback() {
    if (!article) return
    const sentences = sentencesRef.current
    if (sentences.length === 0) return
    const rate = SPEEDS[speedIdx]!.rate

    setPlaying(true)
    sentenceIdxRef.current = 0

    function speakNext() {
      const idx = sentenceIdxRef.current
      if (idx >= sentences.length) {
        setPlaying(false)
        setFinished(true)
        return
      }
      setPlayProgress((idx + 1) / sentences.length)
      Speech.speak(sentences[idx]!, {
        language: 'de-DE',
        rate,
        onDone: () => {
          sentenceIdxRef.current += 1
          speakNext()
        },
        onStopped: () => {},
        onError: () => { sentenceIdxRef.current += 1; speakNext() },
      })
    }
    speakNext()
  }

  function pausePlayback() {
    Speech.stop()
    setPlaying(false)
  }

  function replayTrack() {
    Speech.stop()
    setPlaying(false)
    setFinished(false)
    setPlayProgress(0)
    sentenceIdxRef.current = 0
  }

  function changeSpeed(idx: number) {
    setSpeedIdx(idx)
    if (playing) {
      Speech.stop()
      setPlaying(false)
      setFinished(false)
      setPlayProgress(0)
      sentenceIdxRef.current = 0
    }
  }

  // ── Quiz helpers ─────────────────────────────────────────────────────────────
  function choose(optIdx: number) {
    if (selected !== null) return
    setSelected(optIdx)
    if (optIdx === questions[qIdx]!.correct) setScore(s => s + 1)
  }

  async function nextQuestion() {
    const newIdx = qIdx + 1
    if (newIdx >= questions.length) {
      // Save score then show results
      setSavingScore(true)
      try {
        const token = await getAccessToken()
        const finalScore = selected === questions[qIdx]!.correct ? score + 1 : score
        await apiFetch('/api/listening/session', {
          method: 'POST',
          body: JSON.stringify({ article_id: article!.id, score: finalScore, total: questions.length }),
        }, token)
        setScore(finalScore)
      } catch {} finally { setSavingScore(false) }
      setView('results')
    } else {
      setQIdx(newIdx)
      setSelected(null)
    }
  }

  function backToPicker() {
    Speech.stop()
    setView('picker')
    setArticle(null)
    setFinished(false)
  }

  // ── Filtered tracks ──────────────────────────────────────────────────────────
  const filtered = levelFilter === 'All' ? tracks : tracks.filter(t => t.level === levelFilter)

  // ─────────────────────────────────────────────────────────────────────────────
  // PICKER VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'picker') {
    return (
      <SafeAreaView style={[ls.container, { backgroundColor: C.bg }]} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Header */}
          <View style={ls.header}>
            <View style={[ls.headerIcon, { backgroundColor: 'rgba(99,102,241,.1)' }]}>
              <Icons.Headphones size={28} color={ACCENT} />
            </View>
            <Text style={[ls.headerTitle, { color: C.text }]}>Listening</Text>
            <Text style={[ls.headerSub, { color: C.text3 }]}>
              Pick a track, listen in German, then answer comprehension questions.
            </Text>
          </View>

          {/* Level filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ls.filterRow}>
            {levels.map(l => (
              <TouchableOpacity
                key={l}
                style={[ls.filterChip, { backgroundColor: levelFilter === l ? ACCENT : C.surface, borderColor: C.border }]}
                onPress={() => setLevelFilter(l)}
              >
                <Text style={[ls.filterChipText, { color: levelFilter === l ? '#FFFFFF' : C.text3 }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Track list */}
          {listLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
          ) : (
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {filtered.map(track => {
                const lc = LEVEL_COLORS[track.level] ?? { bg: C.bgAlt, text: C.text3 }
                return (
                  <TouchableOpacity
                    key={track.id}
                    style={[ls.trackCard, { backgroundColor: C.surface, borderColor: C.border }]}
                    onPress={() => openTrack(track)}
                    activeOpacity={0.75}
                  >
                    <View style={ls.trackCardLeft}>
                      <View style={ls.trackCardTop}>
                        <View style={[ls.levelBadge, { backgroundColor: lc.bg }]}>
                          <Text style={[ls.levelBadgeText, { color: lc.text }]}>{track.level}</Text>
                        </View>
                        {track.best_pct != null && (
                          <View style={[ls.scoreBadge, { backgroundColor: track.best_pct >= 75 ? 'rgba(22,163,74,.12)' : 'rgba(245,158,11,.12)' }]}>
                            <Icons.Check size={10} color={track.best_pct >= 75 ? '#16A34A' : '#B45309'} />
                            <Text style={[ls.scoreBadgeText, { color: track.best_pct >= 75 ? '#16A34A' : '#B45309' }]}>
                              {track.best_pct}%
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[ls.trackTitle, { color: C.text }]}>{track.title}</Text>
                      <View style={ls.trackMeta}>
                        <Icons.Clock size={11} color={C.text3} />
                        <Text style={[ls.metaText, { color: C.text3 }]}>{track.estimated_minutes} min</Text>
                        <Text style={[ls.metaSep, { color: C.text3 }]}>·</Text>
                        <Text style={[ls.metaText, { color: C.text3 }]}>{track.topic}</Text>
                      </View>
                    </View>
                    <View style={[ls.playCircle, { backgroundColor: 'rgba(99,102,241,.1)' }]}>
                      <Icons.Play size={16} color={ACCENT} />
                    </View>
                  </TouchableOpacity>
                )
              })}
              {filtered.length === 0 && (
                <View style={{ alignItems: 'center', paddingTop: 40 }}>
                  <Text style={[{ color: C.text2, fontFamily: Fonts.regular }]}>No tracks at this level yet.</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAYER VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'player') {
    const lc = article ? (LEVEL_COLORS[article.level] ?? { bg: C.bgAlt, text: C.text3 }) : { bg: C.bgAlt, text: C.text3 }
    return (
      <SafeAreaView style={[ls.container, { backgroundColor: C.bg }]} edges={['top']}>
        {/* Top bar */}
        <View style={[ls.topBar, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={backToPicker} style={ls.backBtn}>
            <Icons.ArrowLeft size={18} color={ACCENT} />
            <Text style={[ls.backBtnText, { color: ACCENT }]}>Tracks</Text>
          </TouchableOpacity>
          {finished && questions.length > 0 && (
            <TouchableOpacity
              style={[ls.quizBtn, { backgroundColor: ACCENT }]}
              onPress={() => { setQIdx(0); setSelected(null); setView('quiz') }}
            >
              <Icons.CheckCircle size={13} color="#FFFFFF" />
              <Text style={ls.quizBtnText}>Take Quiz</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {loadingTrack ? (
            <View style={ls.center}>
              <ActivityIndicator color={ACCENT} size="large" />
              <Text style={[ls.loadingText, { color: C.text2 }]}>Loading track &amp; generating questions…</Text>
            </View>
          ) : article ? (
            <View style={{ padding: 16, gap: 16 }}>
              {/* Title card */}
              <View style={[ls.titleCard, { backgroundColor: C.surface }]}>
                <View style={ls.titleTop}>
                  <View style={[ls.levelBadge, { backgroundColor: lc.bg }]}>
                    <Text style={[ls.levelBadgeText, { color: lc.text }]}>{article.level}</Text>
                  </View>
                  <Text style={[ls.metaText, { color: C.text3 }]}>{article.topic}</Text>
                </View>
                <Text style={[ls.playerTitle, { color: C.text }]}>{article.title}</Text>
                <Text style={[ls.metaText, { color: C.text3, marginTop: 4 }]}>
                  {article.word_count} words · {article.estimated_minutes} min read
                </Text>
              </View>

              {/* Player controls */}
              <View style={[ls.playerCard, { backgroundColor: C.surface }]}>
                {/* Progress bar */}
                <View style={[ls.progressTrack, { backgroundColor: C.bgAlt }]}>
                  <View style={[ls.progressFill, { width: `${playProgress * 100}%` as any, backgroundColor: ACCENT }]} />
                </View>

                {/* Speed selector */}
                <View style={ls.speedRow}>
                  <Icons.Volume size={14} color={C.text3} />
                  <Text style={[ls.speedLabel, { color: C.text3 }]}>Speed</Text>
                  {SPEEDS.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[ls.speedChip, { backgroundColor: speedIdx === i ? ACCENT : C.bgAlt }]}
                      onPress={() => changeSpeed(i)}
                    >
                      <Text style={[ls.speedChipText, { color: speedIdx === i ? '#FFFFFF' : C.text3 }]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Main controls */}
                <View style={ls.controls}>
                  <TouchableOpacity
                    style={[ls.replayBtn, { backgroundColor: C.bgAlt }]}
                    onPress={replayTrack}
                    disabled={!finished && !playing}
                  >
                    <Icons.RotateCcw size={18} color={C.text3} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[ls.playBtn, { backgroundColor: ACCENT }]}
                    onPress={playing ? pausePlayback : startPlayback}
                    disabled={finished}
                  >
                    {playing
                      ? <Icons.Pause size={28} color="#FFFFFF" />
                      : <Icons.Play size={28} color="#FFFFFF" />}
                  </TouchableOpacity>

                  <View style={{ width: 52 }} />
                </View>

                {/* Status text */}
                <Text style={[ls.statusText, { color: C.text3 }]}>
                  {finished
                    ? '✓ Finished — take the quiz below'
                    : playing
                      ? 'Playing…'
                      : playProgress > 0
                        ? 'Paused'
                        : 'Tap ▶ to start listening'}
                </Text>
              </View>

              {/* Transcript (hidden until finished) */}
              {finished && (
                <View style={[ls.transcriptCard, { backgroundColor: C.surface }]}>
                  <Text style={[ls.transcriptLabel, { color: C.text3 }]}>TRANSCRIPT</Text>
                  <Text style={[ls.transcriptText, { color: C.text2 }]}>{article.text}</Text>
                </View>
              )}

              {/* Quiz CTA */}
              {finished && questions.length > 0 && (
                <TouchableOpacity
                  style={[ls.ctaBtn, { backgroundColor: ACCENT }]}
                  onPress={() => { setQIdx(0); setSelected(null); setView('quiz') }}
                >
                  <Icons.CheckCircle size={18} color="#FFFFFF" />
                  <Text style={ls.ctaBtnText}>Start Comprehension Quiz ({questions.length} questions)</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={ls.center}>
              <Icons.XCircle size={40} color={C.error} />
              <Text style={[ls.loadingText, { color: C.text2 }]}>Could not load this track. Try again.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // QUIZ VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'quiz' && questions.length > 0) {
    const question = questions[qIdx]!
    return (
      <SafeAreaView style={[ls.container, { backgroundColor: C.bg }]} edges={['top']}>
        {/* Top bar */}
        <View style={[ls.topBar, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => setView('player')} style={ls.backBtn}>
            <Icons.ArrowLeft size={18} color={ACCENT} />
            <Text style={[ls.backBtnText, { color: ACCENT }]}>Player</Text>
          </TouchableOpacity>
          <Text style={[ls.counterText, { color: C.text3 }]}>{qIdx + 1} / {questions.length}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Progress */}
          <View style={[ls.progressTrack, { backgroundColor: C.bgAlt, marginBottom: 20 }]}>
            <View style={[ls.progressFill, { width: `${((qIdx + 1) / questions.length) * 100}%` as any, backgroundColor: ACCENT }]} />
          </View>

          {/* Track label */}
          <Text style={[ls.quizTrackLabel, { color: ACCENT }]}>Listening Comprehension</Text>
          <Text style={[ls.quizTrackSub, { color: C.text3 }]}>{article?.title}</Text>

          {/* Question */}
          <View style={[ls.questionCard, { backgroundColor: C.surface }]}>
            <Text style={[ls.questionText, { color: C.text }]}>{question.question}</Text>
          </View>

          {/* Options */}
          <View style={{ gap: 10 }}>
            {question.options.map((opt, i) => {
              const isCorrect  = i === question.correct
              const isSelected = selected === i
              const revealed   = selected !== null
              const borderColor = !revealed ? C.border : isCorrect ? C.success : isSelected ? C.error : C.border
              const bg = !revealed ? C.bg : isCorrect ? 'rgba(22,163,74,.07)' : isSelected ? 'rgba(220,38,38,.06)' : C.bg
              return (
                <TouchableOpacity
                  key={i}
                  style={[ls.option, { borderColor, backgroundColor: bg }]}
                  onPress={() => choose(i)}
                  disabled={revealed}
                >
                  <View style={[ls.optLetter, { backgroundColor: !revealed ? C.bgAlt : isCorrect ? C.success : isSelected ? C.error : C.bgAlt }]}>
                    <Text style={[ls.optLetterText, { color: revealed && (isCorrect || isSelected) ? '#FFF' : C.text2 }]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={[ls.optText, { color: C.text, fontFamily: revealed && isCorrect ? Fonts.semibold : Fonts.regular }]}>
                    {opt}
                  </Text>
                  {revealed && isCorrect  && <Icons.CheckCircle size={18} color={C.success} />}
                  {revealed && isSelected && !isCorrect && <Icons.XCircle size={18} color={C.error} />}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Explanation */}
          {selected !== null && (
            <View style={[ls.explanationBox, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Icons.BookOpen size={14} color={ACCENT} />
              <Text style={[ls.explanationText, { color: C.text2 }]}>{question.explanation}</Text>
            </View>
          )}

          {/* Next */}
          {selected !== null && (
            <TouchableOpacity
              style={[ls.ctaBtn, { backgroundColor: ACCENT, marginTop: 16 }]}
              onPress={nextQuestion}
              disabled={savingScore}
            >
              {savingScore
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={ls.ctaBtnText}>{qIdx + 1 >= questions.length ? 'See Results' : 'Next Question'}</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RESULTS VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'results') {
    const pct = Math.round((score / questions.length) * 100)
    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'
    const msg   = pct >= 80 ? 'Excellent comprehension!' : pct >= 60 ? 'Good effort!' : 'Keep practising!'
    return (
      <SafeAreaView style={[ls.container, { backgroundColor: C.bg }]} edges={['top']}>
        <View style={ls.center}>
          <Text style={{ fontSize: 56 }}>{emoji}</Text>
          <Text style={[ls.resultTitle, { color: C.text }]}>{score}/{questions.length} correct</Text>
          <Text style={[ls.resultSub,   { color: C.text2 }]}>{msg}</Text>
          <View style={[ls.scoreBar, { backgroundColor: C.bgAlt }]}>
            <View style={[ls.scoreFill, {
              width: `${pct}%` as any,
              backgroundColor: pct >= 80 ? C.success : pct >= 60 ? '#B45309' : C.error,
            }]} />
          </View>
          <TouchableOpacity style={[ls.ctaBtn, { backgroundColor: ACCENT, width: '100%' }]} onPress={backToPicker}>
            <Text style={ls.ctaBtnText}>Back to Tracks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ls.ctaBtn, { backgroundColor: C.surface, width: '100%' }]}
            onPress={() => { setQIdx(0); setSelected(null); setView('quiz') }}
          >
            <Text style={[ls.ctaBtnText, { color: ACCENT }]}>Retry Quiz</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return null
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  container: { flex: 1 },

  // Picker
  header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 12 },
  headerIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 26, fontFamily: Fonts.bold, marginBottom: 8 },
  headerSub: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center', lineHeight: 21 },

  filterRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 12 },
  filterChip: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  filterChipText: { fontSize: 13, fontFamily: Fonts.semibold },

  trackCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  trackCardLeft: { flex: 1, gap: 6 },
  trackCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  levelBadgeText: { fontSize: 11, fontFamily: Fonts.bold },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  scoreBadgeText: { fontSize: 11, fontFamily: Fonts.semibold },
  trackTitle: { fontSize: 16, fontFamily: Fonts.semibold },
  trackMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, fontFamily: Fonts.regular },
  metaSep: { fontSize: 11 },
  playCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Shared
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: 14, fontFamily: Fonts.medium },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  loadingText: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16 },
  ctaBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 15 },

  // Player
  titleCard: { borderRadius: 16, padding: 18 },
  titleTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  playerTitle: { fontSize: 20, fontFamily: Fonts.bold },

  playerCard: { borderRadius: 16, padding: 20, gap: 18 },
  progressTrack: { height: 5, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 99 },

  speedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  speedLabel: { fontSize: 12, fontFamily: Fonts.regular, marginRight: 2 },
  speedChip: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  speedChipText: { fontSize: 12, fontFamily: Fonts.semibold },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  replayBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  playBtn:   { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 13, fontFamily: Fonts.regular, textAlign: 'center' },

  transcriptCard: { borderRadius: 16, padding: 18 },
  transcriptLabel: { fontSize: 10, fontFamily: Fonts.bold, letterSpacing: 1, marginBottom: 10 },
  transcriptText: { fontSize: 14, lineHeight: 23, fontFamily: Fonts.regular },

  quizBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  quizBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 13 },

  // Quiz
  counterText: { fontSize: 12, fontFamily: Fonts.regular },
  quizTrackLabel: { fontSize: 12, fontFamily: Fonts.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  quizTrackSub: { fontSize: 13, fontFamily: Fonts.regular, marginBottom: 16 },
  questionCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  questionText: { fontSize: 18, fontFamily: Fonts.semibold, lineHeight: 28 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, borderWidth: 1.5 },
  optLetter: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optLetterText: { fontSize: 13, fontFamily: Fonts.bold },
  optText: { flex: 1, fontSize: 15 },
  explanationBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 16 },
  explanationText: { flex: 1, fontSize: 13, fontFamily: Fonts.regular, lineHeight: 20 },

  // Results
  resultTitle: { fontSize: 26, fontFamily: Fonts.bold, textAlign: 'center' },
  resultSub:   { fontSize: 15, fontFamily: Fonts.regular, textAlign: 'center' },
  scoreBar: { width: '100%', height: 8, borderRadius: 99, overflow: 'hidden' },
  scoreFill: { height: 8, borderRadius: 99 },
})
