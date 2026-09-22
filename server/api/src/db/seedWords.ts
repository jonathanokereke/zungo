import { db } from './index'
import { words, reviews, word_bank } from './schema'
import { eq, inArray } from 'drizzle-orm'

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

// Level ordering for "include all levels up to X" queries
const CEFR_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// Index boundaries: each entry = (start index, level). Entries are arranged in the
// WORD_BANK array in CEFR order so this maps index ranges to levels.
const LEVEL_BOUNDARIES: { start: number; level: CefrLevel }[] = [
  { start: 0, level: 'A1' },
  { start: 40, level: 'A2' },
  { start: 60, level: 'B1' },
  { start: 115, level: 'B2' },
  { start: 164, level: 'C1' },
  { start: 209, level: 'C2' },
]

function getLevelForIndex(i: number): CefrLevel {
  let level: CefrLevel = 'A1'
  for (const b of LEVEL_BOUNDARIES) {
    if (i >= b.start) level = b.level
  }
  return level
}

// 350 words spanning A1–C2
const WORD_BANK = [
  // ── A1 Nouns ──────────────────────────────────────────────────────────────
  { german: 'der Apfel', translation: 'apple', part_of_speech: 'noun', example_sentence: 'Ich esse jeden Tag einen Apfel.' },
  { german: 'das Buch', translation: 'book', part_of_speech: 'noun', example_sentence: 'Das Buch liegt auf dem Tisch.' },
  { german: 'die Stadt', translation: 'city / town', part_of_speech: 'noun', example_sentence: 'Berlin ist eine große Stadt.' },
  { german: 'der Hund', translation: 'dog', part_of_speech: 'noun', example_sentence: 'Der Hund bellt laut.' },
  { german: 'die Katze', translation: 'cat', part_of_speech: 'noun', example_sentence: 'Die Katze schläft auf dem Sofa.' },
  { german: 'das Haus', translation: 'house', part_of_speech: 'noun', example_sentence: 'Wir wohnen in einem alten Haus.' },
  { german: 'die Schule', translation: 'school', part_of_speech: 'noun', example_sentence: 'Die Kinder gehen jeden Tag zur Schule.' },
  { german: 'der Freund', translation: 'friend (male)', part_of_speech: 'noun', example_sentence: 'Mein Freund heißt Thomas.' },
  { german: 'die Freundin', translation: 'friend (female) / girlfriend', part_of_speech: 'noun', example_sentence: 'Meine Freundin kommt heute zu Besuch.' },
  { german: 'das Kind', translation: 'child', part_of_speech: 'noun', example_sentence: 'Das Kind spielt im Garten.' },
  { german: 'das Wasser', translation: 'water', part_of_speech: 'noun', example_sentence: 'Ich trinke viel Wasser.' },
  { german: 'das Geld', translation: 'money', part_of_speech: 'noun', example_sentence: 'Er hat nicht genug Geld.' },
  { german: 'die Zeit', translation: 'time', part_of_speech: 'noun', example_sentence: 'Ich habe keine Zeit.' },
  { german: 'die Hand', translation: 'hand', part_of_speech: 'noun', example_sentence: 'Sie wäscht ihre Hände.' },
  { german: 'die Straße', translation: 'street / road', part_of_speech: 'noun', example_sentence: 'Die Straße ist sehr breit.' },
  { german: 'das Auto', translation: 'car', part_of_speech: 'noun', example_sentence: 'Das Auto fährt schnell.' },
  { german: 'der Zug', translation: 'train', part_of_speech: 'noun', example_sentence: 'Der Zug hat Verspätung.' },
  { german: 'das Flugzeug', translation: 'airplane', part_of_speech: 'noun', example_sentence: 'Das Flugzeug landet in einer Stunde.' },
  { german: 'der Arzt', translation: 'doctor (male)', part_of_speech: 'noun', example_sentence: 'Der Arzt untersucht den Patienten.' },
  { german: 'die Ärztin', translation: 'doctor (female)', part_of_speech: 'noun', example_sentence: 'Die Ärztin gibt mir ein Rezept.' },

  // ── A1 Verbs ──────────────────────────────────────────────────────────────
  { german: 'essen', translation: 'to eat', part_of_speech: 'verb', example_sentence: 'Ich esse gerne Pasta.' },
  { german: 'trinken', translation: 'to drink', part_of_speech: 'verb', example_sentence: 'Sie trinkt morgens Kaffee.' },
  { german: 'schlafen', translation: 'to sleep', part_of_speech: 'verb', example_sentence: 'Das Baby schläft viel.' },
  { german: 'arbeiten', translation: 'to work', part_of_speech: 'verb', example_sentence: 'Er arbeitet bei einer Bank.' },
  { german: 'lernen', translation: 'to learn / to study', part_of_speech: 'verb', example_sentence: 'Ich lerne Deutsch.' },
  { german: 'spielen', translation: 'to play', part_of_speech: 'verb', example_sentence: 'Die Kinder spielen draußen.' },
  { german: 'lesen', translation: 'to read', part_of_speech: 'verb', example_sentence: 'Er liest jeden Abend ein Buch.' },
  { german: 'schreiben', translation: 'to write', part_of_speech: 'verb', example_sentence: 'Sie schreibt einen Brief.' },
  { german: 'kaufen', translation: 'to buy', part_of_speech: 'verb', example_sentence: 'Ich kaufe Brot im Supermarkt.' },
  { german: 'kommen', translation: 'to come', part_of_speech: 'verb', example_sentence: 'Kommst du heute Abend?' },

  // ── A1/A2 Adjectives ──────────────────────────────────────────────────────
  { german: 'groß', translation: 'big / tall', part_of_speech: 'adjective', example_sentence: 'Er ist sehr groß.' },
  { german: 'klein', translation: 'small / short', part_of_speech: 'adjective', example_sentence: 'Die Wohnung ist klein, aber gemütlich.' },
  { german: 'schnell', translation: 'fast / quick', part_of_speech: 'adjective', example_sentence: 'Das ist eine schnelle Lösung.' },
  { german: 'langsam', translation: 'slow', part_of_speech: 'adjective', example_sentence: 'Bitte fahren Sie langsamer.' },
  { german: 'neu', translation: 'new', part_of_speech: 'adjective', example_sentence: 'Ich habe ein neues Handy.' },
  { german: 'alt', translation: 'old', part_of_speech: 'adjective', example_sentence: 'Das ist ein altes Gebäude.' },
  { german: 'gut', translation: 'good', part_of_speech: 'adjective', example_sentence: 'Das Essen schmeckt gut.' },
  { german: 'schlecht', translation: 'bad', part_of_speech: 'adjective', example_sentence: 'Das Wetter ist schlecht.' },
  { german: 'warm', translation: 'warm', part_of_speech: 'adjective', example_sentence: 'Es ist heute sehr warm.' },
  { german: 'kalt', translation: 'cold', part_of_speech: 'adjective', example_sentence: 'Im Winter ist es kalt.' },

  // ── A2 Nouns ──────────────────────────────────────────────────────────────
  { german: 'die Reise', translation: 'journey / trip', part_of_speech: 'noun', example_sentence: 'Die Reise nach Italien war wunderschön.' },
  { german: 'der Beruf', translation: 'occupation / profession', part_of_speech: 'noun', example_sentence: 'Was ist dein Beruf?' },
  { german: 'die Sprache', translation: 'language', part_of_speech: 'noun', example_sentence: 'Deutsch ist eine schwierige Sprache.' },
  { german: 'die Gesundheit', translation: 'health', part_of_speech: 'noun', example_sentence: 'Gesundheit ist das Wichtigste.' },
  { german: 'die Familie', translation: 'family', part_of_speech: 'noun', example_sentence: 'Meine Familie kommt aus München.' },
  { german: 'das Wetter', translation: 'weather', part_of_speech: 'noun', example_sentence: 'Das Wetter ist heute schön.' },
  { german: 'die Arbeit', translation: 'work / job', part_of_speech: 'noun', example_sentence: 'Die Arbeit macht mir Spaß.' },
  { german: 'das Problem', translation: 'problem', part_of_speech: 'noun', example_sentence: 'Das ist kein großes Problem.' },
  { german: 'die Antwort', translation: 'answer / reply', part_of_speech: 'noun', example_sentence: 'Ich warte auf deine Antwort.' },
  { german: 'der Unterschied', translation: 'difference', part_of_speech: 'noun', example_sentence: 'Was ist der Unterschied?' },

  // ── A2 Verbs ──────────────────────────────────────────────────────────────
  { german: 'verstehen', translation: 'to understand', part_of_speech: 'verb', example_sentence: 'Ich verstehe das nicht.' },
  { german: 'erklären', translation: 'to explain', part_of_speech: 'verb', example_sentence: 'Können Sie das erklären?' },
  { german: 'helfen', translation: 'to help', part_of_speech: 'verb', example_sentence: 'Kann ich Ihnen helfen?' },
  { german: 'fragen', translation: 'to ask', part_of_speech: 'verb', example_sentence: 'Ich möchte dich etwas fragen.' },
  { german: 'antworten', translation: 'to answer / to reply', part_of_speech: 'verb', example_sentence: 'Er hat noch nicht geantwortet.' },
  { german: 'beginnen', translation: 'to begin / to start', part_of_speech: 'verb', example_sentence: 'Der Kurs beginnt um neun Uhr.' },
  { german: 'beenden', translation: 'to end / to finish', part_of_speech: 'verb', example_sentence: 'Ich muss die Aufgabe beenden.' },
  { german: 'brauchen', translation: 'to need', part_of_speech: 'verb', example_sentence: 'Ich brauche mehr Zeit.' },
  { german: 'vergessen', translation: 'to forget', part_of_speech: 'verb', example_sentence: 'Vergiss mich nicht!' },
  { german: 'denken', translation: 'to think', part_of_speech: 'verb', example_sentence: 'Was denkst du darüber?' },

  // ── B1 Nouns ──────────────────────────────────────────────────────────────
  { german: 'die Meinung', translation: 'opinion', part_of_speech: 'noun', example_sentence: 'Meiner Meinung nach ist das falsch.' },
  { german: 'die Erfahrung', translation: 'experience', part_of_speech: 'noun', example_sentence: 'Er hat viel Erfahrung in diesem Bereich.' },
  { german: 'die Lösung', translation: 'solution', part_of_speech: 'noun', example_sentence: 'Wir müssen eine Lösung finden.' },
  { german: 'die Möglichkeit', translation: 'possibility / opportunity', part_of_speech: 'noun', example_sentence: 'Es gibt viele Möglichkeiten.' },
  { german: 'der Einfluss', translation: 'influence', part_of_speech: 'noun', example_sentence: 'Die Medien haben großen Einfluss.' },
  { german: 'die Entscheidung', translation: 'decision', part_of_speech: 'noun', example_sentence: 'Das ist eine wichtige Entscheidung.' },
  { german: 'die Entwicklung', translation: 'development', part_of_speech: 'noun', example_sentence: 'Die technologische Entwicklung ist beeindruckend.' },
  { german: 'der Zusammenhang', translation: 'context / connection', part_of_speech: 'noun', example_sentence: 'Das muss man im Zusammenhang sehen.' },
  { german: 'die Gesellschaft', translation: 'society', part_of_speech: 'noun', example_sentence: 'Die Gesellschaft verändert sich ständig.' },
  { german: 'der Vorteil', translation: 'advantage', part_of_speech: 'noun', example_sentence: 'Was sind die Vorteile dieser Methode?' },
  { german: 'der Nachteil', translation: 'disadvantage', part_of_speech: 'noun', example_sentence: 'Jede Lösung hat ihre Nachteile.' },
  { german: 'die Verantwortung', translation: 'responsibility', part_of_speech: 'noun', example_sentence: 'Das liegt in deiner Verantwortung.' },
  { german: 'der Fortschritt', translation: 'progress', part_of_speech: 'noun', example_sentence: 'Der wissenschaftliche Fortschritt ist rasant.' },
  { german: 'die Herausforderung', translation: 'challenge', part_of_speech: 'noun', example_sentence: 'Das ist eine große Herausforderung.' },
  { german: 'das Ziel', translation: 'goal / aim / destination', part_of_speech: 'noun', example_sentence: 'Was ist dein langfristiges Ziel?' },
  { german: 'die Umgebung', translation: 'surroundings / environment', part_of_speech: 'noun', example_sentence: 'Er fühlt sich in seiner Umgebung wohl.' },
  { german: 'der Grund', translation: 'reason / cause', part_of_speech: 'noun', example_sentence: 'Was ist der Grund dafür?' },
  { german: 'die Folge', translation: 'consequence / result', part_of_speech: 'noun', example_sentence: 'Die Folgen des Klimawandels sind ernst.' },
  { german: 'die Gefahr', translation: 'danger', part_of_speech: 'noun', example_sentence: 'Es besteht keine Gefahr.' },
  { german: 'die Gelegenheit', translation: 'opportunity / occasion', part_of_speech: 'noun', example_sentence: 'Das ist eine einmalige Gelegenheit.' },

  // ── B1 Verbs ──────────────────────────────────────────────────────────────
  { german: 'vergleichen', translation: 'to compare', part_of_speech: 'verb', example_sentence: 'Man sollte die Preise vergleichen.' },
  { german: 'beschreiben', translation: 'to describe', part_of_speech: 'verb', example_sentence: 'Können Sie die Situation beschreiben?' },
  { german: 'entscheiden', translation: 'to decide', part_of_speech: 'verb', example_sentence: 'Ich kann mich nicht entscheiden.' },
  { german: 'verbessern', translation: 'to improve', part_of_speech: 'verb', example_sentence: 'Ich möchte mein Deutsch verbessern.' },
  { german: 'vorschlagen', translation: 'to suggest / to propose', part_of_speech: 'verb', example_sentence: 'Darf ich etwas vorschlagen?' },
  { german: 'vermeiden', translation: 'to avoid', part_of_speech: 'verb', example_sentence: 'Wir sollten Missverständnisse vermeiden.' },
  { german: 'ermöglichen', translation: 'to enable / to make possible', part_of_speech: 'verb', example_sentence: 'Technologie ermöglicht neue Arbeitsformen.' },
  { german: 'überzeugen', translation: 'to convince / to persuade', part_of_speech: 'verb', example_sentence: 'Er konnte mich nicht überzeugen.' },
  { german: 'beeinflussen', translation: 'to influence', part_of_speech: 'verb', example_sentence: 'Die Umgebung beeinflusst uns stark.' },
  { german: 'berücksichtigen', translation: 'to consider / to take into account', part_of_speech: 'verb', example_sentence: 'Das müssen wir berücksichtigen.' },
  { german: 'erkennen', translation: 'to recognize / to realize', part_of_speech: 'verb', example_sentence: 'Ich habe das Problem erkannt.' },
  { german: 'betonen', translation: 'to emphasize / to stress', part_of_speech: 'verb', example_sentence: 'Ich möchte betonen, wie wichtig das ist.' },
  { german: 'feststellen', translation: 'to establish / to note / to find', part_of_speech: 'verb', example_sentence: 'Man hat festgestellt, dass die Zahlen stimmen.' },
  { german: 'erfordern', translation: 'to require / to demand', part_of_speech: 'verb', example_sentence: 'Die Aufgabe erfordert viel Geduld.' },
  { german: 'zusammenfassen', translation: 'to summarize', part_of_speech: 'verb', example_sentence: 'Können Sie kurz zusammenfassen?' },

  // ── B1 Adjectives ─────────────────────────────────────────────────────────
  { german: 'wichtig', translation: 'important', part_of_speech: 'adjective', example_sentence: 'Das ist eine wichtige Frage.' },
  { german: 'schwierig', translation: 'difficult', part_of_speech: 'adjective', example_sentence: 'Das ist eine schwierige Situation.' },
  { german: 'möglich', translation: 'possible', part_of_speech: 'adjective', example_sentence: 'Das ist durchaus möglich.' },
  { german: 'notwendig', translation: 'necessary', part_of_speech: 'adjective', example_sentence: 'Ist das wirklich notwendig?' },
  { german: 'erfolgreich', translation: 'successful', part_of_speech: 'adjective', example_sentence: 'Sie ist eine sehr erfolgreiche Unternehmerin.' },
  { german: 'unterschiedlich', translation: 'different / varied', part_of_speech: 'adjective', example_sentence: 'Die Meinungen sind sehr unterschiedlich.' },
  { german: 'bedeutend', translation: 'significant / important', part_of_speech: 'adjective', example_sentence: 'Das ist ein bedeutender Unterschied.' },
  { german: 'wesentlich', translation: 'essential / substantial', part_of_speech: 'adjective', example_sentence: 'Das ist ein wesentlicher Punkt.' },
  { german: 'ausreichend', translation: 'sufficient / adequate', part_of_speech: 'adjective', example_sentence: 'Die Zeit ist nicht ausreichend.' },
  { german: 'erheblich', translation: 'considerable / significant', part_of_speech: 'adjective', example_sentence: 'Es gibt erhebliche Unterschiede.' },

  // ── B1 Adverbs / Connectors ───────────────────────────────────────────────
  { german: 'außerdem', translation: 'in addition / furthermore', part_of_speech: 'adverb', example_sentence: 'Außerdem bin ich müde.' },
  { german: 'dagegen', translation: 'on the other hand / against it', part_of_speech: 'adverb', example_sentence: 'Dagegen habe ich nichts.' },
  { german: 'deshalb', translation: 'therefore / that is why', part_of_speech: 'adverb', example_sentence: 'Deshalb lerne ich Deutsch.' },
  { german: 'deswegen', translation: 'because of that / that is why', part_of_speech: 'adverb', example_sentence: 'Deswegen bin ich heute hier.' },
  { german: 'trotzdem', translation: 'nevertheless / still', part_of_speech: 'adverb', example_sentence: 'Es regnet, trotzdem gehen wir spazieren.' },
  { german: 'obwohl', translation: 'although / even though', part_of_speech: 'adverb', example_sentence: 'Obwohl es schwierig ist, versuche ich es.' },
  { german: 'während', translation: 'while / during', part_of_speech: 'adverb', example_sentence: 'Während ich arbeitete, hörte er Musik.' },
  { german: 'sobald', translation: 'as soon as', part_of_speech: 'adverb', example_sentence: 'Sobald ich fertig bin, ruf ich an.' },
  { german: 'solange', translation: 'as long as', part_of_speech: 'adverb', example_sentence: 'Solange du hier bist, bin ich glücklich.' },
  { german: 'sowohl … als auch', translation: 'both … and', part_of_speech: 'adverb', example_sentence: 'Er spricht sowohl Englisch als auch Französisch.' },

  // ── B2 Nouns ──────────────────────────────────────────────────────────────
  { german: 'die Erkenntnis', translation: 'insight / finding / realization', part_of_speech: 'noun', example_sentence: 'Das ist eine wichtige Erkenntnis.' },
  { german: 'der Aspekt', translation: 'aspect', part_of_speech: 'noun', example_sentence: 'Wir müssen alle Aspekte berücksichtigen.' },
  { german: 'die Auswirkung', translation: 'effect / impact', part_of_speech: 'noun', example_sentence: 'Die Auswirkungen sind noch nicht absehbar.' },
  { german: 'der Anspruch', translation: 'claim / demand / standard', part_of_speech: 'noun', example_sentence: 'Sie stellt hohe Ansprüche an sich selbst.' },
  { german: 'das Bewusstsein', translation: 'awareness / consciousness', part_of_speech: 'noun', example_sentence: 'Das Umweltbewusstsein wächst.' },
  { german: 'der Widerspruch', translation: 'contradiction', part_of_speech: 'noun', example_sentence: 'Darin liegt ein Widerspruch.' },
  { german: 'die Auseinandersetzung', translation: 'confrontation / debate / clash', part_of_speech: 'noun', example_sentence: 'Es kam zu einer heftigen Auseinandersetzung.' },
  { german: 'die Überzeugung', translation: 'conviction / belief', part_of_speech: 'noun', example_sentence: 'Er handelt nach seiner Überzeugung.' },
  { german: 'das Gleichgewicht', translation: 'balance / equilibrium', part_of_speech: 'noun', example_sentence: 'Wir brauchen ein besseres Gleichgewicht.' },
  { german: 'der Zusammenschluss', translation: 'merger / union', part_of_speech: 'noun', example_sentence: 'Der Zusammenschluss der Firmen wurde angekündigt.' },
  { german: 'die Beeinträchtigung', translation: 'impairment / interference', part_of_speech: 'noun', example_sentence: 'Es gibt keine wesentliche Beeinträchtigung.' },
  { german: 'die Anerkennung', translation: 'recognition / acknowledgement', part_of_speech: 'noun', example_sentence: 'Er verdient Anerkennung für seine Arbeit.' },
  { german: 'der Standpunkt', translation: 'standpoint / viewpoint', part_of_speech: 'noun', example_sentence: 'Von meinem Standpunkt aus ist das falsch.' },
  { german: 'das Verhältnis', translation: 'relationship / ratio / proportion', part_of_speech: 'noun', example_sentence: 'Das Verhältnis ist angespannt.' },
  { german: 'die Schwierigkeit', translation: 'difficulty', part_of_speech: 'noun', example_sentence: 'Es gibt technische Schwierigkeiten.' },

  // ── B2 Verbs ──────────────────────────────────────────────────────────────
  { german: 'widersprechen', translation: 'to contradict', part_of_speech: 'verb', example_sentence: 'Ich muss Ihnen widersprechen.' },
  { german: 'hervorheben', translation: 'to highlight / to emphasize', part_of_speech: 'verb', example_sentence: 'Ich möchte diesen Punkt hervorheben.' },
  { german: 'veranschaulichen', translation: 'to illustrate', part_of_speech: 'verb', example_sentence: 'Das Beispiel veranschaulicht das Problem.' },
  { german: 'abwägen', translation: 'to weigh up / to consider', part_of_speech: 'verb', example_sentence: 'Man muss Vor- und Nachteile abwägen.' },
  { german: 'voraussetzen', translation: 'to presuppose / to require', part_of_speech: 'verb', example_sentence: 'Die Stelle setzt Erfahrung voraus.' },
  { german: 'auseinandersetzen', translation: 'to deal with / to come to terms with', part_of_speech: 'verb', example_sentence: 'Ich muss mich damit auseinandersetzen.' },
  { german: 'bestätigen', translation: 'to confirm', part_of_speech: 'verb', example_sentence: 'Können Sie das bestätigen?' },
  { german: 'widerlegen', translation: 'to refute / to disprove', part_of_speech: 'verb', example_sentence: 'Diese These lässt sich leicht widerlegen.' },
  { german: 'zurückführen', translation: 'to attribute to / to trace back', part_of_speech: 'verb', example_sentence: 'Das ist auf mehrere Faktoren zurückzuführen.' },
  { german: 'in Frage stellen', translation: 'to question / to challenge', part_of_speech: 'verb', example_sentence: 'Das stellt die gesamte Theorie in Frage.' },

  // ── B2 Adjectives ─────────────────────────────────────────────────────────
  { german: 'eindeutig', translation: 'clear / unambiguous', part_of_speech: 'adjective', example_sentence: 'Das ist eindeutig ein Fehler.' },
  { german: 'fragwürdig', translation: 'questionable / dubious', part_of_speech: 'adjective', example_sentence: 'Diese Methode ist fragwürdig.' },
  { german: 'strittig', translation: 'controversial / disputed', part_of_speech: 'adjective', example_sentence: 'Das ist ein strittiger Punkt.' },
  { german: 'widersprüchlich', translation: 'contradictory', part_of_speech: 'adjective', example_sentence: 'Die Aussagen sind widersprüchlich.' },
  { german: 'bemerkenswert', translation: 'remarkable / noteworthy', part_of_speech: 'adjective', example_sentence: 'Das ist eine bemerkenswerte Leistung.' },
  { german: 'folgerichtig', translation: 'logical / consistent', part_of_speech: 'adjective', example_sentence: 'Das ist eine folgerichtige Schlussfolgerung.' },
  { german: 'nachhaltig', translation: 'sustainable / lasting', part_of_speech: 'adjective', example_sentence: 'Wir brauchen nachhaltige Lösungen.' },
  { german: 'grundlegend', translation: 'fundamental / basic', part_of_speech: 'adjective', example_sentence: 'Das ist eine grundlegende Frage.' },
  { german: 'umfassend', translation: 'comprehensive / extensive', part_of_speech: 'adjective', example_sentence: 'Das war eine umfassende Analyse.' },
  { german: 'zweifelhaft', translation: 'doubtful / questionable', part_of_speech: 'adjective', example_sentence: 'Der Erfolg ist noch zweifelhaft.' },

  // ── B2 Adverbs / Connectors ───────────────────────────────────────────────
  { german: 'einerseits … andererseits', translation: 'on one hand … on the other hand', part_of_speech: 'adverb', example_sentence: 'Einerseits spart man Zeit, andererseits verliert man den persönlichen Kontakt.' },
  { german: 'folglich', translation: 'consequently', part_of_speech: 'adverb', example_sentence: 'Er hat nicht gelernt, folglich hat er die Prüfung nicht bestanden.' },
  { german: 'hingegen', translation: 'by contrast / whereas', part_of_speech: 'adverb', example_sentence: 'Er mag Sport; sie hingegen liest lieber.' },
  { german: 'immerhin', translation: 'at least / after all', part_of_speech: 'adverb', example_sentence: 'Immerhin hat er es versucht.' },
  { german: 'infolgedessen', translation: 'as a result', part_of_speech: 'adverb', example_sentence: 'Die Straße war gesperrt; infolgedessen gab es Stau.' },
  { german: 'insbesondere', translation: 'in particular', part_of_speech: 'adverb', example_sentence: 'Insbesondere Kinder sind gefährdet.' },
  { german: 'insgesamt', translation: 'overall / in total', part_of_speech: 'adverb', example_sentence: 'Insgesamt bin ich zufrieden.' },
  { german: 'letztendlich', translation: 'ultimately / in the end', part_of_speech: 'adverb', example_sentence: 'Letztendlich muss jeder selbst entscheiden.' },
  { german: 'möglicherweise', translation: 'possibly', part_of_speech: 'adverb', example_sentence: 'Das ist möglicherweise die beste Lösung.' },
  { german: 'nach wie vor', translation: 'still / as ever', part_of_speech: 'adverb', example_sentence: 'Das Problem besteht nach wie vor.' },
  { german: 'offensichtlich', translation: 'obviously / evidently', part_of_speech: 'adverb', example_sentence: 'Er ist offensichtlich müde.' },
  { german: 'schließlich', translation: 'finally / after all', part_of_speech: 'adverb', example_sentence: 'Schließlich haben wir eine Lösung gefunden.' },
  { german: 'tatsächlich', translation: 'actually / indeed', part_of_speech: 'adverb', example_sentence: 'Das ist tatsächlich eine gute Idee.' },
  { german: 'übrigens', translation: 'by the way', part_of_speech: 'adverb', example_sentence: 'Übrigens, hast du schon von dem neuen Film gehört?' },

  // ── C1 Nouns ──────────────────────────────────────────────────────────────
  { german: 'die Ambivalenz', translation: 'ambivalence', part_of_speech: 'noun', example_sentence: 'Seine Ambivalenz gegenüber der Entscheidung war spürbar.' },
  { german: 'die Diskrepanz', translation: 'discrepancy', part_of_speech: 'noun', example_sentence: 'Es gibt eine Diskrepanz zwischen Theorie und Praxis.' },
  { german: 'die Konsequenz', translation: 'consequence / consistency', part_of_speech: 'noun', example_sentence: 'Er handelt mit großer Konsequenz.' },
  { german: 'die Nuance', translation: 'nuance', part_of_speech: 'noun', example_sentence: 'Diese Nuancen gehen bei der Übersetzung verloren.' },
  { german: 'das Paradigma', translation: 'paradigm', part_of_speech: 'noun', example_sentence: 'Das stellt das bisherige Paradigma in Frage.' },
  { german: 'die Plausibilität', translation: 'plausibility', part_of_speech: 'noun', example_sentence: 'Die Plausibilität dieser Theorie ist fraglich.' },
  { german: 'der Präzedenzfall', translation: 'precedent', part_of_speech: 'noun', example_sentence: 'Das Urteil könnte einen Präzedenzfall schaffen.' },
  { german: 'die Prämisse', translation: 'premise', part_of_speech: 'noun', example_sentence: 'Von welchen Prämissen gehen Sie aus?' },
  { german: 'das Zugeständnis', translation: 'concession', part_of_speech: 'noun', example_sentence: 'Beide Seiten machten Zugeständnisse.' },
  { german: 'die Verflechtung', translation: 'entanglement / interweaving', part_of_speech: 'noun', example_sentence: 'Die globale Verflechtung der Wirtschaft nimmt zu.' },
  { german: 'der Gedankengang', translation: 'train of thought', part_of_speech: 'noun', example_sentence: 'Folgen Sie meinem Gedankengang.' },
  { german: 'die Abwägung', translation: 'consideration / balancing', part_of_speech: 'noun', example_sentence: 'Nach sorgfältiger Abwägung haben wir entschieden.' },
  { german: 'das Missverhältnis', translation: 'disproportion / imbalance', part_of_speech: 'noun', example_sentence: 'Es besteht ein Missverhältnis zwischen Aufwand und Ertrag.' },
  { german: 'die Reflexion', translation: 'reflection', part_of_speech: 'noun', example_sentence: 'Tiefe Reflexion führt zu Wachstum.' },
  { german: 'das Spannungsfeld', translation: 'field of tension', part_of_speech: 'noun', example_sentence: 'Wir befinden uns in einem Spannungsfeld.' },

  // ── C1 Verbs ──────────────────────────────────────────────────────────────
  { german: 'differenzieren', translation: 'to differentiate / to distinguish', part_of_speech: 'verb', example_sentence: 'Man muss hier stärker differenzieren.' },
  { german: 'relativieren', translation: 'to put into perspective / to relativize', part_of_speech: 'verb', example_sentence: 'Das sollte man etwas relativieren.' },
  { german: 'exemplifizieren', translation: 'to exemplify', part_of_speech: 'verb', example_sentence: 'Das lässt sich gut exemplifizieren.' },
  { german: 'implizieren', translation: 'to imply', part_of_speech: 'verb', example_sentence: 'Was impliziert diese Aussage?' },
  { german: 'konstatieren', translation: 'to state / to note / to establish', part_of_speech: 'verb', example_sentence: 'Man kann konstatieren, dass die Lage schwierig ist.' },
  { german: 'manifestieren', translation: 'to manifest', part_of_speech: 'verb', example_sentence: 'Der Stress manifestiert sich körperlich.' },
  { german: 'postulieren', translation: 'to postulate', part_of_speech: 'verb', example_sentence: 'Der Philosoph postulierte eine neue Theorie.' },
  { german: 'präzisieren', translation: 'to specify / to make more precise', part_of_speech: 'verb', example_sentence: 'Können Sie das präzisieren?' },
  { german: 'subsumieren', translation: 'to subsume / to include under', part_of_speech: 'verb', example_sentence: 'Das lässt sich unter diesem Begriff subsumieren.' },
  { german: 'vergegenwärtigen', translation: 'to visualize / to bring to mind', part_of_speech: 'verb', example_sentence: 'Man muss sich die Folgen vergegenwärtigen.' },

  // ── C1 Adjectives ─────────────────────────────────────────────────────────
  { german: 'ambivalent', translation: 'ambivalent', part_of_speech: 'adjective', example_sentence: 'Ich stehe dem Projekt ambivalent gegenüber.' },
  { german: 'ausgewogen', translation: 'balanced / well-rounded', part_of_speech: 'adjective', example_sentence: 'Das ist eine ausgewogene Darstellung.' },
  { german: 'diffizil', translation: 'delicate / tricky', part_of_speech: 'adjective', example_sentence: 'Das ist eine diffizile Angelegenheit.' },
  { german: 'facettenreich', translation: 'multifaceted', part_of_speech: 'adjective', example_sentence: 'Sie ist eine facettenreiche Persönlichkeit.' },
  { german: 'kontraproduktiv', translation: 'counterproductive', part_of_speech: 'adjective', example_sentence: 'Das wäre kontraproduktiv.' },
  { german: 'maßgeblich', translation: 'decisive / authoritative', part_of_speech: 'adjective', example_sentence: 'Er hat maßgeblich dazu beigetragen.' },
  { german: 'tiefgreifend', translation: 'profound / far-reaching', part_of_speech: 'adjective', example_sentence: 'Die Veränderungen sind tiefgreifend.' },
  { german: 'treffend', translation: 'apt / fitting / accurate', part_of_speech: 'adjective', example_sentence: 'Das ist eine sehr treffende Beschreibung.' },
  { german: 'unabdingbar', translation: 'indispensable / essential', part_of_speech: 'adjective', example_sentence: 'Vertrauen ist unabdingbar für gute Zusammenarbeit.' },
  { german: 'vielschichtig', translation: 'multilayered / complex', part_of_speech: 'adjective', example_sentence: 'Das ist ein vielschichtiges Thema.' },

  // ── C1 Adverbs / Connectors ───────────────────────────────────────────────
  { german: 'angesichts', translation: 'in view of / given', part_of_speech: 'adverb', example_sentence: 'Angesichts der Lage müssen wir handeln.' },
  { german: 'bezüglich', translation: 'regarding / with respect to', part_of_speech: 'adverb', example_sentence: 'Bezüglich Ihrer Anfrage möchte ich Folgendes sagen.' },
  { german: 'demgegenüber', translation: 'on the other hand / in contrast', part_of_speech: 'adverb', example_sentence: 'Demgegenüber steht die Auffassung der Opposition.' },
  { german: 'gleichermaßen', translation: 'equally / in equal measure', part_of_speech: 'adverb', example_sentence: 'Das gilt gleichermaßen für alle.' },
  { german: 'im Hinblick auf', translation: 'with regard to / in view of', part_of_speech: 'adverb', example_sentence: 'Im Hinblick auf die Zukunft müssen wir planen.' },
  { german: 'nichtsdestoweniger', translation: 'nonetheless / nevertheless', part_of_speech: 'adverb', example_sentence: 'Nichtsdestoweniger bin ich optimistisch.' },
  { german: 'ungeachtet', translation: 'regardless of / despite', part_of_speech: 'adverb', example_sentence: 'Ungeachtet aller Schwierigkeiten haben wir es geschafft.' },
  { german: 'wenngleich', translation: 'even though / although', part_of_speech: 'adverb', example_sentence: 'Wenngleich es schwierig ist, geben wir nicht auf.' },
  { german: 'zumal', translation: 'especially since / particularly as', part_of_speech: 'adverb', example_sentence: 'Das ist bedenklich, zumal wir keine Zeit haben.' },
  { german: 'zweifellos', translation: 'undoubtedly', part_of_speech: 'adverb', example_sentence: 'Das ist zweifellos eine Verbesserung.' },

  // ── C2 Nouns ──────────────────────────────────────────────────────────────
  { german: 'die Akkuratesse', translation: 'accuracy / meticulousness', part_of_speech: 'noun', example_sentence: 'Mit großer Akkuratesse analysierte er jeden Satz.' },
  { german: 'die Aporie', translation: 'aporia / insoluble contradiction', part_of_speech: 'noun', example_sentence: 'Das philosophische Problem führt in eine Aporie.' },
  { german: 'die Dezenz', translation: 'decency / restraint / tact', part_of_speech: 'noun', example_sentence: 'Er reagierte mit bemerkenswerter Dezenz.' },
  { german: 'die Einlässlichkeit', translation: 'thoroughness / attention to detail', part_of_speech: 'noun', example_sentence: 'Die Einlässlichkeit seiner Analyse war beeindruckend.' },
  { german: 'die Kontingenz', translation: 'contingency', part_of_speech: 'noun', example_sentence: 'Wir müssen mit Kontingenz umgehen können.' },
  { german: 'die Redundanz', translation: 'redundancy', part_of_speech: 'noun', example_sentence: 'Redundanz in der Sprache kann stilistisch unerwünscht sein.' },
  { german: 'das Fernweh', translation: 'wanderlust / longing for distant places', part_of_speech: 'noun', example_sentence: 'Im Frühjahr packt mich immer das Fernweh.' },
  { german: 'die Mündigkeit', translation: 'maturity / autonomy', part_of_speech: 'noun', example_sentence: 'Bildung zielt auf die Mündigkeit des Menschen ab.' },
  { german: 'die Vieldeutigkeit', translation: 'ambiguity / polysemy', part_of_speech: 'noun', example_sentence: 'Die Vieldeutigkeit dieses Textes ist beabsichtigt.' },
  { german: 'die Weitsicht', translation: 'foresight / far-sightedness', part_of_speech: 'noun', example_sentence: 'Mit politischer Weitsicht wurde die Krise verhindert.' },

  // ── C2 Verbs ──────────────────────────────────────────────────────────────
  { german: 'amalgamieren', translation: 'to amalgamate / to merge', part_of_speech: 'verb', example_sentence: 'Verschiedene Stile wurden hier amalgamiert.' },
  { german: 'antizipieren', translation: 'to anticipate', part_of_speech: 'verb', example_sentence: 'Das Unternehmen konnte die Krise nicht antizipieren.' },
  { german: 'dekonstruieren', translation: 'to deconstruct', part_of_speech: 'verb', example_sentence: 'Der Kritiker dekonstruiert den Mythos.' },
  { german: 'elaborieren', translation: 'to elaborate', part_of_speech: 'verb', example_sentence: 'Würden Sie das bitte weiter elaborieren?' },
  { german: 'perpetuieren', translation: 'to perpetuate', part_of_speech: 'verb', example_sentence: 'Diese Praxis perpetuiert soziale Ungleichheit.' },
  { german: 'synthetisieren', translation: 'to synthesize', part_of_speech: 'verb', example_sentence: 'Er synthetisiert verschiedene Forschungsansätze.' },
  { german: 'verschmähen', translation: 'to disdain / to spurn', part_of_speech: 'verb', example_sentence: 'Er verschmähte das Angebot hochmütig.' },
  { german: 'vergegenwärtigen', translation: 'to visualize / to bring to mind', part_of_speech: 'verb', example_sentence: 'Man sollte sich die Konsequenzen vergegenwärtigen.' },

  // ── C2 Adjectives ─────────────────────────────────────────────────────────
  { german: 'akribisch', translation: 'meticulous / painstaking', part_of_speech: 'adjective', example_sentence: 'Er arbeitete akribisch an jedem Detail.' },
  { german: 'ephemer', translation: 'ephemeral / transient', part_of_speech: 'adjective', example_sentence: 'Ruhm ist oft ephemer.' },
  { german: 'lapidar', translation: 'terse / pithy / curt', part_of_speech: 'adjective', example_sentence: 'Seine lapidare Antwort überraschte uns.' },
  { german: 'omnipräsent', translation: 'omnipresent', part_of_speech: 'adjective', example_sentence: 'Soziale Medien sind omnipräsent.' },
  { german: 'penibel', translation: 'meticulous / fussy', part_of_speech: 'adjective', example_sentence: 'Sie ist penibel genau in ihrer Arbeit.' },
  { german: 'prekär', translation: 'precarious', part_of_speech: 'adjective', example_sentence: 'Die Lage ist äußerst prekär.' },
  { german: 'proliferierend', translation: 'proliferating', part_of_speech: 'adjective', example_sentence: 'Proliferierende Technologien verändern die Gesellschaft.' },
  { german: 'subtil', translation: 'subtle', part_of_speech: 'adjective', example_sentence: 'Es gibt subtile Unterschiede in der Bedeutung.' },
  { german: 'unerschütterlich', translation: 'unshakeable / steadfast', part_of_speech: 'adjective', example_sentence: 'Sein Glaube ist unerschütterlich.' },
  { german: 'verschmitzt', translation: 'mischievous / impish', part_of_speech: 'adjective', example_sentence: 'Sie lächelte ihn verschmitzt an.' },

  // ── C2 Adverbs / Connectors ───────────────────────────────────────────────
  { german: 'allem Anschein nach', translation: 'apparently / by all appearances', part_of_speech: 'adverb', example_sentence: 'Allem Anschein nach ist das Projekt gescheitert.' },
  { german: 'demzufolge', translation: 'consequently / therefore', part_of_speech: 'adverb', example_sentence: 'Demzufolge muss die Theorie überarbeitet werden.' },
  { german: 'durchaus', translation: 'quite / absolutely / certainly', part_of_speech: 'adverb', example_sentence: 'Das ist durchaus möglich.' },
  { german: 'mithin', translation: 'consequently / hence', part_of_speech: 'adverb', example_sentence: 'Sie ist Expertin, mithin kompetent für diese Aufgabe.' },
  { german: 'ohne Weiteres', translation: 'without hesitation / readily', part_of_speech: 'adverb', example_sentence: 'Das lässt sich ohne Weiteres lösen.' },
  { german: 'schlichtweg', translation: 'simply / plainly', part_of_speech: 'adverb', example_sentence: 'Das ist schlichtweg falsch.' },
  { german: 'umso mehr', translation: 'all the more', part_of_speech: 'adverb', example_sentence: 'Umso mehr freue ich mich über Ihren Besuch.' },
  { german: 'vielmehr', translation: 'rather / more precisely', part_of_speech: 'adverb', example_sentence: 'Es geht vielmehr um Vertrauen als um Regeln.' },
  { german: 'weit gefehlt', translation: 'far from it / quite the contrary', part_of_speech: 'adverb', example_sentence: 'Weit gefehlt – das Gegenteil ist der Fall.' },
  { german: 'wohlgemerkt', translation: 'mind you / note well', part_of_speech: 'adverb', example_sentence: 'Das gilt, wohlgemerkt, nur unter bestimmten Bedingungen.' },
]

export async function seedWordBank(): Promise<void> {
  const existing = await db.select().from(word_bank).limit(1)
  if (existing.length) {
    console.log('[seed] word_bank already populated — skipping')
    return
  }
  const seen = new Set<string>()
  const rows = WORD_BANK
    .map((w, i) => ({ ...w, cefr_level: getLevelForIndex(i) as CefrLevel }))
    .filter(w => {
      if (seen.has(w.german)) return false
      seen.add(w.german)
      return true
    })
  await db.insert(word_bank).values(rows).onConflictDoNothing()
  console.log(`[seed] ${rows.length} words inserted into word_bank`)
}

export async function seedWordsForUser(userId: string, maxLevel: CefrLevel): Promise<void> {
  const existing = await db.select().from(words).where(eq(words.user_id, userId)).limit(1)
  if (existing.length) {
    console.log('[seed] Words already seeded for this user — skipping')
    return
  }

  const eligibleLevels = CEFR_ORDER.slice(0, CEFR_ORDER.indexOf(maxLevel) + 1) as CefrLevel[]
  const bankWords = await db.select().from(word_bank)
    .where(inArray(word_bank.cefr_level, eligibleLevels))

  const now = new Date()
  const wordRows = bankWords.map(w => ({
    user_id: userId,
    german: w.german,
    translation: w.translation,
    part_of_speech: w.part_of_speech,
    example_sentence: w.example_sentence,
  }))
  const inserted = await db.insert(words).values(wordRows).returning({ id: words.id })

  // Spread due dates: ~40% due now, rest spread over next 7 days to simulate
  // a realistic SRS queue rather than 350 cards all due simultaneously.
  const reviewRows = inserted.map((w, i) => {
    const dueNow = i < Math.floor(inserted.length * 0.4)
    const daysOut = dueNow ? 0 : Math.floor(Math.random() * 7) + 1
    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + daysOut)
    return {
      word_id: w.id,
      user_id: userId,
      due_date: dueDate,
      interval: dueNow ? 0 : Math.floor(Math.random() * 3),
      repetition: dueNow ? 0 : Math.floor(Math.random() * 4),
      ease_factor: 2.0 + Math.random() * 1.0,
    }
  })
  await db.insert(reviews).values(reviewRows)

  console.log(`[seed] ${inserted.length} words + review cards created for user ${userId}`)
}

export async function seedWords(userId: string): Promise<void> {
  await seedWordsForUser(userId, 'B1')
}

