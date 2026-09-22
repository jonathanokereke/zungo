import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import type { RootStackParamList } from '../../navigation/RootNavigator'

interface DueCard { review: { due_date: string; interval: number }; word: { id: string; german: string; translation: string; part_of_speech: string } }
interface ProgressData { total_words: number; retention_rate_30d: number; user: { streak: number; level: string } }

export function LearnScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { getAccessToken } = useAuth()
  const { colors: C } = useTheme()
  const [dueCards, setDueCards] = useState<DueCard[]>([])
  const [stats, setStats] = useState<ProgressData | null>(null)
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessToken()
        const [due, progress, counts] = await Promise.all([
          apiFetch<DueCard[]>('/api/reviews/due', {}, token),
          apiFetch<ProgressData>('/api/progress', {}, token),
          apiFetch<Record<string, number>>('/api/words/counts', {}, token).catch(() => ({} as Record<string, number>)),
        ])
        setDueCards(due)
        setStats(progress)
        setTopicCounts(counts)
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [])

  function dueLabel(card: DueCard) {
    const interval = card.review.interval
    if (interval === 0) return 'New'
    if (interval === 1) return '1d'
    return `${interval}d`
  }

  function chipStyle(interval: number) {
    if (interval === 0) return { bg: 'rgba(55,48,163,.12)', color: C.primary }
    if (interval <= 1) return { bg: 'rgba(245,158,11,.15)', color: C.accentD }
    return { bg: C.bgAlt, color: C.text3 }
  }

  const dueCount = dueCards.length
  const totalWords = stats?.total_words ?? 0
  const retention = stats?.retention_rate_30d ?? 0

  if (loading) return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.bg }]} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header + Start Review */}
        <View style={sc.sectionHeader}>
          <View>
            <Text style={[sc.sectionTitle, { color: C.text }]}>Vokabeln</Text>
            <Text style={[sc.sectionSub, { color: C.text2 }]}>{dueCount} cards due · {stats?.user.level ?? ''} level</Text>
          </View>
          <TouchableOpacity style={[sc.btnPrimary, { backgroundColor: C.primary }]} onPress={() => navigation.navigate('Review')}>
            <Text style={sc.btnPrimaryText}>Start Review →</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={sc.statsRow}>
          {[
            { val: totalWords > 0 ? totalWords.toLocaleString() : '—', label: 'Total words', color: C.primary },
            { val: retention > 0 ? `${retention}%` : '—', label: 'Retention', color: C.accentD },
            { val: dueCount.toString(), label: 'Due now', color: dueCount > 0 ? C.error : C.success },
          ].map((stat, i) => (
            <View key={i} style={[sc.statTile, { backgroundColor: C.surface }]}>
              <Text style={[sc.statVal, { color: stat.color }]}>{stat.val}</Text>
              <Text style={[sc.statLbl, { color: C.text3 }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Due cards preview */}
        {dueCards.length > 0 && (
          <View style={[sc.vocabCard, { backgroundColor: C.surface }]}>
            {dueCards.slice(0, 8).map((card, i) => {
              const chip = chipStyle(card.review.interval)
              const [article, ...rest] = card.word.german.split(' ')
              const hasArticle = ['der', 'die', 'das'].includes(article ?? '')
              return (
                <View key={card.word.id}>
                  <View style={sc.vocabItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={[sc.vocabWord, { color: C.text }]}>
                        {hasArticle ? <Text style={{ color: C.primary }}>{article} </Text> : null}
                        {hasArticle ? rest.join(' ') : card.word.german}
                      </Text>
                      <Text style={[sc.vocabTrans, { color: C.text2 }]}>{card.word.translation}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={[sc.chip, { backgroundColor: chip.bg }]}>
                        <Text style={[sc.chipText, { color: chip.color }]}>{dueLabel(card)}</Text>
                      </View>
                      <Text style={[sc.posTag, { color: C.text3 }]}>{card.word.part_of_speech}</Text>
                    </View>
                  </View>
                  {i < Math.min(dueCards.length, 8) - 1 && <View style={[sc.divider, { backgroundColor: C.border }]} />}
                </View>
              )
            })}
            {dueCards.length > 8 && (
              <TouchableOpacity style={[sc.moreBtn, { borderTopColor: C.border }]} onPress={() => navigation.navigate('Review')}>
                <Text style={[sc.moreBtnText, { color: C.primary }]}>+{dueCards.length - 8} more — Start Review</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {dueCards.length === 0 && totalWords > 0 && (
          <View style={[sc.emptyCard, { backgroundColor: C.surface }]}>
            <Text style={{ fontSize: 32 }}>✅</Text>
            <Text style={[sc.emptyTitle, { color: C.text }]}>All caught up!</Text>
            <Text style={[sc.emptySub, { color: C.text2 }]}>No cards due. Come back later for your next review.</Text>
          </View>
        )}

        {/* Browse by part of speech */}
        {(() => {
          const topics = [
            { icon: <Icons.BookOpen size={20} color={C.primary} />, iconBg: 'rgba(55,48,163,.12)', name: 'Nouns', pos: 'noun' },
            { icon: <Icons.Zap size={20} color="#B45309" />, iconBg: 'rgba(217,119,6,.12)', name: 'Verbs', pos: 'verb' },
            { icon: <Icons.Sparkles size={20} color="#7C3AED" />, iconBg: 'rgba(124,58,237,.12)', name: 'Adjectives', pos: 'adjective' },
            { icon: <Icons.TrendingUp size={20} color={C.success} />, iconBg: 'rgba(22,163,74,.12)', name: 'Adverbs', pos: 'adverb' },
            { icon: <Icons.Globe size={20} color="#0891B2" />, iconBg: 'rgba(8,145,178,.12)', name: 'Prepositions', pos: 'preposition' },
            { icon: <Icons.ListChecks size={20} color="#DC2626" />, iconBg: 'rgba(220,38,38,.12)', name: 'Conjunctions', pos: 'conjunction' },
          ]
          return (
            <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
              <Text style={[sc.sectionTitle, { fontSize: 17, marginBottom: 4, color: C.text }]}>Browse by Type</Text>
              <Text style={[sc.sectionSub, { color: C.text2, marginBottom: 12 }]}>
                All {stats?.total_words ?? ''} words in your {stats?.user.level ?? ''} deck
              </Text>
              <View style={sc.topicsGrid}>
                {topics.map((topic, i) => {
                  const wordCount = topicCounts[topic.pos] ?? 0
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[sc.topicCard, { backgroundColor: C.surface }]}
                      onPress={() => navigation.navigate('Vocabulary', { pos: topic.pos })}
                    >
                      <View style={[sc.topicIconWrap, { backgroundColor: topic.iconBg }]}>{topic.icon}</View>
                      <Text style={[sc.topicName, { color: C.text }]}>{topic.name}</Text>
                      <Text style={[sc.topicCount, { color: C.text3 }]}>
                        {wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? 's' : ''}` : '0 words'}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )
        })()}

      </ScrollView>
    </SafeAreaView>
  )
}

const sc = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 20, fontFamily: Fonts.semibold },
  sectionSub: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  btnPrimary: { borderRadius: 9, paddingHorizontal: 14, paddingVertical: 8 },
  btnPrimaryText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  statTile: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 20, fontFamily: Fonts.bold },
  statLbl: { fontSize: 11, marginTop: 2, fontFamily: Fonts.regular },
  vocabCard: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  vocabItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  vocabWord: { fontSize: 17, fontFamily: Fonts.semibold },
  vocabTrans: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  chip: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 12, fontFamily: Fonts.medium },
  posTag: { fontSize: 10, fontFamily: Fonts.regular },
  divider: { height: 1 },
  moreBtn: { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1 },
  moreBtnText: { fontSize: 13, fontFamily: Fonts.semibold },
  emptyCard: { marginHorizontal: 20, borderRadius: 16, padding: 28, alignItems: 'center', gap: 8, marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontFamily: Fonts.bold },
  emptySub: { fontSize: 13, fontFamily: Fonts.regular, textAlign: 'center', lineHeight: 20 },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  topicCard: { width: '31%', borderRadius: 14, padding: 14, alignItems: 'center' },
  topicIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  topicName: { fontSize: 12, fontFamily: Fonts.semibold, textAlign: 'center' },
  topicCount: { fontSize: 11, marginTop: 2, fontFamily: Fonts.regular },
})
