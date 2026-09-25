import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiFetch, API_BASE } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import type { RootStackParamList } from '../../navigation/RootNavigator'
import { useNetwork } from '../../lib/NetworkContext'
import { OfflineNotice } from '../../components/OfflineNotice'

interface Prompt { prompt: string; level: string }
interface Correction { original: string; corrected: string; explanation: string; rule: string }
interface Feedback {
  corrected_text: string
  corrections: Correction[]
  overall_feedback: string
  level_assessment: 'below_level' | 'at_level' | 'above_level'
}
interface HistorySession {
  id: string
  prompt: string
  user_text: string
  feedback_json: Feedback | null
  level: string
  created_at: string
}

const MIN_CHARS = 50

const LEVEL_BADGE = {
  above_level: { label: 'Above Level', bg: 'rgba(22,163,74,.12)', color: '#16A34A' },
  at_level:    { label: 'At Level',    bg: 'rgba(55,48,163,.12)', color: '#3730A3' },
  below_level: { label: 'Below Level', bg: 'rgba(245,158,11,.15)', color: '#B45309' },
} as const

export function WriteScreen() {
  const { colors: C } = useTheme()
  const { isOnline } = useNetwork()
  const { getAccessToken } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const scrollRef = useRef<ScrollView>(null)

  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [promptLoading, setPromptLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [history, setHistory] = useState<HistorySession[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function loadHistory() {
    try {
      const token = await getAccessToken()
      const data = await apiFetch<HistorySession[]>('/api/writing/sessions', {}, token)
      setHistory(data)
    } catch {}
  }

  async function loadPrompt() {
    setPromptLoading(true)
    setFeedback(null)
    setText('')
    setError(null)
    try {
      const token = await getAccessToken()
      const p = await apiFetch<Prompt>('/api/writing/prompt', {}, token)
      setPrompt(p)
    } catch {
      setPrompt({ prompt: 'Beschreibe deinen typischen Morgen. Was machst du als erstes?', level: 'B1' })
    } finally { setPromptLoading(false) }
  }

  useEffect(() => { loadPrompt(); loadHistory() }, [])

  async function submit() {
    if (text.length < MIN_CHARS) { setError(`Please write at least ${MIN_CHARS} characters.`); return }
    setError(null)
    setSubmitting(true)
    setFeedback(null)

    try {
      const token = await getAccessToken()
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE}/api/writing/correct`)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)

        let processed = 0
        let buffer = ''

        function parseChunks(raw: string) {
          for (const line of raw.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') return
            try {
              const parsed = JSON.parse(data) as { chunk?: string; error?: string }
              if (parsed.error) throw new Error(parsed.error)
              if (parsed.chunk) buffer += parsed.chunk
            } catch {}
          }
        }

        xhr.onprogress = () => {
          const newData = xhr.responseText.slice(processed)
          processed = xhr.responseText.length
          parseChunks(newData)
        }

        xhr.onload = () => {
          const newData = xhr.responseText.slice(processed)
          if (newData) parseChunks(newData)
          try {
            const clean = buffer.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
            const parsed = JSON.parse(clean) as Feedback
            setFeedback(parsed)
            setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 200)
            resolve()
          } catch {
            reject(new Error('Invalid feedback format from AI'))
          }
        }

        xhr.onerror = () => reject(new Error('Network error'))

        xhr.send(JSON.stringify({ prompt: prompt?.prompt ?? '', user_text: text }))
      })
    } catch (e: any) {
      setError(e?.message ?? 'Could not get feedback. Please try again.')
    } finally { setSubmitting(false) }
  }


  return (
    <SafeAreaView style={[wr.container, { backgroundColor: C.bg }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={wr.header}>
            <View>
              <Text style={[wr.title, { color: C.text }]}>Schreiben</Text>
              <Text style={[wr.subtitle, { color: C.text2 }]}>AI-powered German writing practice</Text>
            </View>
            <TouchableOpacity
              style={[wr.chatBtn, { backgroundColor: C.bgAlt, borderColor: C.border }]}
              onPress={() => navigation.navigate('Chat')}
            >
              <Icons.MessageSquare size={14} color={C.primary} />
              <Text style={[wr.chatBtnText, { color: C.primary }]}>Chat</Text>
            </TouchableOpacity>
          </View>

          {!isOnline && <OfflineNotice message="AI writing correction requires an internet connection." />}

          {/* Prompt card */}
          {promptLoading ? (
            <View style={[wr.promptCard, { backgroundColor: 'rgba(245,158,11,.06)', borderColor: 'rgba(245,158,11,.25)' }]}>
              <ActivityIndicator size="small" color={C.accentD} />
            </View>
          ) : prompt ? (
            <View style={[wr.promptCard, { backgroundColor: 'rgba(245,158,11,.06)', borderColor: 'rgba(245,158,11,.25)' }]}>
              <View style={wr.promptHeader}>
                <Icons.Star size={12} color={C.accentD} />
                <Text style={[wr.promptLabel, { color: C.accentD }]}>Today's Prompt</Text>
                <View style={[wr.levelChip, { backgroundColor: 'rgba(245,158,11,.2)' }]}>
                  <Text style={[wr.levelChipText, { color: C.accentD }]}>{prompt.level}</Text>
                </View>
                <TouchableOpacity onPress={loadPrompt} style={wr.refreshBtn}>
                  <Icons.Refresh size={14} color={C.text3} />
                </TouchableOpacity>
              </View>
              <Text style={[wr.promptText, { color: C.text }]}>{prompt.prompt}</Text>
            </View>
          ) : null}

          {/* Text input */}
          {!feedback && (
            <>
              <View style={[wr.inputCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <TextInput
                  style={[wr.input, { color: C.text }]}
                  multiline
                  value={text}
                  onChangeText={t => { setText(t); setError(null) }}
                  placeholder="Schreiben Sie auf Deutsch… (min. 50 Zeichen)"
                  placeholderTextColor={C.text3}
                  editable={!submitting}
                  textAlignVertical="top"
                />
                <View style={[wr.inputFooter, { borderTopColor: C.border }]}>
                  <Text style={[wr.charCount, { color: text.length >= MIN_CHARS ? C.primary : C.text3 }]}>
                    {text.length} / {MIN_CHARS} min
                  </Text>
                  {error && <Text style={[wr.errorText, { color: C.error }]}>{error}</Text>}
                </View>
              </View>

              <TouchableOpacity
                style={[wr.submitBtn, { backgroundColor: C.primary, opacity: text.length >= MIN_CHARS && !submitting ? 1 : 0.4 }]}
                onPress={submit}
                disabled={text.length < MIN_CHARS || submitting}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={wr.submitBtnText}>Correcting…</Text>
                  </>
                ) : (
                  <>
                    <Icons.Zap size={16} color="#FFFFFF" />
                    <Text style={wr.submitBtnText}>Get AI Correction</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Feedback results */}
          {feedback && (
            <View style={{ gap: 16 }}>
              {/* Overall feedback */}
              <View style={[wr.card, { backgroundColor: C.surface }]}>
                <View style={wr.cardHeader}>
                  <Text style={[wr.cardTitle, { color: C.text }]}>Feedback</Text>
                  {(() => {
                    const badge = LEVEL_BADGE[feedback.level_assessment]
                    return (
                      <View style={[wr.levelBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[wr.levelBadgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    )
                  })()}
                </View>
                <Text style={[wr.cardBody, { color: C.text2 }]}>{feedback.overall_feedback}</Text>
              </View>

              {/* Corrections */}
              {feedback.corrections.length > 0 && (
                <View>
                  <Text style={[wr.sectionTitle, { color: C.text }]}>
                    Corrections ({feedback.corrections.length})
                  </Text>
                  <View style={{ gap: 10 }}>
                    {feedback.corrections.map((c, i) => (
                      <View key={i} style={[wr.correctionCard, { backgroundColor: C.surface }]}>
                        <View style={wr.correctionRow}>
                          <Text style={[wr.correctionOriginal, { color: C.error }]}>{c.original}</Text>
                          <Icons.ChevronRight size={14} color={C.text3} />
                          <Text style={[wr.correctionFixed, { color: C.success }]}>{c.corrected}</Text>
                        </View>
                        <Text style={[wr.correctionExplain, { color: C.text2 }]}>{c.explanation}</Text>
                        {c.rule ? (
                          <Text style={[wr.correctionRule, { color: C.text3 }]}>Rule: {c.rule}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Corrected text */}
              <View>
                <Text style={[wr.sectionTitle, { color: C.text }]}>Corrected Text</Text>
                <View style={[wr.correctedTextCard, { backgroundColor: 'rgba(55,48,163,.05)', borderColor: 'rgba(55,48,163,.2)' }]}>
                  <Text style={[wr.correctedText, { color: C.text }]}>{feedback.corrected_text}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={wr.actionsRow}>
                <TouchableOpacity
                  style={[wr.actionBtn, { backgroundColor: C.bgAlt, borderColor: C.border }]}
                  onPress={() => { setFeedback(null); setText(''); setError(null) }}
                >
                  <Icons.Pencil size={14} color={C.text2} />
                  <Text style={[wr.actionBtnText, { color: C.text2 }]}>Revise</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[wr.actionBtn, { backgroundColor: C.primary }]}
                  onPress={loadPrompt}
                >
                  <Icons.Refresh size={14} color="#FFFFFF" />
                  <Text style={[wr.actionBtnText, { color: '#FFFFFF' }]}>New Prompt</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {/* Past Sessions */}
          {history.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <TouchableOpacity
                style={wr.historyToggle}
                onPress={() => setHistoryOpen(v => !v)}
              >
                <Icons.Clock size={15} color={C.text2} />
                <Text style={[wr.historyToggleText, { color: C.text2 }]}>
                  Past Sessions ({history.length})
                </Text>
                <View style={{ marginLeft: 'auto' as any }}>
                  {historyOpen
                    ? <Icons.ChevronLeft size={14} color={C.text3} />
                    : <Icons.ChevronRight size={14} color={C.text3} />}
                </View>
              </TouchableOpacity>

              {historyOpen && (
                <View style={{ gap: 12, marginTop: 10 }}>
                  {history.map(s => {
                    const expanded = expandedId === s.id
                    const fb = s.feedback_json
                    const badge = fb ? LEVEL_BADGE[fb.level_assessment] : null
                    const date = new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[wr.historyCard, { backgroundColor: C.surface, borderColor: C.border }]}
                        onPress={() => setExpandedId(expanded ? null : s.id)}
                        activeOpacity={0.8}
                      >
                        <View style={wr.historyCardHeader}>
                          <Text style={[wr.historyPrompt, { color: C.text }]} numberOfLines={expanded ? undefined : 2}>
                            {s.prompt}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <Text style={[wr.historyDate, { color: C.text3 }]}>{date}</Text>
                            {badge && (
                              <View style={[wr.levelBadge, { backgroundColor: badge.bg }]}>
                                <Text style={[wr.levelBadgeText, { color: badge.color }]}>{badge.label}</Text>
                              </View>
                            )}
                            {fb && (
                              <Text style={[wr.historyDate, { color: C.text3 }]}>
                                {fb.corrections.length} correction{fb.corrections.length !== 1 ? 's' : ''}
                              </Text>
                            )}
                          </View>
                        </View>

                        {expanded && fb && (
                          <View style={{ marginTop: 12, gap: 10 }}>
                            <Text style={[wr.cardBody, { color: C.text2 }]}>{fb.overall_feedback}</Text>
                            {fb.corrections.slice(0, 3).map((c, i) => (
                              <View key={i} style={[wr.correctionCard, { backgroundColor: C.bgAlt }]}>
                                <View style={wr.correctionRow}>
                                  <Text style={[wr.correctionOriginal, { color: C.error }]}>{c.original}</Text>
                                  <Icons.ChevronRight size={12} color={C.text3} />
                                  <Text style={[wr.correctionFixed, { color: C.success }]}>{c.corrected}</Text>
                                </View>
                                <Text style={[wr.correctionExplain, { color: C.text2 }]}>{c.explanation}</Text>
                              </View>
                            ))}
                            {fb.corrections.length > 3 && (
                              <Text style={[wr.historyDate, { color: C.text3 }]}>
                                +{fb.corrections.length - 3} more correction{fb.corrections.length - 3 !== 1 ? 's' : ''}
                              </Text>
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const wr = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 28, fontFamily: Fonts.bold },
  subtitle: { fontSize: 13, marginTop: 2, fontFamily: Fonts.regular },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 7 },
  chatBtnText: { fontSize: 13, fontFamily: Fonts.semibold },
  promptCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16, minHeight: 80, justifyContent: 'center' },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  promptLabel: { fontSize: 11, fontFamily: Fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  levelChip: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  levelChipText: { fontSize: 11, fontFamily: Fonts.semibold },
  refreshBtn: { marginLeft: 'auto' as any },
  promptText: { fontSize: 15, fontFamily: Fonts.medium, lineHeight: 22 },
  inputCard: { borderWidth: 1.5, borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  input: { padding: 16, fontSize: 15, fontFamily: Fonts.regular, minHeight: 160, lineHeight: 24 },
  inputFooter: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { fontSize: 12, fontFamily: Fonts.medium },
  errorText: { fontSize: 12, fontFamily: Fonts.regular },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16 },
  submitBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 16 },
  card: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 17, fontFamily: Fonts.semibold },
  cardBody: { fontSize: 14, lineHeight: 22, fontFamily: Fonts.regular },
  levelBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  levelBadgeText: { fontSize: 12, fontFamily: Fonts.semibold },
  sectionTitle: { fontSize: 17, fontFamily: Fonts.semibold, marginBottom: 10 },
  correctionCard: { borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  correctionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  correctionOriginal: { fontSize: 14, fontFamily: Fonts.semibold, textDecorationLine: 'line-through' },
  correctionFixed: { fontSize: 14, fontFamily: Fonts.semibold },
  correctionExplain: { fontSize: 13, lineHeight: 20, fontFamily: Fonts.regular },
  correctionRule: { fontSize: 11, fontFamily: Fonts.regular, marginTop: 4 },
  correctedTextCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
  correctedText: { fontSize: 14, lineHeight: 24, fontFamily: Fonts.regular },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, paddingVertical: 14, borderWidth: 1.5 },
  actionBtnText: { fontSize: 14, fontFamily: Fonts.semibold },
  historyToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  historyToggleText: { fontSize: 15, fontFamily: Fonts.semibold },
  historyCard: { borderRadius: 14, padding: 14, borderWidth: 1 },
  historyCardHeader: {},
  historyPrompt: { fontSize: 14, fontFamily: Fonts.medium, lineHeight: 20 },
  historyDate: { fontSize: 12, fontFamily: Fonts.regular },
})
