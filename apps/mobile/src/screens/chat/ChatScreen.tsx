import { useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../lib/ThemeContext'
import { Fonts } from '../../lib/theme'
import { Icons } from '../../lib/icons'

const SCENARIOS = [
  { label: 'Beim Bäcker', emoji: '🏪' },
  { label: 'Beim Arzt', emoji: '🏥' },
  { label: 'Am Bahnhof', emoji: '🚆' },
  { label: 'Vorstellungsgespräch', emoji: '💼' },
  { label: 'Smalltalk', emoji: '🤝' },
]

interface Correction { original: string; corrected: string; explanation: string }
interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  time: string
  corrections?: Correction[]
}

const INITIAL: Message[] = [
  { id: '1', role: 'assistant', text: 'Guten Morgen! Willkommen in der Bäckerei Müller. Was darf es für Sie sein? 🥐', time: '09:41' },
  { id: '2', role: 'user', text: 'Guten Morgen! Ich hätte gerne zwei Brötchen und ein Stück Kuchen.', time: '09:41' },
  { id: '3', role: 'assistant', text: 'Sehr gut! Welche Art von Kuchen möchten Sie? Wir haben heute frischen Apfelkuchen, Schwarzwälder Kirschtorte und Mohnkuchen.', time: '09:41' },
  {
    id: '4',
    role: 'user',
    text: 'Der Apfelkuchen klingt lecker. Wie viel kosted das?',
    time: '09:42',
    corrections: [{ original: 'kosted', corrected: 'kostet', explanation: '3rd person singular: kosten → kostet (not kosted)' }],
  },
  { id: '5', role: 'assistant', text: 'Gute Wahl! 🍎 Zwei Brötchen und ein Stück Apfelkuchen — das macht zusammen 3,20 Euro.', time: '09:42' },
]

const SUGGESTIONS = ['Das klingt gut!', 'Haben Sie auch Croissants?', 'Kann ich mit Karte zahlen?']

const AI_RESPONSES = [
  'Natürlich! Das macht dann zusammen 3,60 Euro. Möchten Sie noch etwas?',
  'Ja, frische Croissants haben wir für 1,20 Euro das Stück.',
  'Ja, wir akzeptieren alle gängigen Karten.',
]

export function ChatScreen() {
  const { colors: C } = useTheme()
  const [activeScenario, setActiveScenario] = useState(0)
  const [messages, setMessages] = useState<Message[]>(INITIAL)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const flatRef = useRef<FlatList>(null)
  const aiIdx = useRef(0)

  function now() {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  function send(text?: string) {
    const txt = (text ?? input).trim()
    if (!txt) return
    setInput('')
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: txt, time: now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)
    setTimeout(() => {
      const response = AI_RESPONSES[aiIdx.current % AI_RESPONSES.length]
      aiIdx.current++
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: response, time: now() }])
      setTyping(false)
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)
    }, 1200)
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === 'user'
    return (
      <View style={[ms.msgRow, isUser && ms.msgRowUser]}>
        {!isUser && (
          <View style={[ms.botAvatar, { background: C.primary } as any, { backgroundColor: C.primary }]}>
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

        {/* Scenario tabs */}
        <View style={[ms.scenarioBar, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ms.scenarioRow}>
            {SCENARIOS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[ms.scenarioChip, { borderColor: activeScenario === i ? C.primary : C.border },
                  activeScenario === i && { backgroundColor: C.primary }]}
                onPress={() => setActiveScenario(i)}
              >
                <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
                <Text style={[ms.scenarioText, { color: activeScenario === i ? '#FFFFFF' : C.text2 }]}>{s.label}</Text>
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
            <Text style={[ms.agentName, { color: C.text }]}>Zungo AI · {SCENARIOS[activeScenario].label}</Text>
            <View style={ms.agentStatusRow}>
              <View style={[ms.statusDot, { backgroundColor: C.success }]} />
              <Text style={[ms.agentStatus, { color: C.success }]}>Live · B1 mode</Text>
            </View>
          </View>
          <TouchableOpacity style={[ms.newScenarioBtn, { backgroundColor: C.bgAlt, borderColor: C.border }]}>
            <Icons.Refresh size={12} color={C.text2} />
            <Text style={[ms.newScenarioBtnText, { color: C.text2 }]}>New scenario</Text>
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
          ListFooterComponent={typing ? (
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

        {/* Suggestions */}
        <View style={[ms.suggestBar, { backgroundColor: C.bg }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ms.suggestRow}>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity key={i} style={[ms.suggestChip, { backgroundColor: C.surface, borderColor: C.border }]} onPress={() => send(s)}>
                <Text style={[ms.suggestText, { color: C.primary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input bar */}
        <View style={[ms.inputBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <TouchableOpacity style={[ms.micBtn, { backgroundColor: C.bgAlt, borderColor: C.border }]}>
            <Icons.Mic size={18} color={C.text2} />
          </TouchableOpacity>
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
            style={[ms.sendBtn, { backgroundColor: C.primary, opacity: input.trim() ? 1 : 0.4 }]}
            onPress={() => send()}
            disabled={!input.trim()}
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
  suggestBar: { paddingVertical: 4 },
  suggestRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  suggestChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5 },
  suggestText: { fontSize: 13, fontFamily: Fonts.medium },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, borderTopWidth: 1 },
  micBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  input: { flex: 1, borderRadius: 22, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: Fonts.regular, maxHeight: 120, lineHeight: 20 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
})
