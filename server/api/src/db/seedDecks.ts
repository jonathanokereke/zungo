import { db } from './index'
import { vocab_decks, vocab_deck_words } from './schema'
import { eq } from 'drizzle-orm'

type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface DeckDef {
  title: string
  description: string
  level: Level
  topic: string
  words: { german: string; translation: string; part_of_speech: string; example_sentence: string }[]
}

const DECKS: DeckDef[] = [
  // ── A1 ────────────────────────────────────────────────────────────────────
  {
    title: 'Greetings & Basics',
    description: 'Essential phrases for first conversations — greetings, introductions, and polite expressions.',
    level: 'A1', topic: 'Social',
    words: [
      { german: 'Hallo', translation: 'hello', part_of_speech: 'other', example_sentence: 'Hallo, wie geht es dir?' },
      { german: 'Guten Morgen', translation: 'good morning', part_of_speech: 'other', example_sentence: 'Guten Morgen! Hast du gut geschlafen?' },
      { german: 'Guten Abend', translation: 'good evening', part_of_speech: 'other', example_sentence: 'Guten Abend, Herr Müller.' },
      { german: 'Auf Wiedersehen', translation: 'goodbye', part_of_speech: 'other', example_sentence: 'Auf Wiedersehen und eine gute Reise!' },
      { german: 'Bitte', translation: 'please / you\'re welcome', part_of_speech: 'other', example_sentence: 'Kannst du mir bitte helfen?' },
      { german: 'Danke', translation: 'thank you', part_of_speech: 'other', example_sentence: 'Danke für Ihre Hilfe.' },
      { german: 'Entschuldigung', translation: 'excuse me / sorry', part_of_speech: 'other', example_sentence: 'Entschuldigung, wo ist der Bahnhof?' },
      { german: 'Ja', translation: 'yes', part_of_speech: 'other', example_sentence: 'Ja, das stimmt.' },
      { german: 'Nein', translation: 'no', part_of_speech: 'other', example_sentence: 'Nein, das ist nicht richtig.' },
      { german: 'Wie heißt du?', translation: 'What is your name?', part_of_speech: 'other', example_sentence: 'Wie heißt du? Ich heiße Anna.' },
      { german: 'heißen', translation: 'to be called / named', part_of_speech: 'verb', example_sentence: 'Ich heiße Thomas.' },
      { german: 'kommen', translation: 'to come', part_of_speech: 'verb', example_sentence: 'Woher kommst du?' },
      { german: 'wohnen', translation: 'to live / reside', part_of_speech: 'verb', example_sentence: 'Ich wohne in München.' },
      { german: 'sprechen', translation: 'to speak', part_of_speech: 'verb', example_sentence: 'Sprechen Sie Englisch?' },
      { german: 'verstehen', translation: 'to understand', part_of_speech: 'verb', example_sentence: 'Ich verstehe das nicht.' },
    ],
  },
  {
    title: 'Numbers & Time',
    description: 'Count, tell the time, and talk about days and dates.',
    level: 'A1', topic: 'Daily Life',
    words: [
      { german: 'die Zahl', translation: 'number', part_of_speech: 'noun', example_sentence: 'Welche Zahl kommt nach zehn?' },
      { german: 'die Uhr', translation: 'clock / watch / o\'clock', part_of_speech: 'noun', example_sentence: 'Es ist drei Uhr.' },
      { german: 'die Stunde', translation: 'hour', part_of_speech: 'noun', example_sentence: 'Die Fahrt dauert eine Stunde.' },
      { german: 'die Minute', translation: 'minute', part_of_speech: 'noun', example_sentence: 'Ich komme in fünf Minuten.' },
      { german: 'der Tag', translation: 'day', part_of_speech: 'noun', example_sentence: 'Heute ist ein schöner Tag.' },
      { german: 'die Woche', translation: 'week', part_of_speech: 'noun', example_sentence: 'Diese Woche habe ich viel zu tun.' },
      { german: 'der Monat', translation: 'month', part_of_speech: 'noun', example_sentence: 'Im nächsten Monat fahren wir in den Urlaub.' },
      { german: 'das Jahr', translation: 'year', part_of_speech: 'noun', example_sentence: 'Das Jahr hat zwölf Monate.' },
      { german: 'heute', translation: 'today', part_of_speech: 'adverb', example_sentence: 'Was machst du heute?' },
      { german: 'morgen', translation: 'tomorrow', part_of_speech: 'adverb', example_sentence: 'Morgen beginnt die Schule wieder.' },
      { german: 'gestern', translation: 'yesterday', part_of_speech: 'adverb', example_sentence: 'Gestern war das Wetter schlechter.' },
      { german: 'früh', translation: 'early', part_of_speech: 'adjective', example_sentence: 'Ich stehe früh auf.' },
      { german: 'spät', translation: 'late', part_of_speech: 'adjective', example_sentence: 'Es ist schon spät!' },
      { german: 'jetzt', translation: 'now', part_of_speech: 'adverb', example_sentence: 'Ich muss jetzt gehen.' },
      { german: 'später', translation: 'later', part_of_speech: 'adverb', example_sentence: 'Bis später!' },
    ],
  },

  // ── A2 ────────────────────────────────────────────────────────────────────
  {
    title: 'Food & Eating Out',
    description: 'Order food, read menus, and talk about what you like to eat.',
    level: 'A2', topic: 'Food',
    words: [
      { german: 'das Restaurant', translation: 'restaurant', part_of_speech: 'noun', example_sentence: 'Wir gehen heute in ein italienisches Restaurant.' },
      { german: 'die Speisekarte', translation: 'menu', part_of_speech: 'noun', example_sentence: 'Darf ich bitte die Speisekarte sehen?' },
      { german: 'bestellen', translation: 'to order', part_of_speech: 'verb', example_sentence: 'Ich möchte gerne bestellen.' },
      { german: 'die Rechnung', translation: 'the bill / check', part_of_speech: 'noun', example_sentence: 'Könnte ich bitte die Rechnung haben?' },
      { german: 'das Frühstück', translation: 'breakfast', part_of_speech: 'noun', example_sentence: 'Ich esse ein gesundes Frühstück.' },
      { german: 'das Mittagessen', translation: 'lunch', part_of_speech: 'noun', example_sentence: 'Zum Mittagessen esse ich ein Sandwich.' },
      { german: 'das Abendessen', translation: 'dinner', part_of_speech: 'noun', example_sentence: 'Das Abendessen ist um sieben Uhr.' },
      { german: 'das Getränk', translation: 'drink / beverage', part_of_speech: 'noun', example_sentence: 'Was für ein Getränk möchtest du?' },
      { german: 'schmecken', translation: 'to taste / to taste good', part_of_speech: 'verb', example_sentence: 'Das Essen schmeckt sehr gut.' },
      { german: 'der Kellner', translation: 'waiter', part_of_speech: 'noun', example_sentence: 'Der Kellner bringt die Vorspeise.' },
      { german: 'vegetarisch', translation: 'vegetarian', part_of_speech: 'adjective', example_sentence: 'Gibt es vegetarische Gerichte?' },
      { german: 'lecker', translation: 'delicious / tasty', part_of_speech: 'adjective', example_sentence: 'Dieser Kuchen ist wirklich lecker.' },
      { german: 'hungrig', translation: 'hungry', part_of_speech: 'adjective', example_sentence: 'Ich bin sehr hungrig.' },
      { german: 'satt', translation: 'full / satisfied', part_of_speech: 'adjective', example_sentence: 'Ich bin satt, danke.' },
      { german: 'kochen', translation: 'to cook', part_of_speech: 'verb', example_sentence: 'Meine Mutter kocht jeden Abend.' },
    ],
  },
  {
    title: 'Travel & Transport',
    description: 'Navigate airports, train stations, and get around town.',
    level: 'A2', topic: 'Travel',
    words: [
      { german: 'der Bahnhof', translation: 'train station', part_of_speech: 'noun', example_sentence: 'Der Bahnhof ist in der Stadtmitte.' },
      { german: 'der Flughafen', translation: 'airport', part_of_speech: 'noun', example_sentence: 'Das Taxi fährt zum Flughafen.' },
      { german: 'das Ticket', translation: 'ticket', part_of_speech: 'noun', example_sentence: 'Ich kaufe ein Ticket online.' },
      { german: 'abfahren', translation: 'to depart / leave', part_of_speech: 'verb', example_sentence: 'Der Zug fährt um neun Uhr ab.' },
      { german: 'ankommen', translation: 'to arrive', part_of_speech: 'verb', example_sentence: 'Wann kommt das Flugzeug an?' },
      { german: 'umsteigen', translation: 'to change (train/bus)', part_of_speech: 'verb', example_sentence: 'Sie müssen in Hamburg umsteigen.' },
      { german: 'die Verspätung', translation: 'delay', part_of_speech: 'noun', example_sentence: 'Der Zug hat zwanzig Minuten Verspätung.' },
      { german: 'der Reisepass', translation: 'passport', part_of_speech: 'noun', example_sentence: 'Vergiss nicht deinen Reisepass!' },
      { german: 'das Gepäck', translation: 'luggage / baggage', part_of_speech: 'noun', example_sentence: 'Das Gepäck ist zu schwer.' },
      { german: 'die Unterkunft', translation: 'accommodation', part_of_speech: 'noun', example_sentence: 'Wir haben eine günstige Unterkunft gebucht.' },
      { german: 'buchen', translation: 'to book / reserve', part_of_speech: 'verb', example_sentence: 'Ich möchte ein Zimmer buchen.' },
      { german: 'die Richtung', translation: 'direction', part_of_speech: 'noun', example_sentence: 'In welche Richtung geht es zum Museum?' },
      { german: 'geradeaus', translation: 'straight ahead', part_of_speech: 'adverb', example_sentence: 'Gehen Sie geradeaus und dann links.' },
      { german: 'die Haltestelle', translation: 'bus/tram stop', part_of_speech: 'noun', example_sentence: 'Die Haltestelle ist um die Ecke.' },
      { german: 'einsteigen', translation: 'to board / get on', part_of_speech: 'verb', example_sentence: 'Bitte jetzt einsteigen!' },
    ],
  },

  // ── B1 ────────────────────────────────────────────────────────────────────
  {
    title: 'Work & Career',
    description: 'Talk about jobs, workplaces, and professional situations.',
    level: 'B1', topic: 'Work',
    words: [
      { german: 'die Bewerbung', translation: 'job application', part_of_speech: 'noun', example_sentence: 'Ich schicke meine Bewerbung morgen ab.' },
      { german: 'das Vorstellungsgespräch', translation: 'job interview', part_of_speech: 'noun', example_sentence: 'Das Vorstellungsgespräch ist am Montag.' },
      { german: 'der Lebenslauf', translation: 'CV / résumé', part_of_speech: 'noun', example_sentence: 'Mein Lebenslauf ist aktualisiert.' },
      { german: 'die Stelle', translation: 'position / job opening', part_of_speech: 'noun', example_sentence: 'Es gibt eine freie Stelle in der IT-Abteilung.' },
      { german: 'das Gehalt', translation: 'salary', part_of_speech: 'noun', example_sentence: 'Das Gehalt ist verhandelbar.' },
      { german: 'die Abteilung', translation: 'department', part_of_speech: 'noun', example_sentence: 'Ich arbeite in der Marketing-Abteilung.' },
      { german: 'der Kollege', translation: 'colleague (male)', part_of_speech: 'noun', example_sentence: 'Mein Kollege hilft mir gerne.' },
      { german: 'kündigen', translation: 'to resign / quit', part_of_speech: 'verb', example_sentence: 'Er hat seine Stelle gekündigt.' },
      { german: 'befördern', translation: 'to promote', part_of_speech: 'verb', example_sentence: 'Sie wurde zur Teamleiterin befördert.' },
      { german: 'die Besprechung', translation: 'meeting', part_of_speech: 'noun', example_sentence: 'Die Besprechung dauert eine Stunde.' },
      { german: 'die Überstunden', translation: 'overtime', part_of_speech: 'noun', example_sentence: 'Ich mache oft Überstunden.' },
      { german: 'selbstständig', translation: 'self-employed / independent', part_of_speech: 'adjective', example_sentence: 'Er ist selbstständiger Grafiker.' },
      { german: 'das Unternehmen', translation: 'company / enterprise', part_of_speech: 'noun', example_sentence: 'Das Unternehmen hat 500 Mitarbeiter.' },
      { german: 'verantwortlich', translation: 'responsible', part_of_speech: 'adjective', example_sentence: 'Wer ist für dieses Projekt verantwortlich?' },
      { german: 'die Fähigkeit', translation: 'skill / ability', part_of_speech: 'noun', example_sentence: 'Sprachkenntnisse sind eine wichtige Fähigkeit.' },
    ],
  },
  {
    title: 'Health & Body',
    description: 'Describe symptoms, visit the doctor, and discuss health habits.',
    level: 'B1', topic: 'Health',
    words: [
      { german: 'die Erkältung', translation: 'cold (illness)', part_of_speech: 'noun', example_sentence: 'Ich habe eine starke Erkältung.' },
      { german: 'das Fieber', translation: 'fever', part_of_speech: 'noun', example_sentence: 'Das Kind hat hohes Fieber.' },
      { german: 'der Schmerz', translation: 'pain', part_of_speech: 'noun', example_sentence: 'Ich habe Schmerzen im Rücken.' },
      { german: 'das Rezept', translation: 'prescription', part_of_speech: 'noun', example_sentence: 'Der Arzt hat mir ein Rezept ausgestellt.' },
      { german: 'das Krankenhaus', translation: 'hospital', part_of_speech: 'noun', example_sentence: 'Er liegt seit gestern im Krankenhaus.' },
      { german: 'die Apotheke', translation: 'pharmacy', part_of_speech: 'noun', example_sentence: 'Kaufe das Medikament in der Apotheke.' },
      { german: 'sich erholen', translation: 'to recover / rest', part_of_speech: 'verb', example_sentence: 'Nach dem Urlaub habe ich mich gut erholt.' },
      { german: 'allergisch', translation: 'allergic', part_of_speech: 'adjective', example_sentence: 'Ich bin allergisch gegen Nüsse.' },
      { german: 'die Versicherung', translation: 'insurance', part_of_speech: 'noun', example_sentence: 'Haben Sie eine Krankenversicherung?' },
      { german: 'gesund', translation: 'healthy', part_of_speech: 'adjective', example_sentence: 'Eine gesunde Ernährung ist wichtig.' },
      { german: 'zunehmen', translation: 'to gain weight', part_of_speech: 'verb', example_sentence: 'Im Winter nehme ich immer zu.' },
      { german: 'abnehmen', translation: 'to lose weight', part_of_speech: 'verb', example_sentence: 'Ich möchte fünf Kilo abnehmen.' },
      { german: 'der Blutdruck', translation: 'blood pressure', part_of_speech: 'noun', example_sentence: 'Mein Blutdruck ist zu hoch.' },
      { german: 'bewusst', translation: 'conscious / aware', part_of_speech: 'adjective', example_sentence: 'Ich lebe sehr gesundheitsbewusst.' },
      { german: 'die Übung', translation: 'exercise', part_of_speech: 'noun', example_sentence: 'Regelmäßige Übung hält fit.' },
    ],
  },

  // ── B2 ────────────────────────────────────────────────────────────────────
  {
    title: 'Media & Technology',
    description: 'Discuss the internet, social media, and digital life.',
    level: 'B2', topic: 'Technology',
    words: [
      { german: 'die Nachricht', translation: 'news / message', part_of_speech: 'noun', example_sentence: 'Ich lese die Nachrichten online.' },
      { german: 'der Datenschutz', translation: 'data protection / privacy', part_of_speech: 'noun', example_sentence: 'Datenschutz ist ein wichtiges Thema.' },
      { german: 'die Benutzeroberfläche', translation: 'user interface', part_of_speech: 'noun', example_sentence: 'Die neue Benutzeroberfläche ist intuitiv.' },
      { german: 'herunterladen', translation: 'to download', part_of_speech: 'verb', example_sentence: 'Ich lade die App herunter.' },
      { german: 'speichern', translation: 'to save / store', part_of_speech: 'verb', example_sentence: 'Vergiss nicht, die Datei zu speichern.' },
      { german: 'die Verschlüsselung', translation: 'encryption', part_of_speech: 'noun', example_sentence: 'Die Nachricht ist mit Verschlüsselung geschützt.' },
      { german: 'das Passwort', translation: 'password', part_of_speech: 'noun', example_sentence: 'Verwende ein sicheres Passwort.' },
      { german: 'vernetzen', translation: 'to connect / network', part_of_speech: 'verb', example_sentence: 'Die Geräte lassen sich drahtlos vernetzen.' },
      { german: 'die Schlagzeile', translation: 'headline', part_of_speech: 'noun', example_sentence: 'Die Schlagzeile war irreführend.' },
      { german: 'beeinflussen', translation: 'to influence', part_of_speech: 'verb', example_sentence: 'Soziale Medien beeinflussen die Meinung.' },
      { german: 'die Plattform', translation: 'platform', part_of_speech: 'noun', example_sentence: 'Welche Plattform nutzt du am meisten?' },
      { german: 'aktualisieren', translation: 'to update', part_of_speech: 'verb', example_sentence: 'Das System wird gerade aktualisiert.' },
      { german: 'der Algorithmus', translation: 'algorithm', part_of_speech: 'noun', example_sentence: 'Der Algorithmus bestimmt, was du siehst.' },
      { german: 'anonym', translation: 'anonymous', part_of_speech: 'adjective', example_sentence: 'Er postet anonym im Internet.' },
      { german: 'die Bandbreite', translation: 'bandwidth', part_of_speech: 'noun', example_sentence: 'Die Bandbreite ist für Streaming ausreichend.' },
    ],
  },
  {
    title: 'Environment & Nature',
    description: 'Discuss climate change, ecology, and the natural world.',
    level: 'B2', topic: 'Environment',
    words: [
      { german: 'der Klimawandel', translation: 'climate change', part_of_speech: 'noun', example_sentence: 'Der Klimawandel ist eine globale Herausforderung.' },
      { german: 'die Nachhaltigkeit', translation: 'sustainability', part_of_speech: 'noun', example_sentence: 'Nachhaltigkeit ist das Ziel vieler Unternehmen.' },
      { german: 'erneuerbarer Energien', translation: 'renewable energies', part_of_speech: 'noun', example_sentence: 'Wir setzen auf erneuerbare Energien.' },
      { german: 'die Abgase', translation: 'exhaust fumes / emissions', part_of_speech: 'noun', example_sentence: 'Abgase verschmutzen die Luft.' },
      { german: 'recyceln', translation: 'to recycle', part_of_speech: 'verb', example_sentence: 'Wir recyceln Glas, Papier und Plastik.' },
      { german: 'das Artensterben', translation: 'extinction of species', part_of_speech: 'noun', example_sentence: 'Das Artensterben bedroht das Ökosystem.' },
      { german: 'der Treibhauseffekt', translation: 'greenhouse effect', part_of_speech: 'noun', example_sentence: 'Der Treibhauseffekt erhöht die Temperaturen.' },
      { german: 'der Lebensraum', translation: 'habitat', part_of_speech: 'noun', example_sentence: 'Der Lebensraum vieler Tiere schrumpft.' },
      { german: 'schützen', translation: 'to protect', part_of_speech: 'verb', example_sentence: 'Wir müssen die Umwelt schützen.' },
      { german: 'umweltfreundlich', translation: 'environmentally friendly', part_of_speech: 'adjective', example_sentence: 'Das Auto ist sehr umweltfreundlich.' },
      { german: 'die Dürre', translation: 'drought', part_of_speech: 'noun', example_sentence: 'Die Dürre hat die Ernte zerstört.' },
      { german: 'überschwemmen', translation: 'to flood', part_of_speech: 'verb', example_sentence: 'Der Fluss hat das Dorf überschwemmt.' },
      { german: 'biologisch', translation: 'organic / biological', part_of_speech: 'adjective', example_sentence: 'Ich kaufe biologisches Gemüse.' },
      { german: 'der Fußabdruck', translation: 'footprint (carbon footprint)', part_of_speech: 'noun', example_sentence: 'Reduziere deinen ökologischen Fußabdruck.' },
      { german: 'bewahren', translation: 'to preserve / conserve', part_of_speech: 'verb', example_sentence: 'Wir müssen die Wälder bewahren.' },
    ],
  },

  // ── C1 ────────────────────────────────────────────────────────────────────
  {
    title: 'Law & Politics',
    description: 'Navigate political discourse, legal terminology, and civic life.',
    level: 'C1', topic: 'Politics',
    words: [
      { german: 'die Gesetzgebung', translation: 'legislation', part_of_speech: 'noun', example_sentence: 'Die neue Gesetzgebung tritt nächsten Monat in Kraft.' },
      { german: 'der Verfassungsschutz', translation: 'constitutional protection / domestic intelligence', part_of_speech: 'noun', example_sentence: 'Der Verfassungsschutz beobachtet extremistische Gruppen.' },
      { german: 'die Rechtsprechung', translation: 'jurisprudence / case law', part_of_speech: 'noun', example_sentence: 'Die Rechtsprechung hat sich in dieser Frage geändert.' },
      { german: 'abstimmen', translation: 'to vote / cast a ballot', part_of_speech: 'verb', example_sentence: 'Das Parlament stimmt heute über den Haushalt ab.' },
      { german: 'die Grundrechte', translation: 'fundamental rights', part_of_speech: 'noun', example_sentence: 'Die Grundrechte sind im Grundgesetz verankert.' },
      { german: 'die Bürokratie', translation: 'bureaucracy', part_of_speech: 'noun', example_sentence: 'Die Bürokratie verlangsamte den Prozess.' },
      { german: 'verabschieden', translation: 'to pass (a law) / to adopt', part_of_speech: 'verb', example_sentence: 'Der Bundestag verabschiedete das Gesetz.' },
      { german: 'die Meinungsfreiheit', translation: 'freedom of speech', part_of_speech: 'noun', example_sentence: 'Die Meinungsfreiheit ist ein Grundrecht.' },
      { german: 'der Kompromiss', translation: 'compromise', part_of_speech: 'noun', example_sentence: 'Beide Parteien einigten sich auf einen Kompromiss.' },
      { german: 'klagen', translation: 'to sue / file a lawsuit', part_of_speech: 'verb', example_sentence: 'Das Unternehmen klagte gegen die Entscheidung.' },
      { german: 'die Zuständigkeit', translation: 'jurisdiction / competence', part_of_speech: 'noun', example_sentence: 'Das liegt in der Zuständigkeit der Gemeinde.' },
      { german: 'anordnen', translation: 'to order / decree', part_of_speech: 'verb', example_sentence: 'Das Gericht ordnete eine Untersuchung an.' },
      { german: 'die Koalition', translation: 'coalition', part_of_speech: 'noun', example_sentence: 'Die Koalition verhandelt über den Koalitionsvertrag.' },
      { german: 'der Einspruch', translation: 'objection / appeal', part_of_speech: 'noun', example_sentence: 'Er legte Einspruch gegen das Urteil ein.' },
      { german: 'verfassungswidrig', translation: 'unconstitutional', part_of_speech: 'adjective', example_sentence: 'Das Gesetz wurde für verfassungswidrig erklärt.' },
    ],
  },

  // ── C2 ────────────────────────────────────────────────────────────────────
  {
    title: 'Philosophy & Abstract Thought',
    description: 'Engage with complex philosophical and abstract concepts at the highest level.',
    level: 'C2', topic: 'Philosophy',
    words: [
      { german: 'die Erkenntnistheorie', translation: 'epistemology', part_of_speech: 'noun', example_sentence: 'Die Erkenntnistheorie fragt, wie Wissen entsteht.' },
      { german: 'das Weltanschauung', translation: 'worldview', part_of_speech: 'noun', example_sentence: 'Jede Kultur hat ihre eigene Weltanschauung.' },
      { german: 'die Transzendenz', translation: 'transcendence', part_of_speech: 'noun', example_sentence: 'Kant unterscheidet zwischen Immanenz und Transzendenz.' },
      { german: 'das Paradoxon', translation: 'paradox', part_of_speech: 'noun', example_sentence: 'Das Paradoxon des Achilles beschäftigt Philosophen seit Jahrhunderten.' },
      { german: 'hinterfragen', translation: 'to question / challenge', part_of_speech: 'verb', example_sentence: 'Kritisches Denken bedeutet, alles zu hinterfragen.' },
      { german: 'die Kontroverse', translation: 'controversy', part_of_speech: 'noun', example_sentence: 'Diese These löste eine lebhafte Kontroverse aus.' },
      { german: 'immanent', translation: 'immanent / inherent', part_of_speech: 'adjective', example_sentence: 'Diese Spannung ist dem System immanent.' },
      { german: 'das Dilemma', translation: 'dilemma', part_of_speech: 'noun', example_sentence: 'Das ethische Dilemma hat keine einfache Lösung.' },
      { german: 'widerlegen', translation: 'to refute / disprove', part_of_speech: 'verb', example_sentence: 'Seine Theorie wurde empirisch widerlegt.' },
      { german: 'die Prämisse', translation: 'premise', part_of_speech: 'noun', example_sentence: 'Aus dieser Prämisse folgt eine falsche Schlussfolgerung.' },
      { german: 'das Subjektive', translation: 'the subjective', part_of_speech: 'noun', example_sentence: 'Das Subjektive lässt sich nicht messen.' },
      { german: 'dialektisch', translation: 'dialectical', part_of_speech: 'adjective', example_sentence: 'Hegels dialektisches Denken ist komplex.' },
      { german: 'die Stringenz', translation: 'rigour / stringency', part_of_speech: 'noun', example_sentence: 'Das Argument überzeugt durch seine Stringenz.' },
      { german: 'begründen', translation: 'to justify / substantiate', part_of_speech: 'verb', example_sentence: 'Können Sie Ihre Aussage begründen?' },
      { german: 'das Axiom', translation: 'axiom', part_of_speech: 'noun', example_sentence: 'Ein Axiom gilt als nicht beweisbare Grundwahrheit.' },
    ],
  },
]

async function main() {
  const existing = await db.select().from(vocab_decks).limit(1)
  if (existing.length > 0) {
    console.log('[seed] vocab_decks already populated — skipping')
    process.exit(0)
  }

  for (const def of DECKS) {
    const [deck] = await db.insert(vocab_decks).values({
      title: def.title,
      description: def.description,
      level: def.level,
      topic: def.topic,
      word_count: def.words.length,
    }).returning()

    await db.insert(vocab_deck_words).values(
      def.words.map((w, i) => ({ deck_id: deck!.id, ...w, sort_order: i }))
    )

    console.log(`[seed] deck "${def.title}" (${def.level}) — ${def.words.length} words`)
  }

  console.log(`[seed] ${DECKS.length} decks seeded`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
