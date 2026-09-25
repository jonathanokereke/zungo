import { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import { Icons } from '../../lib/icons'
import { useNetwork } from '../../lib/NetworkContext'
import { useOfflineStore, type CachedDueEntry } from '../../lib/offlineStore'

interface DueEntry { review: { id: string; word_id: string; interval: number; ease_factor: number; repetition: number }; word: { id: string; german: string; translation: string; example_sentence?: string } }
interface ReviewCard { word_id: string; word: string; article?: string; definition: string; examples: string[]; interval: number; easeFactor: number; repetition: number }
type Rating = 1 | 2 | 3 | 4

// SM-2 next interval preview — mirrors server-side calculateNextReview
// New card (repetition=0): Again<10m, Hard=1d, Good=1d, Easy=4d (Anki-style first-time bonus)
// Learning card (repetition=1, interval=1): Again<10m, Hard=1d, Good=6d, Easy=8d
// Mature card (repetition≥2): scaled by easeFactor
function previewInterval(interval: number, easeFactor: number, repetition: number, quality: Rating): string {
  if (quality === 1) return '<10m'
  if (quality === 2) {
    if (repetition === 0) return '1d'
    const next = Math.round(interval * 1.2)
    return next < 2 ? '1d' : `${next}d`
  }
  if (repetition === 0) return quality === 4 ? '4d' : '1d'
  if (repetition === 1) return quality === 4 ? '8d' : '6d'
  const next = Math.round(interval * easeFactor)
  return quality === 4 ? `${Math.round(next * 1.3)}d` : `${next}d`
}

function toCard(entry: DueEntry): ReviewCard {
  const parts = entry.word.german.split(' ')
  const hasArticle = ['der', 'die', 'das'].includes(parts[0] ?? '')
  return {
    word_id: entry.word.id,
    word: hasArticle ? parts.slice(1).join(' ') : entry.word.german,
    article: hasArticle ? parts[0] : undefined,
    definition: entry.word.translation,
    examples: entry.word.example_sentence ? [entry.word.example_sentence] : [],
    interval: entry.review.interval,
    easeFactor: entry.review.ease_factor,
    repetition: entry.review.repetition,
  }
}

export function ReviewScreen() {
  const navigation = useNavigation()
  const { getAccessToken } = useAuth()
  const { colors: C } = useTheme()
  const { isOnline } = useNetwork()
  const { cachedDueCards, setDueCards, enqueueReview } = useOfflineStore()
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [usingCache, setUsingCache] = useState(false)
  const flipAnim = useRef(new Animated.Value(0)).current

  const currentCard = cards[idx]
  const RATINGS: { rating: Rating; label: string; interval: string; bg: string; color: string }[] = [
    { rating: 1, label: 'Again', interval: currentCard ? previewInterval(currentCard.interval, currentCard.easeFactor, currentCard.repetition, 1) : '<10m', bg: 'rgba(220,38,38,.1)', color: C.error },
    { rating: 2, label: 'Hard',  interval: currentCard ? previewInterval(currentCard.interval, currentCard.easeFactor, currentCard.repetition, 2) : '1d',   bg: 'rgba(217,119,6,.1)', color: C.warn },
    { rating: 3, label: 'Good',  interval: currentCard ? previewInterval(currentCard.interval, currentCard.easeFactor, currentCard.repetition, 3) : '3d',   bg: 'rgba(55,48,163,.1)', color: C.primary },
    { rating: 4, label: 'Easy',  interval: currentCard ? previewInterval(currentCard.interval, currentCard.easeFactor, currentCard.repetition, 4) : '7d',   bg: 'rgba(22,163,74,.12)', color: C.success },
  ]

  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessToken()
        const data = await apiFetch<DueEntry[]>('/api/reviews/due', {}, token)
        setDueCards(data)
        if (data.length > 0) setCards(data.map(toCard))
      } catch {
        if (cachedDueCards.length > 0) {
          setCards(cachedDueCards.map(toCard))
          setUsingCache(true)
        }
      }
    }
    load()
  }, [])

  function flip() {
    if (flipped) return
    Animated.spring(flipAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start()
    setFlipped(true)
  }

  async function rate(rating: Rating) {
    if (submitting) return
    setSubmitting(true)
    const wordId = cards[idx].word_id
    if (!isOnline) {
      enqueueReview(wordId, rating)
    } else {
      try {
        const token = await getAccessToken()
        await apiFetch(`/api/reviews/${wordId}`, { method: 'POST', body: JSON.stringify({ quality: rating }) }, token)
      } catch {
        enqueueReview(wordId, rating)
      }
    }
    setSubmitting(false)
    flipAnim.setValue(0)
    setFlipped(false)
    if (idx + 1 >= cards.length) setDone(true)
    else setIdx(i => i + 1)
  }

  const frontRot = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })
  const backRot  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] })
  const card = currentCard

  if (done || cards.length === 0) {
    return (
      <SafeAreaView style={[rv.center, { backgroundColor: C.bg }]}>
        <Icons.CheckCircle size={64} color={C.success} />
        <Text style={[rv.doneTitle, { color: C.text }]}>{cards.length === 0 ? 'Nothing due!' : 'Session complete!'}</Text>
        <Text style={[rv.doneSub, { color: C.text2 }]}>You reviewed {cards.length} card{cards.length !== 1 ? 's' : ''}. Great work!</Text>
        <TouchableOpacity style={[rv.backBtn, { backgroundColor: C.primary }]} onPress={() => navigation.goBack()}>
          <Text style={rv.backBtnText}>Back to Vocabulary</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[rv.container, { backgroundColor: C.bg }]} edges={['bottom']}>
      {usingCache && (
        <View style={[rv.offlineBar, { backgroundColor: 'rgba(180,83,9,.12)' }]}>
          <Icons.Globe size={12} color='#B45309' />
          <Text style={[rv.offlineBarText, { color: '#B45309' }]}>Offline · ratings will sync when you reconnect</Text>
        </View>
      )}
      <View style={rv.header}>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <View style={[rv.progressTrack, { backgroundColor: C.bgAlt }]}>
            <View style={[rv.progressFill, { width: `${(idx / cards.length) * 100}%` as any, backgroundColor: C.primary }]} />
          </View>
          <Text style={[rv.progressText, { color: C.text3 }]}>{idx + 1} of {cards.length}</Text>
        </View>
        <TouchableOpacity style={rv.settingsBtn}>
          <Icons.Settings size={18} color={C.text3} />
        </TouchableOpacity>
      </View>

      <View style={rv.dots}>
        {cards.slice(0, Math.min(5, cards.length)).map((_, i) => (
          <View key={i} style={[rv.dot,
            i < idx && { backgroundColor: C.success },
            i === idx && { backgroundColor: C.primary },
            i > idx && { backgroundColor: C.bgAlt }
          ]} />
        ))}
      </View>

      <View style={rv.cardArea}>
        <Animated.View style={[rv.card, { backgroundColor: C.surface, transform: [{ rotateY: frontRot }] }, flipped && rv.hidden]}>
          {card.article ? <Text style={[rv.cardArticle, { color: C.primary }]}>{card.article}</Text> : null}
          <Text style={[rv.cardWord, { color: C.text }]}>{card.word}</Text>
          <Text style={[rv.cardHint, { color: C.text3 }]}>tap to reveal →</Text>
        </Animated.View>

        <Animated.View style={[rv.card, rv.cardBack, { backgroundColor: C.primaryD, transform: [{ rotateY: backRot }] }, !flipped && rv.hidden]}>
          <Text style={rv.cardBackSub}>{card.word}</Text>
          <Text style={rv.cardBackTrans}>{card.definition}</Text>
          {card.examples?.[0] && <Text style={rv.cardBackExample}>"{card.examples[0]}"</Text>}
        </Animated.View>

        {!flipped && <TouchableOpacity style={rv.flipArea} onPress={flip} />}
      </View>

      {!flipped && <Text style={[rv.tapHint, { color: C.text3 }]}>Tap card to see translation</Text>}

      {flipped && (
        <>
          <View style={rv.srsRow}>
            {RATINGS.map(({ rating, label, interval, bg, color }) => (
              <TouchableOpacity
                key={rating}
                style={[rv.srsBtn, { backgroundColor: bg }, submitting && { opacity: 0.5 }]}
                onPress={() => rate(rating)}
                disabled={submitting}
              >
                <Text style={[rv.srsBtnLabel, { color }]}>{label}</Text>
                <Text style={[rv.srsBtnInterval, { color }]}>{interval}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={rv.audioEditBtn}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Icons.Volume size={14} color={C.text3} />
              <Text style={[rv.audioEditText, { color: C.text3 }]}>Play audio  ·  Edit card</Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  )
}

const rv = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  progressTrack: { height: 8, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 99 },
  progressText: { fontSize: 11, marginTop: 4, textAlign: 'center', fontFamily: Fonts.regular },
  settingsBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  dots: { flexDirection: 'row', gap: 4, justifyContent: 'center', marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', width: '100%', aspectRatio: 1.5, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 8, backfaceVisibility: 'hidden' },
  cardBack: {},
  hidden: { opacity: 0 },
  cardBadgeLevel: { position: 'absolute', top: 14, left: 14, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  cardBadgeLevelText: { fontSize: 11, fontFamily: Fonts.semibold },
  cardBadgeType: { position: 'absolute', top: 14, right: 14, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  cardBadgeTypeText: { fontSize: 11, fontFamily: Fonts.semibold },
  cardArticle: { fontSize: 16, fontFamily: Fonts.semibold, marginBottom: 4 },
  cardWord: { fontSize: 36, fontFamily: Fonts.bold, textAlign: 'center', lineHeight: 42 },
  cardHint: { fontSize: 13, marginTop: 8, fontFamily: Fonts.regular },
  cardBackSub: { fontSize: 16, color: 'rgba(255,255,255,.7)', marginBottom: 12, fontFamily: Fonts.regular },
  cardBackTrans: { fontSize: 22, fontFamily: Fonts.semibold, color: '#FFFFFF', textAlign: 'center', lineHeight: 30 },
  cardBackExample: { fontSize: 13, color: 'rgba(255,255,255,.65)', fontFamily: Fonts.italic, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  cardBackTags: { flexDirection: 'row', gap: 8, marginTop: 14 },
  cardTag: { backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  cardTagText: { fontSize: 11, color: 'rgba(255,255,255,.8)', fontFamily: Fonts.regular },
  flipArea: { position: 'absolute', width: '100%', height: '100%' },
  tapHint: { textAlign: 'center', fontSize: 12, marginTop: 10, fontFamily: Fonts.regular },
  srsRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 4 },
  srsBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', gap: 2 },
  srsBtnLabel: { fontSize: 12, fontFamily: Fonts.semibold },
  srsBtnInterval: { fontSize: 10, fontFamily: Fonts.regular, opacity: 0.7 },
  audioEditBtn: { paddingVertical: 8, alignItems: 'center' },
  audioEditText: { fontSize: 12, fontFamily: Fonts.regular },
  offlineBar: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 },
  offlineBarText: { fontSize: 12, fontFamily: Fonts.regular },
  doneTitle: { fontSize: 24, fontFamily: Fonts.bold, marginTop: 20, marginBottom: 10, textAlign: 'center' },
  doneSub: { fontSize: 15, marginBottom: 32, textAlign: 'center', fontFamily: Fonts.regular },
  backBtn: { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  backBtnText: { color: '#FFFFFF', fontFamily: Fonts.semibold, fontSize: 16 },
})
