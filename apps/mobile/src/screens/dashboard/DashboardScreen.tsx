import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiFetch } from '../../lib/api'
import { useToken } from '../../lib/devAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import type { RootStackParamList } from '../../navigation/RootNavigator'

interface ProgressResp { total_words: number; retention_rate_30d: number; user: { level: string; streak: number } }
interface UserProgress { level: string; streak: number; words_due: number; total_words: number; mastery_score: number }

const WOTD = {
  word: 'Verschmitzt', article: 'Adjektiv · B2',
  def: 'Mischievous, impish; having a sly, roguish quality that is nonetheless charming.',
  example: '"Sie lächelte ihn verschmitzt an." — She gave him a mischievous smile.',
}

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const getToken = useToken()
  const { colors: C, isDark, toggleTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken()
        const [prog, due] = await Promise.all([
          apiFetch<ProgressResp>('/api/progress', {}, token),
          apiFetch<unknown[]>('/api/reviews/due', {}, token),
        ])
        setProgress({
          level: prog.user.level,
          streak: prog.user.streak,
          words_due: due.length,
          total_words: prog.total_words,
          mastery_score: prog.retention_rate_30d,
        })
      } catch {
        setProgress({ level: 'B1', streak: 0, words_due: 0, total_words: 0, mastery_score: 0 })
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  if (loading) return (
    <SafeAreaView style={[s.center, { backgroundColor: C.bg }]}>
      <ActivityIndicator size="large" color={C.primary} />
    </SafeAreaView>
  )

  const ACTIVITY = [
    { icon: <Icons.CheckCircle size={16} color={C.success} />, bg: 'rgba(22,163,74,.1)', title: 'Grammar — Dativ completed', sub: 'Scored 90% · 12 questions', time: '2h ago' },
    { icon: <Icons.MessageSquare size={16} color={C.primary} />, bg: 'rgba(55,48,163,.1)', title: 'AI Chat — Café ordering', sub: '8 min · 3 corrections', time: '5h ago' },
    { icon: <Icons.BookOpen size={16} color={C.accentD} />, bg: 'rgba(245,158,11,.1)', title: 'Vocab — 45 cards reviewed', sub: '92% retention · 8 new words', time: 'Yesterday' },
  ]

  const planCards = [
    { icon: <Icons.Layers size={18} color={C.primary} />, bg: 'rgba(55,48,163,.1)', title: 'Vocab Review', sub: `${progress?.words_due ?? 32} cards due`, fill: 0, fillColor: C.primary, onPress: () => navigation.navigate('Review') },
    { icon: <Icons.MessageSquare size={18} color={C.success} />, bg: 'rgba(22,163,74,.1)', title: 'Conversation', sub: '10 min goal', fill: 0.4, fillColor: C.success, onPress: undefined },
    { icon: <Icons.Pencil size={18} color={C.accentD} />, bg: 'rgba(245,158,11,.1)', title: 'Grammar', sub: 'Konjunktiv II', fill: 1, fillColor: C.accent, onPress: () => navigation.navigate('Grammar') },
    { icon: <Icons.BookOpen size={18} color={C.primary} />, bg: 'rgba(55,48,163,.1)', title: 'Reading', sub: '1 article', fill: 1, fillColor: C.primary, onPress: undefined },
    { icon: <Icons.Volume size={18} color={C.error} />, bg: 'rgba(220,38,38,.08)', title: 'Pronunciation', sub: '5 exercises', fill: 1, fillColor: C.error, onPress: undefined },
  ]

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.primaryD }]} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero */}
        <View style={[s.hero, { backgroundColor: C.primaryD, paddingTop: insets.top + 16 }]}>
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />
          <Text style={[s.heroGreeting, { color: 'rgba(255,255,255,.7)' }]}>{greeting}</Text>
          <Text style={[s.heroName, { color: '#FFFFFF' }]}>Jonathan 👋</Text>
          <View style={s.heroStats}>
            {[
              { icon: <Icons.Flame size={18} color={C.accent} />, val: progress?.streak ?? 14, lbl: 'Day Streak' },
              { icon: null, val: progress?.level ?? 'B1', lbl: 'Current Level' },
              { icon: null, val: `${(progress?.total_words ?? 0) > 0 ? ((progress!.total_words) * 2).toLocaleString() : '—'}`, lbl: 'XP Total' },
            ].map((stat, i) => (
              <View key={i} style={s.heroStat}>
                <View style={s.heroStatValRow}>
                  {stat.icon}
                  <Text style={s.heroStatVal}>{stat.val}</Text>
                </View>
                <Text style={s.heroStatLbl}>{stat.lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Today's Plan */}
        <View style={s.sectionHeader}>
          <View>
            <Text style={[s.sectionTitle, { color: C.text }]}>Today's Plan</Text>
            <Text style={[s.sectionSub, { color: C.text2 }]}>{progress?.words_due ?? 0} cards due</Text>
          </View>
          <Text style={[s.sectionMeta, { color: C.text3 }]}>{progress?.mastery_score ?? 0}% mastery</Text>
        </View>
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={[s.progressTrack, { backgroundColor: C.bgAlt }]}>
            <View style={[s.progressFill, { width: `${progress?.mastery_score ?? 0}%` as any, backgroundColor: C.primary }]} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.planRow}>
          {planCards.map((card, i) => (
            <TouchableOpacity key={i} style={[s.planCard, { backgroundColor: C.surface }]} onPress={card.onPress} activeOpacity={0.8}>
              <View style={[s.planCardIcon, { backgroundColor: card.bg }]}>{card.icon}</View>
              <Text style={[s.planCardTitle, { color: C.text }]}>{card.title}</Text>
              <Text style={[s.planCardSub, { color: C.text3 }]}>{card.sub}</Text>
              <View style={[s.planCardBar, { backgroundColor: C.bgAlt }]}>
                <View style={[s.planCardBarFill, { width: `${card.fill * 100}%` as any, backgroundColor: card.fillColor }]} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Word of the Day */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: C.text }]}>Wort des Tages</Text>
          <View style={s.chipAccent}><Text style={[s.chipAccentText, { color: C.accentD }]}>Neu</Text></View>
        </View>
        <View style={[s.wotd, { borderColor: 'rgba(245,158,11,.25)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Icons.Star size={12} color={C.accentD} />
            <Text style={[s.wotdLabel, { color: C.accentD }]}>Word of the Day</Text>
          </View>
          <Text style={[s.wotdWord, { color: C.text }]}>{WOTD.word}</Text>
          <Text style={[s.wotdArticle, { color: C.primary }]}>{WOTD.article}</Text>
          <Text style={[s.wotdDef, { color: C.text2 }]}>{WOTD.def}</Text>
          <Text style={[s.wotdExample, { color: C.text3 }]}>{WOTD.example}</Text>
        </View>

        {/* Recent Activity */}
        <View style={[s.sectionHeader, { paddingTop: 24 }]}>
          <Text style={[s.sectionTitle, { color: C.text }]}>Recent Activity</Text>
        </View>
        {ACTIVITY.map((item, i) => (
          <View key={i}>
            <View style={s.activityItem}>
              <View style={[s.activityIcon, { backgroundColor: item.bg }]}>{item.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={[s.activityTitle, { color: C.text }]}>{item.title}</Text>
                <Text style={[s.activitySub, { color: C.text3 }]}>{item.sub}</Text>
              </View>
              <Text style={[s.activityTime, { color: C.text3 }]}>{item.time}</Text>
            </View>
            {i < ACTIVITY.length - 1 && <View style={[s.divider, { backgroundColor: C.border }]} />}
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={[s.themeToggle, { top: insets.top + 10 }]} onPress={toggleTheme} activeOpacity={0.8}>
        {isDark
          ? <Icons.Sun size={16} color={C.accent} />
          : <Icons.Moon size={16} color="rgba(255,255,255,.85)" />}
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { paddingHorizontal: 20, paddingBottom: 28, overflow: 'hidden' },
  themeToggle: { position: 'absolute', right: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' },
  heroCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,.06)', right: -40, top: -60 },
  heroCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(245,158,11,.12)', left: 20, bottom: -50 },
  heroGreeting: { fontSize: 13, marginBottom: 4, fontFamily: Fonts.regular },
  heroName: { fontSize: 26, fontFamily: Fonts.bold, marginBottom: 16 },
  heroStats: { flexDirection: 'row', gap: 12 },
  heroStat: { flex: 1, backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 12, padding: 10, paddingHorizontal: 12 },
  heroStatValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStatVal: { fontSize: 22, fontFamily: Fonts.bold, color: '#FFFFFF', lineHeight: 26 },
  heroStatLbl: { fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 2, fontFamily: Fonts.regular },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 20, fontFamily: Fonts.semibold },
  sectionSub: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  sectionMeta: { fontSize: 13, fontFamily: Fonts.medium },
  progressTrack: { height: 8, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 99 },
  planRow: { paddingHorizontal: 20, paddingBottom: 4, gap: 10 },
  planCard: { flexShrink: 0, width: 140, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  planCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  planCardTitle: { fontSize: 13, fontFamily: Fonts.semibold, lineHeight: 18, marginBottom: 4 },
  planCardSub: { fontSize: 11, fontFamily: Fonts.regular },
  planCardBar: { height: 3, borderRadius: 99, overflow: 'hidden', marginTop: 8 },
  planCardBarFill: { height: 3, borderRadius: 99 },
  chipAccent: { backgroundColor: 'rgba(245,158,11,.15)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  chipAccentText: { fontSize: 12, fontFamily: Fonts.medium },
  wotd: { marginHorizontal: 20, backgroundColor: 'rgba(245,158,11,.06)', borderWidth: 1, borderRadius: 16, padding: 16 },
  wotdLabel: { fontSize: 11, fontFamily: Fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  wotdWord: { fontSize: 28, fontFamily: Fonts.bold, marginBottom: 2 },
  wotdArticle: { fontSize: 13, fontFamily: Fonts.medium, marginBottom: 6 },
  wotdDef: { fontSize: 14, lineHeight: 21, fontFamily: Fonts.regular },
  wotdExample: { fontSize: 13, fontFamily: Fonts.italic, marginTop: 8 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  activityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityTitle: { fontSize: 14, fontFamily: Fonts.medium },
  activitySub: { fontSize: 12, fontFamily: Fonts.regular },
  activityTime: { fontSize: 12, fontFamily: Fonts.regular },
  divider: { height: 1, marginHorizontal: 20 },
})
