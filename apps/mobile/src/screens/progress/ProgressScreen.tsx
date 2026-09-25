import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProgressData {
  total_words: number; mastered_words: number; total_xp: number
  retention_rate_30d: number; reviews_30d: number; total_writing_sessions: number
  user: { streak: number; level: string }
}
interface GrammarSession { pct: number }
interface Details {
  weekly_xp: { date: string; day_label: string; xp: number }[]
  activity_30d: { date: string; count: number }[]
  reading_stats: { total_sessions: number; total_words_looked_up: number; total_minutes: number }
  weak_grammar_topics: { topic: string; avg_pct: number; sessions: number }[]
  writing_stats: { total: number; above_level: number; at_level: number; below_level: number }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const LEVEL_MASTERY_TARGETS: Record<string, number> = { A1: 800, A2: 2000, B1: 4000, B2: 8000, C1: 12000, C2: 20000 }
const SKILL_COLORS = ['#3730A3', '#B45309', '#6366F1']

// ── Heatmap helpers ───────────────────────────────────────────────────────────
function heatColor(count: number, isDark: boolean): string {
  if (count === 0) return isDark ? '#2A2A3A' : '#EAECF6'
  if (count <= 2)  return '#6366F1'
  if (count <= 5)  return '#4F46E5'
  return '#3730A3'
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ProgressScreen() {
  const { getAccessToken } = useAuth()
  const { colors: C, isDark } = useTheme()
  const [data, setData] = useState<ProgressData | null>(null)
  const [details, setDetails] = useState<Details | null>(null)
  const [grammarSessions, setGrammarSessions] = useState<GrammarSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessToken()
        const [progress, det, grammar] = await Promise.all([
          apiFetch<ProgressData>('/api/progress', {}, token),
          apiFetch<Details>('/api/progress/details', {}, token),
          apiFetch<GrammarSession[]>('/api/grammar/sessions', {}, token).catch(() => [] as GrammarSession[]),
        ])
        setData(progress)
        setDetails(det)
        setGrammarSessions(grammar)
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.bg }]} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    </SafeAreaView>
  )

  // ── Derived values ────────────────────────────────────────────────────────
  const streak       = data?.user.streak ?? 0
  const level        = data?.user.level ?? 'B1'
  const totalWords   = data?.total_words ?? 0
  const masteredWords = data?.mastered_words ?? 0
  const retention    = data?.retention_rate_30d ?? 0
  const reviews30d   = data?.reviews_30d ?? 0

  const levelIdx     = CEFR.indexOf(level as any)
  const nextLevel    = CEFR[levelIdx + 1] ?? 'C2'
  const prevTarget   = levelIdx > 0 ? (LEVEL_MASTERY_TARGETS[CEFR[levelIdx - 1]!] ?? 0) : 0
  const thisTarget   = LEVEL_MASTERY_TARGETS[level] ?? 1000
  const levelPct     = Math.min(99, Math.round(Math.max(0, masteredWords - prevTarget) / Math.max(1, thisTarget - prevTarget) * 100))

  const weeklyXP     = details?.weekly_xp ?? []
  const activity30d  = details?.activity_30d ?? []
  const readingStats = details?.reading_stats ?? { total_sessions: 0, total_words_looked_up: 0, total_minutes: 0 }
  const weakTopics   = details?.weak_grammar_topics ?? []
  const writingStats = details?.writing_stats ?? { total: 0, above_level: 0, at_level: 0, below_level: 0 }

  const maxXP = Math.max(1, ...weeklyXP.map(d => d.xp))
  const weekXPTotal = weeklyXP.reduce((s, d) => s + d.xp, 0)

  const vocabPct   = retention
  const grammarPct = grammarSessions.length > 0
    ? Math.round(grammarSessions.reduce((s, g) => s + g.pct, 0) / grammarSessions.length) : 0
  const writingPct = Math.min(100, writingStats.total * 10)
  const readingPct = Math.min(100, readingStats.total_sessions * 8)
  const skillPcts  = [vocabPct, grammarPct, writingPct, readingPct]
  const SKILL_NAMES = ['Vocabulary', 'Grammar', 'Writing', 'Reading']
  const SKILL_ICONS = [
    <Icons.BookOpen size={14} color={SKILL_COLORS[0]!} />,
    <Icons.ListChecks size={14} color={SKILL_COLORS[1]!} />,
    <Icons.PenLine size={14} color={SKILL_COLORS[2]!} />,
    <Icons.BookOpen size={14} color="#16A34A" />,
  ]

  // Stats cards
  const STATS = [
    { icon: <Icons.BookOpen size={18} color={C.primary} />,  val: totalWords > 0 ? totalWords.toLocaleString() : '—', lbl: 'Words saved',    bg: 'rgba(55,48,163,.1)' },
    { icon: <Icons.Flame size={18} color={C.accentD} />,     val: `${streak}`,                                       lbl: 'Day streak',      bg: 'rgba(245,158,11,.15)' },
    { icon: <Icons.Target size={18} color={C.success} />,    val: retention > 0 ? `${retention}%` : '—',             lbl: 'Retention',       bg: 'rgba(22,163,74,.1)' },
    { icon: <Icons.BookOpen size={18} color="#7C3AED" />,    val: readingStats.total_sessions > 0 ? `${readingStats.total_sessions}` : '—', lbl: 'Reading sessions', bg: 'rgba(124,58,237,.1)' },
  ]

  // Badges
  const BADGES = [
    { icon: <Icons.Flame size={20} color="#B45309" />,     name: `${streak} Day Streak`,  earned: streak >= 7 },
    { icon: <Icons.BookOpen size={20} color="#3730A3" />,  name: '100 Mastered',          earned: masteredWords >= 100 },
    { icon: <Icons.Star size={20} color="#B45309" />,      name: `${level} Achieved`,     earned: true },
    { icon: <Icons.Zap size={20} color="#7C3AED" />,       name: 'Speed Learner',         earned: reviews30d >= 50 },
    { icon: <Icons.Trophy size={20} color="#B45309" />,    name: 'Top Student',           earned: retention >= 90 },
    { icon: <Icons.BookOpen size={20} color="#16A34A" />,  name: 'Avid Reader',           earned: readingStats.total_sessions >= 10 },
  ]

  // Writing assessment percentage bars
  const writingTotal = Math.max(1, writingStats.total)
  const abovePct  = Math.round((writingStats.above_level / writingTotal) * 100)
  const atPct     = Math.round((writingStats.at_level / writingTotal) * 100)
  const belowPct  = Math.round((writingStats.below_level / writingTotal) * 100)

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={pg.header}>
          <Text style={[pg.headerTitle, { color: C.text }]}>Fortschritt</Text>
          <Text style={[pg.headerSub, { color: C.text2 }]}>Your learning progress at a glance</Text>
        </View>

        {/* CEFR Progress Card */}
        <View style={[pg.cefrCard, { backgroundColor: C.primaryD }]}>
          <View style={pg.cefrRow}>
            <View>
              <Text style={pg.cefrLabel}>Current Level</Text>
              <Text style={pg.cefrLevel}>{level}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={pg.cefrLabel}>Target</Text>
              <Text style={[pg.cefrNext, { color: C.accent }]}>{nextLevel}</Text>
            </View>
          </View>
          <View style={[pg.cefrTrack, { backgroundColor: 'rgba(255,255,255,.2)' }]}>
            <View style={[pg.cefrFill, { width: `${levelPct}%` as any, backgroundColor: C.accent }]} />
            <View style={[pg.cefrThumb, { left: `${levelPct}%` as any }]} />
          </View>
          <View style={pg.cefrFooter}>
            <Text style={pg.cefrFooterText}>{levelPct}% to {nextLevel}</Text>
            <Text style={pg.cefrFooterText}>{masteredWords.toLocaleString()} / {thisTarget.toLocaleString()} mastered words</Text>
          </View>
          {/* XP summary row */}
          <View style={pg.cefrXpRow}>
            <Icons.Zap size={13} color="rgba(255,255,255,.7)" />
            <Text style={pg.cefrXpText}>{(data?.total_xp ?? 0).toLocaleString()} total XP · {weekXPTotal} this week</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={pg.statsGrid}>
          {STATS.map((s, i) => (
            <View key={i} style={[pg.statCard, { backgroundColor: C.surface }]}>
              <View style={[pg.statIcon, { backgroundColor: s.bg }]}>{s.icon}</View>
              <Text style={[pg.statVal, { color: C.text }]}>{s.val}</Text>
              <Text style={[pg.statLbl, { color: C.text3 }]}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Activity Heatmap — last 30 days */}
        <View style={[pg.sectionCard, { backgroundColor: C.surface }]}>
          <View style={pg.sectionCardHeader}>
            <Text style={[pg.sectionCardTitle, { color: C.text }]}>Activity</Text>
            <Text style={[pg.sectionCardMeta, { color: C.text3 }]}>Last 30 days</Text>
          </View>
          <View style={pg.heatmapGrid}>
            {activity30d.map((day, i) => (
              <View
                key={i}
                style={[pg.heatCell, { backgroundColor: heatColor(day.count, isDark) }]}
              />
            ))}
          </View>
          <View style={pg.heatmapLegend}>
            <Text style={[pg.heatLegendText, { color: C.text3 }]}>Less</Text>
            {[0, 1, 3, 6].map(n => (
              <View key={n} style={[pg.heatCell, { backgroundColor: heatColor(n, isDark) }]} />
            ))}
            <Text style={[pg.heatLegendText, { color: C.text3 }]}>More</Text>
          </View>
        </View>

        {/* Weekly XP Chart */}
        <View style={[pg.sectionCard, { backgroundColor: C.surface }]}>
          <View style={pg.sectionCardHeader}>
            <Text style={[pg.sectionCardTitle, { color: C.text }]}>Weekly XP</Text>
            <Text style={[pg.sectionCardMeta, { color: C.text3 }]}>{weekXPTotal.toLocaleString()} this week</Text>
          </View>
          <View style={pg.chart}>
            {weeklyXP.map((d, i) => {
              const isToday = d.day_label === 'Today'
              return (
                <View key={i} style={pg.chartCol}>
                  {d.xp > 0 && (
                    <Text style={[pg.barXpLabel, { color: isToday ? C.accent : C.text3 }]}>{d.xp}</Text>
                  )}
                  <View style={pg.barWrap}>
                    <View style={[pg.bar, {
                      height: d.xp > 0 ? `${Math.round((d.xp / maxXP) * 100)}%` as any : 4,
                      backgroundColor: isToday ? C.accent : C.primary,
                      opacity: d.xp > 0 ? 1 : 0.18,
                    }]} />
                  </View>
                  <Text style={[pg.barLabel, { color: isToday ? C.text : C.text3, fontFamily: isToday ? Fonts.semibold : Fonts.regular }]}>
                    {d.day_label}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Skills */}
        <View style={[pg.sectionCard, { backgroundColor: C.surface }]}>
          <Text style={[pg.sectionCardTitle, { color: C.text, marginBottom: 16 }]}>Skills</Text>
          {SKILL_NAMES.map((name, i) => {
            const pct = skillPcts[i] ?? 0
            const color = i < SKILL_COLORS.length ? SKILL_COLORS[i]! : '#16A34A'
            return (
              <View key={i} style={{ marginBottom: i < SKILL_NAMES.length - 1 ? 14 : 0 }}>
                <View style={pg.skillRow}>
                  <View style={pg.skillNameRow}>
                    {SKILL_ICONS[i]}
                    <Text style={[pg.skillName, { color: C.text2 }]}>{name}</Text>
                  </View>
                  <Text style={[pg.skillPct, { color }]}>{pct > 0 ? `${pct}%` : '—'}</Text>
                </View>
                <View style={[pg.skillTrack, { backgroundColor: C.bgAlt }]}>
                  {pct > 0 && <View style={[pg.skillFill, { width: `${pct}%` as any, backgroundColor: color }]} />}
                </View>
              </View>
            )
          })}
        </View>

        {/* Weak areas */}
        {weakTopics.length > 0 && (
          <View style={[pg.sectionCard, { backgroundColor: C.surface }]}>
            <View style={pg.sectionCardHeader}>
              <Text style={[pg.sectionCardTitle, { color: C.text }]}>Focus Areas</Text>
              <View style={[pg.focusBadge, { backgroundColor: 'rgba(220,38,38,.1)' }]}>
                <Text style={[pg.focusBadgeText, { color: C.error }]}>Needs work</Text>
              </View>
            </View>
            {weakTopics.map((t, i) => (
              <View key={i} style={[pg.weakRow, i < weakTopics.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[pg.weakTopic, { color: C.text }]}>{t.topic}</Text>
                  <Text style={[pg.weakMeta, { color: C.text3 }]}>{t.sessions} session{t.sessions !== 1 ? 's' : ''} · avg {t.avg_pct}%</Text>
                </View>
                <View style={pg.weakBarWrap}>
                  <View style={[pg.weakBarTrack, { backgroundColor: C.bgAlt }]}>
                    <View style={[pg.weakBarFill, { width: `${t.avg_pct}%` as any, backgroundColor: t.avg_pct < 50 ? C.error : C.accentD }]} />
                  </View>
                  <Text style={[pg.weakPct, { color: t.avg_pct < 50 ? C.error : C.accentD }]}>{t.avg_pct}%</Text>
                </View>
              </View>
            ))}
            <Text style={[pg.weakHint, { color: C.text3 }]}>Practice these topics in Grammar to improve your score</Text>
          </View>
        )}

        {/* Writing level breakdown */}
        {writingStats.total > 0 && (
          <View style={[pg.sectionCard, { backgroundColor: C.surface }]}>
            <View style={pg.sectionCardHeader}>
              <Text style={[pg.sectionCardTitle, { color: C.text }]}>Writing Level</Text>
              <Text style={[pg.sectionCardMeta, { color: C.text3 }]}>{writingStats.total} sessions</Text>
            </View>
            <View style={pg.writingRow}>
              {[
                { label: 'Above',  pct: abovePct,  color: C.success,  count: writingStats.above_level },
                { label: 'At',     pct: atPct,     color: C.primary,  count: writingStats.at_level },
                { label: 'Below',  pct: belowPct,  color: C.error,    count: writingStats.below_level },
              ].map(({ label, pct, color, count }) => (
                <View key={label} style={pg.writingCol}>
                  <Text style={[pg.writingCount, { color }]}>{count}</Text>
                  <View style={[pg.writingBar, { backgroundColor: C.bgAlt }]}>
                    <View style={[pg.writingBarFill, { height: `${pct}%` as any, backgroundColor: color }]} />
                  </View>
                  <Text style={[pg.writingLabel, { color: C.text3 }]}>{label} level</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reading stats */}
        {readingStats.total_sessions > 0 && (
          <View style={[pg.sectionCard, { backgroundColor: C.surface }]}>
            <Text style={[pg.sectionCardTitle, { color: C.text, marginBottom: 14 }]}>Reading</Text>
            <View style={pg.readingRow}>
              {[
                { val: `${readingStats.total_sessions}`,       lbl: 'Sessions',   icon: <Icons.BookOpen size={18} color={C.primary} />,  bg: 'rgba(55,48,163,.1)' },
                { val: `${readingStats.total_minutes}m`,       lbl: 'Time read',  icon: <Icons.Clock size={18} color="#7C3AED" />,        bg: 'rgba(124,58,237,.1)' },
                { val: `${readingStats.total_words_looked_up}`, lbl: 'Looked up', icon: <Icons.Search size={18} color={C.accentD} />,    bg: 'rgba(245,158,11,.15)' },
              ].map((item, i) => (
                <View key={i} style={[pg.readingCard, { backgroundColor: C.bgAlt }]}>
                  <View style={[pg.statIcon, { backgroundColor: item.bg, marginBottom: 6 }]}>{item.icon}</View>
                  <Text style={[pg.statVal, { color: C.text, fontSize: 18 }]}>{item.val}</Text>
                  <Text style={[pg.statLbl, { color: C.text3 }]}>{item.lbl}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Achievements */}
        <View style={[pg.sectionCard, { backgroundColor: C.surface }]}>
          <Text style={[pg.sectionCardTitle, { color: C.text, marginBottom: 14 }]}>Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {BADGES.map((badge, i) => (
              <View key={i} style={[pg.badge, !badge.earned && { opacity: 0.4 }]}>
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

  // CEFR card
  cefrCard: { margin: 20, borderRadius: 20, padding: 20 },
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cefrLabel: { fontSize: 12, color: 'rgba(255,255,255,.6)', fontFamily: Fonts.regular },
  cefrLevel: { fontSize: 48, fontFamily: Fonts.bold, color: '#FFFFFF', lineHeight: 54 },
  cefrNext: { fontSize: 48, fontFamily: Fonts.bold, lineHeight: 54 },
  cefrTrack: { height: 6, borderRadius: 99, marginBottom: 10, overflow: 'hidden' },
  cefrFill: { height: 6, borderRadius: 99 },
  cefrThumb: { position: 'absolute', top: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', marginLeft: -8 },
  cefrFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cefrFooterText: { fontSize: 11, color: 'rgba(255,255,255,.6)', fontFamily: Fonts.regular },
  cefrXpRow: { flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)', paddingTop: 10 },
  cefrXpText: { fontSize: 12, color: 'rgba(255,255,255,.65)', fontFamily: Fonts.regular },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  statCard: { width: '47.5%', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal: { fontSize: 22, fontFamily: Fonts.bold },
  statLbl: { fontSize: 11, marginTop: 2, fontFamily: Fonts.regular },

  // Section cards
  sectionCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionCardTitle: { fontSize: 17, fontFamily: Fonts.semibold },
  sectionCardMeta: { fontSize: 13, fontFamily: Fonts.regular },

  // Heatmap
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
  heatCell: { width: 18, height: 18, borderRadius: 4 },
  heatmapLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  heatLegendText: { fontSize: 10, fontFamily: Fonts.regular },

  // XP chart
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 6 },
  chartCol: { flex: 1, alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' },
  barXpLabel: { fontSize: 9, fontFamily: Fonts.semibold, marginBottom: 2 },
  barWrap: { width: '100%', height: 80, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10 },

  // Skills
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  skillNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skillName: { fontSize: 13, fontFamily: Fonts.medium },
  skillPct: { fontSize: 13, fontFamily: Fonts.semibold },
  skillTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  skillFill: { height: 6, borderRadius: 99 },

  // Focus/weak areas
  focusBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  focusBadgeText: { fontSize: 11, fontFamily: Fonts.semibold },
  weakRow: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  weakTopic: { fontSize: 14, fontFamily: Fonts.medium, marginBottom: 2 },
  weakMeta: { fontSize: 11, fontFamily: Fonts.regular },
  weakBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weakBarTrack: { width: 80, height: 6, borderRadius: 99, overflow: 'hidden' },
  weakBarFill: { height: 6, borderRadius: 99 },
  weakPct: { fontSize: 12, fontFamily: Fonts.semibold, width: 32, textAlign: 'right' },
  weakHint: { fontSize: 11, fontFamily: Fonts.regular, marginTop: 4 },

  // Writing breakdown
  writingRow: { flexDirection: 'row', gap: 12, height: 120, alignItems: 'flex-end' },
  writingCol: { flex: 1, alignItems: 'center', gap: 4 },
  writingCount: { fontSize: 18, fontFamily: Fonts.bold },
  writingBar: { width: '100%', height: 60, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  writingBarFill: { width: '100%', borderRadius: 8 },
  writingLabel: { fontSize: 10, fontFamily: Fonts.regular, textAlign: 'center' },

  // Reading stats
  readingRow: { flexDirection: 'row', gap: 10 },
  readingCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },

  // Badges
  badge: { width: 72, alignItems: 'center', gap: 6 },
  badgeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 10, fontFamily: Fonts.medium, textAlign: 'center', lineHeight: 14 },
})
