import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import type { RootStackParamList } from '../../navigation/RootNavigator'

interface Word {
  id: string
  german: string
  translation: string
  part_of_speech: string
  example_sentence?: string
  created_at: string
}

const POS_COLORS: Record<string, string> = {
  noun: '#2563EB', verb: '#16A34A', adjective: '#7C3AED',
  adverb: '#DC2626', preposition: '#B45309', conjunction: '#6366F1',
  pronoun: '#0891B2', article: '#9333EA', other: '#64748B',
}

export function VocabularyScreen() {
  const { colors: C } = useTheme()
  const { getAccessToken } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'Vocabulary'>['route']>()
  const initialPos = route.params?.pos ?? null

  const [words, setWords] = useState<Word[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string | null>(initialPos)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function loadWords(activeFilter: string | null = filter) {
    setLoading(true)
    try {
      const token = await getAccessToken()
      // When browsing by type, use server-side pos filter to get ALL words of that type
      // When no filter, fetch the most recent 200 for the general browse view
      const url = activeFilter
        ? `/api/words?pos=${encodeURIComponent(activeFilter)}`
        : '/api/words?limit=200'
      const result = await apiFetch<Word[]>(url, {}, token)
      setWords(result)
      setTotalCount(result.length)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadWords(initialPos) }, [])

  async function deleteWord(word: Word) {
    Alert.alert(
      'Delete Word',
      `Remove "${word.german}" from your deck?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeleting(word.id)
            try {
              const token = await getAccessToken()
              await apiFetch(`/api/words/${word.id}`, { method: 'DELETE' }, token)
              setWords(prev => prev.filter(w => w.id !== word.id))
            } catch {
              Alert.alert('Error', 'Could not delete word.')
            } finally { setDeleting(null) }
          },
        },
      ],
    )
  }

  function setFilterAndReload(pos: string | null) {
    setFilter(pos)
    loadWords(pos)
  }

  const allPos = [...new Set(words.map(w => w.part_of_speech))].sort()

  // With server-side filtering, words already reflects the active filter
  // Client-side search still applies within the loaded set
  const filtered = words.filter(w => {
    if (!search) return true
    return w.german.toLowerCase().includes(search.toLowerCase()) ||
      w.translation.toLowerCase().includes(search.toLowerCase())
  })

  function renderWord({ item }: { item: Word }) {
    const [article, ...rest] = item.german.split(' ')
    const hasArticle = ['der', 'die', 'das'].includes(article ?? '')
    const color = POS_COLORS[item.part_of_speech] ?? POS_COLORS['other']!

    return (
      <View style={[vc.wordRow, { backgroundColor: C.surface }]}>
        <View style={[vc.wordAccent, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <View style={vc.wordHeader}>
            <Text style={[vc.wordGerman, { color: C.text }]}>
              {hasArticle ? (
                <>
                  <Text style={{ color: C.primary }}>{article} </Text>
                  {rest.join(' ')}
                </>
              ) : item.german}
            </Text>
            <View style={[vc.posChip, { backgroundColor: color + '18' }]}>
              <Text style={[vc.posChipText, { color }]}>{item.part_of_speech}</Text>
            </View>
          </View>
          <Text style={[vc.wordTranslation, { color: C.text2 }]}>{item.translation}</Text>
          {item.example_sentence ? (
            <Text style={[vc.wordExample, { color: C.text3 }]} numberOfLines={1}>
              {item.example_sentence}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => deleteWord(item)}
          style={[vc.deleteBtn, { backgroundColor: 'rgba(220,38,38,.07)' }]}
          disabled={deleting === item.id}
        >
          {deleting === item.id
            ? <ActivityIndicator size="small" color={C.error} />
            : <Icons.Trash size={15} color={C.error} />}
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={[vc.container, { backgroundColor: C.bg }]} edges={['top']}>
      {/* Header */}
      <View style={vc.header}>
        <View>
          <Text style={[vc.title, { color: C.text }]}>Vokabular</Text>
          <Text style={[vc.subtitle, { color: C.text2 }]}>
            {filter
              ? `${words.length.toLocaleString()} ${filter}${words.length !== 1 ? 's' : ''} in your deck`
              : `${words.length.toLocaleString()} words in your deck`}
          </Text>
        </View>
        <TouchableOpacity
          style={[vc.reviewBtn, { backgroundColor: C.primary }]}
          onPress={() => navigation.navigate('Review')}
        >
          <Icons.Layers size={14} color="#FFFFFF" />
          <Text style={vc.reviewBtnText}>Review</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[vc.searchBar, { backgroundColor: C.bgAlt, borderColor: C.border }]}>
        <Icons.Search size={16} color={C.text3} />
        <TextInput
          style={[vc.searchInput, { color: C.text }]}
          placeholder="Search words…"
          placeholderTextColor={C.text3}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icons.XCircle size={16} color={C.text3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      {allPos.length > 0 && (
        <View style={vc.filterRow}>
          <TouchableOpacity
            style={[vc.filterChip, { borderColor: !filter ? C.primary : C.border, backgroundColor: !filter ? C.primary : C.bg }]}
            onPress={() => setFilterAndReload(null)}
          >
            <Text style={[vc.filterChipText, { color: !filter ? '#FFFFFF' : C.text2 }]}>All</Text>
          </TouchableOpacity>
          {allPos.map(pos => {
            const active = filter === pos
            const color = POS_COLORS[pos] ?? POS_COLORS['other']!
            return (
              <TouchableOpacity
                key={pos}
                style={[vc.filterChip, { borderColor: active ? color : C.border, backgroundColor: active ? color : C.bg }]}
                onPress={() => setFilterAndReload(active ? null : pos)}
              >
                <Text style={[vc.filterChipText, { color: active ? '#FFFFFF' : C.text2 }]}>{pos}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {/* Word list */}
      {loading ? (
        <View style={vc.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={vc.center}>
          <Icons.BookOpen size={40} color={C.border} />
          <Text style={[vc.emptyTitle, { color: C.text2 }]}>
            {words.length === 0 && !filter ? 'No words yet' : search ? 'No matches' : `No ${filter ?? 'words'} yet`}
          </Text>
          <Text style={[vc.emptySubtitle, { color: C.text3 }]}>
            {words.length === 0 && !filter
              ? 'Use Reading mode to discover and save new German words'
              : search ? 'Try a different search term' : 'Try a different filter'}
          </Text>
          {words.length === 0 && (
            <TouchableOpacity
              style={[vc.readBtn, { backgroundColor: C.primary }]}
              onPress={() => navigation.navigate('Read' as any)}
            >
              <Text style={vc.readBtnText}>Go to Reading</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={w => w.id}
          renderItem={renderWord}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 8, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        />
      )}
    </SafeAreaView>
  )
}

const vc = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  title: { fontSize: 28, fontFamily: Fonts.bold },
  subtitle: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  reviewBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 13 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 10, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: Fonts.regular, padding: 0 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  filterChip: { borderRadius: 99, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 5 },
  filterChipText: { fontSize: 12, fontFamily: Fonts.medium },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  wordAccent: { width: 4, borderRadius: 99, alignSelf: 'stretch', minHeight: 40 },
  wordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  wordGerman: { fontSize: 16, fontFamily: Fonts.semibold, flex: 1 },
  posChip: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  posChipText: { fontSize: 11, fontFamily: Fonts.medium },
  wordTranslation: { fontSize: 13, fontFamily: Fonts.regular },
  wordExample: { fontSize: 12, fontFamily: Fonts.italic, marginTop: 3 },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontFamily: Fonts.semibold, marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, fontFamily: Fonts.regular, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  readBtn: { marginTop: 20, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  readBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 15 },
})
