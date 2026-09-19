import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import type { RootStackParamList } from '../../navigation/RootNavigator'

const FILTERS = ['All (32)', 'New (8)', 'Review (18)', 'Relearn (6)', 'Nouns', 'Verbs', 'B1']

const SAMPLE_WORDS = [
  { id: '1', word: 'Gedankengang', article: 'die', trans: 'train of thought, chain of reasoning', status: 'now' },
  { id: '2', word: 'Fernweh', article: 'das', trans: 'wanderlust, longing for distant places', status: 'now' },
  { id: '3', word: 'besinnen', article: 'sich', trans: 'to reflect, to reconsider', status: '1d' },
  { id: '4', word: 'Weltanschauung', article: 'die', trans: 'worldview, philosophy of life', status: '3d' },
  { id: '5', word: 'unerschütterlich', article: '', trans: 'unshakeable, steadfast, unwavering', status: '5d' },
]

const TOPICS = [
  { emoji: '🏙️', name: 'City Life', count: '124 words' },
  { emoji: '🍽️', name: 'Food & Dining', count: '89 words' },
  { emoji: '💼', name: 'Work & Career', count: '156 words' },
  { emoji: '🎭', name: 'Culture & Arts', count: '203 words' },
]

export function LearnScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { colors: C } = useTheme()
  const [activeFilter, setActiveFilter] = useState(0)

  function chipStyle(status: string) {
    if (status === 'now') return { bg: 'rgba(55,48,163,.12)', color: C.primary }
    if (status === '1d') return { bg: 'rgba(245,158,11,.15)', color: C.accentD }
    return { bg: C.bgAlt, color: C.text3 }
  }

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={sc.sectionHeader}>
          <View>
            <Text style={[sc.sectionTitle, { color: C.text }]}>Vokabeln</Text>
            <Text style={[sc.sectionSub, { color: C.text2 }]}>32 cards due today</Text>
          </View>
          <TouchableOpacity style={[sc.btnPrimary, { backgroundColor: C.primary }]} onPress={() => navigation.navigate('Review')}>
            <Text style={sc.btnPrimaryText}>Start Review</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sc.filterRow}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={[sc.filterChip, { borderColor: activeScenario(i, activeFilter) ? C.primary : C.border },
                activeScenario(i, activeFilter) && { backgroundColor: C.primary }]}
              onPress={() => setActiveFilter(i)}
            >
              <Text style={[sc.filterChipText, { color: activeScenario(i, activeFilter) ? '#FFFFFF' : C.text2 }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={sc.statsRow}>
          {[
            { val: '1,284', label: 'Total learned', color: C.primary },
            { val: '87%', label: 'Retention', color: C.accentD },
            { val: '32', label: 'Due now', color: C.success },
          ].map((stat, i) => (
            <View key={i} style={[sc.statTile, { backgroundColor: C.surface }]}>
              <Text style={[sc.statVal, { color: stat.color }]}>{stat.val}</Text>
              <Text style={[sc.statLbl, { color: C.text3 }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[sc.vocabCard, { backgroundColor: C.surface }]}>
          {SAMPLE_WORDS.map((word, i) => {
            const chip = chipStyle(word.status)
            return (
              <View key={word.id}>
                <TouchableOpacity style={sc.vocabItem} onPress={() => navigation.navigate('Review')}>
                  <View style={{ flex: 1 }}>
                    <Text style={[sc.vocabWord, { color: C.text }]}>
                      {word.article ? <Text style={{ color: C.primary }}>{word.article} </Text> : null}
                      {word.word}
                    </Text>
                    <Text style={[sc.vocabTrans, { color: C.text2 }]}>{word.trans}</Text>
                  </View>
                  <View style={[sc.chip, { backgroundColor: chip.bg }]}>
                    <Text style={[sc.chipText, { color: chip.color }]}>{word.status === 'now' ? 'Now' : word.status}</Text>
                  </View>
                </TouchableOpacity>
                {i < SAMPLE_WORDS.length - 1 && <View style={[sc.divider, { backgroundColor: C.border }]} />}
              </View>
            )
          })}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={[sc.sectionTitle, { fontSize: 18, marginBottom: 12, color: C.text }]}>Browse Topics</Text>
          <View style={sc.topicsGrid}>
            {TOPICS.map((topic, i) => (
              <TouchableOpacity key={i} style={[sc.topicCard, { backgroundColor: C.surface }]}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{topic.emoji}</Text>
                <Text style={[sc.topicName, { color: C.text }]}>{topic.name}</Text>
                <Text style={[sc.topicCount, { color: C.text3 }]}>{topic.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function activeScenario(i: number, active: number) { return i === active }

const sc = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 20, fontFamily: Fonts.semibold },
  sectionSub: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  btnPrimary: { borderRadius: 9, paddingHorizontal: 14, paddingVertical: 8 },
  btnPrimaryText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 13 },
  filterRow: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5, backgroundColor: 'transparent' },
  filterChipText: { fontSize: 13, fontFamily: Fonts.medium },
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
