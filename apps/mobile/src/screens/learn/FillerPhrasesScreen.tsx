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
      { phrase: 'Ja', translation: 'Yes', example: 'Ja, das ist mein Buch.', example_translation: 'Yes, that is my book.' },
      { phrase: 'Nein', translation: 'No', example: 'Nein, ich komme nicht.', example_translation: 'No, I am not coming.' },
      { phrase: 'Bitte', translation: 'Please / You\'re welcome', example: 'Bitte, nehmen Sie Platz!', example_translation: 'Please, take a seat!' },
      { phrase: 'Danke / Danke schön', translation: 'Thank you / Thank you very much', example: 'Danke schön für Ihre Hilfe!', example_translation: 'Thank you very much for your help!' },
      { phrase: 'Entschuldigung', translation: 'Excuse me / Sorry', example: 'Entschuldigung, wo ist der Bahnhof?', example_translation: 'Excuse me, where is the train station?' },
      { phrase: 'Wie bitte?', translation: 'Pardon? / Could you repeat that?', example: 'Wie bitte? Ich habe das nicht verstanden.', example_translation: 'Pardon? I didn\'t understand that.' },
      { phrase: 'Ich weiß nicht', translation: 'I don\'t know', example: 'Ich weiß nicht, wie das heißt.', example_translation: 'I don\'t know what that is called.' },
      { phrase: 'Moment mal', translation: 'Just a moment', example: 'Moment mal, ich suche das Wort.', example_translation: 'Just a moment, I\'m looking for the word.' },
      { phrase: 'Genau', translation: 'Exactly / Precisely', example: 'Genau, das meine ich auch!', example_translation: 'Exactly, that\'s what I mean too!' },
      { phrase: 'Ach so', translation: 'Oh, I see / I understand now', example: 'Ach so, jetzt verstehe ich das.', example_translation: 'Oh I see, now I understand.' },
      { phrase: 'Okay / In Ordnung', translation: 'Okay / Alright', example: 'In Ordnung, ich komme morgen.', example_translation: 'Alright, I\'ll come tomorrow.' },
      { phrase: 'Sehr gut', translation: 'Very good', example: 'Sehr gut! Du hast alles richtig gemacht.', example_translation: 'Very good! You did everything right.' },
      { phrase: 'Kein Problem', translation: 'No problem', example: 'Kein Problem, ich helfe dir gerne.', example_translation: 'No problem, I\'m happy to help you.' },
      { phrase: 'Tut mir leid', translation: 'I\'m sorry', example: 'Tut mir leid, ich bin zu spät.', example_translation: 'I\'m sorry, I am late.' },
      { phrase: 'Natürlich', translation: 'Of course / Naturally', example: 'Natürlich kann ich das machen.', example_translation: 'Of course I can do that.' },
      { phrase: 'Gern / Gerne', translation: 'Gladly / With pleasure', example: 'Ich helfe dir gerne.', example_translation: 'I\'ll gladly help you.' },
      { phrase: 'Prima!', translation: 'Great! / Excellent!', example: 'Prima! Das hast du gut gemacht.', example_translation: 'Great! You did that well.' },
      { phrase: 'Wirklich?', translation: 'Really? / Is that so?', example: 'Wirklich? Das wusste ich nicht!', example_translation: 'Really? I didn\'t know that!' },
      { phrase: 'Schon', translation: 'Already / Indeed', example: 'Ich bin schon fertig.', example_translation: 'I\'m already done.' },
      { phrase: 'Noch', translation: 'Still / Yet / Another', example: 'Ich habe noch eine Frage.', example_translation: 'I have one more question.' },
      { phrase: 'Auch', translation: 'Also / Too / As well', example: 'Ich komme auch mit.', example_translation: 'I\'ll come along too.' },
      { phrase: 'Vielleicht', translation: 'Maybe / Perhaps', example: 'Vielleicht komme ich später.', example_translation: 'Maybe I\'ll come later.' },
      { phrase: 'Immer', translation: 'Always', example: 'Er kommt immer zu spät.', example_translation: 'He always comes late.' },
      { phrase: 'Nie', translation: 'Never', example: 'Ich esse nie Fleisch.', example_translation: 'I never eat meat.' },
      { phrase: 'Manchmal', translation: 'Sometimes', example: 'Manchmal gehe ich ins Kino.', example_translation: 'Sometimes I go to the cinema.' },
    ],
  },
  {
    level: 'A2',
    color: '#0891B2',
    bg: 'rgba(8,145,178,.1)',
    phrases: [
      { phrase: 'Na ja', translation: 'Well... / Sort of', example: 'Na ja, das ist nicht so einfach.', example_translation: 'Well, that\'s not so easy.' },
      { phrase: 'Also', translation: 'So / Well then', example: 'Also, was machen wir jetzt?', example_translation: 'So, what do we do now?' },
      { phrase: 'Eigentlich', translation: 'Actually / Basically', example: 'Eigentlich wollte ich heute lernen.', example_translation: 'Actually, I wanted to study today.' },
      { phrase: 'Übrigens', translation: 'By the way', example: 'Übrigens, morgen ist mein Geburtstag.', example_translation: 'By the way, tomorrow is my birthday.' },
      { phrase: 'Zum Beispiel (z.B.)', translation: 'For example (e.g.)', example: 'Ich mag Obst, zum Beispiel Äpfel und Bananen.', example_translation: 'I like fruit, for example apples and bananas.' },
      { phrase: 'Das stimmt', translation: 'That\'s right / That\'s true', example: 'Das stimmt, du hast recht.', example_translation: 'That\'s right, you are correct.' },
      { phrase: 'Ich meine', translation: 'I mean / What I mean is', example: 'Ich meine, wir sollten früher anfangen.', example_translation: 'I mean, we should start earlier.' },
      { phrase: 'Oder?', translation: 'Right? / Don\'t you think?', example: 'Das war ein schöner Tag, oder?', example_translation: 'That was a nice day, right?' },
      { phrase: 'Dann', translation: 'Then / In that case', example: 'Dann gehen wir zusammen zum Markt.', example_translation: 'Then we\'ll go to the market together.' },
      { phrase: 'Doch', translation: 'Yes (contradicting) / But / Still', example: 'Doch, das ist richtig!', example_translation: 'Yes it is, that is correct!' },
      { phrase: 'Nämlich', translation: 'You see / That is to say / Namely', example: 'Ich kann nicht kommen, ich bin nämlich krank.', example_translation: 'I can\'t come, you see I\'m sick.' },
      { phrase: 'Halt / Eben', translation: 'Just / Simply / That\'s how it is', example: 'Das ist halt so. / Das ist eben so.', example_translation: 'That\'s just how it is.' },
      { phrase: 'Denn', translation: 'Because / Since / For', example: 'Ich gehe nicht raus, denn es regnet.', example_translation: 'I\'m not going out because it\'s raining.' },
      { phrase: 'Zuerst', translation: 'First / At first', example: 'Zuerst mache ich meine Hausaufgaben.', example_translation: 'First I do my homework.' },
      { phrase: 'Dann … danach', translation: 'Then … after that', example: 'Ich esse zuerst, dann gehe ich spazieren.', example_translation: 'I eat first, then I go for a walk.' },
      { phrase: 'Am Ende / Zum Schluss', translation: 'At the end / Finally', example: 'Zum Schluss trinken wir Kaffee.', example_translation: 'Finally, we drink coffee.' },
      { phrase: 'Meistens', translation: 'Usually / Most of the time', example: 'Meistens stehe ich um sieben Uhr auf.', example_translation: 'Usually I get up at seven o\'clock.' },
      { phrase: 'Zusammen', translation: 'Together', example: 'Wir machen das zusammen.', example_translation: 'We\'ll do that together.' },
      { phrase: 'So etwas', translation: 'Something like that / That kind of thing', example: 'Ich mag so etwas nicht.', example_translation: 'I don\'t like that kind of thing.' },
      { phrase: 'Na und?', translation: 'So what? / And?', example: 'Na und? Das ist doch kein Problem!', example_translation: 'So what? That\'s not a problem!' },
      { phrase: 'Sowas', translation: 'Something like that / Such a thing', example: 'Sowas habe ich noch nie gesehen.', example_translation: 'I\'ve never seen something like that.' },
      { phrase: 'Wie gesagt', translation: 'As I said / As I mentioned', example: 'Wie gesagt, ich komme um drei Uhr.', example_translation: 'As I said, I\'ll come at three o\'clock.' },
      { phrase: 'Ungefähr', translation: 'Approximately / About', example: 'Das kostet ungefähr zwanzig Euro.', example_translation: 'That costs approximately twenty euros.' },
      { phrase: 'Irgendwie', translation: 'Somehow / In some way', example: 'Das ist irgendwie komisch.', example_translation: 'That is somehow strange.' },
      { phrase: 'Ich glaube', translation: 'I think / I believe', example: 'Ich glaube, das ist eine gute Idee.', example_translation: 'I think that is a good idea.' },
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
      { phrase: 'Einerseits… andererseits', translation: 'On one hand… on the other hand', example: 'Einerseits ist es teuer, andererseits ist die Qualität gut.', example_translation: 'On one hand it\'s expensive, on the other hand the quality is good.' },
      { phrase: 'Auf der einen Seite… auf der anderen Seite', translation: 'On one side… on the other side', example: 'Auf der einen Seite ist das praktisch, auf der anderen Seite riskant.', example_translation: 'On one side it\'s practical, on the other side risky.' },
      { phrase: 'Im Allgemeinen', translation: 'In general / Generally speaking', example: 'Im Allgemeinen esse ich gesund.', example_translation: 'In general, I eat healthily.' },
      { phrase: 'Zum Beispiel', translation: 'For example', example: 'Es gibt viele Möglichkeiten, zum Beispiel Schwimmen oder Radfahren.', example_translation: 'There are many options, for example swimming or cycling.' },
      { phrase: 'Was mich betrifft', translation: 'As for me / As far as I\'m concerned', example: 'Was mich betrifft, bin ich damit einverstanden.', example_translation: 'As for me, I agree with that.' },
      { phrase: 'Im Gegenteil', translation: 'On the contrary / Quite the opposite', example: 'Das ist nicht langweilig – im Gegenteil, es ist sehr spannend.', example_translation: 'That\'s not boring – on the contrary, it\'s very exciting.' },
      { phrase: 'Sowohl… als auch', translation: 'Both… and / Not only… but also', example: 'Sie spricht sowohl Englisch als auch Französisch.', example_translation: 'She speaks both English and French.' },
      { phrase: 'Entweder… oder', translation: 'Either… or', example: 'Wir gehen entweder ins Kino oder ins Theater.', example_translation: 'We either go to the cinema or the theatre.' },
      { phrase: 'Weder… noch', translation: 'Neither… nor', example: 'Ich habe weder Hunger noch Durst.', example_translation: 'I\'m neither hungry nor thirsty.' },
      { phrase: 'Zwar… aber', translation: 'Admittedly… but / True… but', example: 'Das Buch ist zwar lang, aber sehr interessant.', example_translation: 'The book is admittedly long, but very interesting.' },
      { phrase: 'Ich finde, dass…', translation: 'I think that… / I find that…', example: 'Ich finde, dass wir mehr Zeit brauchen.', example_translation: 'I think that we need more time.' },
      { phrase: 'Das hängt davon ab', translation: 'That depends / It depends on that', example: 'Das hängt davon ab, wie viel es kostet.', example_translation: 'That depends on how much it costs.' },
      { phrase: 'Heutzutage', translation: 'Nowadays / These days', example: 'Heutzutage benutzen alle Smartphones.', example_translation: 'Nowadays everyone uses smartphones.' },
      { phrase: 'Früher', translation: 'In the past / Previously / Before', example: 'Früher war alles anders.', example_translation: 'Things were different in the past.' },
      { phrase: 'Überhaupt', translation: 'At all / In general / Anyway', example: 'Das interessiert mich überhaupt nicht.', example_translation: 'That doesn\'t interest me at all.' },
      { phrase: 'Jedenfalls', translation: 'At any rate / In any case / Anyway', example: 'Jedenfalls war es ein schöner Abend.', example_translation: 'At any rate, it was a nice evening.' },
      { phrase: 'Schließlich', translation: 'After all / Finally / Eventually', example: 'Schließlich ist er mein bester Freund.', example_translation: 'After all, he is my best friend.' },
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
      { phrase: 'Darüber hinaus', translation: 'Furthermore / Moreover / Beyond that', example: 'Darüber hinaus gibt es noch weitere Vorteile.', example_translation: 'Furthermore, there are additional advantages.' },
      { phrase: 'Im Vergleich dazu', translation: 'In comparison / By comparison', example: 'Im Vergleich dazu ist dieses Modell viel günstiger.', example_translation: 'In comparison, this model is much cheaper.' },
      { phrase: 'Wie dem auch sei', translation: 'Be that as it may / However that may be', example: 'Wie dem auch sei, wir müssen jetzt eine Entscheidung treffen.', example_translation: 'Be that as it may, we need to make a decision now.' },
      { phrase: 'Unter anderem (u.a.)', translation: 'Among other things / Including', example: 'Er spricht unter anderem Spanisch und Portugiesisch.', example_translation: 'He speaks, among other things, Spanish and Portuguese.' },
      { phrase: 'In diesem Zusammenhang', translation: 'In this context / In this regard', example: 'In diesem Zusammenhang ist es wichtig zu erwähnen, dass…', example_translation: 'In this context, it is important to mention that…' },
      { phrase: 'Vor allem', translation: 'Above all / Especially / Most importantly', example: 'Vor allem muss man ehrlich sein.', example_translation: 'Above all, one must be honest.' },
      { phrase: 'Im Nachhinein', translation: 'In hindsight / Looking back / With hindsight', example: 'Im Nachhinein war das die falsche Entscheidung.', example_translation: 'In hindsight, that was the wrong decision.' },
      { phrase: 'Einerseits… wiederum', translation: 'On one hand… on the other', example: 'Das Projekt ist einerseits kostspielig, wiederum sehr lohnend.', example_translation: 'The project is on one hand costly, on the other very rewarding.' },
      { phrase: 'In Anbetracht', translation: 'In view of / Considering', example: 'In Anbetracht der Umstände war das eine gute Lösung.', example_translation: 'In view of the circumstances, that was a good solution.' },
      { phrase: 'Sei es… oder', translation: 'Whether… or / Be it… or', example: 'Sei es durch Arbeit oder Zufall, er hat Erfolg.', example_translation: 'Whether through work or chance, he is successful.' },
      { phrase: 'Beziehungsweise (bzw.)', translation: 'Or rather / Respectively / That is', example: 'Schreib mir eine E-Mail bzw. ruf mich an.', example_translation: 'Write me an email, or rather call me.' },
      { phrase: 'Das heißt (d.h.)', translation: 'That is / That means / I.e.', example: 'Er ist introvertiert, d.h. er braucht viel Zeit für sich.', example_translation: 'He is introverted, that is, he needs a lot of time to himself.' },
      { phrase: 'Dementsprechend', translation: 'Accordingly / Consequently / In line with this', example: 'Die Preise stiegen, dementsprechend sank der Konsum.', example_translation: 'Prices rose, accordingly consumption fell.' },
      { phrase: 'Zumal', translation: 'Especially since / All the more because', example: 'Das war falsch, zumal er es besser wissen sollte.', example_translation: 'That was wrong, especially since he should have known better.' },
      { phrase: 'Allerdings', translation: 'However / Although / Admittedly', example: 'Das Essen war gut, allerdings sehr teuer.', example_translation: 'The food was good, however very expensive.' },
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
      { phrase: 'Überdies', translation: 'Moreover / Furthermore / In addition', example: 'Überdies hat sie mehrere Auszeichnungen gewonnen.', example_translation: 'Moreover, she has won several awards.' },
      { phrase: 'Indes / Indessen', translation: 'However / Meanwhile / In the meantime', example: 'Er sprach ruhig, indes wurde die Situation immer angespannter.', example_translation: 'He spoke calmly, meanwhile the situation grew increasingly tense.' },
      { phrase: 'Sofern', translation: 'Provided that / As long as / If', example: 'Sofern nichts dazwischenkommt, sind wir morgen fertig.', example_translation: 'Provided nothing comes up, we\'ll be done tomorrow.' },
      { phrase: 'Zufolge', translation: 'According to / As a result of', example: 'Einem Bericht zufolge stiegen die Preise drastisch.', example_translation: 'According to a report, prices rose drastically.' },
      { phrase: 'Mitunter', translation: 'Sometimes / Occasionally / At times', example: 'Das Wetter ist mitunter sehr unberechenbar.', example_translation: 'The weather is sometimes very unpredictable.' },
      { phrase: 'Kaum… da', translation: 'No sooner… than / Hardly… when', example: 'Kaum war er angekommen, da musste er wieder abreisen.', example_translation: 'No sooner had he arrived than he had to leave again.' },
      { phrase: 'Umso mehr / umso weniger', translation: 'All the more / All the less', example: 'Je schwieriger die Aufgabe, umso mehr muss man üben.', example_translation: 'The harder the task, all the more one must practice.' },
      { phrase: 'Wohingegen', translation: 'Whereas / While / In contrast to', example: 'Er bevorzugt klassische Musik, wohingegen sie Jazz liebt.', example_translation: 'He prefers classical music, whereas she loves jazz.' },
      { phrase: 'Unbeschadet dessen', translation: 'Notwithstanding / Without prejudice to', example: 'Unbeschadet dessen bleibt das Grundprinzip unverändert.', example_translation: 'Notwithstanding that, the basic principle remains unchanged.' },
      { phrase: 'Im Zuge (+ Gen.)', translation: 'In the course of / As part of', example: 'Im Zuge der Digitalisierung entstanden neue Berufe.', example_translation: 'In the course of digitisation, new professions emerged.' },
      { phrase: 'Kurzum', translation: 'In short / To put it briefly / In a nutshell', example: 'Kurzum, das Projekt war ein Misserfolg.', example_translation: 'In short, the project was a failure.' },
      { phrase: 'Schlechterdings', translation: 'Simply / Absolutely / Without question', example: 'Das ist schlechterdings unmöglich zu akzeptieren.', example_translation: 'That is simply impossible to accept.' },
      { phrase: 'Wohlgemerkt', translation: 'Mind you / Note well / Bear in mind', example: 'Wohlgemerkt, das ist nur meine persönliche Meinung.', example_translation: 'Mind you, that is only my personal opinion.' },
      { phrase: 'Stellenweise', translation: 'In places / In parts / At some points', example: 'Der Text ist stellenweise schwer zu verstehen.', example_translation: 'The text is in places difficult to understand.' },
      { phrase: 'Ausgerechnet', translation: 'Of all things / Of all people / Precisely', example: 'Ausgerechnet heute kommt er zu spät.', example_translation: 'Of all days, he\'s late today.' },
    ],
  },
  {
    level: 'C2',
    color: '#1E40AF',
    bg: 'rgba(30,64,175,.1)',
    phrases: [
      { phrase: 'Mutmaßlich', translation: 'Presumably / Supposedly / Allegedly', example: 'Mutmaßlich waren externe Faktoren für das Scheitern verantwortlich.', example_translation: 'Presumably, external factors were responsible for the failure.' },
      { phrase: 'Unter dem Strich', translation: 'At the end of the day / When all is said and done', example: 'Unter dem Strich war das Projekt trotz allem ein Erfolg.', example_translation: 'At the end of the day, the project was a success despite everything.' },
      { phrase: 'Im Übrigen', translation: 'Incidentally / Moreover / By the way (formal)', example: 'Im Übrigen wurde das Thema bereits ausführlich diskutiert.', example_translation: 'Incidentally, the topic has already been discussed extensively.' },
      { phrase: 'Dahingehend', translation: 'To that effect / In that regard / In that direction', example: 'Die Aussagen des Ministers sind dahingehend zu interpretieren.', example_translation: 'The minister\'s statements are to be interpreted in that regard.' },
      { phrase: 'Schwerlich', translation: 'Hardly / Scarcely / With difficulty (formal)', example: 'Diese These lässt sich schwerlich mit den Fakten vereinbaren.', example_translation: 'This thesis can hardly be reconciled with the facts.' },
      { phrase: 'Angesichts der Tatsache, dass', translation: 'In view of the fact that / Given that', example: 'Angesichts der Tatsache, dass die Zeit knapp ist, müssen wir handeln.', example_translation: 'In view of the fact that time is short, we must act.' },
      { phrase: 'Insofern als', translation: 'Insofar as / To the extent that', example: 'Das ist zutreffend, insofern als man den Kontext berücksichtigt.', example_translation: 'That is accurate insofar as one considers the context.' },
      { phrase: 'Nichtsdestoweniger', translation: 'Nevertheless / Nonetheless (formal)', example: 'Die Kritik war berechtigt, nichtsdestoweniger wurde das Projekt genehmigt.', example_translation: 'The criticism was justified, nevertheless the project was approved.' },
      { phrase: 'Es erübrigt sich zu sagen', translation: 'It goes without saying / Needless to say', example: 'Es erübrigt sich zu sagen, dass Pünktlichkeit hier erwartet wird.', example_translation: 'It goes without saying that punctuality is expected here.' },
      { phrase: 'Gleichsam', translation: 'As it were / So to speak / In a sense', example: 'Er ist gleichsam der Architekt dieser ganzen Bewegung.', example_translation: 'He is, as it were, the architect of this entire movement.' },
      { phrase: 'Vermöge', translation: 'By virtue of / By means of / Thanks to', example: 'Vermöge seiner Erfahrung löste er das Problem mühelos.', example_translation: 'By virtue of his experience, he solved the problem effortlessly.' },
      { phrase: 'Kraft (+ Gen.)', translation: 'By virtue of / By the power of (formal)', example: 'Kraft seines Amtes hat er diese Entscheidung getroffen.', example_translation: 'By virtue of his office, he made this decision.' },
      { phrase: 'Nolens volens', translation: 'Willy-nilly / Whether one likes it or not', example: 'Er musste nolens volens zustimmen.', example_translation: 'He had to agree, whether he liked it or not.' },
      { phrase: 'Mitnichten', translation: 'By no means / Not at all (literary)', example: 'Das ist mitnichten eine einfache Angelegenheit.', example_translation: 'That is by no means a simple matter.' },
      { phrase: 'Gleichwohl sei angemerkt', translation: 'Nevertheless it should be noted', example: 'Gleichwohl sei angemerkt, dass die Datenlage dünn ist.', example_translation: 'Nevertheless it should be noted that the data basis is thin.' },
      { phrase: 'Augenscheinlich', translation: 'Apparently / Evidently / Ostensibly', example: 'Augenscheinlich hat niemand das Problem ernst genommen.', example_translation: 'Apparently, nobody took the problem seriously.' },
      { phrase: 'Dessen ungeachtet', translation: 'Despite that / Regardless of that / Notwithstanding', example: 'Dessen ungeachtet hielt sie an ihrer Position fest.', example_translation: 'Despite that, she held to her position.' },
      { phrase: 'Vermeintlich', translation: 'Supposedly / Allegedly / Ostensibly', example: 'Die vermeintlich einfache Aufgabe erwies sich als schwierig.', example_translation: 'The supposedly simple task turned out to be difficult.' },
      { phrase: 'Dergestalt, dass', translation: 'In such a way that / To such an extent that', example: 'Die Lage verschlechterte sich dergestalt, dass Maßnahmen ergriffen werden mussten.', example_translation: 'The situation deteriorated to such an extent that measures had to be taken.' },
      { phrase: 'Im Wesentlichen', translation: 'Essentially / In essence / Fundamentally', example: 'Im Wesentlichen stimmen beide Parteien überein.', example_translation: 'Essentially, both parties are in agreement.' },
      { phrase: 'Weit gefehlt', translation: 'Far from it / Not at all / Quite the contrary', example: 'Weit gefehlt — das Problem ist damit nicht gelöst.', example_translation: 'Far from it — the problem is not solved by that.' },
      { phrase: 'Wider Erwarten', translation: 'Contrary to expectations / Against all odds', example: 'Wider Erwarten hat das Experiment funktioniert.', example_translation: 'Contrary to expectations, the experiment worked.' },
      { phrase: 'Es steht außer Frage', translation: 'It is beyond question / There is no question', example: 'Es steht außer Frage, dass grundlegende Reformen nötig sind.', example_translation: 'It is beyond question that fundamental reforms are necessary.' },
      { phrase: 'Nicht von ungefähr', translation: 'Not without reason / Not by accident', example: 'Nicht von ungefähr gilt sie als die beste Expertin auf diesem Gebiet.', example_translation: 'Not without reason is she considered the best expert in this field.' },
      { phrase: 'In Ermangelung (+ Gen.)', translation: 'In the absence of / For lack of', example: 'In Ermangelung besserer Alternativen wählen wir diesen Ansatz.', example_translation: 'In the absence of better alternatives, we choose this approach.' },
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
