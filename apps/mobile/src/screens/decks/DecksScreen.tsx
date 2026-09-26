import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import type { RootStackParamList } from '../../navigation/RootNavigator'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Deck {
  id: string; title: string; description: string
  level: string; topic: string; word_count: number; imported: boolean
}
interface DeckWord {
  id: string; german: string; translation: string
  part_of_speech: string; example_sentence?: string
}
interface DeckDetail extends Deck { words: DeckWord[] }

// ── Constants ─────────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  A1: { bg: 'rgba(34,197,94,.15)', text: '#16A34A' },
  A2: { bg: 'rgba(34,197,94,.15)', text: '#16A34A' },
  B1: { bg: 'rgba(59,130,246,.15)', text: '#2563EB' },
  B2: { bg: 'rgba(59,130,246,.15)', text: '#2563EB' },
  C1: { bg: 'rgba(168,85,247,.15)', text: '#9333EA' },
  C2: { bg: 'rgba(168,85,247,.15)', text: '#9333EA' },
}

const POS_COLORS: Record<string, string> = {
  noun: '#2563EB', verb: '#16A34A', adjective: '#7C3AED',
  adverb: '#DC2626', preposition: '#B45309', conjunction: '#6366F1',
  pronoun: '#0891B2', article: '#9333EA', other: '#64748B',
}

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

type ScreenView = 'list' | 'detail'

// ── Component ─────────────────────────────────────────────────────────────────
export function DecksScreen() {
  const { colors: C } = useTheme()
  const { getAccessToken } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [view, setView] = useState<ScreenView>('list')
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('All')

  const [detail, setDetail] = useState<DeckDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ added: number } | null>(null)

  useEffect(() => { loadDecks() }, [])

  async function loadDecks() {
    setLoading(true)
    try {
      const token = await getAccessToken()
      const data = await apiFetch<Deck[]>('/api/decks', {}, token)
      setDecks(data)
    } catch {} finally { setLoading(false) }
  }

  async function openDeck(deck: Deck) {
    setDetailLoading(true)
    setImportResult(null)
    try {
      const token = await getAccessToken()
      const data = await apiFetch<DeckDetail>(`/api/decks/${deck.id}`, {}, token)
      setDetail(data)
      setView('detail')
    } catch {} finally { setDetailLoading(false) }
  }

  async function importDeck() {
    if (!detail) return
    setImporting(true)
    try {
      const token = await getAccessToken()
      const resp = await apiFetch<{ added: number; already_imported: boolean }>(
        `/api/decks/${detail.id}/import`,
        { method: 'POST' },
        token,
      )
      setImportResult({ added: resp.added })
      setDetail(d => d ? { ...d, imported: true } : d)
      setDecks(ds => ds.map(d => d.id === detail.id ? { ...d, imported: true } : d))
      // Give user a moment to read the success message then take them to Vocabulary
      setTimeout(() => navigation.navigate('Vocabulary'), 1500)
    } catch {} finally { setImporting(false) }
  }

  function back() {
    setView('list')
    setDetail(null)
    setImportResult(null)
  }

  const filtered = levelFilter === 'All' ? decks : decks.filter(d => d.level === levelFilter)

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (view === 'detail' && detail) {
    const lc = LEVEL_COLORS[detail.level] ?? { bg: C.bgAlt, text: C.text3 }
    return (
      <SafeAreaView style={[st.container, { backgroundColor: C.bg }]} edges={['top']}>
        {/* Top bar */}
        <View style={[st.topBar, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={back} style={st.backBtn}>
            <Icons.ArrowLeft size={18} color={C.primary} />
            <Text style={[st.backBtnText, { color: C.primary }]}>Decks</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Deck header */}
          <View style={[st.detailHeader, { backgroundColor: C.surface }]}>
            <View style={st.detailHeaderTop}>
              <Text style={[st.detailTitle, { color: C.text }]}>{detail.title}</Text>
              <View style={[st.levelBadge, { backgroundColor: lc.bg }]}>
                <Text style={[st.levelBadgeText, { color: lc.text }]}>{detail.level}</Text>
              </View>
            </View>
            <Text style={[st.detailDesc, { color: C.text2 }]}>{detail.description}</Text>
            <View style={st.detailMeta}>
              <Icons.Layers size={13} color={C.text3} />
              <Text style={[st.metaText, { color: C.text3 }]}>{detail.word_count} words</Text>
              <Text style={[st.metaSep, { color: C.text3 }]}>·</Text>
              <Text style={[st.metaText, { color: C.text3 }]}>{detail.topic}</Text>
            </View>

            {/* Import button / status */}
            {importResult ? (
              <View style={[st.importSuccess, { backgroundColor: 'rgba(22,163,74,.1)' }]}>
                <Icons.Check size={16} color='#16A34A' />
                <Text style={[st.importSuccessText, { color: '#16A34A' }]}>
                  {importResult.added > 0
                    ? `${importResult.added} words added to your vocabulary`
                    : 'Already imported — no new words added'}
                </Text>
              </View>
            ) : detail.imported ? (
              <View style={[st.importedBadge, { backgroundColor: C.bgAlt }]}>
                <Icons.Check size={14} color={C.text3} />
                <Text style={[st.importedBadgeText, { color: C.text3 }]}>Already in your vocabulary</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[st.importBtn, { backgroundColor: C.primary, opacity: importing ? 0.7 : 1 }]}
                onPress={importDeck}
                disabled={importing}
              >
                {importing
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Icons.Plus size={16} color="#FFFFFF" />}
                <Text style={st.importBtnText}>
                  {importing ? 'Importing…' : `Add all ${detail.word_count} words to my vocab`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Word list */}
          <Text style={[st.sectionLabel, { color: C.text3 }]}>Words in this deck</Text>
          <View style={{ paddingHorizontal: 16 }}>
            {detail.words.map((w, i) => (
              <View key={w.id} style={[st.wordRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={st.wordRowLeft}>
                  <Text style={[st.wordGerman, { color: C.text }]}>{w.german}</Text>
                  <Text style={[st.wordTranslation, { color: C.text2 }]}>{w.translation}</Text>
                  {w.example_sentence ? (
                    <Text style={[st.wordExample, { color: C.text3 }]} numberOfLines={2}>
                      {w.example_sentence}
                    </Text>
                  ) : null}
                </View>
                <View style={[st.posBadge, { backgroundColor: `${POS_COLORS[w.part_of_speech] ?? '#64748B'}18` }]}>
                  <Text style={[st.posBadgeText, { color: POS_COLORS[w.part_of_speech] ?? '#64748B' }]}>
                    {w.part_of_speech}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[st.container, { backgroundColor: C.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={[st.headerSub, { color: C.text3, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }]}>
          Curated word sets by topic and level. Import any deck to add the words to your review queue.
        </Text>

        {/* Level filter */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.filterRow}
        >
          {LEVELS.map(l => (
            <TouchableOpacity
              key={l}
              style={[
                st.filterChip,
                { backgroundColor: levelFilter === l ? C.primary : C.surface, borderColor: C.border },
              ]}
              onPress={() => setLevelFilter(l)}
            >
              <Text style={[st.filterChipText, { color: levelFilter === l ? '#FFFFFF' : C.text3 }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Deck grid */}
        {loading ? (
          <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 32 }} />
        ) : (
          <View style={st.deckGrid}>
            {filtered.map(deck => {
              const lc = LEVEL_COLORS[deck.level] ?? { bg: C.bgAlt, text: C.text3 }
              return (
                <TouchableOpacity
                  key={deck.id}
                  style={[st.deckCard, { backgroundColor: C.surface, borderColor: C.border }]}
                  onPress={() => openDeck(deck)}
                  activeOpacity={0.75}
                >
                  <View style={st.deckCardTop}>
                    <View style={[st.levelBadge, { backgroundColor: lc.bg }]}>
                      <Text style={[st.levelBadgeText, { color: lc.text }]}>{deck.level}</Text>
                    </View>
                    {deck.imported && (
                      <View style={[st.importedDot, { backgroundColor: '#16A34A' }]}>
                        <Icons.Check size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text style={[st.deckTitle, { color: C.text }]}>{deck.title}</Text>
                  <Text style={[st.deckDesc, { color: C.text3 }]} numberOfLines={2}>{deck.description}</Text>
                  <View style={st.deckMeta}>
                    <Icons.Layers size={11} color={C.text3} />
                    <Text style={[st.metaText, { color: C.text3 }]}>{deck.word_count} words</Text>
                    <Text style={[st.metaSep, { color: C.text3 }]}>·</Text>
                    <Text style={[st.metaText, { color: C.text3 }]}>{deck.topic}</Text>
                  </View>
                  {detailLoading && <ActivityIndicator size="small" color={C.primary} style={{ position: 'absolute', right: 12, top: 12 }} />}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const st = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 12 },
  headerIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 26, fontFamily: Fonts.bold, marginBottom: 8, textAlign: 'center' },
  headerSub: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center', lineHeight: 21 },

  // Filter
  filterRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 12 },
  filterChip: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  filterChipText: { fontSize: 13, fontFamily: Fonts.semibold },

  // Deck grid
  deckGrid: { paddingHorizontal: 16, gap: 12 },
  deckCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  deckCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  levelBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  levelBadgeText: { fontSize: 11, fontFamily: Fonts.bold },
  importedDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deckTitle: { fontSize: 17, fontFamily: Fonts.semibold, marginBottom: 4 },
  deckDesc: { fontSize: 13, lineHeight: 19, fontFamily: Fonts.regular, marginBottom: 10 },
  deckMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, fontFamily: Fonts.regular },
  metaSep: { fontSize: 11 },

  // Detail top bar
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: 14, fontFamily: Fonts.medium },

  // Detail header
  detailHeader: { margin: 16, borderRadius: 16, padding: 20 },
  detailHeaderTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  detailTitle: { flex: 1, fontSize: 22, fontFamily: Fonts.bold, marginRight: 10 },
  detailDesc: { fontSize: 14, lineHeight: 21, fontFamily: Fonts.regular, marginBottom: 10 },
  detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 },
  importBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  importBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 15 },
  importedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, paddingVertical: 12 },
  importedBadgeText: { fontSize: 14, fontFamily: Fonts.medium },
  importSuccess: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  importSuccessText: { fontSize: 14, fontFamily: Fonts.semibold, flex: 1 },

  // Word list
  sectionLabel: { fontSize: 11, fontFamily: Fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, paddingBottom: 8 },
  wordRow: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  wordRowLeft: { flex: 1 },
  wordGerman: { fontSize: 16, fontFamily: Fonts.semibold, marginBottom: 2 },
  wordTranslation: { fontSize: 14, fontFamily: Fonts.regular, marginBottom: 4 },
  wordExample: { fontSize: 12, lineHeight: 18, fontFamily: Fonts.italic },
  posBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  posBadgeText: { fontSize: 10, fontFamily: Fonts.semibold },
})
