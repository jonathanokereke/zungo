import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'

export function ProfileScreen() {
  const { colors: C, isDark, toggleTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const [dailyReminder, setDailyReminder] = useState(true)
  const [autoCorrect, setAutoCorrect] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  const toggleMap: Record<string, [boolean, (v: boolean) => void]> = {
    'Daily Reminder': [dailyReminder, setDailyReminder],
    'Auto-correct': [autoCorrect, setAutoCorrect],
    'Offline Mode': [offlineMode, setOfflineMode],
  }

  const sections = [
    {
      title: 'Learning',
      rows: [
        { icon: <Icons.Target size={16} color={C.primary} />, iconBg: 'rgba(55,48,163,.12)', label: 'CEFR Level', value: 'B1', chevron: true },
        { icon: <Icons.Clock size={16} color={C.accentD} />, iconBg: 'rgba(245,158,11,.15)', label: 'Daily Goal', value: '30 min', chevron: true },
        { icon: <Icons.Bell size={16} color={C.success} />, iconBg: 'rgba(22,163,74,.1)', label: 'Daily Reminder', toggle: true },
        { icon: <Icons.Download size={16} color="#7C3AED" />, iconBg: 'rgba(124,58,237,.1)', label: 'Offline Mode', toggle: true },
      ],
    },
    {
      title: 'AI Conversation',
      rows: [
        { icon: <Icons.Pencil size={16} color={C.primary} />, iconBg: 'rgba(55,48,163,.12)', label: 'Auto-correct', toggle: true },
        { icon: <Icons.MessageSquare size={16} color={C.accentD} />, iconBg: 'rgba(245,158,11,.15)', label: 'Difficulty Level', value: 'Intermediate', chevron: true },
        { icon: <Icons.Volume size={16} color={C.success} />, iconBg: 'rgba(22,163,74,.1)', label: 'Voice Speed', value: 'Normal', chevron: true },
      ],
    },
    {
      title: 'Account',
      rows: [
        { icon: <Icons.Settings size={16} color={C.text3} />, iconBg: C.bgAlt, label: 'Preferences', chevron: true },
        { icon: <Icons.User size={16} color={C.text3} />, iconBg: C.bgAlt, label: 'Edit Profile', chevron: true },
        { icon: <Icons.LogOut size={16} color={C.error} />, iconBg: 'rgba(220,38,38,.1)', label: 'Sign Out', danger: true },
      ],
    },
  ]

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: C.primaryD }]} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero */}
        <View style={[pf.hero, { backgroundColor: C.primaryD, paddingTop: insets.top + 28 }]}>
          <View style={pf.heroCircle1} />
          <View style={pf.heroCircle2} />
          <TouchableOpacity style={[pf.themeToggle, { top: insets.top + 10 }]} onPress={toggleTheme} activeOpacity={0.8}>
            {isDark
              ? <Icons.Sun size={16} color={C.accent} />
              : <Icons.Moon size={16} color="rgba(255,255,255,.85)" />}
          </TouchableOpacity>
          <View style={[pf.avatarWrap, { backgroundColor: C.accent }]}>
            <Text style={[pf.avatarText, { color: C.primaryD }]}>J</Text>
          </View>
          <Text style={pf.heroName}>Jonathan Okereke</Text>
          <Text style={pf.heroEmail}>jonathanokereke16@gmail.com</Text>
          <View style={pf.heroChips}>
            <View style={pf.heroChip}><Text style={pf.heroChipText}>🇩🇪 Learner</Text></View>
            <View style={pf.heroChip}><Text style={pf.heroChipText}>B1 Level</Text></View>
            <View style={pf.heroChip}><Text style={pf.heroChipText}>14 Day Streak 🔥</Text></View>
          </View>
        </View>

        {sections.map((section, si) => (
          <View key={si} style={{ marginBottom: 8 }}>
            <Text style={[pf.sectionLabel, { color: C.text3 }]}>{section.title}</Text>
            <View style={[pf.sectionCard, { backgroundColor: C.surface }]}>
              {section.rows.map((row, ri) => {
                const togglePair = row.toggle ? toggleMap[row.label] : undefined
                return (
                  <View key={ri}>
                    <TouchableOpacity style={pf.row} activeOpacity={row.toggle ? 1 : 0.7}>
                      <View style={[pf.rowIcon, { backgroundColor: row.iconBg }]}>{row.icon}</View>
                      <Text style={[pf.rowLabel, { color: row.danger ? C.error : C.text }]}>{row.label}</Text>
                      {row.value && <Text style={[pf.rowValue, { color: C.text3 }]}>{row.value}</Text>}
                      {row.chevron && <Icons.ChevronRight size={16} color={C.text3} />}
                      {row.toggle && togglePair && (
                        <Switch
                          value={togglePair[0]}
                          onValueChange={togglePair[1]}
                          trackColor={{ false: C.border, true: C.primary }}
                          thumbColor="#FFFFFF"
                        />
                      )}
                    </TouchableOpacity>
                    {ri < section.rows.length - 1 && <View style={[pf.divider, { backgroundColor: C.border }]} />}
                  </View>
                )
              })}
            </View>
          </View>
        ))}

        <Text style={[pf.version, { color: C.text3 }]}>Zungo v1.0.0 · Made with ♥ for German learners</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const pf = StyleSheet.create({
  hero: { paddingHorizontal: 28, paddingBottom: 32, alignItems: 'center', overflow: 'hidden', marginBottom: 8 },
  themeToggle: { position: 'absolute', right: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' },
  heroCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,.05)', right: -60, top: -60 },
  heroCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(245,158,11,.1)', left: -40, bottom: -60 },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,.3)' },
  avatarText: { fontSize: 28, fontFamily: Fonts.bold },
  heroName: { fontSize: 20, fontFamily: Fonts.bold, color: '#FFFFFF', marginBottom: 4 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,.65)', marginBottom: 12, fontFamily: Fonts.regular },
  heroChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  heroChip: { backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  heroChipText: { fontSize: 12, fontFamily: Fonts.medium, color: '#FFFFFF' },
  sectionLabel: { fontSize: 11, fontFamily: Fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionCard: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: Fonts.regular },
  rowValue: { fontSize: 14, fontFamily: Fonts.regular },
  divider: { height: 1, marginLeft: 60 },
  version: { textAlign: 'center', fontSize: 12, padding: 24, fontFamily: Fonts.regular },
})
