import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'

// ── Types ─────────────────────────────────────────────────────────────────────
interface WordInfo { translation: string; partOfSpeech: string; exampleSentence?: string; level?: string }

interface ArticleSummary {
  id: string; title: string; level: string; topic: string
  word_count: number; estimated_minutes: number; preview: string
}
interface ArticleFull extends ArticleSummary { text: string }

interface LibraryResp {
  articles: ArticleSummary[]
  topics: string[]
  accessible_levels: string[]
  user_level: string
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
type View = 'library' | 'reading'

// ── Helpers ───────────────────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  return text.split(/(\s+|[.,!?;:()\[\]"„"–—])/).filter(Boolean)
}
function isPunctOrSpace(t: string) {
  return /^\s+$/.test(t) || /^[.,!?;:()\[\]"„"–—]+$/.test(t)
}
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: 'rgba(34,197,94,.15)',   text: '#16A34A' },
  A2: { bg: 'rgba(34,197,94,.15)',   text: '#16A34A' },
  B1: { bg: 'rgba(59,130,246,.15)',  text: '#2563EB' },
  B2: { bg: 'rgba(59,130,246,.15)',  text: '#2563EB' },
  C1: { bg: 'rgba(168,85,247,.15)',  text: '#9333EA' },
  C2: { bg: 'rgba(168,85,247,.15)',  text: '#9333EA' },
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ReadScreen() {
  const { colors: C } = useTheme()
  const { getAccessToken } = useAuth()

  // Library state
  const [view, setView] = useState<View>('library')
  const [library, setLibrary] = useState<LibraryResp | null>(null)
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [articleLoading, setArticleLoading] = useState(false)

  // Reading state
  const [article, setArticle] = useState<ArticleFull | null>(null)
  const [tokens, setTokens] = useState<string[]>([])
  const [sessionStart, setSessionStart] = useState(0)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [loadingWord, setLoadingWord] = useState<string | null>(null)
  const [popover, setPopover] = useState<{ word: string; info: WordInfo } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Custom text paste
  const [pasteVisible, setPasteVisible] = useState(false)
  const [inputText, setInputText] = useState('')

  useEffect(() => { loadLibrary() }, [])

  async function loadLibrary(level?: string | null, topic?: string | null) {
    setLibraryLoading(true)
    try {
      const token = await getAccessToken()
      const params = new URLSearchParams()
      if (level) params.set('level', level)
      if (topic) params.set('topic', topic)
      const qs = params.toString()
      const resp = await apiFetch<LibraryResp>(`/api/reading/library${qs ? `?${qs}` : ''}`, {}, token)
      setLibrary(resp)
    } catch {
      // keep previous state on error
    } finally { setLibraryLoading(false) }
  }

  function onLevelFilter(level: string | null) {
    setSelectedLevel(level)
    setSelectedTopic(null)
    loadLibrary(level, null)
  }

  function onTopicFilter(topic: string | null) {
    const next = selectedTopic === topic ? null : topic
    setSelectedTopic(next)
    loadLibrary(selectedLevel, next)
  }

  async function openArticle(summary: ArticleSummary) {
    setArticleLoading(true)
    try {
      const token = await getAccessToken()
      const full = await apiFetch<ArticleFull>(`/api/reading/library/${summary.id}`, {}, token)
      setArticle(full)
      setTokens(tokenize(full.text))
      setSessionStart(Date.now())
      setSavedWords(new Set())
      setError(null)
      setView('reading')
    } catch {
      setError('Could not load article.')
    } finally { setArticleLoading(false) }
  }

  function openPastedText() {
    if (!inputText.trim()) return
    const pseudo: ArticleFull = {
      id: '', title: 'Custom text', level: 'B1', topic: 'Custom',
      word_count: 0, estimated_minutes: 0, preview: '', text: inputText.trim(),
    }
    setArticle(pseudo)
    setTokens(tokenize(inputText.trim()))
    setSessionStart(Date.now())
    setSavedWords(new Set())
    setError(null)
    setPasteVisible(false)
    setInputText('')
    setView('reading')
  }

  function exitReading() {
    finishSession(savedWords.size)
    setView('library')
    setTokens([])
    setArticle(null)
    setSavedWords(new Set())
    setPopover(null)
  }

  async function finishSession(wordsLookedUp: number) {
    if (!article || !article.id) return
    try {
      const token = await getAccessToken()
      await apiFetch('/api/reading/sessions', {
        method: 'POST',
        body: JSON.stringify({
          title: article.title,
          level: article.level as CefrLevel,
          topic: article.topic,
          words_looked_up: wordsLookedUp,
          duration_seconds: Math.floor((Date.now() - sessionStart) / 1000),
        }),
      }, token)
    } catch { /* non-fatal */ }
  }

  async function handleWordTap(word: string) {
    if (isPunctOrSpace(word) || loadingWord) return
    setLoadingWord(word)
    setError(null)
    try {
      const token = await getAccessToken()
      const info = await apiFetch<WordInfo>(`/api/words/lookup?word=${encodeURIComponent(word)}`, {}, token)
      setPopover({ word, info })
    } catch {
      setError(`Could not look up "${word}"`)
    } finally { setLoadingWord(null) }
  }

  async function saveWord() {
    if (!popover || saving) return
    setSaving(true)
    try {
      const token = await getAccessToken()
      await apiFetch('/api/words', {
        method: 'POST',
        body: JSON.stringify({
          german: popover.word,
          translation: popover.info.translation,
          part_of_speech: popover.info.partOfSpeech,
          example_sentence: popover.info.exampleSentence ?? '',
          source_text: article?.text.slice(0, 500) ?? '',
        }),
      }, token)
      setSavedWords(prev => new Set([...prev, popover.word.toLowerCase()]))
      setPopover(null)
    } catch {
      setError('Could not save word.')
    } finally { setSaving(false) }
  }

  // ── Reading view ─────────────────────────────────────────────────────────────
  if (view === 'reading') {
    return (
      <SafeAreaView style={[rd.container, { backgroundColor: C.bg }]} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
          <View style={rd.toolbar}>
            <TouchableOpacity style={[rd.toolbarBtn, { backgroundColor: C.bgAlt }]} onPress={exitReading}>
              <Icons.ArrowLeft size={16} color={C.text2} />
              <Text style={[rd.toolbarBtnText, { color: C.text2 }]}>Library</Text>
            </TouchableOpacity>
            {article && (
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[rd.articleMeta, { color: C.text3 }]} numberOfLines={1}>{article.title}</Text>
              </View>
            )}
            {savedWords.size > 0 && (
              <View style={[rd.savedChip, { backgroundColor: 'rgba(22,163,74,.1)' }]}>
                <Icons.CheckCircle size={12} color={C.success} />
                <Text style={[rd.savedChipText, { color: C.success }]}>{savedWords.size} saved</Text>
              </View>
            )}
          </View>
          {error && <Text style={[rd.errorText, { color: C.error }]}>{error}</Text>}

          <View style={[rd.articleCard, { backgroundColor: C.surface }]}>
            <Text style={[rd.articleText, { color: C.text }]}>
              {tokens.map((token, i) => {
                if (isPunctOrSpace(token)) return <Text key={i} style={{ color: C.text }}>{token}</Text>
                const lower = token.toLowerCase()
                const isSaved = savedWords.has(lower)
                const isLoading = loadingWord === token
                return (
                  <Text key={i} onPress={() => handleWordTap(token)} style={[
                    rd.wordToken,
                    isSaved && { color: C.accentD, backgroundColor: 'rgba(245,158,11,.15)' },
                    isLoading && { color: C.primary, backgroundColor: 'rgba(55,48,163,.1)' },
                    !isSaved && !isLoading && { color: C.text },
                  ]}>
                    {token}
                  </Text>
                )
              })}
            </Text>
          </View>
          <Text style={[rd.hintText, { color: C.text3 }]}>Tap any word to look it up</Text>
        </ScrollView>

        <Modal visible={!!popover} transparent animationType="slide" onRequestClose={() => setPopover(null)}>
          <TouchableOpacity style={rd.modalOverlay} activeOpacity={1} onPress={() => setPopover(null)}>
            <View style={[rd.sheet, { backgroundColor: C.surface }]} onStartShouldSetResponder={() => true}>
              <View style={[rd.sheetHandle, { backgroundColor: C.border }]} />
              <View style={rd.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[rd.sheetWord, { color: C.text }]}>{popover?.word}</Text>
                  <View style={[rd.posChip, { backgroundColor: 'rgba(55,48,163,.1)' }]}>
                    <Text style={[rd.posChipText, { color: C.primary }]}>{popover?.info.partOfSpeech}</Text>
                  </View>
                </View>
                {popover?.info.level && (
                  <View style={[rd.sheetLevelChip, { backgroundColor: C.bgAlt }]}>
                    <Text style={[rd.sheetLevelText, { color: C.text3 }]}>{popover.info.level}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => setPopover(null)} style={{ padding: 4 }}>
                  <Icons.XCircle size={22} color={C.text3} />
                </TouchableOpacity>
              </View>
              <Text style={[rd.sheetTranslation, { color: C.text }]}>{popover?.info.translation}</Text>
              {popover?.info.exampleSentence ? (
                <Text style={[rd.sheetExample, { color: C.text3 }]}>"{popover.info.exampleSentence}"</Text>
              ) : null}
              <View style={rd.sheetActions}>
                <TouchableOpacity
                  style={[rd.sheetSaveBtn, { backgroundColor: C.primary, opacity: saving ? 0.6 : 1 }]}
                  onPress={saveWord}
                  disabled={saving || savedWords.has(popover?.word.toLowerCase() ?? '')}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Icons.BookOpen size={16} color="#FFFFFF" />}
                  <Text style={rd.sheetSaveBtnText}>
                    {savedWords.has(popover?.word.toLowerCase() ?? '') ? 'Saved ✓' : 'Save to Deck'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[rd.sheetDismissBtn, { borderColor: C.border }]} onPress={() => setPopover(null)}>
                  <Text style={[rd.sheetDismissBtnText, { color: C.text2 }]}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    )
  }

  // ── Library view ─────────────────────────────────────────────────────────────
  const articles = library?.articles ?? []
  const topics = library?.topics ?? []
  const accessibleLevels = library?.accessible_levels ?? []

  return (
    <SafeAreaView style={[rd.container, { backgroundColor: C.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View style={rd.libHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[rd.libTitle, { color: C.text }]}>Lesen</Text>
            <Text style={[rd.libSubtitle, { color: C.text3 }]}>Tap any word to look it up</Text>
          </View>
          <TouchableOpacity
            style={[rd.pasteBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={() => setPasteVisible(true)}
          >
            <Icons.PenLine size={15} color={C.primary} />
            <Text style={[rd.pasteBtnText, { color: C.primary }]}>Paste text</Text>
          </TouchableOpacity>
        </View>

        {/* Level filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={rd.levelScroll} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          <TouchableOpacity
            style={[rd.levelChip, { backgroundColor: selectedLevel === null ? C.primary : C.bgAlt, borderColor: selectedLevel === null ? C.primary : C.border }]}
            onPress={() => onLevelFilter(null)}
          >
            <Text style={[rd.levelChipText, { color: selectedLevel === null ? '#FFFFFF' : C.text2 }]}>All levels</Text>
          </TouchableOpacity>
          {accessibleLevels.map(l => {
            const active = selectedLevel === l
            return (
              <TouchableOpacity
                key={l}
                style={[rd.levelChip, { backgroundColor: active ? C.primary : C.bgAlt, borderColor: active ? C.primary : C.border }]}
                onPress={() => onLevelFilter(active ? null : l)}
              >
                <Text style={[rd.levelChipText, { color: active ? '#FFFFFF' : C.text2 }]}>{l}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Topic pills */}
        {topics.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={rd.topicScroll} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {topics.map(t => {
              const active = selectedTopic === t
              return (
                <TouchableOpacity
                  key={t}
                  style={[rd.topicPill, { backgroundColor: active ? 'rgba(55,48,163,.12)' : C.surface, borderColor: active ? C.primary : C.border }]}
                  onPress={() => onTopicFilter(t)}
                >
                  <Text style={[rd.topicPillText, { color: active ? C.primary : C.text2 }]}>{t}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}

        {/* Article list */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          {libraryLoading ? (
            <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 24 }} />
          ) : articles.length === 0 ? (
            <View style={[rd.emptyState, { backgroundColor: C.surface }]}>
              <Icons.BookOpen size={32} color={C.text3} />
              <Text style={[rd.emptyText, { color: C.text3 }]}>No articles for this filter</Text>
            </View>
          ) : articles.map(a => {
            const lc = LEVEL_COLORS[a.level] ?? { bg: C.bgAlt, text: C.text3 }
            return (
              <TouchableOpacity
                key={a.id}
                style={[rd.articleSummaryCard, { backgroundColor: C.surface, borderColor: C.border }]}
                onPress={() => openArticle(a)}
                activeOpacity={0.75}
              >
                <View style={rd.articleSummaryTop}>
                  <Text style={[rd.articleSummaryTitle, { color: C.text }]}>{a.title}</Text>
                  <View style={[rd.levelBadge, { backgroundColor: lc.bg }]}>
                    <Text style={[rd.levelBadgeText, { color: lc.text }]}>{a.level}</Text>
                  </View>
                </View>
                <View style={rd.articleSummaryMeta}>
                  <Text style={[rd.topicTag, { color: C.text3 }]}>{a.topic}</Text>
                  <View style={rd.metaDots}>
                    <Text style={[rd.metaDot, { color: C.text3 }]}>·</Text>
                    <Icons.Clock size={11} color={C.text3} />
                    <Text style={[rd.metaText, { color: C.text3 }]}>{a.estimated_minutes} min</Text>
                    <Text style={[rd.metaDot, { color: C.text3 }]}>·</Text>
                    <Text style={[rd.metaText, { color: C.text3 }]}>{a.word_count} words</Text>
                  </View>
                </View>
                <Text style={[rd.articleSummaryPreview, { color: C.text3 }]} numberOfLines={2}>{a.preview}</Text>
                {articleLoading && <ActivityIndicator size="small" color={C.primary} style={{ position: 'absolute', right: 14, top: 14 }} />}
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Paste text modal */}
      <Modal visible={pasteVisible} transparent animationType="slide" onRequestClose={() => setPasteVisible(false)}>
        <TouchableOpacity style={rd.modalOverlay} activeOpacity={1} onPress={() => setPasteVisible(false)}>
          <View style={[rd.sheet, { backgroundColor: C.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[rd.sheetHandle, { backgroundColor: C.border }]} />
            <Text style={[rd.sheetWord, { color: C.text, fontSize: 20, marginBottom: 16 }]}>Paste German text</Text>
            <View style={[rd.inputCard, { backgroundColor: C.bg, borderColor: C.border }]}>
              <TextInput
                style={[rd.textInput, { color: C.text }]}
                multiline
                value={inputText}
                onChangeText={setInputText}
                placeholder="Paste German text here…"
                placeholderTextColor={C.text3}
                textAlignVertical="top"
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[rd.sheetSaveBtn, { backgroundColor: C.primary, opacity: inputText.trim() ? 1 : 0.4 }]}
              onPress={openPastedText}
              disabled={!inputText.trim()}
            >
              <Icons.BookOpen size={16} color="#FFFFFF" />
              <Text style={rd.sheetSaveBtnText}>Read text</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const rd = StyleSheet.create({
  container: { flex: 1 },
  // Library
  libHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  libTitle: { fontSize: 28, fontFamily: Fonts.bold },
  libSubtitle: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  pasteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  pasteBtnText: { fontSize: 13, fontFamily: Fonts.medium },
  levelScroll: { marginBottom: 10 },
  topicScroll: { marginBottom: 12 },
  levelChip: { borderWidth: 1.5, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  levelChipText: { fontSize: 13, fontFamily: Fonts.semibold },
  topicPill: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  topicPillText: { fontSize: 12, fontFamily: Fonts.medium },
  articleSummaryCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  articleSummaryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  articleSummaryTitle: { flex: 1, fontSize: 16, fontFamily: Fonts.semibold, marginRight: 10 },
  levelBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  levelBadgeText: { fontSize: 11, fontFamily: Fonts.bold },
  articleSummaryMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' },
  topicTag: { fontSize: 11, fontFamily: Fonts.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaDots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaDot: { fontSize: 11 },
  metaText: { fontSize: 11, fontFamily: Fonts.regular },
  articleSummaryPreview: { fontSize: 13, lineHeight: 20, fontFamily: Fonts.regular },
  emptyState: { borderRadius: 16, padding: 40, alignItems: 'center', gap: 12, marginTop: 16 },
  emptyText: { fontSize: 14, fontFamily: Fonts.regular },
  // Reading
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  toolbarBtnText: { fontSize: 13, fontFamily: Fonts.medium },
  articleMeta: { fontSize: 12, fontFamily: Fonts.regular, maxWidth: 180 },
  savedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  savedChipText: { fontSize: 12, fontFamily: Fonts.medium },
  errorText: { fontSize: 12, fontFamily: Fonts.regular, marginBottom: 8 },
  articleCard: { borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, marginBottom: 12 },
  articleText: { fontSize: 18, lineHeight: 34, fontFamily: Fonts.regular },
  wordToken: { borderRadius: 4 },
  hintText: { textAlign: 'center', fontSize: 12, fontFamily: Fonts.regular },
  // Paste + word sheet (shared)
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  sheetWord: { fontSize: 28, fontFamily: Fonts.bold, marginBottom: 6 },
  posChip: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  posChipText: { fontSize: 12, fontFamily: Fonts.medium },
  sheetLevelChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  sheetLevelText: { fontSize: 12, fontFamily: Fonts.semibold },
  sheetTranslation: { fontSize: 18, fontFamily: Fonts.semibold, marginBottom: 8 },
  sheetExample: { fontSize: 13, fontFamily: Fonts.italic, lineHeight: 20, marginBottom: 20 },
  sheetActions: { flexDirection: 'row', gap: 10 },
  sheetSaveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  sheetSaveBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 15 },
  sheetDismissBtn: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  sheetDismissBtnText: { fontSize: 15, fontFamily: Fonts.medium },
  inputCard: { borderWidth: 1.5, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  textInput: { padding: 16, fontSize: 14, fontFamily: Fonts.regular, minHeight: 140, lineHeight: 22 },
})
