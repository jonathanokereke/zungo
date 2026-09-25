import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Speech from 'expo-speech'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ArticleSummary {
  id: string; title: string; level: string; topic: string
  word_count: number; estimated_minutes: number; preview: string
}
interface ArticleFull extends ArticleSummary { text: string }
interface LibraryResp { articles: ArticleSummary[]; accessible_levels: string[] }

type Speed = 0.5 | 0.75 | 1.0
type Mode = 'listen' | 'shadow'
type ScreenView = 'picker' | 'player'

// ── Helpers ───────────────────────────────────────────────────────────────────

// Split text into sentences on . ! ?
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean)
}

// Estimate ms to speak `text` at given rate (avg ~130 wpm at 1.0×)
function estimateDuration(text: string, rate: Speed): number {
  const words = text.trim().split(/\s+/).length
  const wordsPerMs = (130 * rate) / 60_000
  return Math.ceil(words / wordsPerMs) + 300 // 300ms buffer
}

const SPEED_LABELS: Record<Speed, string> = { 0.5: '0.5×', 0.75: '0.75×', 1.0: '1×' }
const SPEEDS: Speed[] = [0.5, 0.75, 1.0]

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: 'rgba(34,197,94,.15)', text: '#16A34A' },
  A2: { bg: 'rgba(34,197,94,.15)', text: '#16A34A' },
  B1: { bg: 'rgba(59,130,246,.15)', text: '#2563EB' },
  B2: { bg: 'rgba(59,130,246,.15)', text: '#2563EB' },
  C1: { bg: 'rgba(168,85,247,.15)', text: '#9333EA' },
  C2: { bg: 'rgba(168,85,247,.15)', text: '#9333EA' },
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ShadowScreen() {
  const { colors: C } = useTheme()
  const { getAccessToken } = useAuth()

  // Picker state
  const [view, setView] = useState<ScreenView>('picker')
  const [library, setLibrary] = useState<ArticleSummary[]>([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [articleLoading, setArticleLoading] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [showPaste, setShowPaste] = useState(false)

  // Player state
  const [article, setArticle] = useState<ArticleFull | null>(null)
  const [sentences, setSentences] = useState<string[]>([])
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(0.75)
  const [mode, setMode] = useState<Mode>('listen')
  // In shadow mode: 'listening' → hearing sentence, 'shadowing' → user repeats, 'done' → advance
  const [shadowPhase, setShadowPhase] = useState<'listening' | 'shadowing' | 'idle'>('idle')

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    loadLibrary()
    return () => { Speech.stop(); clearTimer() }
  }, [])

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  async function loadLibrary() {
    try {
      const token = await getAccessToken()
      const resp = await apiFetch<LibraryResp>('/api/reading/library', {}, token)
      setLibrary(resp.articles)
    } catch {} finally { setLibraryLoading(false) }
  }

  async function openArticle(summary: ArticleSummary) {
    setArticleLoading(true)
    try {
      const token = await getAccessToken()
      const full = await apiFetch<ArticleFull>(`/api/reading/library/${summary.id}`, {}, token)
      startPlayer(full)
    } catch {} finally { setArticleLoading(false) }
  }

  function openPasted() {
    if (!pasteText.trim()) return
    const pseudo: ArticleFull = {
      id: '', title: 'Custom text', level: 'B1', topic: 'Custom',
      word_count: 0, estimated_minutes: 0, preview: '', text: pasteText.trim(),
    }
    startPlayer(pseudo)
    setShowPaste(false)
    setPasteText('')
  }

  function startPlayer(a: ArticleFull) {
    const s = splitSentences(a.text)
    setArticle(a)
    setSentences(s)
    setSentenceIdx(0)
    setPlaying(false)
    setShadowPhase('idle')
    setView('player')
  }

  function exitPlayer() {
    Speech.stop()
    clearTimer()
    setPlaying(false)
    setView('picker')
    setArticle(null)
  }

  // ── Playback ────────────────────────────────────────────────────────────────

  const speakCurrent = useCallback((idx: number, currentSpeed: Speed, currentMode: Mode) => {
    const sentence = sentences[idx]
    if (!sentence) return

    Speech.stop()
    clearTimer()
    setPlaying(true)
    setShadowPhase(currentMode === 'shadow' ? 'listening' : 'idle')

    Speech.speak(sentence, {
      language: 'de-DE',
      rate: currentSpeed,
      onDone: () => {
        if (currentMode === 'shadow') {
          // After listening, give user time to shadow (same duration)
          setShadowPhase('shadowing')
          const wait = estimateDuration(sentence, currentSpeed) * 1.5
          timerRef.current = setTimeout(() => {
            setShadowPhase('idle')
            setPlaying(false)
          }, wait)
        } else {
          setPlaying(false)
          setShadowPhase('idle')
        }
      },
      onError: () => { setPlaying(false); setShadowPhase('idle') },
    })
  }, [sentences])

  function handlePlayPause() {
    if (playing) {
      Speech.stop()
      clearTimer()
      setPlaying(false)
      setShadowPhase('idle')
    } else {
      speakCurrent(sentenceIdx, speed, mode)
    }
  }

  function handlePrev() {
    Speech.stop(); clearTimer()
    setPlaying(false); setShadowPhase('idle')
    setSentenceIdx(i => Math.max(0, i - 1))
  }

  function handleNext() {
    Speech.stop(); clearTimer()
    setPlaying(false); setShadowPhase('idle')
    setSentenceIdx(i => Math.min(sentences.length - 1, i + 1))
  }

  function handleReplay() {
    speakCurrent(sentenceIdx, speed, mode)
  }

  function handleSpeedChange(s: Speed) {
    setSpeed(s)
    if (playing) {
      Speech.stop(); clearTimer()
      setPlaying(false); setShadowPhase('idle')
    }
  }

  function handleModeChange(m: Mode) {
    setMode(m)
    Speech.stop(); clearTimer()
    setPlaying(false); setShadowPhase('idle')
  }

  // ── Player view ──────────────────────────────────────────────────────────────
  if (view === 'player' && article) {
    const sentence = sentences[sentenceIdx] ?? ''
    const isLast = sentenceIdx === sentences.length - 1

    return (
      <SafeAreaView style={[sh.container, { backgroundColor: C.bg }]} edges={['top']}>
        {/* Top bar */}
        <View style={[sh.topBar, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={exitPlayer} style={sh.backBtn}>
            <Icons.ArrowLeft size={18} color={C.primary} />
            <Text style={[sh.backBtnText, { color: C.primary }]}>Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[sh.topTitle, { color: C.text }]} numberOfLines={1}>{article.title}</Text>
          </View>
          <View style={[sh.levelBadge, { backgroundColor: LEVEL_COLORS[article.level]?.bg ?? C.bgAlt }]}>
            <Text style={[sh.levelBadgeText, { color: LEVEL_COLORS[article.level]?.text ?? C.text3 }]}>{article.level}</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={sh.playerContent} showsVerticalScrollIndicator={false}>
          {/* Mode selector */}
          <View style={[sh.modeRow, { backgroundColor: C.bgAlt }]}>
            {(['listen', 'shadow'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[sh.modeBtn, mode === m && { backgroundColor: C.surface }]}
                onPress={() => handleModeChange(m)}
              >
                {m === 'listen'
                  ? <Icons.Headphones size={15} color={mode === m ? C.primary : C.text3} />
                  : <Icons.Repeat size={15} color={mode === m ? C.primary : C.text3} />}
                <Text style={[sh.modeBtnText, { color: mode === m ? C.primary : C.text3, fontFamily: mode === m ? Fonts.semibold : Fonts.regular }]}>
                  {m === 'listen' ? 'Listen' : 'Shadow'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sentence counter */}
          <Text style={[sh.sentenceCount, { color: C.text3 }]}>
            {sentenceIdx + 1} / {sentences.length}
          </Text>

          {/* Full transcript — current sentence highlighted */}
          <View style={[sh.transcriptCard, { backgroundColor: C.surface }]}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 260 }}>
              {sentences.map((s, i) => (
                <Text
                  key={i}
                  style={[
                    sh.transcriptLine,
                    i === sentenceIdx
                      ? { color: C.text, backgroundColor: 'rgba(55,48,163,.08)', borderRadius: 6 }
                      : { color: C.text3 },
                  ]}
                >
                  {s}
                </Text>
              ))}
            </ScrollView>
          </View>

          {/* Active sentence large display */}
          <View style={[sh.activeSentenceCard, {
            backgroundColor: shadowPhase === 'shadowing' ? 'rgba(245,158,11,.08)' : C.surface,
            borderColor: shadowPhase === 'shadowing' ? C.accent : C.border,
          }]}>
            {shadowPhase === 'shadowing' ? (
              <View style={sh.shadowingIndicator}>
                <Icons.Mic size={20} color={C.accent} />
                <Text style={[sh.shadowingLabel, { color: C.accent }]}>Your turn — repeat the sentence</Text>
              </View>
            ) : shadowPhase === 'listening' ? (
              <View style={sh.shadowingIndicator}>
                <Icons.Volume size={18} color={C.primary} />
                <Text style={[sh.shadowingLabel, { color: C.primary }]}>Listen carefully…</Text>
              </View>
            ) : null}
            <Text style={[sh.activeSentence, { color: C.text }]}>{sentence}</Text>
          </View>

          {/* Mode hint */}
          <Text style={[sh.modeHint, { color: C.text3 }]}>
            {mode === 'listen'
              ? 'Press play to hear the sentence in German'
              : 'Listen to each sentence, then repeat it aloud'}
          </Text>
        </ScrollView>

        {/* Controls */}
        <View style={[sh.controls, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          {/* Speed selector */}
          <View style={sh.speedRow}>
            {SPEEDS.map(s => (
              <TouchableOpacity
                key={s}
                style={[sh.speedBtn, speed === s && { backgroundColor: C.primary }]}
                onPress={() => handleSpeedChange(s)}
              >
                <Text style={[sh.speedBtnText, { color: speed === s ? '#FFFFFF' : C.text3 }]}>
                  {SPEED_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transport */}
          <View style={sh.transport}>
            <TouchableOpacity
              style={[sh.transpBtn, { opacity: sentenceIdx === 0 ? 0.3 : 1 }]}
              onPress={handlePrev}
              disabled={sentenceIdx === 0}
            >
              <Icons.ChevronLeft size={24} color={C.text2} />
            </TouchableOpacity>

            <TouchableOpacity style={sh.replayBtn} onPress={handleReplay}>
              <Icons.RotateCcw size={18} color={C.text2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[sh.playBtn, { backgroundColor: playing ? C.error : C.primary }]}
              onPress={handlePlayPause}
            >
              {playing
                ? <Icons.Pause size={26} color="#FFFFFF" />
                : <Icons.Play size={26} color="#FFFFFF" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[sh.replayBtn, { opacity: isLast ? 0.3 : 1 }]}
              onPress={handleNext}
              disabled={isLast}
            >
              <Icons.ChevronRight size={24} color={C.text2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[sh.transpBtn, { opacity: isLast ? 0.3 : 1 }]}
              onPress={() => { if (!isLast) { setSentenceIdx(i => i + 1); setPlaying(false); setShadowPhase('idle') } }}
              disabled={isLast}
            >
              <Icons.ChevronRight size={24} color={C.text2} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // ── Picker view ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[sh.container, { backgroundColor: C.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View style={sh.pickerHeader}>
          <View style={[sh.headerIconWrap, { backgroundColor: 'rgba(55,48,163,.1)' }]}>
            <Icons.Headphones size={28} color={C.primary} />
          </View>
          <Text style={[sh.pickerTitle, { color: C.text }]}>Shadowing</Text>
          <Text style={[sh.pickerSubtitle, { color: C.text3 }]}>
            Hear native-speed German, then repeat each sentence to train your ear and pronunciation.
          </Text>
          {/* Paste own text */}
          <TouchableOpacity
            style={[sh.pasteBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={() => setShowPaste(v => !v)}
          >
            <Icons.PenLine size={15} color={C.primary} />
            <Text style={[sh.pasteBtnText, { color: C.primary }]}>Paste your own text</Text>
          </TouchableOpacity>
          {showPaste && (
            <View style={{ marginTop: 10, width: '100%' }}>
              <View style={[sh.inputCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <TextInput
                  style={[sh.textInput, { color: C.text }]}
                  multiline
                  value={pasteText}
                  onChangeText={setPasteText}
                  placeholder="Paste German text here…"
                  placeholderTextColor={C.text3}
                  textAlignVertical="top"
                />
              </View>
              <TouchableOpacity
                style={[sh.startBtn, { backgroundColor: C.primary, opacity: pasteText.trim() ? 1 : 0.4 }]}
                onPress={openPasted}
                disabled={!pasteText.trim()}
              >
                <Icons.Headphones size={16} color="#FFFFFF" />
                <Text style={sh.startBtnText}>Start session</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Article library */}
        <Text style={[sh.sectionLabel, { color: C.text3 }]}>Choose an article</Text>
        <View style={{ paddingHorizontal: 20 }}>
          {libraryLoading ? (
            <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 16 }} />
          ) : library.map(a => {
            const lc = LEVEL_COLORS[a.level] ?? { bg: C.bgAlt, text: C.text3 }
            return (
              <TouchableOpacity
                key={a.id}
                style={[sh.articleCard, { backgroundColor: C.surface, borderColor: C.border }]}
                onPress={() => openArticle(a)}
                activeOpacity={0.75}
              >
                <View style={sh.articleTop}>
                  <Text style={[sh.articleTitle, { color: C.text }]}>{a.title}</Text>
                  <View style={[sh.levelBadge, { backgroundColor: lc.bg }]}>
                    <Text style={[sh.levelBadgeText, { color: lc.text }]}>{a.level}</Text>
                  </View>
                </View>
                <View style={sh.articleMeta}>
                  <Text style={[sh.topicTag, { color: C.text3 }]}>{a.topic}</Text>
                  <Text style={[sh.metaSep, { color: C.text3 }]}>·</Text>
                  <Icons.Clock size={11} color={C.text3} />
                  <Text style={[sh.metaText, { color: C.text3 }]}>{a.estimated_minutes} min</Text>
                  <Text style={[sh.metaSep, { color: C.text3 }]}>·</Text>
                  <Text style={[sh.metaText, { color: C.text3 }]}>{a.word_count} words</Text>
                </View>
                <Text style={[sh.articlePreview, { color: C.text3 }]} numberOfLines={2}>{a.preview}</Text>
                {articleLoading && <ActivityIndicator size="small" color={C.primary} style={{ position: 'absolute', right: 14, top: 14 }} />}
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const sh = StyleSheet.create({
  container: { flex: 1 },

  // Picker
  pickerHeader: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 },
  headerIconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  pickerTitle: { fontSize: 26, fontFamily: Fonts.bold, marginBottom: 8, textAlign: 'center' },
  pickerSubtitle: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center', lineHeight: 21, marginBottom: 16 },
  pasteBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  pasteBtnText: { fontSize: 14, fontFamily: Fonts.medium },
  inputCard: { borderWidth: 1.5, borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  textInput: { padding: 14, fontSize: 14, fontFamily: Fonts.regular, minHeight: 100, lineHeight: 22 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  startBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 15 },
  sectionLabel: { fontSize: 11, fontFamily: Fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, paddingBottom: 10 },
  articleCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  articleTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  articleTitle: { flex: 1, fontSize: 16, fontFamily: Fonts.semibold, marginRight: 10 },
  levelBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  levelBadgeText: { fontSize: 11, fontFamily: Fonts.bold },
  articleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  topicTag: { fontSize: 11, fontFamily: Fonts.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaSep: { fontSize: 11 },
  metaText: { fontSize: 11, fontFamily: Fonts.regular },
  articlePreview: { fontSize: 13, lineHeight: 20, fontFamily: Fonts.regular },

  // Player top bar
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: 14, fontFamily: Fonts.medium },
  topTitle: { fontSize: 14, fontFamily: Fonts.semibold, textAlign: 'center' },

  // Player content
  playerContent: { padding: 20, paddingBottom: 20 },
  modeRow: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 9 },
  modeBtnText: { fontSize: 14 },
  sentenceCount: { textAlign: 'center', fontSize: 12, fontFamily: Fonts.regular, marginBottom: 12 },
  transcriptCard: { borderRadius: 14, padding: 14, marginBottom: 14 },
  transcriptLine: { fontSize: 14, lineHeight: 24, fontFamily: Fonts.regular, paddingHorizontal: 4, paddingVertical: 2, marginBottom: 2 },
  activeSentenceCard: { borderRadius: 16, padding: 20, borderWidth: 1.5, marginBottom: 10 },
  shadowingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  shadowingLabel: { fontSize: 13, fontFamily: Fonts.semibold },
  activeSentence: { fontSize: 20, lineHeight: 32, fontFamily: Fonts.regular },
  modeHint: { fontSize: 12, fontFamily: Fonts.regular, textAlign: 'center' },

  // Controls
  controls: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28, borderTopWidth: 1, gap: 14 },
  speedRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  speedBtn: { borderRadius: 99, paddingHorizontal: 18, paddingVertical: 7 },
  speedBtnText: { fontSize: 13, fontFamily: Fonts.semibold },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  transpBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  replayBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 4 },
})
