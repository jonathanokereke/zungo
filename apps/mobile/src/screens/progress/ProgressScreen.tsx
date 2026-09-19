import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'

const WEEKLY_XP = [
  { day: 'Mon', xp: 120 }, { day: 'Tue', xp: 180 }, { day: 'Wed', xp: 90 },
  { day: 'Thu', xp: 210 }, { day: 'Fri', xp: 150 }, { day: 'Sat', xp: 200 }, { day: 'Sun', xp: 75 },
]

const SKILL_NAMES = ['Vocabulary', 'Grammar', 'Listening', 'Speaking', 'Writing', 'Reading']
const SKILL_PCTS  = [78, 62, 55, 40, 70, 83]
const SKILL_COLORS = ['#3730A3', '#B45309', '#16A34A', '#7C3AED', '#6366F1', '#818CF8']

const maxXP = Math.max(...WEEKLY_XP.map(d => d.xp))

export function ProgressScreen() {
  const { colors: C } = useTheme()

  const BADGES = [
    { icon: <Icons.Flame size={20} color="#B45309" />, name: '14 Day Streak', earned: true },
    { icon: <Icons.BookOpen size={20} color="#3730A3" />, name: '500 Words', earned: true },
    { icon: <Icons.Star size={20} color="#B45309" />, name: 'B1 Achieved', earned: true },
    { icon: <Icons.Zap size={20} color="#7C3AED" />, name: 'Speed Learner', earned: false },
    { icon: <Icons.Trophy size={20} color="#B45309" />, name: 'Top Student', earned: false },
  ]

  const STATS = [
    { icon: <Icons.BookOpen size={18} color={C.primary} />, val: '1,284', lbl: 'Words learned', bg: 'rgba(55,48,163,.1)' },
    { icon: <Icons.Flame size={18} color={C.accentD} />, val: '14', lbl: 'Day streak', bg: 'rgba(245,158,11,.15)' },
    { icon: <Icons.Target size={18} color={C.success} />, val: '87%', lbl: 'Retention', bg: 'rgba(22,163,74,.1)' },
    { icon: <Icons.Clock size={18} color="#7C3AED" />, val: '48h', lbl: 'Study time', bg: 'rgba(124,58,237,.1)' },
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
              <Text style={pg.cefrLevel}>B1</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={pg.cefrLabel}>Next Level</Text>
              <Text style={[pg.cefrNext, { color: C.accent }]}>B2</Text>
            </View>
          </View>
          <View style={pg.cefrTrack}>
            <View style={[pg.cefrFill, { backgroundColor: C.accent }]} />
            <View style={pg.cefrThumb} />
          </View>
          <View style={pg.cefrFooter}>
            <Text style={pg.cefrFooterText}>62% to B2</Text>
            <Text style={pg.cefrFooterText}>Est. 3 months at current pace</Text>
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
            <Text style={[pg.sectionCardMeta, { color: C.text3 }]}>1,025 this week</Text>
          </View>
          <View style={pg.chart}>
            {WEEKLY_XP.map((d, i) => (
              <View key={i} style={pg.chartCol}>
                <View style={pg.barWrap}>
                  <View style={[pg.bar, { height: `${(d.xp / maxXP) * 100}%` as any, backgroundColor: i === 3 ? C.accent : C.primary, opacity: i === 3 ? 1 : 0.6 }]} />
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
                <Text style={[pg.skillPct, { color: SKILL_COLORS[i] }]}>{SKILL_PCTS[i]}%</Text>
              </View>
              <View style={[pg.skillTrack, { backgroundColor: C.bgAlt }]}>
                <View style={[pg.skillFill, { width: `${SKILL_PCTS[i]}%` as any, backgroundColor: SKILL_COLORS[i] }]} />
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
  cefrFill: { width: '62%', height: 6, borderRadius: 99 },
  cefrThumb: { position: 'absolute', left: '62%', top: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', marginLeft: -8 },
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
