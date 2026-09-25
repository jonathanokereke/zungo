import { useEffect, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../lib/ThemeContext'
import { Fonts } from '../../lib/theme'
import { Icons } from '../../lib/icons'
import { API_BASE, apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { useNetwork } from '../../lib/NetworkContext'
import { OfflineNotice } from '../../components/OfflineNotice'

const SCENARIOS = [
  { label: 'Beim Bäcker',          emoji: '🥖', category: 'Daily Life' },
  { label: 'Beim Arzt',            emoji: '🏥', category: 'Daily Life' },
  { label: 'Am Bahnhof',           emoji: '🚆', category: 'Travel' },
  { label: 'Vorstellungsgespräch', emoji: '💼', category: 'Work' },
  { label: 'Smalltalk',            emoji: '🤝', category: 'Social' },
  { label: 'Im Restaurant',        emoji: '🍽️', category: 'Daily Life' },
  { label: 'Beim Einkaufen',       emoji: '🛒', category: 'Daily Life' },
  { label: 'Im Hotel',             emoji: '🏨', category: 'Travel' },
  { label: 'Am Flughafen',         emoji: '✈️', category: 'Travel' },
  { label: 'Auf der Bank',         emoji: '🏦', category: 'Daily Life' },
  { label: 'Beim Friseur',         emoji: '✂️', category: 'Daily Life' },
  { label: 'Im Fitnessstudio',     emoji: '💪', category: 'Social' },
  { label: 'Wohnungssuche',        emoji: '🏠', category: 'Work' },
  { label: 'Telefonat',            emoji: '📞', category: 'Work' },
  { label: 'Beim Nachbarn',        emoji: '🏘️', category: 'Social' },
  { label: 'An der Uni',           emoji: '🎓', category: 'Work' },
  { label: 'Im Supermarkt',        emoji: '🧺', category: 'Daily Life' },
  { label: 'Beim Zahnarzt',        emoji: '🦷', category: 'Daily Life' },
  { label: 'Am Amt',               emoji: '📋', category: 'Daily Life' },
  { label: 'Café-Gespräch',        emoji: '☕', category: 'Social' },
]

interface Correction { original: string; corrected: string; explanation: string }
interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  time: string
  corrections?: Correction[]
}

function now() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function parseCorrections(text: string): { clean: string; corrections: Correction[] } {
  const corrections: Correction[] = []
  const corrRegex = /\[Correction:\s*"([^"]+)"\s*→\s*"([^"]+)"\s*[—–-]\s*([^\]]+)\]/gi
  let clean = text
  let match
  while ((match = corrRegex.exec(text)) !== null) {
    corrections.push({ original: match[1]!, corrected: match[2]!, explanation: match[3]!.trim() })
    clean = clean.replace(match[0], '')
  }
  return { clean: clean.trim(), corrections }
}

export function ChatScreen() {
  const { colors: C } = useTheme()
  const { isOnline } = useNetwork()
  const { getAccessToken } = useAuth()
  const [activeScenario, setActiveScenario] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [userLevel, setUserLevel] = useState('B1')
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const flatRef = useRef<FlatList>(null)
  const conversationRef = useRef<{ role: 'user' | 'assistant'; text: string }[]>([])

  useEffect(() => {
    loadOpening(0)
    getAccessToken().then(token =>
      apiFetch<{ user: { level: string } }>('/api/progress', {}, token)
    ).then(d => setUserLevel(d.user.level)).catch(() => {})
  }, [])

  async function loadOpening(scenarioIdx: number) {
    setMessages([])
    conversationRef.current = []
    setTyping(true)
    try {
      const token = await getAccessToken()
      const scenario = SCENARIOS[scenarioIdx]!.label
      const resp = await apiFetch<{ text: string }>(`/api/chat/opening?scenario=${encodeURIComponent(scenario)}`, {}, token)
      const openingMsg: Message = { id: Date.now().toString(), role: 'assistant', text: resp.text, time: now() }
      setMessages([openingMsg])
      conversationRef.current = [{ role: 'assistant', text: resp.text }]
    } catch {
      const fallback: Message = { id: Date.now().toString(), role: 'assistant', text: 'Guten Tag! Wie kann ich Ihnen helfen?', time: now() }
      setMessages([fallback])
      conversationRef.current = [{ role: 'assistant', text: fallback.text }]
    } finally { setTyping(false) }
  }

  function switchScenario(idx: number) {
    setActiveScenario(idx)
    loadOpening(idx)
  }

  async function send(text?: string) {
    const txt = (text ?? input).trim()
    if (!txt || typing) return
    setInput('')

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: txt, time: now() }
    setMessages(prev => [...prev, userMsg])
    conversationRef.current = [...conversationRef.current, { role: 'user', text: txt }]
    setTyping(true)

    const botId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: botId, role: 'assistant', text: '', time: now() }])
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const token = await getAccessToken()
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE}/api/chat`)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)

        let processed = 0
        let accumulated = ''

        function parseChunks(raw: string) {
          for (const line of raw.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') return
            try {
              const parsed = JSON.parse(data) as { chunk?: string; error?: string }
              if (parsed.error) throw new Error(parsed.error)
              if (parsed.chunk) {
                accumulated += parsed.chunk
                const { clean } = parseCorrections(accumulated)
                setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: clean } : m))
                setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 0)
              }
            } catch {}
          }
        }

        xhr.onprogress = () => {
          const newData = xhr.responseText.slice(processed)
          processed = xhr.responseText.length
          parseChunks(newData)
        }

        xhr.onload = () => {
          // final parse in case onprogress missed trailing data
          const newData = xhr.responseText.slice(processed)
          if (newData) parseChunks(newData)
          const { clean, corrections } = parseCorrections(accumulated)
          setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: clean, corrections } : m))
          conversationRef.current = [...conversationRef.current, { role: 'assistant', text: clean }]
          resolve()
        }

        xhr.onerror = () => reject(new Error('Network error'))

        xhr.send(JSON.stringify({
          messages: conversationRef.current,
          scenario: SCENARIOS[activeScenario]!.label,
        }))
      })
    } catch {
      setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: 'Entschuldigung, ich hatte ein Problem. Bitte versuche es erneut.' } : m))
    } finally {
      setTyping(false)
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === 'user'
    return (
      <View style={[ms.msgRow, isUser && ms.msgRowUser]}>
        {!isUser && (
          <View style={[ms.botAvatar, { backgroundColor: C.primary }]}>
            <Text style={ms.botAvatarText}>Z</Text>
          </View>
        )}
        <View style={{ maxWidth: '80%', gap: 4 }}>
          <View style={[ms.bubble, isUser ? [ms.bubbleUser, { backgroundColor: C.primary }] : [ms.bubbleBot, { backgroundColor: C.surface, borderColor: C.border }]]}>
            <Text style={[ms.bubbleText, { color: isUser ? '#FFFFFF' : C.text }]}>{item.text}</Text>
          </View>
          <Text style={[ms.msgTime, { color: C.text3, alignSelf: isUser ? 'flex-end' : 'flex-start' }]}>{item.time}</Text>
          {item.corrections?.map((c, i) => (
            <View key={i} style={[ms.correction, { backgroundColor: 'rgba(245,158,11,.08)', borderColor: 'rgba(245,158,11,.3)' }]}>
              <View style={ms.correctionHeader}>
                <Icons.Pencil size={10} color={C.accentD} />
                <Text style={[ms.correctionLabel, { color: C.accentD }]}>Kleine Korrektur</Text>
              </View>
              <Text style={{ fontSize: 13, fontFamily: Fonts.regular }}>
                <Text style={{ color: C.error, textDecorationLine: 'line-through' }}>{c.original}</Text>
                <Text style={{ color: C.text2 }}>  →  </Text>
                <Text style={{ color: C.success, fontFamily: Fonts.semibold }}>{c.corrected}</Text>
              </Text>
              <Text style={[ms.correctionExplain, { color: C.text3 }]}>{c.explanation}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={[ms.container, { backgroundColor: C.bg }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>

        {!isOnline && <OfflineNotice message="Chat requires an internet connection. You'll be able to send messages once you're back online." />}

        {/* Scenario tabs */}
        <View style={[ms.scenarioBar, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ms.scenarioRow}>
            {SCENARIOS.map((sc, i) => (
              <TouchableOpacity
                key={i}
                style={[ms.scenarioChip, { borderColor: activeScenario === i ? C.primary : C.border },
                  activeScenario === i && { backgroundColor: C.primary }]}
                onPress={() => switchScenario(i)}
              >
                <Text style={{ fontSize: 14 }}>{sc.emoji}</Text>
                <Text style={[ms.scenarioText, { color: activeScenario === i ? '#FFFFFF' : C.text2 }]}>{sc.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Agent header */}
        <View style={[ms.agentHeader, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <View style={[ms.agentAvatar, { backgroundColor: C.primary }]}>
            <Text style={ms.agentAvatarText}>Z</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ms.agentName, { color: C.text }]}>Zungo AI · {SCENARIOS[activeScenario]!.label}</Text>
            <View style={ms.agentStatusRow}>
              <View style={[ms.statusDot, { backgroundColor: C.success }]} />
              <Text style={[ms.agentStatus, { color: C.success }]}>Live · {userLevel} mode</Text>
            </View>
          </View>
          <TouchableOpacity style={[ms.newScenarioBtn, { backgroundColor: C.bgAlt, borderColor: C.border }]} onPress={() => switchScenario(activeScenario)}>
            <Icons.Refresh size={12} color={C.text2} />
            <Text style={[ms.newScenarioBtnText, { color: C.text2 }]}>Restart</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={[ms.messageList, { paddingBottom: 8 }]}
          style={{ flex: 1, backgroundColor: C.bg }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={typing && messages.length === 0 ? (
            <View style={ms.msgRow}>
              <View style={[ms.botAvatar, { backgroundColor: C.primary }]}>
                <Text style={ms.botAvatarText}>Z</Text>
              </View>
              <View style={[ms.bubble, ms.bubbleBot, { backgroundColor: C.surface, borderColor: C.border, paddingVertical: 14 }]}>
                <View style={ms.typingDots}>
                  <View style={[ms.typingDot, { backgroundColor: C.text3 }]} />
                  <View style={[ms.typingDot, { backgroundColor: C.text3 }]} />
                  <View style={[ms.typingDot, { backgroundColor: C.text3 }]} />
                </View>
              </View>
            </View>
          ) : null}
        />

        {/* Input bar */}
        <View style={[ms.inputBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <TextInput
            style={[ms.input, { backgroundColor: C.bgAlt, borderColor: C.border, color: C.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Schreiben Sie auf Deutsch…"
            placeholderTextColor={C.text3}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[ms.sendBtn, { backgroundColor: C.primary, opacity: input.trim() && !typing ? 1 : 0.4 }]}
            onPress={() => send()}
            disabled={!input.trim() || typing}
          >
            <Icons.Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const ms = StyleSheet.create({
  container: { flex: 1 },
  scenarioBar: { borderBottomWidth: 1 },
  scenarioRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  scenarioChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5 },
  scenarioText: { fontSize: 13, fontFamily: Fonts.medium },
  agentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  agentAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  agentAvatarText: { fontSize: 16, fontFamily: Fonts.bold, color: '#FFFFFF' },
  agentName: { fontSize: 14, fontFamily: Fonts.semibold },
  agentStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  agentStatus: { fontSize: 12, fontFamily: Fonts.regular },
  newScenarioBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  newScenarioBtnText: { fontSize: 12, fontFamily: Fonts.medium },
  messageList: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  botAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  botAvatarText: { fontSize: 13, fontFamily: Fonts.bold, color: '#FFFFFF' },
  bubble: { borderRadius: 18, padding: 11, borderWidth: 1, borderColor: 'transparent' },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleBot: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 22, fontFamily: Fonts.regular },
  msgTime: { fontSize: 11, fontFamily: Fonts.regular },
  correction: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 4 },
  correctionHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  correctionLabel: { fontSize: 11, fontFamily: Fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  correctionExplain: { fontSize: 12, fontFamily: Fonts.regular, lineHeight: 18, marginTop: 2 },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 22, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: Fonts.regular, maxHeight: 120, lineHeight: 20 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
})
