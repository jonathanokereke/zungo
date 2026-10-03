import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../lib/ThemeContext'
import { Fonts } from '../../lib/theme'

interface FillerPhrase {
  phrase: string
  translation: string
  example: string
  example_translation: string
}

interface LevelData {
  level: string
  color: string
  bg: string
  phrases: FillerPhrase[]
}

const FILLER_DATA: LevelData[] = [
  {
    level: 'A1',
    color: '#16A34A',
    bg: 'rgba(22,163,74,.1)',
    phrases: [
      { phrase: 'Ja / Nein', translation: 'Yes / No', example: 'Ja, das ist richtig. Nein, ich weiß nicht.', example_translation: 'Yes, that is correct. No, I don\'t know.' },
      { phrase: 'Bitte', translation: 'Please / You\'re welcome', example: 'Bitte, nehmen Sie Platz!', example_translation: 'Please, take a seat!' },
      { phrase: 'Danke schön', translation: 'Thank you very much', example: 'Danke schön für Ihre Hilfe!', example_translation: 'Thank you very much for your help!' },
      { phrase: 'Entschuldigung', translation: 'Excuse me / Sorry', example: 'Entschuldigung, wo ist der Bahnhof?', example_translation: 'Excuse me, where is the train station?' },
      { phrase: 'Ich weiß nicht', translation: 'I don\'t know', example: 'Ich weiß nicht, wie das heißt.', example_translation: 'I don\'t know what that is called.' },
      { phrase: 'Moment mal', translation: 'Just a moment', example: 'Moment mal, ich suche das Wort.', example_translation: 'Just a moment, I\'m looking for the word.' },
      { phrase: 'Wie bitte?', translation: 'Pardon? / Could you repeat that?', example: 'Wie bitte? Können Sie das wiederholen?', example_translation: 'Pardon? Can you repeat that?' },
      { phrase: 'Genau', translation: 'Exactly / Precisely', example: 'Genau, das meine ich auch!', example_translation: 'Exactly, that\'s what I mean too!' },
      { phrase: 'Ach so', translation: 'Oh, I see / I understand now', example: 'Ach so, jetzt verstehe ich das.', example_translation: 'Oh I see, now I understand.' },
      { phrase: 'Okay / In Ordnung', translation: 'Okay / Alright', example: 'In Ordnung, ich komme morgen.', example_translation: 'Alright, I\'ll come tomorrow.' },
    ],
  },
  {
    level: 'A2',
    color: '#0891B2',
    bg: 'rgba(8,145,178,.1)',
    phrases: [
      { phrase: 'Na ja', translation: 'Well... / Sort of', example: 'Na ja, das ist nicht so einfach.', example_translation: 'Well, that\'s not so easy.' },
      { phrase: 'Also', translation: 'So / Well then / So then', example: 'Also, was machen wir jetzt?', example_translation: 'So, what do we do now?' },
      { phrase: 'Eigentlich', translation: 'Actually / Basically', example: 'Eigentlich wollte ich heute lernen.', example_translation: 'Actually, I wanted to study today.' },
      { phrase: 'Übrigens', translation: 'By the way', example: 'Übrigens, morgen ist mein Geburtstag.', example_translation: 'By the way, tomorrow is my birthday.' },
      { phrase: 'Zum Beispiel (z.B.)', translation: 'For example (e.g.)', example: 'Ich mag Obst, zum Beispiel Äpfel und Bananen.', example_translation: 'I like fruit, for example apples and bananas.' },
      { phrase: 'Wirklich?', translation: 'Really? / Is that so?', example: 'Wirklich? Das wusste ich nicht!', example_translation: 'Really? I didn\'t know that!' },
      { phrase: 'Das stimmt', translation: 'That\'s right / That\'s true', example: 'Das stimmt, du hast recht.', example_translation: 'That\'s right, you are correct.' },
      { phrase: 'Ich meine', translation: 'I mean / What I mean is', example: 'Ich meine, wir sollten früher anfangen.', example_translation: 'I mean, we should start earlier.' },
      { phrase: 'Oder?', translation: 'Right? / Don\'t you think?', example: 'Das war ein schöner Tag, oder?', example_translation: 'That was a nice day, right?' },
      { phrase: 'Dann', translation: 'Then / In that case', example: 'Dann gehen wir zusammen zum Markt.', example_translation: 'Then we\'ll go to the market together.' },
    ],
  },
  {
    level: 'B1',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,.1)',
    phrases: [
      { phrase: 'Auf jeden Fall', translation: 'In any case / Absolutely / Definitely', example: 'Auf jeden Fall komme ich zur Party.', example_translation: 'I\'ll definitely come to the party.' },
      { phrase: 'Ehrlich gesagt', translation: 'Honestly / To be honest / Frankly', example: 'Ehrlich gesagt finde ich das langweilig.', example_translation: 'Honestly, I find that boring.' },
      { phrase: 'Meiner Meinung nach', translation: 'In my opinion', example: 'Meiner Meinung nach ist das eine gute Idee.', example_translation: 'In my opinion, that is a good idea.' },
      { phrase: 'Zum Glück', translation: 'Fortunately / Luckily', example: 'Zum Glück hat es heute nicht geregnet.', example_translation: 'Fortunately, it didn\'t rain today.' },
      { phrase: 'Leider', translation: 'Unfortunately / Sadly', example: 'Leider kann ich heute nicht kommen.', example_translation: 'Unfortunately, I can\'t come today.' },
      { phrase: 'Außerdem', translation: 'Besides / Furthermore / In addition', example: 'Außerdem hat er keine Zeit gehabt.', example_translation: 'Besides, he didn\'t have any time.' },
      { phrase: 'Trotzdem', translation: 'Nevertheless / Still / Yet', example: 'Es war kalt, trotzdem sind wir spazieren gegangen.', example_translation: 'It was cold, still we went for a walk.' },
      { phrase: 'Deswegen / Deshalb', translation: 'Therefore / That\'s why / For that reason', example: 'Ich war müde, deswegen bin ich früh ins Bett gegangen.', example_translation: 'I was tired, that\'s why I went to bed early.' },
      { phrase: 'Ungefähr', translation: 'Approximately / About / Roughly', example: 'Das dauert ungefähr zwei Stunden.', example_translation: 'That takes approximately two hours.' },
      { phrase: 'Einerseits… andererseits', translation: 'On one hand… on the other hand', example: 'Einerseits ist es teuer, andererseits ist die Qualität gut.', example_translation: 'On one hand it\'s expensive, on the other hand the quality is good.' },
    ],
  },
  {
    level: 'B2',
    color: '#D97706',
    bg: 'rgba(217,119,6,.1)',
    phrases: [
      { phrase: 'Soweit ich weiß', translation: 'As far as I know', example: 'Soweit ich weiß, beginnt die Sitzung um neun Uhr.', example_translation: 'As far as I know, the meeting starts at nine.' },
      { phrase: 'Im Großen und Ganzen', translation: 'On the whole / By and large', example: 'Im Großen und Ganzen war es ein erfolgreicher Abend.', example_translation: 'On the whole, it was a successful evening.' },
      { phrase: 'Es kommt darauf an', translation: 'It depends / That depends', example: 'Es kommt darauf an, wie viel Zeit wir haben.', example_translation: 'It depends on how much time we have.' },
      { phrase: 'Abgesehen davon', translation: 'Apart from that / Besides that', example: 'Abgesehen davon war die Reise wunderbar.', example_translation: 'Apart from that, the trip was wonderful.' },
      { phrase: 'Immerhin', translation: 'After all / At least / At any rate', example: 'Er hat immerhin versucht, uns zu helfen.', example_translation: 'He at least tried to help us.' },
      { phrase: 'Letztendlich', translation: 'Ultimately / In the end / After all', example: 'Letztendlich haben wir eine gute Entscheidung getroffen.', example_translation: 'Ultimately, we made a good decision.' },
      { phrase: 'Inzwischen', translation: 'Meanwhile / By now / In the meantime', example: 'Inzwischen hat er drei Sprachen gelernt.', example_translation: 'Meanwhile, he has learned three languages.' },
      { phrase: 'Gewissermaßen', translation: 'In a sense / To a certain extent', example: 'Das ist gewissermaßen unser größtes Problem.', example_translation: 'That is, in a sense, our biggest problem.' },
      { phrase: 'Nichtsdestotrotz', translation: 'Nevertheless / Nonetheless', example: 'Es war schwierig, nichtsdestotrotz haben wir es geschafft.', example_translation: 'It was difficult, nonetheless we managed it.' },
      { phrase: 'Dabei', translation: 'In doing so / At the same time / Yet', example: 'Er arbeitet viel und ist dabei noch sehr kreativ.', example_translation: 'He works a lot and is very creative at the same time.' },
    ],
  },
  {
    level: 'C1',
    color: '#DC2626',
    bg: 'rgba(220,38,38,.1)',
    phrases: [
      { phrase: 'Zweifelsohne', translation: 'Without a doubt / Undoubtedly', example: 'Das ist zweifelsohne die beste Lösung für dieses Problem.', example_translation: 'That is without a doubt the best solution for this problem.' },
      { phrase: 'Es sei denn', translation: 'Unless', example: 'Ich komme morgen, es sei denn, es regnet stark.', example_translation: 'I\'ll come tomorrow, unless it rains heavily.' },
      { phrase: 'Wenngleich', translation: 'Although / Even though / While', example: 'Wenngleich ich seinen Standpunkt verstehe, stimme ich nicht zu.', example_translation: 'Although I understand his position, I don\'t agree.' },
      { phrase: 'Insofern', translation: 'In so far as / To that extent', example: 'Insofern hat er mit seiner Kritik recht gehabt.', example_translation: 'To that extent, he was right in his criticism.' },
      { phrase: 'Demzufolge', translation: 'Consequently / As a result / Therefore', example: 'Die Kosten stiegen, demzufolge mussten wir das Projekt verschieben.', example_translation: 'Costs rose, consequently we had to postpone the project.' },
      { phrase: 'Im Hinblick auf', translation: 'With regard to / In view of / Regarding', example: 'Im Hinblick auf die Ergebnisse müssen wir neu planen.', example_translation: 'With regard to the results, we need to plan again.' },
      { phrase: 'Folglich', translation: 'Consequently / Therefore / Thus', example: 'Er hat nicht geübt, folglich hat er die Prüfung nicht bestanden.', example_translation: 'He didn\'t practice, consequently he didn\'t pass the exam.' },
      { phrase: 'Gleichwohl', translation: 'Nevertheless / Yet / All the same', example: 'Die Aufgabe war komplex, gleichwohl wurde sie rechtzeitig fertig.', example_translation: 'The task was complex, yet it was finished on time.' },
      { phrase: 'Ungeachtet dessen', translation: 'Regardless of that / Notwithstanding', example: 'Ungeachtet dessen setzte das Team seine Arbeit fort.', example_translation: 'Regardless of that, the team continued its work.' },
      { phrase: 'Nicht zuletzt', translation: 'Not least / Last but not least', example: 'Nicht zuletzt dank seiner Hilfe haben wir Erfolg gehabt.', example_translation: 'Not least thanks to his help, we were successful.' },
    ],
  },
  {
    level: 'C2',
    color: '#1E40AF',
    bg: 'rgba(30,64,175,.1)',
    phrases: [
      { phrase: 'Mutmaßlich', translation: 'Presumably / Supposedly / Allegedly', example: 'Mutmaßlich waren externe Faktoren für das Scheitern verantwortlich.', example_translation: 'Presumably, external factors were responsible for the failure.' },
      { phrase: 'Unter dem Strich', translation: 'At the end of the day / When all is said and done', example: 'Unter dem Strich war das Projekt trotz allem ein Erfolg.', example_translation: 'At the end of the day, the project was a success despite everything.' },
      { phrase: 'Wohingegen', translation: 'Whereas / While / In contrast to', example: 'Er ist sehr spontan, wohingegen seine Schwester alles plant.', example_translation: 'He is very spontaneous, whereas his sister plans everything.' },
      { phrase: 'Im Übrigen', translation: 'Incidentally / Moreover / By the way (formal)', example: 'Im Übrigen wurde das Thema bereits ausführlich diskutiert.', example_translation: 'Incidentally, the topic has already been discussed extensively.' },
      { phrase: 'Dahingehend', translation: 'To that effect / In that regard / In that direction', example: 'Die Aussagen des Ministers sind dahingehend zu interpretieren.', example_translation: 'The minister\'s statements are to be interpreted in that regard.' },
      { phrase: 'Schwerlich', translation: 'Hardly / Scarcely / With difficulty (formal)', example: 'Diese These lässt sich schwerlich mit den Fakten vereinbaren.', example_translation: 'This thesis can hardly be reconciled with the facts.' },
      { phrase: 'Angesichts der Tatsache', translation: 'In view of the fact / Given the fact', example: 'Angesichts der Tatsache, dass die Zeit knapp ist, müssen wir handeln.', example_translation: 'In view of the fact that time is short, we must act.' },
      { phrase: 'Insofern als', translation: 'Insofar as / To the extent that', example: 'Das ist zutreffend, insofern als man den Kontext berücksichtigt.', example_translation: 'That is accurate insofar as one considers the context.' },
      { phrase: 'Nichtsdestoweniger', translation: 'Nevertheless / Nonetheless (formal)', example: 'Die Kritik war berechtigt, nichtsdestoweniger wurde das Projekt genehmigt.', example_translation: 'The criticism was justified, nevertheless the project was approved.' },
      { phrase: 'Es erübrigt sich zu sagen', translation: 'It goes without saying / Needless to say', example: 'Es erübrigt sich zu sagen, dass Pünktlichkeit hier erwartet wird.', example_translation: 'It goes without saying that punctuality is expected here.' },
    ],
  },
]

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export function FillerPhrasesScreen({ route }: { route?: { params?: { userLevel?: string } } }) {
  const { colors: C } = useTheme()
  const userLevel = route?.params?.userLevel ?? 'C2'
  const maxIdx = CEFR_ORDER.indexOf(userLevel)
  const visible = FILLER_DATA.filter(d => CEFR_ORDER.indexOf(d.level) <= maxIdx)

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [openLevel, setOpenLevel] = useState<string>(userLevel)

  function togglePhrase(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <SafeAreaView style={[fp.container, { backgroundColor: C.bg }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={[fp.intro, { color: C.text2 }]}>
          Filler phrases make your speech and writing sound more natural. Tap any phrase to see it used in context.
        </Text>

        {visible.map(section => {
          const isOpen = openLevel === section.level
          return (
            <View key={section.level} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={[fp.levelHeader, { backgroundColor: section.bg, borderColor: section.color + '40' }]}
                onPress={() => setOpenLevel(isOpen ? '' : section.level)}
                activeOpacity={0.8}
              >
                <View style={[fp.levelBadge, { backgroundColor: section.color }]}>
                  <Text style={fp.levelBadgeText}>{section.level}</Text>
                </View>
                <Text style={[fp.levelTitle, { color: section.color }]}>
                  {section.phrases.length} phrases
                </Text>
                <Text style={[fp.levelChevron, { color: section.color }]}>{isOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={[fp.phraseList, { borderColor: section.color + '30', backgroundColor: C.surface }]}>
                  {section.phrases.map((p, i) => {
                    const key = `${section.level}-${i}`
                    const isExpanded = expanded[key]
                    return (
                      <View key={key}>
                        <TouchableOpacity
                          style={fp.phraseRow}
                          onPress={() => togglePhrase(key)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[fp.phraseText, { color: C.text }]}>{p.phrase}</Text>
                            <Text style={[fp.phraseTrans, { color: C.text2 }]}>{p.translation}</Text>
                          </View>
                          <Text style={[fp.phraseChevron, { color: C.text3 }]}>{isExpanded ? '▲' : '▼'}</Text>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={[fp.exampleBox, { backgroundColor: section.bg, borderColor: section.color + '30' }]}>
                            <Text style={[fp.exampleDE, { color: C.text }]}>{p.example}</Text>
                            <Text style={[fp.exampleEN, { color: C.text3 }]}>{p.example_translation}</Text>
                          </View>
                        )}

                        {i < section.phrases.length - 1 && (
                          <View style={[fp.divider, { backgroundColor: C.border }]} />
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const fp = StyleSheet.create({
  container: { flex: 1 },
  intro: { fontSize: 14, fontFamily: Fonts.regular, lineHeight: 20, marginBottom: 20 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  levelBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  levelBadgeText: { color: '#FFFFFF', fontSize: 13, fontFamily: Fonts.bold },
  levelTitle: { flex: 1, fontSize: 14, fontFamily: Fonts.semibold },
  levelChevron: { fontSize: 10, fontFamily: Fonts.medium },
  phraseList: { borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, overflow: 'hidden' },
  phraseRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  phraseText: { fontSize: 16, fontFamily: Fonts.semibold },
  phraseTrans: { fontSize: 13, fontFamily: Fonts.regular, marginTop: 2 },
  phraseChevron: { fontSize: 10 },
  exampleBox: { marginHorizontal: 16, marginBottom: 12, borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  exampleDE: { fontSize: 14, fontFamily: Fonts.medium, lineHeight: 20, fontStyle: 'italic' },
  exampleEN: { fontSize: 12, fontFamily: Fonts.regular, lineHeight: 18 },
  divider: { height: 1, marginHorizontal: 16 },
})
