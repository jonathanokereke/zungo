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

interface Topic { title: string; subtitle: string; minLevel: string; color: string; mastery: number }
interface TopicsResp { topics: Topic[]; level: string }

export function GrammarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { getAccessToken } = useAuth()
  const { colors: C } = useTheme()
  const [topics, setTopics] = useState<Topic[]>([])
  const [userLevel, setUserLevel] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoadError(null)
      try {
        const token = await getAccessToken()
        const resp = await apiFetch<TopicsResp>('/api/grammar/topics', {}, token)
        setTopics(resp.topics)
        setUserLevel(resp.level)
      } catch (e: any) {
        setLoadError(e?.message ?? 'Could not load grammar topics')
        setTopics([])
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#fff' }]} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    </SafeAreaView>
  )

  const practisedTopics = topics.filter(t => t.mastery > 0)
  const avgMastery = practisedTopics.length > 0
    ? Math.round(practisedTopics.reduce((s, t) => s + t.mastery, 0) / practisedTopics.length)
    : 0
  const needPractice = topics.filter(t => t.mastery < 70).length

  const STATS = [
    { val: practisedTopics.length > 0 ? `${avgMastery}%` : '—', label: 'Avg Mastery', icon: <Icons.Target size={16} color={C.primary} />, bg: 'rgba(55,48,163,.1)' },
    { val: `${topics.length}`, label: `${userLevel} Topics`, icon: <Icons.BookOpen size={16} color={C.accentD} />, bg: 'rgba(245,158,11,.15)' },
    { val: `${needPractice}`, label: 'Need practice', icon: <Icons.CheckCircle size={16} color={C.success} />, bg: 'rgba(22,163,74,.1)' },
  ]

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={gm.header}>
          <View>
            <Text style={[gm.headerTitle, { color: C.text }]}>Grammatik</Text>
            <Text style={[gm.headerSub, { color: C.text2 }]}>{topics.length} topics for {userLevel} · {needPractice} need practice</Text>
          </View>
          <TouchableOpacity
            style={[gm.drillBtn, { backgroundColor: C.primary }]}
            onPress={() => {
              // Pick a random topic from the loaded set for the Daily Drill
              const drillTopic = topics.length > 0
                ? topics[Math.floor(Math.random() * topics.length)]!
                : { title: 'Mixed Grammar', subtitle: 'Mixed practice' }
              navigation.navigate('Exercise', { topic: drillTopic.title, subtitle: drillTopic.subtitle ?? 'Daily Drill' })
            }}
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

        {topics.map((topic, i) => (
          <TouchableOpacity
            key={i}
            style={[gm.topicCard, { backgroundColor: C.surface }]}
            onPress={() => navigation.navigate('GrammarRef', { topic: topic.title, subtitle: topic.subtitle, color: topic.color })}
            activeOpacity={0.82}
          >
            <View style={gm.topicBody}>
              <View style={gm.topicTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[gm.topicTitle, { color: C.text }]}>{topic.title}</Text>
                  <Text style={[gm.topicSub, { color: C.text3 }]}>{topic.subtitle}</Text>
                </View>
                <View style={[gm.levelBadge, { backgroundColor: topic.color + '18' }]}>
                  <Text style={[gm.levelBadgeText, { color: topic.color }]}>{topic.minLevel}</Text>
                </View>
              </View>
              <View style={gm.progressRow}>
                <View style={[gm.progressTrack, { backgroundColor: C.bgAlt }]}>
                  <View style={[gm.progressFill, { width: `${topic.mastery}%` as any, backgroundColor: topic.mastery >= 70 ? C.success : topic.color }]} />
                </View>
                <Text style={[gm.masteryPct, { color: topic.mastery >= 70 ? C.success : C.text3 }]}>
                  {topic.mastery > 0 ? `${topic.mastery}%` : 'New'}
                </Text>
              </View>
            </View>
            <Icons.ChevronRight size={16} color={C.text3} />
          </TouchableOpacity>
        ))}

        {topics.length === 0 && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={[{ color: C.text2, fontFamily: Fonts.regular, textAlign: 'center' }]}>
              {loadError ?? 'Could not load grammar topics. Please check your connection.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const gm = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontFamily: Fonts.bold },
  headerSub: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  drillBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  drillBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 13 },
  overviewCard: { marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16 },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-around' },
  overviewStat: { alignItems: 'center', gap: 6 },
  overviewIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  overviewVal: { fontSize: 18, fontFamily: Fonts.bold },
  overviewLbl: { fontSize: 11, fontFamily: Fonts.regular },
  topicCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  topicBody: { flex: 1, gap: 10 },
  topicTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  topicTitle: { fontSize: 15, fontFamily: Fonts.semibold },
  topicSub: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
  levelBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  levelBadgeText: { fontSize: 11, fontFamily: Fonts.bold },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 5, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 99 },
  masteryPct: { fontSize: 11, fontFamily: Fonts.semibold, width: 32, textAlign: 'right' },
})
