import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import type { RootStackParamList } from '../../navigation/RootNavigator'

const TOPICS = [
  { title: 'Der Dativ', subtitle: 'Indirect object case', mastery: 90, level: 'A2', color: '#16A34A' },
  { title: 'Konjunktiv II', subtitle: 'Subjunctive mood', mastery: 62, level: 'B1', color: '#B45309' },
  { title: 'Passiv Konstruktionen', subtitle: 'Passive voice', mastery: 45, level: 'B1', color: '#3730A3' },
  { title: 'Relativsätze', subtitle: 'Relative clauses', mastery: 38, level: 'B2', color: '#DC2626' },
  { title: 'Modalverben', subtitle: 'Modal verbs', mastery: 74, level: 'A2', color: '#7C3AED' },
  { title: 'Genitiv', subtitle: 'Possessive case', mastery: 55, level: 'B1', color: '#6366F1' },
]

function masteryColor(pct: number, colors: any) {
  if (pct >= 80) return colors.success
  if (pct >= 60) return colors.accentD
  if (pct >= 40) return colors.warn
  return colors.error
}

export function GrammarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { colors: C } = useTheme()

  const avgMastery = Math.round(TOPICS.reduce((s, t) => s + t.mastery, 0) / TOPICS.length)
  const STATS = [
    { val: `${avgMastery}%`, label: 'Avg Mastery', icon: <Icons.Target size={16} color={C.primary} />, bg: 'rgba(55,48,163,.1)' },
    { val: `${TOPICS.length}`, label: 'Topics', icon: <Icons.BookOpen size={16} color={C.accentD} />, bg: 'rgba(245,158,11,.15)' },
    { val: `${TOPICS.filter(t => t.mastery < 70).length}`, label: 'Need practice', icon: <Icons.CheckCircle size={16} color={C.success} />, bg: 'rgba(22,163,74,.1)' },
  ]

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={gm.header}>
          <View>
            <Text style={[gm.headerTitle, { color: C.text }]}>Grammatik</Text>
            <Text style={[gm.headerSub, { color: C.text2 }]}>{TOPICS.length} topics · {TOPICS.filter(t => t.mastery < 70).length} need practice</Text>
          </View>
          <TouchableOpacity
            style={[gm.drillBtn, { backgroundColor: C.primary }]}
            onPress={() => navigation.navigate('Exercise', { topic: 'Daily Drill', subtitle: 'Mixed practice' })}
          >
            <Icons.Zap size={14} color="#FFFFFF" />
            <Text style={gm.drillBtnText}>Daily Drill</Text>
          </TouchableOpacity>
        </View>

        <View style={[gm.overviewCard, { backgroundColor: C.surface }]}>
          <View style={gm.overviewRow}>
            {STATS.map((stat, i) => (
              <View key={i} style={gm.overviewStat}>
                <View style={[gm.overviewIcon, { backgroundColor: stat.bg }]}>{stat.icon}</View>
                <Text style={[gm.overviewVal, { color: C.text }]}>{stat.val}</Text>
                <Text style={[gm.overviewLbl, { color: C.text3 }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {TOPICS.map((topic, i) => (
          <TouchableOpacity
            key={i}
            style={[gm.topicCard, { backgroundColor: C.surface }]}
            onPress={() => navigation.navigate('Exercise', { topic: topic.title, subtitle: topic.subtitle })}
          >
            <View style={[gm.topicAccent, { backgroundColor: topic.color }]} />
            <View style={{ flex: 1 }}>
              <View style={gm.topicHeader}>
                <Text style={[gm.topicTitle, { color: C.text }]}>{topic.title}</Text>
                <View style={[gm.levelBadge, { backgroundColor: topic.color + '22' }]}>
                  <Text style={[gm.levelBadgeText, { color: topic.color }]}>{topic.level}</Text>
                </View>
              </View>
              <Text style={[gm.topicSub, { color: C.text3 }]}>{topic.subtitle}</Text>
              <View style={gm.masteryRow}>
                <View style={[gm.masteryTrack, { backgroundColor: C.bgAlt }]}>
                  <View style={[gm.masteryFill, { width: `${topic.mastery}%` as any, backgroundColor: masteryColor(topic.mastery, C) }]} />
                </View>
                <Text style={[gm.masteryPct, { color: masteryColor(topic.mastery, C) }]}>{topic.mastery}%</Text>
              </View>
            </View>
            <Icons.ChevronRight size={18} color={C.text3} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const gm = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontFamily: Fonts.bold },
  headerSub: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  drillBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  drillBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 13 },
  overviewCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  overviewRow: { flexDirection: 'row', gap: 8 },
  overviewStat: { flex: 1, alignItems: 'center', gap: 6 },
  overviewIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  overviewVal: { fontSize: 18, fontFamily: Fonts.bold },
  overviewLbl: { fontSize: 11, fontFamily: Fonts.regular, textAlign: 'center' },
  topicCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginBottom: 10, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  topicAccent: { width: 4, borderRadius: 99, alignSelf: 'stretch', minHeight: 50 },
  topicHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  topicTitle: { fontSize: 16, fontFamily: Fonts.semibold },
  levelBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  levelBadgeText: { fontSize: 11, fontFamily: Fonts.semibold },
  topicSub: { fontSize: 12, marginBottom: 10, fontFamily: Fonts.regular },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  masteryTrack: { flex: 1, height: 6, borderRadius: 99, overflow: 'hidden' },
  masteryFill: { height: 6, borderRadius: 99 },
  masteryPct: { fontSize: 12, fontFamily: Fonts.semibold, minWidth: 36, textAlign: 'right' },
})
