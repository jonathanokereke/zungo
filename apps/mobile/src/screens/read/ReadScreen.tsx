import { useEffect, useState } from 'react'
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

interface WordInfo {
  translation: string
  partOfSpeech: string
  exampleSentence?: string
  level?: string
}

interface SampleText { title: string; level: string; topic: string; text: string }
interface TextsResp { texts: SampleText[]; level: string }

function tokenize(text: string): string[] {
  return text.split(/(\s+|[.,!?;:()\[\]"„"–—])/).filter(Boolean)
}

function isPunctOrSpace(t: string) {
  return /^\s+$/.test(t) || /^[.,!?;:()\[\]"„"–—]+$/.test(t)
}

export function ReadScreen() {
  const { colors: C } = useTheme()
  const { getAccessToken } = useAuth()

  const [sampleTexts, setSampleTexts] = useState<SampleText[]>([])
  const [textsLoading, setTextsLoading] = useState(true)
  const [tokens, setTokens] = useState<string[]>([])
  const [sourceText, setSourceText] = useState('')
  const [inputText, setInputText] = useState('')
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [loadingWord, setLoadingWord] = useState<string | null>(null)
  const [popover, setPopover] = useState<{ word: string; info: WordInfo } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTexts() {
      try {
        const token = await getAccessToken()
        const resp = await apiFetch<TextsResp>('/api/reading/texts', {}, token)
        setSampleTexts(resp.texts)
      } catch {
        // Fallback texts if API fails
        setSampleTexts([
          { title: 'Der Herbst', level: 'B1', topic: 'Natur', text: 'Der Herbst ist eine besondere Jahreszeit. Die Blätter färben sich in warmen Tönen von Rot, Orange und Gelb. Der Wind trägt einen frischen Duft, und die Tage werden kürzer.' },
        ])
      } finally { setTextsLoading(false) }
    }
    fetchTexts()
  }, [])

  function loadText(text: string) {
    setSourceText(text)
    setTokens(tokenize(text))
    setPopover(null)
    setError(null)
  }

  async function handleWordTap(word: string) {
    if (isPunctOrSpace(word) || loadingWord) return
    setLoadingWord(word)
    setError(null)
    try {
      const token = await getAccessToken()
      const info = await apiFetch<WordInfo>(
        `/api/words/lookup?word=${encodeURIComponent(word)}`,
        {},
        token,
      )
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
          source_text: sourceText.slice(0, 500),
        }),
      }, token)
      setSavedWords(prev => new Set([...prev, popover.word.toLowerCase()]))
      setPopover(null)
    } catch {
      setError('Could not save word.')
    } finally { setSaving(false) }
  }

  if (tokens.length === 0) {
    return (
      <SafeAreaView style={[rd.container, { backgroundColor: C.bg }]} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <View style={rd.header}>
            <Text style={[rd.title, { color: C.text }]}>Lesen</Text>
            <Text style={[rd.subtitle, { color: C.text2 }]}>Tap any word to look it up and save to your deck</Text>
          </View>

          <Text style={[rd.sectionLabel, { color: C.text3 }]}>Texts for your level</Text>
          {textsLoading ? (
            <ActivityIndicator size="small" color={C.primary} style={{ marginVertical: 16 }} />
          ) : sampleTexts.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[rd.sampleCard, { backgroundColor: C.surface, borderColor: C.border }]}
              onPress={() => loadText(s.text)}
            >
              <View style={rd.sampleCardHeader}>
                <Text style={[rd.sampleTitle, { color: C.text }]}>{s.title}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={[rd.levelChip, { backgroundColor: 'rgba(55,48,163,.1)' }]}>
                    <Text style={[rd.levelChipText, { color: C.primary }]}>{s.level}</Text>
                  </View>
                </View>
              </View>
              {s.topic ? <Text style={[rd.topicLabel, { color: C.text3 }]}>{s.topic}</Text> : null}
              <Text style={[rd.samplePreview, { color: C.text3 }]} numberOfLines={2}>{s.text}</Text>
            </TouchableOpacity>
          ))}

          <View style={[rd.dividerRow, { marginVertical: 16 }]}>
            <View style={[rd.dividerLine, { backgroundColor: C.border }]} />
            <Text style={[rd.dividerLabel, { color: C.text3 }]}>or paste your own</Text>
            <View style={[rd.dividerLine, { backgroundColor: C.border }]} />
          </View>

          <View style={[rd.inputCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <TextInput
              style={[rd.textInput, { color: C.text }]}
              multiline
              value={inputText}
              onChangeText={setInputText}
              placeholder="Paste German text here…"
              placeholderTextColor={C.text3}
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity
            style={[rd.loadBtn, { backgroundColor: C.primary, opacity: inputText.trim() ? 1 : 0.4 }]}
            onPress={() => loadText(inputText)}
            disabled={!inputText.trim()}
          >
            <Text style={rd.loadBtnText}>Load Text</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[rd.container, { backgroundColor: C.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
        {/* Toolbar */}
        <View style={rd.toolbar}>
          <TouchableOpacity
            style={[rd.toolbarBtn, { backgroundColor: C.bgAlt }]}
            onPress={() => { setTokens([]); setPopover(null); setSavedWords(new Set()) }}
          >
            <Icons.ArrowLeft size={16} color={C.text2} />
            <Text style={[rd.toolbarBtnText, { color: C.text2 }]}>Back</Text>
          </TouchableOpacity>
          {savedWords.size > 0 && (
            <View style={[rd.savedChip, { backgroundColor: 'rgba(22,163,74,.1)' }]}>
              <Icons.CheckCircle size={12} color={C.success} />
              <Text style={[rd.savedChipText, { color: C.success }]}>{savedWords.size} saved</Text>
            </View>
          )}
          {error && <Text style={[rd.errorText, { color: C.error }]}>{error}</Text>}
        </View>

        {/* Readable text with tappable words */}
        <View style={[rd.articleCard, { backgroundColor: C.surface }]}>
          <Text style={[rd.articleText, { color: C.text }]}>
            {tokens.map((token, i) => {
              if (isPunctOrSpace(token)) {
                return <Text key={i} style={{ color: C.text }}>{token}</Text>
              }
              const lower = token.toLowerCase()
              const isSaved = savedWords.has(lower)
              const isLoading = loadingWord === token
              return (
                <Text
                  key={i}
                  onPress={() => handleWordTap(token)}
                  style={[
                    rd.wordToken,
                    isSaved && { color: C.accentD, backgroundColor: 'rgba(245,158,11,.15)' },
                    isLoading && { color: C.primary, backgroundColor: 'rgba(55,48,163,.1)' },
                    !isSaved && !isLoading && { color: C.text },
                  ]}
                >
                  {token}
                </Text>
              )
            })}
          </Text>
        </View>

        <Text style={[rd.hintText, { color: C.text3 }]}>Tap any word to look it up</Text>
      </ScrollView>

      {/* Word lookup bottom sheet (modal) */}
      <Modal visible={!!popover} transparent animationType="slide" onRequestClose={() => setPopover(null)}>
        <TouchableOpacity style={rd.modalOverlay} activeOpacity={1} onPress={() => setPopover(null)}>
          <View style={[rd.sheet, { backgroundColor: C.surface }]}>
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
              <TouchableOpacity
                style={[rd.sheetDismissBtn, { borderColor: C.border }]}
                onPress={() => setPopover(null)}
              >
                <Text style={[rd.sheetDismissBtnText, { color: C.text2 }]}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const rd = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontFamily: Fonts.bold },
  subtitle: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  sectionLabel: { fontSize: 11, fontFamily: Fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  sampleCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  sampleCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sampleTitle: { fontSize: 15, fontFamily: Fonts.semibold },
  levelChip: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  levelChipText: { fontSize: 11, fontFamily: Fonts.semibold },
  topicLabel: { fontSize: 11, fontFamily: Fonts.medium, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  samplePreview: { fontSize: 13, lineHeight: 20, fontFamily: Fonts.regular },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: 12, fontFamily: Fonts.regular },
  inputCard: { borderWidth: 1.5, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  textInput: { padding: 16, fontSize: 14, fontFamily: Fonts.regular, minHeight: 120, lineHeight: 22 },
  loadBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  loadBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 16 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  toolbarBtnText: { fontSize: 13, fontFamily: Fonts.medium },
  savedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  savedChipText: { fontSize: 12, fontFamily: Fonts.medium },
  errorText: { fontSize: 12, fontFamily: Fonts.regular },
  articleCard: { borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, marginBottom: 12 },
  articleText: { fontSize: 18, lineHeight: 34, fontFamily: Fonts.regular },
  wordToken: { borderRadius: 4 },
  hintText: { textAlign: 'center', fontSize: 12, fontFamily: Fonts.regular },
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
})
