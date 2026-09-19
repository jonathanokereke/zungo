import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiFetch } from '../../lib/api'
import { useToken } from '../../lib/devAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import type { RootStackParamList } from '../../navigation/RootNavigator'

interface DueCard { review: { due_date: string; interval: number }; word: { id: string; german: string; translation: string; part_of_speech: string } }
interface ProgressData { total_words: number; retention_rate_30d: number; user: { streak: number; level: string } }

const TOPICS = [
  { emoji: '🏙️', name: 'City Life' },
  { emoji: '🍽️', name: 'Food & Dining' },
  { emoji: '💼', name: 'Work & Career' },
  { emoji: '🎭', name: 'Culture & Arts' },
]

export function LearnScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const getToken = useToken()
  const { colors: C } = useTheme()
  const [dueCards, setDueCards] = useState<DueCard[]>([])
  const [stats, setStats] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken()
        const [due, progress] = await Promise.all([
          apiFetch<DueCard[]>('/api/reviews/due', {}, token),
          apiFetch<ProgressData>('/api/progress', {}, token),
        ])
        setDueCards(due)
        setStats(progress)
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [])

  function dueLabel(card: DueCard) {
    const interval = card.review.interval
    if (interval === 0) return 'Now'
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
        <View style={sc.sectionHeader}>
          <View>
            <Text style={[sc.sectionTitle, { color: C.text }]}>Vokabeln</Text>
            <Text style={[sc.sectionSub, { color: C.text2 }]}>{dueCount} cards due today</Text>
          </View>
          <TouchableOpacity style={[sc.btnPrimary, { backgroundColor: C.primary }]} onPress={() => navigation.navigate('Review')}>
            <Text style={sc.btnPrimaryText}>Start Review</Text>
          </TouchableOpacity>
        </View>

        <View style={sc.statsRow}>
          {[
            { val: totalWords > 0 ? totalWords.toLocaleString() : '—', label: 'Total words', color: C.primary },
            { val: retention > 0 ? `${retention}%` : '—', label: 'Retention', color: C.accentD },
            { val: dueCount.toString(), label: 'Due now', color: C.success },
          ].map((stat, i) => (
            <View key={i} style={[sc.statTile, { backgroundColor: C.surface }]}>
              <Text style={[sc.statVal, { color: stat.color }]}>{stat.val}</Text>
              <Text style={[sc.statLbl, { color: C.text3 }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {dueCards.length > 0 && (
          <View style={[sc.vocabCard, { backgroundColor: C.surface }]}>
            {dueCards.slice(0, 8).map((card, i) => {
              const chip = chipStyle(card.review.interval)
              const [article, ...rest] = card.word.german.split(' ')
              const hasArticle = ['der', 'die', 'das'].includes(article ?? '')
              return (
                <View key={card.word.id}>
                  <TouchableOpacity style={sc.vocabItem} onPress={() => navigation.navigate('Review')}>
                    <View style={{ flex: 1 }}>
                      <Text style={[sc.vocabWord, { color: C.text }]}>
                        {hasArticle ? <Text style={{ color: C.primary }}>{article} </Text> : null}
                        {hasArticle ? rest.join(' ') : card.word.german}
                      </Text>
                      <Text style={[sc.vocabTrans, { color: C.text2 }]}>{card.word.translation}</Text>
                    </View>
                    <View style={[sc.chip, { backgroundColor: chip.bg }]}>
                      <Text style={[sc.chipText, { color: chip.color }]}>{dueLabel(card)}</Text>
                    </View>
                  </TouchableOpacity>
                  {i < Math.min(dueCards.length, 8) - 1 && <View style={[sc.divider, { backgroundColor: C.border }]} />}
                </View>
              )
            })}
          </View>
        )}

        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={[sc.sectionTitle, { fontSize: 18, marginBottom: 12, color: C.text }]}>Browse Topics</Text>
          <View style={sc.topicsGrid}>
            {TOPICS.map((topic, i) => (
              <TouchableOpacity key={i} style={[sc.topicCard, { backgroundColor: C.surface }]} onPress={() => navigation.navigate('Review')}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{topic.emoji}</Text>
                <Text style={[sc.topicName, { color: C.text }]}>{topic.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  statTile: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statVal: { fontSize: 20, fontFamily: Fonts.bold },
  statLbl: { fontSize: 11, marginTop: 2, fontFamily: Fonts.regular },
  vocabCard: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, marginBottom: 20 },
  vocabItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  vocabWord: { fontSize: 17, fontFamily: Fonts.semibold },
  vocabTrans: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  chip: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 12, fontFamily: Fonts.medium },
  divider: { height: 1 },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  topicCard: { width: '48%', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  topicName: { fontSize: 13, fontFamily: Fonts.semibold },
  topicCount: { fontSize: 11, marginTop: 2, fontFamily: Fonts.regular },
})
