import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users, grammar_sessions } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'
import { anthropic } from '../lib/anthropic'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

// All grammar topics with the minimum CEFR level required to encounter them
const ALL_TOPICS = [
  { title: 'Artikel & Genus',        subtitle: 'Definite and indefinite articles',    minLevel: 'A1', color: '#16A34A' },
  { title: 'Präsens',                subtitle: 'Present tense conjugation',            minLevel: 'A1', color: '#2563EB' },
  { title: 'Verneinung',             subtitle: 'Negation with nicht & kein',           minLevel: 'A1', color: '#7C3AED' },
  { title: 'Modalverben',            subtitle: 'Modal verbs: können, müssen, wollen',  minLevel: 'A2', color: '#B45309' },
  { title: 'Der Dativ',              subtitle: 'Indirect object case',                 minLevel: 'A2', color: '#16A34A' },
  { title: 'Perfekt',                subtitle: 'Present perfect with haben & sein',    minLevel: 'A2', color: '#DC2626' },
  { title: 'Adjektivdeklination',    subtitle: 'Adjective endings by case & gender',       minLevel: 'B1', color: '#6366F1' },
  { title: 'Konjunktiv II',          subtitle: 'Subjunctive mood for hypotheticals',       minLevel: 'B1', color: '#B45309' },
  { title: 'Passiv Konstruktionen',  subtitle: 'Passive voice with werden',                minLevel: 'B1', color: '#3730A3' },
  { title: 'Nebensätze',             subtitle: 'Subordinate clauses: weil, dass, wenn',    minLevel: 'B1', color: '#0891B2' },
  { title: 'Verben mit Präpositionen', subtitle: 'Verbs that govern specific prepositions', minLevel: 'B1', color: '#DC2626' },
  { title: 'Wechselpräpositionen',   subtitle: 'Two-way prepositions: Akkusativ & Dativ',  minLevel: 'B1', color: '#16A34A' },
  { title: 'Reflexive Verben',       subtitle: 'Reflexive verbs with sich',                minLevel: 'B1', color: '#7C3AED' },
  { title: 'Futur I',                subtitle: 'Future tense with werden + Infinitiv',     minLevel: 'B1', color: '#2563EB' },
  { title: 'Komparativ & Superlativ', subtitle: 'Comparative and superlative adjectives',  minLevel: 'B1', color: '#B45309' },
  { title: 'Trennbare Verben',       subtitle: 'Separable and inseparable prefix verbs',   minLevel: 'B1', color: '#16A34A' },
  { title: 'Relativsätze',           subtitle: 'Relative clauses with der/die/das',    minLevel: 'B2', color: '#DC2626' },
  { title: 'Genitiv',                subtitle: 'Possessive case',                      minLevel: 'B2', color: '#6366F1' },
  { title: 'Infinitivkonstruktionen',subtitle: 'Infinitive clauses with zu',           minLevel: 'B2', color: '#0891B2' },
  { title: 'Erweiterte Partizipien', subtitle: 'Extended participial phrases',          minLevel: 'C1', color: '#7C3AED' },
  { title: 'Konjunktiv I',           subtitle: 'Reported speech subjunctive',          minLevel: 'C1', color: '#B45309' },
  { title: 'Doppelkonjunktionen',    subtitle: 'Correlative conjunctions',             minLevel: 'C1', color: '#16A34A' },
  { title: 'Nominalstil',            subtitle: 'Nominalisation in formal German',      minLevel: 'C2', color: '#DC2626' },
  { title: 'Stilistische Mittel',    subtitle: 'Rhetorical and stylistic devices',     minLevel: 'C2', color: '#2563EB' },
]

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function topicsForLevel(level: string) {
  return ALL_TOPICS.filter(t => t.minLevel === level)
}

interface GrammarRef {
  explanation: string
  formula: string
  rows?: { label: string; value: string }[]   // optional table rows (e.g. conjugation)
  examples: { german: string; english: string }[]
  tips: string[]
}

const GRAMMAR_REFS: Record<string, GrammarRef> = {
  'Artikel & Genus': {
    explanation: 'Every German noun has a grammatical gender: masculine (der), feminine (die), or neuter (das). The definite article changes with gender and case; the indefinite article (ein/eine/ein) follows the same pattern. Gender must be memorised with each noun.',
    formula: 'der (masc.) · die (fem.) · das (neut.) · die (plural)',
    rows: [
      { label: 'Masculine', value: 'der Mann, der Tisch, der Hund' },
      { label: 'Feminine',  value: 'die Frau, die Lampe, die Katze' },
      { label: 'Neuter',    value: 'das Kind, das Buch, das Auto' },
      { label: 'Plural',    value: 'die Männer, die Bücher (always die)' },
    ],
    examples: [
      { german: 'Der Mann kauft das Buch.', english: 'The man buys the book.' },
      { german: 'Ich sehe eine Katze.', english: 'I see a cat.' },
      { german: 'Ein Kind spielt im Garten.', english: 'A child plays in the garden.' },
    ],
    tips: [
      'Learn every noun with its article from the start.',
      'Nouns ending in -ung, -heit, -keit, -schaft are almost always feminine (die).',
      'Nouns ending in -chen or -lein are always neuter (das): das Mädchen.',
      'Days, months, and seasons are masculine: der Montag, der Juli.',
    ],
  },
  'Präsens': {
    explanation: 'The Präsens (present tense) is used for current actions, habits, and near-future plans. Regular verbs follow a predictable conjugation pattern based on the infinitive stem. Many common verbs have stem vowel changes in 2nd and 3rd person singular.',
    formula: 'Stem + ending: -e, -st, -t, -en, -t, -en',
    rows: [
      { label: 'ich',  value: 'lerne' },
      { label: 'du',   value: 'lernst' },
      { label: 'er/sie/es', value: 'lernt' },
      { label: 'wir',  value: 'lernen' },
      { label: 'ihr',  value: 'lernt' },
      { label: 'sie/Sie', value: 'lernen' },
    ],
    examples: [
      { german: 'Ich lerne Deutsch jeden Tag.', english: 'I learn German every day.' },
      { german: 'Er fährt morgen nach Berlin.', english: 'He is driving to Berlin tomorrow.' },
      { german: 'Wir essen um 12 Uhr Mittag.', english: 'We eat lunch at 12 o\'clock.' },
    ],
    tips: [
      'Verbs like "fahren" (fährt), "lesen" (liest), "sprechen" (spricht) change their stem vowel in du/er/sie/es.',
      'The German present tense covers both "I do" and "I am doing".',
      'Stem-final -d/-t adds an extra -e-: du arbeitest, er wartet.',
    ],
  },
  'Verneinung': {
    explanation: '"Nicht" negates verbs, adjectives, adverbs, and proper nouns. "Kein/keine/kein" negates nouns that would use the indefinite article or no article at all. Choosing between them is the key skill.',
    formula: 'Verb/adj/adverb → nicht · Indefinite noun → kein',
    rows: [
      { label: 'Statement',        value: 'Ich habe Zeit.' },
      { label: 'nicht (verb)',     value: 'Ich habe keine Zeit. → kein (noun)' },
      { label: 'nicht (adj/adv)',  value: 'Das ist nicht richtig.' },
      { label: 'kein masculine',   value: 'kein Mann' },
      { label: 'kein feminine',    value: 'keine Frau' },
      { label: 'kein neuter',      value: 'kein Kind' },
    ],
    examples: [
      { german: 'Ich arbeite heute nicht.', english: 'I am not working today.' },
      { german: 'Das ist kein Problem.', english: 'That is not a problem.' },
      { german: 'Sie hat keine Zeit.', english: 'She has no time.' },
    ],
    tips: [
      'Use "kein" where you would say "a" or no article in a positive sentence: "Ich habe ein Auto" → "Ich habe kein Auto".',
      '"Nicht" usually comes at the end of the clause, or just before the element it negates.',
      '"Nicht" negates specific verbs, adjectives, adverbs, and definite noun phrases.',
    ],
  },
  'Modalverben': {
    explanation: 'Modal verbs express ability, necessity, permission, desire, or likelihood. They have irregular conjugations and are paired with an infinitive at the end of the clause. German has six core modals.',
    formula: 'Subject + Modal (conjugated) + ... + Infinitive',
    rows: [
      { label: 'können', value: 'can / to be able to' },
      { label: 'müssen', value: 'must / to have to' },
      { label: 'wollen', value: 'to want to' },
      { label: 'sollen', value: 'should / to be supposed to' },
      { label: 'dürfen', value: 'may / to be allowed to' },
      { label: 'mögen',  value: 'to like / möchten: would like to' },
    ],
    examples: [
      { german: 'Ich kann Deutsch sprechen.', english: 'I can speak German.' },
      { german: 'Du musst jetzt gehen.', english: 'You must leave now.' },
      { german: 'Sie möchte einen Kaffee trinken.', english: 'She would like to drink a coffee.' },
    ],
    tips: [
      'In the present tense, ich and er/sie/es share the same form: ich kann, er kann.',
      '"Nicht müssen" means "don\'t have to", not "must not". "Darf nicht" means "must not".',
      'In past tense, modals use double infinitive: "Er hat gehen müssen."',
    ],
  },
  'Der Dativ': {
    explanation: 'The dative case marks the indirect object of a verb — the recipient of an action. It is also required after certain prepositions (mit, bei, nach, seit, von, zu, aus, außer, gegenüber) and certain verbs (helfen, danken, gefallen, gehören).',
    formula: 'Definite: dem (m/n) · der (f) · den+n (pl)  |  Indefinite: einem (m/n) · einer (f)',
    rows: [
      { label: 'Masculine', value: 'dem Mann / einem Mann' },
      { label: 'Feminine',  value: 'der Frau / einer Frau' },
      { label: 'Neuter',    value: 'dem Kind / einem Kind' },
      { label: 'Plural',    value: 'den Kindern (noun adds -n)' },
    ],
    examples: [
      { german: 'Ich gebe dem Kind ein Buch.', english: 'I give the child a book.' },
      { german: 'Sie hilft ihrer Mutter.', english: 'She helps her mother.' },
      { german: 'Wir fahren mit dem Bus.', english: 'We travel by bus.' },
    ],
    tips: [
      'Plural nouns add -n in the dative unless they already end in -n or -s.',
      'Memorise the dative-only prepositions: mit, bei, nach, seit, von, zu, aus, außer, gegenüber.',
      'Certain verbs always take dative: helfen, danken, gefallen, gehören, folgen, glauben.',
    ],
  },
  'Perfekt': {
    explanation: 'The Perfekt is the standard spoken past tense in German. It is formed with an auxiliary verb (haben or sein) plus the Partizip II of the main verb. Verbs of motion and change of state usually take sein; most others take haben.',
    formula: 'haben/sein (conjugated) + Partizip II (at end)',
    rows: [
      { label: 'Regular Partizip II',  value: 'ge- + stem + -t: gemacht, gelernt' },
      { label: 'Irregular Partizip II', value: 'ge- + stem + -en: gegangen, gesehen' },
      { label: 'With sein',            value: 'gehen, kommen, fahren, sterben, werden' },
      { label: 'With haben',           value: 'machen, essen, kaufen, lesen, sehen' },
    ],
    examples: [
      { german: 'Ich habe Deutsch gelernt.', english: 'I learned German.' },
      { german: 'Sie ist nach Hause gegangen.', english: 'She went home.' },
      { german: 'Wir haben einen Film gesehen.', english: 'We watched a film.' },
    ],
    tips: [
      'When in doubt about haben vs. sein, ask: does the verb describe movement from A to B, or change of state? → sein.',
      'Separable verbs insert -ge- between prefix and stem: aufgemacht.',
      'Verbs with inseparable prefixes (be-, ge-, er-, ver-) do NOT add ge-: besucht, vergessen.',
    ],
  },
  'Adjektivdeklination': {
    explanation: 'German adjectives change their endings depending on grammatical gender, case, number, and whether a definite, indefinite, or no article precedes them. There are three declension patterns: weak (after der/die/das), mixed (after ein/kein), and strong (no article).',
    formula: 'Article type + Gender + Case → ending',
    rows: [
      { label: 'Weak (after der)',    value: 'Nom: -e · Acc/Gen/Dat: -en' },
      { label: 'Mixed (after ein)',   value: 'Nom m/n: -er/-es · Acc f/n: -e/-es · rest: -en' },
      { label: 'Strong (no article)', value: 'Endings match the definite article' },
    ],
    examples: [
      { german: 'Der alte Mann geht spazieren.', english: 'The old man goes for a walk. (weak nom)' },
      { german: 'Ich kaufe einen roten Apfel.', english: 'I buy a red apple. (mixed acc masc)' },
      { german: 'Frisches Brot schmeckt gut.', english: 'Fresh bread tastes good. (strong nom neut)' },
    ],
    tips: [
      'The strong pattern carries the gender signal the article would normally give.',
      'Learn the weak pattern first: it is always -e in Nom.sg. and -en everywhere else.',
      'Predicative adjectives (after sein/werden) never inflect: Das Brot ist frisch.',
    ],
  },
  'Konjunktiv II': {
    explanation: 'The Konjunktiv II (subjunctive II) expresses hypothetical situations, polite requests, wishes, and unreal conditionals. It is formed with würde + infinitive for most verbs, or with irregular forms for common verbs like sein, haben, and modals.',
    formula: 'würde + Infinitiv  (or: hätte / wäre / könnte / müsste…)',
    rows: [
      { label: 'sein',   value: 'ich wäre, du wärst, er wäre…' },
      { label: 'haben',  value: 'ich hätte, du hättest, er hätte…' },
      { label: 'können', value: 'ich könnte, du könntest…' },
      { label: 'General', value: 'ich würde gehen, du würdest sagen…' },
    ],
    examples: [
      { german: 'Wenn ich Zeit hätte, würde ich mehr lesen.', english: 'If I had time, I would read more.' },
      { german: 'Könntest du mir helfen?', english: 'Could you help me?' },
      { german: 'Ich wäre gern Pilot.', english: 'I would like to be a pilot.' },
    ],
    tips: [
      'Use hätte/wäre/modals directly; use würde+infinitive for most other verbs.',
      '"Würde + infinitive" avoids awkward Konjunktiv II forms of weak verbs.',
      'Unreal conditionals: wenn-clause uses Konjunktiv II, main clause uses würde or Konj. II.',
    ],
  },
  'Passiv Konstruktionen': {
    explanation: 'The German passive (Vorgangspassiv) describes an action without emphasising the agent. It is formed with werden + Partizip II. The agent (if mentioned) is introduced with von + dative. The Zustandspassiv uses sein + Partizip II to describe a resulting state.',
    formula: 'werden (conjugated) + Partizip II  |  von + Dative for agent',
    rows: [
      { label: 'Present passive',   value: 'Das Haus wird gebaut.' },
      { label: 'Past passive',      value: 'Das Haus wurde gebaut.' },
      { label: 'Perfect passive',   value: 'Das Haus ist gebaut worden.' },
      { label: 'State passive',     value: 'Das Haus ist gebaut. (sein + Partizip II)' },
      { label: 'With agent',        value: 'Das Buch wird von ihr gelesen.' },
    ],
    examples: [
      { german: 'Das Fenster wird geöffnet.', english: 'The window is being opened.' },
      { german: 'Das Paket wurde gestern geliefert.', english: 'The package was delivered yesterday.' },
      { german: 'Das Lied wird von allen gesungen.', english: 'The song is sung by everyone.' },
    ],
    tips: [
      'In perfect passive, "worden" (not "geworden") is used: ist gebaut worden.',
      'Dative objects cannot become the subject of a passive; they stay in dative.',
      'Impersonal passive is possible: Es wird getanzt. (People are dancing.)',
    ],
  },
  'Nebensätze': {
    explanation: 'Subordinate clauses (Nebensätze) begin with a subordinating conjunction and push the conjugated verb to the very end of the clause. Common conjunctions include: weil (because), dass (that), wenn (when/if), obwohl (although), damit (so that).',
    formula: 'Main clause + Conjunction + ... + Verb (end)',
    rows: [
      { label: 'weil',    value: 'because: Ich lerne, weil es Spaß macht.' },
      { label: 'dass',    value: 'that: Ich denke, dass er kommt.' },
      { label: 'wenn',    value: 'when/if: Wenn du Zeit hast, ruf an.' },
      { label: 'obwohl',  value: 'although: Er kam, obwohl er müde war.' },
      { label: 'damit',   value: 'so that: Sie spart, damit sie reisen kann.' },
    ],
    examples: [
      { german: 'Ich lerne Deutsch, weil ich nach Berlin ziehen möchte.', english: 'I\'m learning German because I want to move to Berlin.' },
      { german: 'Er weiß, dass sie recht hat.', english: 'He knows that she is right.' },
      { german: 'Wenn es regnet, bleibe ich zu Hause.', english: 'When it rains, I stay home.' },
    ],
    tips: [
      'The finite verb goes to the very last position in the subordinate clause.',
      'Separable verbs stay together at the end: weil er aufgestanden ist.',
      'When a Nebensatz starts the sentence, the main clause inverts: Weil er müde ist, schläft er.',
    ],
  },
  'Verben mit Präpositionen': {
    explanation: 'Many German verbs are always paired with a specific preposition, which determines whether the following noun phrase is in accusative or dative. These must be learned as fixed combinations.',
    formula: 'Verb + fixed preposition + Case (Akk or Dat)',
    rows: [
      { label: 'warten auf + Akk',   value: 'to wait for: Ich warte auf den Bus.' },
      { label: 'denken an + Akk',    value: 'to think of: Ich denke an dich.' },
      { label: 'sprechen über + Akk', value: 'to talk about: Wir sprechen über das Problem.' },
      { label: 'helfen bei + Dat',   value: 'to help with: Er hilft mir bei der Arbeit.' },
      { label: 'sich freuen auf + Akk', value: 'to look forward to: Ich freue mich auf den Urlaub.' },
    ],
    examples: [
      { german: 'Sie wartet auf ihren Freund.', english: 'She is waiting for her boyfriend.' },
      { german: 'Wir denken an unsere Reise.', english: 'We are thinking of our trip.' },
      { german: 'Er bittet um Hilfe.', english: 'He is asking for help.' },
    ],
    tips: [
      'Make flashcards for verb + preposition + case as a single unit.',
      'Da- compounds (darauf, darüber) replace preposition + pronoun when referring to things.',
      'Wo- compounds (worauf, worüber) are used in questions about things.',
    ],
  },
  'Wechselpräpositionen': {
    explanation: 'Nine prepositions (an, auf, hinter, in, neben, über, unter, vor, zwischen) can take either accusative or dative. Accusative is used for movement or direction (answering "wohin?"); dative is used for location or state (answering "wo?").',
    formula: 'Wohin? (direction) → Akkusativ · Wo? (location) → Dativ',
    rows: [
      { label: 'an',      value: 'at, on (vertical surface)' },
      { label: 'auf',     value: 'on (horizontal surface)' },
      { label: 'hinter',  value: 'behind' },
      { label: 'in',      value: 'in, into' },
      { label: 'über',    value: 'over, above' },
      { label: 'unter',   value: 'under, below' },
      { label: 'vor',     value: 'in front of, before' },
      { label: 'neben',   value: 'next to, beside' },
      { label: 'zwischen',value: 'between' },
    ],
    examples: [
      { german: 'Ich hänge das Bild an die Wand.', english: 'I hang the picture on the wall. (Akk – movement)' },
      { german: 'Das Bild hängt an der Wand.', english: 'The picture hangs on the wall. (Dat – location)' },
      { german: 'Sie geht in die Küche.', english: 'She goes into the kitchen. (Akk)' },
    ],
    tips: [
      'Ask yourself: is something being placed/moved (Akk), or is it already there (Dat)?',
      'Contracted forms: in dem → im, in das → ins, an dem → am, an das → ans.',
      'Figurative uses are mostly dative: Ich denke an dich (fixed verb-prep combo).',
    ],
  },
  'Reflexive Verben': {
    explanation: 'Reflexive verbs use a reflexive pronoun (mich/dich/sich…) that refers back to the subject. Some verbs are inherently reflexive (sich freuen, sich beeilen); others can be used reflexively (sich waschen = to wash oneself). The pronoun case depends on the verb.',
    formula: 'Subject + reflexive verb + sich/mich/dich/uns/euch (Akk or Dat)',
    rows: [
      { label: 'ich',       value: 'mich / mir' },
      { label: 'du',        value: 'dich / dir' },
      { label: 'er/sie/es', value: 'sich / sich' },
      { label: 'wir',       value: 'uns / uns' },
      { label: 'ihr',       value: 'euch / euch' },
      { label: 'sie/Sie',   value: 'sich / sich' },
    ],
    examples: [
      { german: 'Ich freue mich auf das Wochenende.', english: 'I am looking forward to the weekend.' },
      { german: 'Er wäscht sich die Hände.', english: 'He washes his hands. (Dat – another object present)' },
      { german: 'Wir beeilen uns.', english: 'We are hurrying.' },
    ],
    tips: [
      'If a direct object is also present (sich die Hände waschen), the reflexive pronoun is dative.',
      'Inherently reflexive verbs must always have the pronoun; it cannot be omitted.',
      'In Perfekt, reflexive verbs always take haben: Ich habe mich gewaschen.',
    ],
  },
  'Futur I': {
    explanation: 'Futur I expresses future events, predictions, or intentions. It is formed with werden + infinitive. In everyday speech, the present tense with a time adverb is often preferred. Futur I also expresses presumption about the present.',
    formula: 'werden (conjugated) + Infinitiv (end of clause)',
    rows: [
      { label: 'ich',       value: 'ich werde gehen' },
      { label: 'du',        value: 'du wirst gehen' },
      { label: 'er/sie/es', value: 'er wird gehen' },
      { label: 'wir',       value: 'wir werden gehen' },
      { label: 'ihr',       value: 'ihr werdet gehen' },
      { label: 'sie/Sie',   value: 'sie werden gehen' },
    ],
    examples: [
      { german: 'Morgen wird es regnen.', english: 'It will rain tomorrow.' },
      { german: 'Wir werden das Problem lösen.', english: 'We will solve the problem.' },
      { german: 'Er wird wohl schon schlafen.', english: 'He is probably already asleep. (presumption)' },
    ],
    tips: [
      'In spoken German, "Ich gehe morgen" is more natural than "Ich werde morgen gehen".',
      'Futur I + wohl/wahrscheinlich expresses a reasonable guess about the present.',
      'Don\'t confuse Futur I (werden + inf.) with Passiv (werden + Partizip II).',
    ],
  },
  'Komparativ & Superlativ': {
    explanation: 'Comparative adjectives add -er to the base form; superlatives add -(e)sten and are used with am or as an attributive adjective. Many common adjectives are irregular (gut → besser → best-). Adjective endings still apply in all degrees.',
    formula: 'Base → Komparativ: +er · Superlativ: am +(e)sten / attributive: -(e)ste',
    rows: [
      { label: 'Regular',    value: 'klein → kleiner → am kleinsten' },
      { label: 'Umlaut',     value: 'alt → älter → am ältesten' },
      { label: 'gut',        value: 'gut → besser → am besten' },
      { label: 'viel',       value: 'viel → mehr → am meisten' },
      { label: 'gern',       value: 'gern → lieber → am liebsten' },
    ],
    examples: [
      { german: 'Berlin ist größer als Hamburg.', english: 'Berlin is larger than Hamburg.' },
      { german: 'Das ist das schönste Bild.', english: 'That is the most beautiful picture.' },
      { german: 'Ich trinke lieber Tee als Kaffee.', english: 'I prefer tea to coffee.' },
    ],
    tips: [
      'Comparisons use als (than): Er ist größer als ich.',
      'Equality uses so … wie: Er ist so groß wie ich.',
      'One-syllable adjectives with a, o, u usually take an umlaut: jung → jünger.',
    ],
  },
  'Trennbare Verben': {
    explanation: 'Separable prefix verbs have a stressed prefix that detaches and moves to the end of the main clause in present and simple past tenses. Inseparable prefixes (be-, ge-, emp-, ent-, er-, miss-, ver-, zer-) are unstressed and never separate.',
    formula: 'Prefix separates → end of clause  |  Partizip II: ge- between prefix & stem',
    rows: [
      { label: 'Separable prefixes',   value: 'ab-, an-, auf-, aus-, ein-, mit-, vor-, zu-, zurück-…' },
      { label: 'Inseparable prefixes', value: 'be-, ge-, emp-, ent-, er-, miss-, ver-, zer-' },
      { label: 'Present',              value: 'Ich rufe an. (anrufen)' },
      { label: 'Partizip II',          value: 'angerufen, aufgemacht, eingeschlafen' },
    ],
    examples: [
      { german: 'Er steht um 7 Uhr auf.', english: 'He gets up at 7 o\'clock.' },
      { german: 'Wir kommen morgen an.', english: 'We arrive tomorrow.' },
      { german: 'Ich habe gestern angerufen.', english: 'I called yesterday.' },
    ],
    tips: [
      'In subordinate clauses the verb goes last but stays unseparated: weil er aufsteht.',
      'With modals, the infinitive is written as one word: Ich muss aufstehen.',
      'No "ge-" in Partizip II for inseparable verbs: verstanden, besucht, empfohlen.',
    ],
  },
  'Relativsätze': {
    explanation: 'Relative clauses define or give extra information about a preceding noun. They begin with a relative pronoun (der/die/das/deren/denen…) that agrees in gender and number with the antecedent but takes its case from its role within the relative clause. The verb goes to the end.',
    formula: 'Antecedent + relative pronoun (gender/number of noun, case from clause role) + … + Verb',
    rows: [
      { label: 'Masculine Nom', value: 'der → Der Mann, der singt…' },
      { label: 'Masculine Akk', value: 'den → Der Mann, den ich sehe…' },
      { label: 'Masculine Dat', value: 'dem → Der Mann, dem ich helfe…' },
      { label: 'Feminine all',  value: 'die/die/der/deren' },
      { label: 'Neuter all',    value: 'das/das/dem/dessen' },
      { label: 'Plural all',    value: 'die/die/denen/deren' },
    ],
    examples: [
      { german: 'Das Buch, das ich lese, ist spannend.', english: 'The book that I am reading is exciting.' },
      { german: 'Die Frau, der ich geholfen habe, ist meine Lehrerin.', english: 'The woman I helped is my teacher.' },
      { german: 'Der Mann, dessen Auto kaputt ist, braucht Hilfe.', english: 'The man whose car is broken needs help.' },
    ],
    tips: [
      'The relative pronoun looks like the definite article except in dative plural (denen) and genitive (dessen/deren).',
      'A comma always precedes the relative clause.',
      'The verb moves to the very end of the relative clause.',
    ],
  },
  'Genitiv': {
    explanation: 'The genitive case expresses possession or belonging. It is required after certain prepositions (wegen, trotz, während, statt, außerhalb, innerhalb) and in formal written German. Masculine and neuter nouns add -(e)s in genitive.',
    formula: 'des/der/des/der + noun (masc/neut add -s)  |  eines/einer/eines',
    rows: [
      { label: 'Masculine', value: 'des Mannes / eines Mannes' },
      { label: 'Feminine',  value: 'der Frau / einer Frau' },
      { label: 'Neuter',    value: 'des Kindes / eines Kindes' },
      { label: 'Plural',    value: 'der Kinder' },
    ],
    examples: [
      { german: 'Das Auto meines Vaters ist neu.', english: 'My father\'s car is new.' },
      { german: 'Trotz des Regens gingen wir spazieren.', english: 'Despite the rain we went for a walk.' },
      { german: 'Das Ende des Films war überraschend.', english: 'The end of the film was surprising.' },
    ],
    tips: [
      'In spoken German, von + dative often replaces the genitive: das Auto von meinem Vater.',
      'Proper names just add -s without an apostrophe: Goethes Faust.',
      'Memorise genitive prepositions: wegen, trotz, während, statt, (an)statt, außerhalb, innerhalb, diesseits, jenseits.',
    ],
  },
  'Infinitivkonstruktionen': {
    explanation: 'Infinitive clauses with "zu" are used after many verbs, adjectives, and nouns to express purpose or dependency. With separable verbs, "zu" is inserted between prefix and stem. When the subject of both clauses is the same, "zu + infinitive" can replace a dass-clause.',
    formula: 'zu + Infinitiv (end of clause)  |  Separable: prefix + zu + stem',
    rows: [
      { label: 'Basic structure',  value: 'Ich versuche, Deutsch zu lernen.' },
      { label: 'Separable verb',   value: 'Ich vergesse, aufzuhören.' },
      { label: 'um … zu',          value: 'purpose: Ich lerne, um Arbeit zu finden.' },
      { label: 'ohne … zu',        value: 'without: Er ging, ohne zu grüßen.' },
      { label: 'statt … zu',       value: 'instead of: Statt zu schlafen, arbeitet er.' },
    ],
    examples: [
      { german: 'Es ist wichtig, pünktlich zu sein.', english: 'It is important to be punctual.' },
      { german: 'Ich hoffe, bald fertig zu werden.', english: 'I hope to finish soon.' },
      { german: 'Sie fährt in die Stadt, um einzukaufen.', english: 'She goes into town in order to shop.' },
    ],
    tips: [
      'A comma is usually written before infinitive clauses when they have additional elements.',
      'The subject of both clauses must be the same for "zu + infinitive"; otherwise use "dass".',
      '"um … zu" always expresses purpose and answers "why?" or "for what reason?"',
    ],
  },
  'Erweiterte Partizipien': {
    explanation: 'Extended participial phrases allow an entire modifying clause to be compressed into a noun phrase. The participle (present or past) and all its modifiers come between the article and the noun. This construction is common in written and formal German.',
    formula: 'Article + [modifiers + Partizip I/II] + Noun',
    rows: [
      { label: 'Partizip I (active)', value: 'das weinende Kind = das Kind, das weint' },
      { label: 'Partizip II (passive)', value: 'das gelesene Buch = das Buch, das gelesen wurde' },
      { label: 'Extended example',    value: 'der von vielen bewunderte Künstler = der Künstler, der von vielen bewundert wird' },
    ],
    examples: [
      { german: 'Die im letzten Jahr erschienene Studie zeigt neue Ergebnisse.', english: 'The study published last year shows new findings.' },
      { german: 'Der aufgeregt wartende Schüler bekam die Nachricht.', english: 'The excitedly waiting student received the news.' },
      { german: 'Das bereits verkaufte Haus steht noch leer.', english: 'The already sold house is still empty.' },
    ],
    tips: [
      'The entire bracketed phrase modifies the noun that follows it.',
      'Partizip I is formed by adding -d to the infinitive: lachend, weinend, wartend.',
      'Partizip II of the main verb is used for completed or passive states.',
    ],
  },
  'Konjunktiv I': {
    explanation: 'The Konjunktiv I is used mainly in indirect speech to report what someone said without endorsing it. It is formed from the infinitive stem. When Konjunktiv I is identical to indicative, Konjunktiv II is used instead. It appears frequently in journalism and formal writing.',
    formula: 'Infinitive stem + endings: -e, -est, -e, -en, -et, -en',
    rows: [
      { label: 'sein (special)', value: 'ich sei, du sei(e)st, er sei, wir seien, ihr seiet, sie seien' },
      { label: 'haben',          value: 'er habe, sie habe, es habe' },
      { label: 'machen',         value: 'er mache, sie mache' },
      { label: 'kommen',         value: 'er komme, sie komme' },
    ],
    examples: [
      { german: 'Er sagte, er habe keine Zeit.', english: 'He said he had no time.' },
      { german: 'Die Zeitung berichtet, die Preise seien gestiegen.', english: 'The newspaper reports that prices have risen.' },
      { german: 'Sie erklärte, sie komme morgen.', english: 'She explained she would come tomorrow.' },
    ],
    tips: [
      'When Konj. I = indicative (mostly with wir/ihr/sie forms), use Konj. II instead.',
      'Infinitive stem is the stem of the infinitive: machen → mach-, kommen → komm-.',
      '"Sein" is the most important irregular Konjunktiv I form: er sei.',
    ],
  },
  'Doppelkonjunktionen': {
    explanation: 'Correlative conjunctions (Doppelkonjunktionen) come in pairs and connect equal grammatical elements. They can link nouns, adjectives, clauses, and more. Each pair has its own meaning and sometimes affects word order.',
    formula: 'First element … Second element (paired)',
    rows: [
      { label: 'sowohl … als auch', value: 'both … and: sowohl Kaffee als auch Tee' },
      { label: 'entweder … oder',   value: 'either … or' },
      { label: 'weder … noch',      value: 'neither … nor' },
      { label: 'nicht nur … sondern auch', value: 'not only … but also' },
      { label: 'zwar … aber',       value: 'admittedly … but' },
      { label: 'je … desto',        value: 'the more … the more' },
    ],
    examples: [
      { german: 'Er spricht sowohl Deutsch als auch Englisch.', english: 'He speaks both German and English.' },
      { german: 'Entweder kommst du, oder ich gehe allein.', english: 'Either you come, or I go alone.' },
      { german: 'Je mehr er übt, desto besser wird er.', english: 'The more he practises, the better he gets.' },
    ],
    tips: [
      '"Je … desto" triggers verb-final order in the je-clause and verb-second in the desto-clause.',
      '"Weder … noch" creates a stronger negation than "nicht … und nicht".',
      '"Nicht nur … sondern auch" emphasises the addition: not merely X but also Y.',
    ],
  },
  'Nominalstil': {
    explanation: 'Nominalstil (noun-heavy style) converts verbs and adjectives into nouns to create formal, compact sentences. It is characteristic of academic, legal, and bureaucratic German. Nominalisations typically use capitalized nouns formed from verbs or adjectives.',
    formula: 'Verb/Adjective → Noun form (usually with -ung, -heit, -keit, -schaft, das + infinitive)',
    rows: [
      { label: 'Verb → -ung',      value: 'entscheiden → die Entscheidung' },
      { label: 'Verb → das',       value: 'laufen → das Laufen' },
      { label: 'Adjective → -heit', value: 'frei → die Freiheit' },
      { label: 'Adjective → -keit', value: 'möglich → die Möglichkeit' },
      { label: 'Adjective → -schaft', value: 'bereit → die Bereitschaft' },
    ],
    examples: [
      { german: 'Nach der Überprüfung der Unterlagen erfolgt die Entscheidung.', english: 'After checking the documents, the decision will be made.' },
      { german: 'Die Lösung des Problems erfordert Zusammenarbeit.', english: 'Solving the problem requires cooperation.' },
      { german: 'Unter Berücksichtigung aller Faktoren…', english: 'Taking all factors into consideration…' },
    ],
    tips: [
      'Nominalstil is often criticised as opaque; balanced use is stylistically appropriate.',
      'Recognise common nominalisation suffixes: -ung, -heit, -keit, -schaft, -tum, -nis.',
      'Genitive chains are typical: die Erhöhung der Qualität der Ausbildung.',
    ],
  },
  'Stilistische Mittel': {
    explanation: 'Rhetorical and stylistic devices (Stilmittel) give German texts their expressive power. Understanding them is essential for advanced reading and sophisticated writing. Key devices include metaphor, alliteration, anaphora, irony, hyperbole, ellipsis, and chiasmus.',
    formula: 'Identify device → Analyse effect on the reader',
    rows: [
      { label: 'Metapher',      value: 'indirect comparison: Das Leben ist eine Reise.' },
      { label: 'Alliteration',  value: 'repeated initial sounds: Mit Mut und Macht…' },
      { label: 'Anapher',       value: 'repeated opening words: Wir wollen…Wir fordern…Wir verlangen…' },
      { label: 'Ironie',        value: 'meaning the opposite: Das war ja wirklich toll! (sarcastically)' },
      { label: 'Hyperbel',      value: 'exaggeration: Ich habe das tausendmal gesagt.' },
      { label: 'Ellipse',       value: 'omission for effect: Geld oder Leben!' },
    ],
    examples: [
      { german: 'Die Zeit ist ein Dieb.', english: 'Time is a thief. (Metapher)' },
      { german: 'Wir kämpfen, wir siegen, wir triumphieren.', english: 'We fight, we win, we triumph. (Anapher)' },
      { german: 'Er hat "zufällig" genau das Richtige gesagt.', english: 'He "coincidentally" said exactly the right thing. (Ironie)' },
    ],
    tips: [
      'When analysing a text, name the device, cite the example, and explain its intended effect.',
      'Irony and sarcasm are distinguished by intent: irony can be constructive, sarcasm is cutting.',
      'Chiasmus reverses the structure: "Man lebt nicht, um zu essen – man isst, um zu leben."',
    ],
  },
}

function getRef(topic: string): GrammarRef | null {
  return GRAMMAR_REFS[topic] ?? null
}

export async function grammarRoutes(app: FastifyInstance) {
  // Returns topics appropriate for the user's CEFR level
  app.get('/api/grammar/topics', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const sessions = await db.select().from(grammar_sessions)
      .where(eq(grammar_sessions.user_id, user.id))
      .orderBy(desc(grammar_sessions.created_at))
      .limit(200)

    // Compute per-topic average mastery
    const masteryMap: Record<string, number[]> = {}
    for (const s of sessions) {
      if (!masteryMap[s.topic]) masteryMap[s.topic] = []
      masteryMap[s.topic]!.push(s.pct)
    }

    const topics = topicsForLevel(user.level).map(def => {
      const pcts = masteryMap[def.title]
      const mastery = pcts && pcts.length > 0
        ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
        : 0
      return { ...def, mastery }
    })

    return reply.send({ data: { topics, level: user.level } })
  })

  // Returns the static grammar reference card for a given topic
  app.get('/api/grammar/reference', { preHandler: verifyAuth }, async (request, reply) => {
    const query = request.query as { topic?: string }
    const topic = query.topic ?? ''
    const ref = getRef(topic)
    if (!ref) return reply.code(404).send({ error: { code: 'not_found', message: 'No reference for this topic' } })
    return reply.send({ data: ref })
  })

  // Generates 5 exercise questions for a given topic at the user's level using Claude
  app.get('/api/grammar/exercises', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const query = request.query as { topic?: string }
    const topic = query.topic ?? 'Präsens'

    const systemPrompt = `You are a German grammar exercise generator for CEFR level ${user.level} learners.
Generate exactly 5 multiple-choice questions for the topic: "${topic}".

Return a JSON array of 5 objects, each with:
- sentence: German sentence with a blank marked as ___
- options: array of exactly 4 strings (possible answers)
- correct: index (0-3) of the correct option
- explanation: one sentence in English explaining why the answer is correct and which grammar rule applies

Ensure questions are appropriate for level ${user.level}. Return only valid JSON array, no extra text.`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Generate 5 ${topic} exercises for CEFR ${user.level}` }],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
      // Strip markdown code fences if present
      const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      const questions = JSON.parse(clean)

      return reply.send({ data: { questions, topic, level: user.level } })
    } catch (err) {
      request.log.error({ err }, 'Grammar exercise generation failed')
      return reply.code(500).send({ error: { code: 'ai_error', message: 'Could not generate exercises' } })
    }
  })

  app.post('/api/grammar/session', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const body = request.body as { topic: string; score: number; total: number }
    if (!body.topic || body.score == null || body.total == null) {
      return reply.code(400).send({ error: { code: 'validation_error', message: 'topic, score, total required' } })
    }

    const pct = body.total > 0 ? Math.round((body.score / body.total) * 100) : 0

    const [session] = await db.insert(grammar_sessions).values({
      user_id: user.id,
      topic: body.topic,
      score: body.score,
      total: body.total,
      pct,
    }).returning()

    return reply.code(201).send({ data: session })
  })

  app.get('/api/grammar/sessions', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const sessions = await db.select().from(grammar_sessions)
      .where(eq(grammar_sessions.user_id, user.id))
      .orderBy(desc(grammar_sessions.created_at))
      .limit(50)

    return reply.send({ data: sessions })
  })
}
