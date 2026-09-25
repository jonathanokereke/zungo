import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import type { RootStackParamList } from '../../navigation/RootNavigator'

type RefRoute = RouteProp<RootStackParamList, 'GrammarRef'>

interface GrammarRef {
  explanation: string
  formula: string
  rows?: { label: string; value: string }[]
  examples: { german: string; english: string }[]
  tips: string[]
}

export function GrammarRefScreen() {
  const route = useRoute<RefRoute>()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { topic, subtitle, color } = route.params
  const { colors: C } = useTheme()
  const { getAccessToken } = useAuth()

  const [ref, setRef] = useState<GrammarRef | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessToken()
        const data = await apiFetch<GrammarRef>(
          `/api/grammar/reference?topic=${encodeURIComponent(topic)}`,
          {},
          token,
        )
        setRef(data)
      } catch (e: any) {
        setError(e?.message ?? 'Could not load reference')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [topic])

  const accentBg = color + '18'

  return (
    <SafeAreaView style={[gr.container, { backgroundColor: C.bg }]} edges={['top']}>
      {/* Top bar */}
      <View style={[gr.topBar, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={gr.backBtn}>
          <Icons.ArrowLeft size={18} color={C.primary} />
          <Text style={[gr.backBtnText, { color: C.primary }]}>Grammatik</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[gr.practiceBtn, { backgroundColor: color }]}
          onPress={() => navigation.navigate('Exercise', { topic, subtitle })}
        >
          <Icons.Zap size={13} color="#FFFFFF" />
          <Text style={gr.practiceBtnText}>Practice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero */}
        <View style={[gr.hero, { backgroundColor: accentBg }]}>
          <View style={[gr.levelDot, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[gr.heroTitle, { color: C.text }]}>{topic}</Text>
            <Text style={[gr.heroSub, { color: C.text2 }]}>{subtitle}</Text>
          </View>
        </View>

        {loading && (
          <View style={gr.center}>
            <ActivityIndicator color={C.primary} size="large" />
          </View>
        )}

        {error && (
          <View style={gr.center}>
            <Icons.XCircle size={40} color={C.error} />
            <Text style={[gr.errorText, { color: C.text2 }]}>{error}</Text>
          </View>
        )}

        {ref && (
          <View style={{ paddingHorizontal: 16, gap: 16 }}>
            {/* Explanation */}
            <View style={[gr.card, { backgroundColor: C.surface }]}>
              <View style={gr.cardHeader}>
                <View style={[gr.cardIcon, { backgroundColor: 'rgba(55,48,163,.1)' }]}>
                  <Icons.BookOpen size={15} color={C.primary} />
                </View>
                <Text style={[gr.cardTitle, { color: C.text }]}>Explanation</Text>
              </View>
              <Text style={[gr.explanationText, { color: C.text2 }]}>{ref.explanation}</Text>
            </View>

            {/* Formula */}
            <View style={[gr.formulaCard, { backgroundColor: accentBg, borderColor: color + '40' }]}>
              <Text style={[gr.formulaLabel, { color: color }]}>FORMULA</Text>
              <Text style={[gr.formulaText, { color: C.text }]}>{ref.formula}</Text>
            </View>

            {/* Table rows */}
            {ref.rows && ref.rows.length > 0 && (
              <View style={[gr.card, { backgroundColor: C.surface }]}>
                <View style={gr.cardHeader}>
                  <View style={[gr.cardIcon, { backgroundColor: 'rgba(245,158,11,.12)' }]}>
                    <Icons.Layers size={15} color="#B45309" />
                  </View>
                  <Text style={[gr.cardTitle, { color: C.text }]}>Key Forms</Text>
                </View>
                <View style={{ gap: 0 }}>
                  {ref.rows.map((row, i) => (
                    <View
                      key={i}
                      style={[
                        gr.tableRow,
                        { borderTopColor: C.border },
                        i === 0 && { borderTopWidth: 0 },
                      ]}
                    >
                      <Text style={[gr.tableLabel, { color: C.text3 }]}>{row.label}</Text>
                      <Text style={[gr.tableValue, { color: C.text }]}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Examples */}
            <View style={[gr.card, { backgroundColor: C.surface }]}>
              <View style={gr.cardHeader}>
                <View style={[gr.cardIcon, { backgroundColor: 'rgba(22,163,74,.1)' }]}>
                  <Icons.MessageSquare size={15} color="#16A34A" />
                </View>
                <Text style={[gr.cardTitle, { color: C.text }]}>Examples</Text>
              </View>
              <View style={{ gap: 12 }}>
                {ref.examples.map((ex, i) => (
                  <View key={i} style={[gr.exampleBox, { borderLeftColor: color, backgroundColor: C.bg }]}>
                    <Text style={[gr.exGerman, { color: C.text }]}>{ex.german}</Text>
                    <Text style={[gr.exEnglish, { color: C.text3 }]}>{ex.english}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Tips */}
            <View style={[gr.card, { backgroundColor: C.surface }]}>
              <View style={gr.cardHeader}>
                <View style={[gr.cardIcon, { backgroundColor: 'rgba(168,85,247,.1)' }]}>
                  <Icons.Sparkles size={15} color="#9333EA" />
                </View>
                <Text style={[gr.cardTitle, { color: C.text }]}>Tips & Watch-outs</Text>
              </View>
              <View style={{ gap: 10 }}>
                {ref.tips.map((tip, i) => (
                  <View key={i} style={gr.tipRow}>
                    <View style={[gr.tipDot, { backgroundColor: color }]} />
                    <Text style={[gr.tipText, { color: C.text2 }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[gr.ctaBtn, { backgroundColor: color }]}
              onPress={() => navigation.navigate('Exercise', { topic, subtitle })}
              activeOpacity={0.85}
            >
              <Icons.Zap size={18} color="#FFFFFF" />
              <Text style={gr.ctaBtnText}>Practice {topic}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const gr = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: 14, fontFamily: Fonts.medium },
  practiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  practiceBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 13 },

  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    borderRadius: 16, padding: 20,
  },
  levelDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 2 },
  heroTitle: { fontSize: 22, fontFamily: Fonts.bold },
  heroSub: { fontSize: 13, fontFamily: Fonts.regular, marginTop: 3 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  errorText: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center', paddingHorizontal: 32 },

  card: { borderRadius: 16, padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontFamily: Fonts.semibold },

  explanationText: { fontSize: 14, lineHeight: 22, fontFamily: Fonts.regular },

  formulaCard: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  formulaLabel: { fontSize: 10, fontFamily: Fonts.bold, letterSpacing: 1, marginBottom: 6 },
  formulaText: { fontSize: 15, fontFamily: Fonts.medium, lineHeight: 22 },

  tableRow: { flexDirection: 'row', paddingVertical: 9, borderTopWidth: 1, gap: 10 },
  tableLabel: { width: 110, fontSize: 12, fontFamily: Fonts.medium, paddingTop: 1 },
  tableValue: { flex: 1, fontSize: 13, fontFamily: Fonts.regular, lineHeight: 20 },

  exampleBox: { borderLeftWidth: 3, paddingLeft: 12, borderRadius: 4 },
  exGerman: { fontSize: 15, fontFamily: Fonts.semibold, marginBottom: 2 },
  exEnglish: { fontSize: 13, fontFamily: Fonts.italic, lineHeight: 18 },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  tipText: { flex: 1, fontSize: 13, fontFamily: Fonts.regular, lineHeight: 20 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, paddingVertical: 16, marginTop: 4,
  },
  ctaBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 16 },
})
