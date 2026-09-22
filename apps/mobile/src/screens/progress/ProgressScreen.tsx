import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'

interface ProgressData { total_words: number; mastered_words: number; total_xp: number; retention_rate_30d: number; reviews_30d: number; total_writing_sessions: number; user: { streak: number; level: string } }
interface ActivityItem { type: string; ts: number }
interface GrammarSession { pct: number }

// Build last-7-days labels: ['Mon 15', 'Tue 16', …, 'Today']
function buildLast7Days(): { day: string; date: string }[] {
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const label = i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' })
    const dateStr = d.toISOString().split('T')[0]!
    result.push({ day: label, date: dateStr })
  }
  return result
}

const SKILL_COLORS = ['#3730A3', '#B45309', '#6366F1']

export function ProgressScreen() {
  const { getAccessToken } = useAuth()
  const { colors: C } = useTheme()
  const [data, setData] = useState<ProgressData | null>(null)
  const [weeklyXP, setWeeklyXP] = useState<{ day: string; xp: number }[]>(buildLast7Days().map(d => ({ day: d.day, xp: 0 })))
  const [skillPcts, setSkillPcts] = useState([0, 0, 0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessToken()
        const [progress, activityItems, grammarSessions] = await Promise.all([
          apiFetch<ProgressData>('/api/progress', {}, token),
          apiFetch<ActivityItem[]>('/api/activity', {}, token).catch(() => [] as ActivityItem[]),
          apiFetch<GrammarSession[]>('/api/grammar/sessions', {}, token).catch(() => [] as GrammarSession[]),
        ])
        setData(progress)

        // Weekly XP: group by actual calendar date over last 7 days
        const last7 = buildLast7Days()
        const xpByDate: Record<string, number> = {}
        for (const item of activityItems) {
          const dateStr = new Date(item.ts).toISOString().split('T')[0]!
          xpByDate[dateStr] = (xpByDate[dateStr] ?? 0) + (item.type === 'writing' ? 50 : 20)
        }
        setWeeklyXP(last7.map(d => ({ day: d.day, xp: xpByDate[d.date] ?? 0 })))

        // Skills: Vocabulary (retention), Grammar (avg session score), Writing (sessions × 10, cap 100)
        const vocabPct = progress.retention_rate_30d
        const grammarPct = grammarSessions.length > 0
          ? Math.round(grammarSessions.reduce((s, g) => s + g.pct, 0) / grammarSessions.length)
          : 0
        const writingPct = Math.min(100, progress.total_writing_sessions * 10)
        setSkillPcts([vocabPct, grammarPct, writingPct])
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [])

  const streak = data?.user.streak ?? 0
  const level = data?.user.level ?? 'B1'
  const totalWords = data?.total_words ?? 0
  const masteredWords = data?.mastered_words ?? 0
  const retention = data?.retention_rate_30d ?? 0
  const reviews30d = data?.reviews_30d ?? 0

  const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  // Mastered-word targets to "complete" each level — based on research into CEFR vocabulary sizes
  // These are the words you need to have actively reviewed at each level, not total deck size
  const LEVEL_MASTERY_TARGETS: Record<string, number> = { A1: 800, A2: 2000, B1: 4000, B2: 8000, C1: 12000, C2: 20000 }
  const levelIdx = CEFR.indexOf(level)
  const nextLevel = CEFR[levelIdx + 1] ?? 'C2'
  const prevTarget = levelIdx > 0 ? (LEVEL_MASTERY_TARGETS[CEFR[levelIdx - 1]!] ?? 0) : 0
  const thisTarget = LEVEL_MASTERY_TARGETS[level] ?? 1000
  // Progress = mastered words within the current level's range
  const levelPct = Math.min(99, Math.round(Math.max(0, masteredWords - prevTarget) / Math.max(1, thisTarget - prevTarget) * 100))

  const maxXP = Math.max(1, ...weeklyXP.map(d => d.xp))

  const BADGES = [
    { icon: <Icons.Flame size={20} color="#B45309" />, name: `${streak} Day Streak`, earned: streak >= 7 },
    { icon: <Icons.BookOpen size={20} color="#3730A3" />, name: '100 Mastered', earned: masteredWords >= 100 },
    { icon: <Icons.Star size={20} color="#B45309" />, name: `${level} Achieved`, earned: true },
    { icon: <Icons.Zap size={20} color="#7C3AED" />, name: 'Speed Learner', earned: reviews30d >= 50 },
    { icon: <Icons.Trophy size={20} color="#B45309" />, name: 'Top Student', earned: retention >= 90 },
  ]

  // Only skills with real data; Listening/Speaking/Reading have no tracking yet
  const SKILL_NAMES = ['Vocabulary', 'Grammar', 'Writing']

  if (loading) return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.bg }]} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    </SafeAreaView>
  )

  const STATS = [
    { icon: <Icons.BookOpen size={18} color={C.primary} />, val: totalWords > 0 ? totalWords.toLocaleString() : '—', lbl: 'Words', bg: 'rgba(55,48,163,.1)' },
    { icon: <Icons.Flame size={18} color={C.accentD} />, val: streak.toString(), lbl: 'Day streak', bg: 'rgba(245,158,11,.15)' },
    { icon: <Icons.Target size={18} color={C.success} />, val: retention > 0 ? `${retention}%` : '—', lbl: 'Retention', bg: 'rgba(22,163,74,.1)' },
    { icon: <Icons.Clock size={18} color="#7C3AED" />, val: reviews30d > 0 ? `${reviews30d}` : '—', lbl: 'Reviews/30d', bg: 'rgba(124,58,237,.1)' },
  ]

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={pg.header}>
          <Text style={[pg.headerTitle, { color: C.text }]}>Fortschritt</Text>
          <Text style={[pg.headerSub, { color: C.text2 }]}>Your learning progress</Text>
        </View>

        {/* CEFR Card */}
        <View style={[pg.cefrCard, { backgroundColor: C.primaryD }]}>
          <View style={pg.cefrRow}>
            <View>
              <Text style={pg.cefrLabel}>Current Level</Text>
              <Text style={pg.cefrLevel}>{level}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={pg.cefrLabel}>Next Level</Text>
              <Text style={[pg.cefrNext, { color: C.accent }]}>{nextLevel}</Text>
            </View>
          </View>
          <View style={pg.cefrTrack}>
            <View style={[pg.cefrFill, { width: `${levelPct}%` as any, backgroundColor: C.accent }]} />
            <View style={[pg.cefrThumb, { left: `${levelPct}%` as any }]} />
          </View>
          <View style={pg.cefrFooter}>
            <Text style={pg.cefrFooterText}>{levelPct}% to {nextLevel}</Text>
            <Text style={pg.cefrFooterText}>{masteredWords.toLocaleString()} / {thisTarget.toLocaleString()} mastered</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={pg.statsGrid}>
          {STATS.map((stat, i) => (
            <View key={i} style={[pg.statCard, { backgroundColor: C.surface }]}>
              <View style={[pg.statIcon, { backgroundColor: stat.bg }]}>{stat.icon}</View>
              <Text style={[pg.statVal, { color: C.text }]}>{stat.val}</Text>
              <Text style={[pg.statLbl, { color: C.text3 }]}>{stat.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Weekly XP Chart */}
        <View style={[pg.sectionCard, { backgroundColor: C.surface }]}>
          <View style={pg.sectionCardHeader}>
            <Text style={[pg.sectionCardTitle, { color: C.text }]}>Weekly XP</Text>
            <Text style={[pg.sectionCardMeta, { color: C.text3 }]}>{weeklyXP.reduce((s, d) => s + d.xp, 0).toLocaleString()} this week</Text>
          </View>
          <View style={pg.chart}>
            {weeklyXP.map((d, i) => (
              <View key={i} style={pg.chartCol}>
                <View style={pg.barWrap}>
                  <View style={[pg.bar, {
                    height: d.xp > 0 ? `${(d.xp / maxXP) * 100}%` as any : 4,
                    backgroundColor: i === new Date().getDay() ? C.accent : C.primary,
                    opacity: d.xp > 0 ? 1 : 0.2,
                  }]} />
                </View>
                <Text style={[pg.barLabel, { color: C.text3 }]}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Skill Bars */}
        <View style={[pg.sectionCard, { backgroundColor: C.surface }]}>
          <Text style={[pg.sectionCardTitle, { color: C.text, marginBottom: 14 }]}>Skills</Text>
          {SKILL_NAMES.map((name, i) => (
            <View key={i} style={{ marginBottom: i < SKILL_NAMES.length - 1 ? 12 : 0 }}>
              <View style={pg.skillRow}>
                <Text style={[pg.skillName, { color: C.text2 }]}>{name}</Text>
                <Text style={[pg.skillPct, { color: SKILL_COLORS[i] }]}>
                  {skillPcts[i]! > 0 ? `${skillPcts[i]}%` : '—'}
                </Text>
              </View>
              <View style={[pg.skillTrack, { backgroundColor: C.bgAlt }]}>
                {skillPcts[i]! > 0 && (
                  <View style={[pg.skillFill, { width: `${skillPcts[i]}%` as any, backgroundColor: SKILL_COLORS[i] }]} />
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={[pg.sectionCard, { backgroundColor: C.surface }]}>
          <Text style={[pg.sectionCardTitle, { color: C.text, marginBottom: 14 }]}>Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {BADGES.map((badge, i) => (
              <View key={i} style={[pg.badge, !badge.earned && { opacity: 0.45 }]}>
                <View style={[pg.badgeIcon, badge.earned
                  ? { backgroundColor: 'rgba(245,158,11,.15)' }
                  : { backgroundColor: C.bgAlt }]}>
                  {badge.earned ? badge.icon : <Icons.Lock size={20} color={C.text3} />}
                </View>
                <Text style={[pg.badgeName, { color: badge.earned ? C.text : C.text3 }]}>{badge.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const pg = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontFamily: Fonts.bold },
  headerSub: { fontSize: 14, marginTop: 2, fontFamily: Fonts.regular },
  cefrCard: { margin: 20, borderRadius: 20, padding: 20 },
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cefrLabel: { fontSize: 12, color: 'rgba(255,255,255,.6)', fontFamily: Fonts.regular },
  cefrLevel: { fontSize: 48, fontFamily: Fonts.bold, color: '#FFFFFF', lineHeight: 54 },
  cefrNext: { fontSize: 48, fontFamily: Fonts.bold, lineHeight: 54 },
  cefrTrack: { height: 6, backgroundColor: 'rgba(255,255,255,.2)', borderRadius: 99, marginBottom: 10 },
  cefrFill: { height: 6, borderRadius: 99 },
  cefrThumb: { position: 'absolute', top: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', marginLeft: -8 },
  cefrFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cefrFooterText: { fontSize: 11, color: 'rgba(255,255,255,.6)', fontFamily: Fonts.regular },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  statCard: { width: '47.5%', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal: { fontSize: 22, fontFamily: Fonts.bold },
  statLbl: { fontSize: 11, marginTop: 2, fontFamily: Fonts.regular },
  sectionCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionCardTitle: { fontSize: 17, fontFamily: Fonts.semibold },
  sectionCardMeta: { fontSize: 13, fontFamily: Fonts.regular },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%' },
  barWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, fontFamily: Fonts.regular },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  skillName: { fontSize: 13, fontFamily: Fonts.medium },
  skillPct: { fontSize: 13, fontFamily: Fonts.semibold },
  skillTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  skillFill: { height: 6, borderRadius: 99 },
  badge: { width: 72, alignItems: 'center', gap: 6 },
  badgeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 10, fontFamily: Fonts.medium, textAlign: 'center', lineHeight: 14 },
})
