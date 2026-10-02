import { useEffect, useState } from 'react'
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import { requestPermissionsAndScheduleReminder } from '../../lib/notifications'

interface ProgressData { total_words: number; user: { level: string; streak: number } }
interface Prefs { onboarding_complete?: boolean; daily_goal_minutes?: number; reminder_hour?: number; reminder_minute?: number; auto_correct?: boolean; offline_mode?: boolean }
interface UserMe { name: string; preferred_name: string; email: string; preferences_json?: Prefs | null }

export function ProfileScreen() {
  const { getAccessToken, logout, user: authUser } = useAuth()
  const { colors: C, isDark, toggleTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const [profileData, setProfileData] = useState<ProgressData | null>(null)
  const [serverUser, setServerUser] = useState<UserMe | null>(null)
  const [userPrefs, setUserPrefs] = useState<Prefs>({})
  const [dailyReminder, setDailyReminder] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // Edit profile modal state
  const [editVisible, setEditVisible] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // CEFR level picker
  const [levelPickerVisible, setLevelPickerVisible] = useState(false)
  // Daily goal picker
  const [goalPickerVisible, setGoalPickerVisible] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessToken()
        const [d, me] = await Promise.all([
          apiFetch<ProgressData>('/api/progress', {}, token),
          apiFetch<UserMe>('/api/users/me', {}, token),
        ])
        setProfileData(d)
        setServerUser(me)
        if (me.preferences_json) setUserPrefs(me.preferences_json)
      } catch (e: any) {
        console.warn('ProfileScreen load error:', e?.message ?? e)
        setLoadError(true)
      }
    }
    load()
  }, [])

  function openEditProfile() {
    setEditName(serverUser?.preferred_name || serverUser?.name || '')
    setEditEmail(serverUser?.email || '')
    setEditError(null)
    setEditVisible(true)
  }

  async function saveProfile() {
    const trimmedName = editName.trim()
    const trimmedEmail = editEmail.trim()
    if (!trimmedName) { setEditError('Name is required'); return }
    setEditSaving(true)
    setEditError(null)
    try {
      const token = await getAccessToken()
      const updated = await apiFetch<UserMe>('/api/users/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({ preferred_name: trimmedName, email: trimmedEmail || undefined }),
      }, token)
      setServerUser(prev => prev ? { ...prev, ...updated } : prev)
      setEditVisible(false)
    } catch (e: any) {
      setEditError(e?.message ?? 'Failed to save')
    } finally {
      setEditSaving(false)
    }
  }

  async function savePrefs(updates: Partial<Prefs>) {
    try {
      const token = await getAccessToken()
      const merged = { ...userPrefs, ...updates }
      await apiFetch('/api/users/preferences', { method: 'PATCH', body: JSON.stringify(merged) }, token)
      setUserPrefs(merged)
      if (updates.reminder_hour !== undefined || updates.reminder_minute !== undefined) {
        await requestPermissionsAndScheduleReminder(
          updates.reminder_hour ?? userPrefs.reminder_hour ?? 19,
          updates.reminder_minute ?? userPrefs.reminder_minute ?? 0,
        )
      }
    } catch {}
  }

  const [autoCorrect, setAutoCorrect] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  // Sync toggle state from loaded prefs
  useEffect(() => {
    setAutoCorrect(userPrefs.auto_correct !== false)
    setOfflineMode(userPrefs.offline_mode === true)
  }, [userPrefs.auto_correct, userPrefs.offline_mode])

  const reminderTime = (() => {
    const h = userPrefs.reminder_hour ?? 19
    const m = userPrefs.reminder_minute ?? 0
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })()

  const toggleMap: Record<string, [boolean, (v: boolean) => void]> = {
    'Daily Reminder': [dailyReminder, (v) => {
      setDailyReminder(v)
      if (v) {
        const h = userPrefs.reminder_hour ?? 19
        const m = userPrefs.reminder_minute ?? 0
        requestPermissionsAndScheduleReminder(h, m).catch(() => {})
        savePrefs({})
      }
    }],
    'Auto-correct': [autoCorrect, (v) => {
      setAutoCorrect(v)
      savePrefs({ auto_correct: v })
    }],
    'Offline Mode': [offlineMode, (v) => {
      setOfflineMode(v)
      savePrefs({ offline_mode: v })
    }],
  }

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const DAILY_GOALS = [5, 10, 15, 20, 30, 45, 60]

  async function saveCefrLevel(newLevel: string) {
    try {
      const token = await getAccessToken()
      await apiFetch('/api/users/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ ...userPrefs, cefr_level: newLevel }),
      }, token)
      setProfileData(prev => prev ? { ...prev, user: { ...prev.user, level: newLevel } } : prev)
    } catch {
      Alert.alert('Error', 'Could not update level.')
    }
  }

  async function saveDailyGoal(minutes: number) {
    await savePrefs({ daily_goal_minutes: minutes })
  }

  const level = profileData?.user.level ?? '…'
  const streak = profileData?.user.streak ?? 0

  const sections = [
    {
      title: 'Learning',
      rows: [
        { icon: <Icons.Target size={16} color={C.primary} />, iconBg: 'rgba(55,48,163,.12)', label: 'CEFR Level', value: level, chevron: true, onPress: () => setLevelPickerVisible(true) },
        { icon: <Icons.Clock size={16} color={C.accentD} />, iconBg: 'rgba(245,158,11,.15)', label: 'Daily Goal', value: `${userPrefs.daily_goal_minutes ?? 30} min`, chevron: true, onPress: () => setGoalPickerVisible(true) },
        { icon: <Icons.Bell size={16} color={C.success} />, iconBg: 'rgba(22,163,74,.1)', label: 'Daily Reminder', toggle: true, value: dailyReminder ? reminderTime : undefined },
      ],
    },
    {
      title: 'Account',
      rows: [
        { icon: <Icons.User size={16} color={C.primary} />, iconBg: 'rgba(55,48,163,.12)', label: 'Edit Profile', chevron: true, onPress: openEditProfile },
        { icon: <Icons.LogOut size={16} color={C.error} />, iconBg: 'rgba(220,38,38,.1)', label: 'Sign Out', danger: true, onPress: logout },
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
            <Text style={[pf.avatarText, { color: C.primaryD }]}>{(serverUser?.preferred_name || serverUser?.name || authUser?.name || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={pf.heroName}>{serverUser?.preferred_name || serverUser?.name || authUser?.name || 'Learner'}</Text>
          <Text style={pf.heroEmail}>{serverUser?.email || authUser?.email || '—'}</Text>
          <View style={pf.heroChips}>
            <View style={pf.heroChip}><Text style={pf.heroChipText}>🇩🇪 Learner</Text></View>
            <View style={pf.heroChip}><Text style={pf.heroChipText}>{level} Level</Text></View>
            {streak > 0 && <View style={pf.heroChip}><Text style={pf.heroChipText}>{streak} Day Streak 🔥</Text></View>}
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
                    <TouchableOpacity style={pf.row} activeOpacity={row.toggle ? 1 : 0.7} onPress={(row as any).onPress}>
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

      {/* CEFR Level Picker */}
      <Modal visible={levelPickerVisible} transparent animationType="slide" onRequestClose={() => setLevelPickerVisible(false)}>
        <TouchableOpacity style={pf.modalOverlay} activeOpacity={1} onPress={() => setLevelPickerVisible(false)}>
          <View style={[pf.sheet, { backgroundColor: C.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[pf.sheetHandle, { backgroundColor: C.border }]} />
            <Text style={[pf.sheetTitle, { color: C.text }]}>CEFR Level</Text>
            <Text style={[{ color: C.text3, fontSize: 13, fontFamily: Fonts.regular, marginBottom: 16 }]}>Select your current German level</Text>
            {CEFR_LEVELS.map(l => (
              <TouchableOpacity
                key={l}
                style={[pf.pickerRow, { borderColor: level === l ? C.primary : C.border, backgroundColor: level === l ? 'rgba(55,48,163,.07)' : C.bg }]}
                onPress={() => { saveCefrLevel(l); setLevelPickerVisible(false) }}
              >
                <Text style={[pf.pickerRowText, { color: level === l ? C.primary : C.text, fontFamily: level === l ? Fonts.semibold : Fonts.regular }]}>{l}</Text>
                {level === l && <Icons.CheckCircle size={18} color={C.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Daily Goal Picker */}
      <Modal visible={goalPickerVisible} transparent animationType="slide" onRequestClose={() => setGoalPickerVisible(false)}>
        <TouchableOpacity style={pf.modalOverlay} activeOpacity={1} onPress={() => setGoalPickerVisible(false)}>
          <View style={[pf.sheet, { backgroundColor: C.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[pf.sheetHandle, { backgroundColor: C.border }]} />
            <Text style={[pf.sheetTitle, { color: C.text }]}>Daily Goal</Text>
            <Text style={[{ color: C.text3, fontSize: 13, fontFamily: Fonts.regular, marginBottom: 16 }]}>How many minutes do you want to study each day?</Text>
            {DAILY_GOALS.map(mins => (
              <TouchableOpacity
                key={mins}
                style={[pf.pickerRow, { borderColor: (userPrefs.daily_goal_minutes ?? 30) === mins ? C.primary : C.border, backgroundColor: (userPrefs.daily_goal_minutes ?? 30) === mins ? 'rgba(55,48,163,.07)' : C.bg }]}
                onPress={() => { saveDailyGoal(mins); setGoalPickerVisible(false) }}
              >
                <Text style={[pf.pickerRowText, { color: (userPrefs.daily_goal_minutes ?? 30) === mins ? C.primary : C.text, fontFamily: (userPrefs.daily_goal_minutes ?? 30) === mins ? Fonts.semibold : Fonts.regular }]}>{mins} minutes</Text>
                {(userPrefs.daily_goal_minutes ?? 30) === mins && <Icons.CheckCircle size={18} color={C.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <TouchableOpacity style={pf.modalOverlay} activeOpacity={1} onPress={() => setEditVisible(false)}>
          <View style={[pf.sheet, { backgroundColor: C.surface }]} onStartShouldSetResponder={() => true}>
            <View style={[pf.sheetHandle, { backgroundColor: C.border }]} />
            <Text style={[pf.sheetTitle, { color: C.text }]}>Edit Profile</Text>

            <Text style={[pf.fieldLabel, { color: C.text3 }]}>Display name</Text>
            <TextInput
              style={[pf.fieldInput, { color: C.text, borderColor: C.border, backgroundColor: C.bg }]}
              value={editName}
              onChangeText={v => { setEditName(v); setEditError(null) }}
              placeholder="Your name"
              placeholderTextColor={C.text3}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={[pf.fieldLabel, { color: C.text3 }]}>Email</Text>
            <TextInput
              style={[pf.fieldInput, { color: C.text, borderColor: C.border, backgroundColor: C.bg }]}
              value={editEmail}
              onChangeText={v => { setEditEmail(v); setEditError(null) }}
              placeholder="your@email.com"
              placeholderTextColor={C.text3}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={saveProfile}
            />

            {editError && <Text style={[pf.fieldError, { color: C.error }]}>{editError}</Text>}

            <TouchableOpacity
              style={[pf.sheetSaveBtn, { backgroundColor: C.primary, opacity: editSaving ? 0.6 : 1 }]}
              onPress={saveProfile}
              disabled={editSaving}
            >
              <Text style={pf.sheetSaveBtnText}>{editSaving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  // Edit profile modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: Fonts.bold, marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontFamily: Fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  fieldInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: Fonts.regular, marginBottom: 16 },
  fieldError: { fontSize: 13, fontFamily: Fonts.regular, marginBottom: 12 },
  sheetSaveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  sheetSaveBtnText: { fontSize: 16, fontFamily: Fonts.bold, color: '#FFFFFF' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8 },
  pickerRowText: { fontSize: 16 },
})
