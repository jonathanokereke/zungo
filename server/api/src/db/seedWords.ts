import { db } from './index.js'
import { users, words, reviews } from './schema.js'
import { eq } from 'drizzle-orm'
import { DEV_AUTH0_ID } from '../lib/auth0.js'

// 120 curated German words spanning B1–C1, covering everyday vocabulary,
// abstract concepts, and academic register. Distributed across noun, verb,
// adjective, and adverb categories.
const WORD_BANK: Array<{
  german: string
  translation: string
  part_of_speech: string
  example_sentence: string
}> = [
  // ── Nouns ──────────────────────────────────────────────────────────────
  { german: 'die Erfahrung', translation: 'experience', part_of_speech: 'noun', example_sentence: 'Diese Erfahrung hat mich viel gelehrt.' },
  { german: 'die Herausforderung', translation: 'challenge', part_of_speech: 'noun', example_sentence: 'Der neue Job war eine große Herausforderung.' },
  { german: 'die Möglichkeit', translation: 'possibility / opportunity', part_of_speech: 'noun', example_sentence: 'Es gibt viele Möglichkeiten, Deutsch zu lernen.' },
  { german: 'die Verantwortung', translation: 'responsibility', part_of_speech: 'noun', example_sentence: 'Sie trägt die Verantwortung für das Projekt.' },
  { german: 'die Entscheidung', translation: 'decision', part_of_speech: 'noun', example_sentence: 'Es war eine schwierige Entscheidung.' },
  { german: 'die Entwicklung', translation: 'development', part_of_speech: 'noun', example_sentence: 'Die technologische Entwicklung schreitet schnell voran.' },
  { german: 'die Bedeutung', translation: 'meaning / importance', part_of_speech: 'noun', example_sentence: 'Die Bedeutung dieses Wortes ist mir unklar.' },
  { german: 'die Beziehung', translation: 'relationship', part_of_speech: 'noun', example_sentence: 'Sie haben eine gute Beziehung zueinander.' },
  { german: 'die Gesellschaft', translation: 'society', part_of_speech: 'noun', example_sentence: 'In der modernen Gesellschaft spielt Technologie eine große Rolle.' },
  { german: 'die Vorstellung', translation: 'idea / imagination / performance', part_of_speech: 'noun', example_sentence: 'Meine Vorstellung davon war ganz anders.' },
  { german: 'die Wirkung', translation: 'effect / impact', part_of_speech: 'noun', example_sentence: 'Die Wirkung des Medikaments tritt schnell ein.' },
  { german: 'die Wahrheit', translation: 'truth', part_of_speech: 'noun', example_sentence: 'Er sagt immer die Wahrheit.' },
  { german: 'die Freiheit', translation: 'freedom', part_of_speech: 'noun', example_sentence: 'Freiheit ist ein grundlegendes Menschenrecht.' },
  { german: 'die Gelegenheit', translation: 'opportunity / occasion', part_of_speech: 'noun', example_sentence: 'Ich hatte keine Gelegenheit, ihn zu sprechen.' },
  { german: 'die Umgebung', translation: 'surroundings / environment', part_of_speech: 'noun', example_sentence: 'Er wohnt in einer schönen Umgebung.' },
  { german: 'die Fähigkeit', translation: 'ability / skill', part_of_speech: 'noun', example_sentence: 'Sie hat die Fähigkeit, andere zu motivieren.' },
  { german: 'die Einstellung', translation: 'attitude / setting', part_of_speech: 'noun', example_sentence: 'Seine Einstellung zur Arbeit ist sehr positiv.' },
  { german: 'die Unterstützung', translation: 'support', part_of_speech: 'noun', example_sentence: 'Ich bin dankbar für deine Unterstützung.' },
  { german: 'die Lösung', translation: 'solution', part_of_speech: 'noun', example_sentence: 'Wir müssen eine Lösung für dieses Problem finden.' },
  { german: 'die Aussage', translation: 'statement', part_of_speech: 'noun', example_sentence: 'Diese Aussage ist nicht korrekt.' },
  { german: 'der Unterschied', translation: 'difference', part_of_speech: 'noun', example_sentence: 'Was ist der Unterschied zwischen diesen beiden Wörtern?' },
  { german: 'der Zusammenhang', translation: 'context / connection', part_of_speech: 'noun', example_sentence: 'Im Zusammenhang mit der Wirtschaft ist das wichtig.' },
  { german: 'der Einfluss', translation: 'influence', part_of_speech: 'noun', example_sentence: 'Musik hat einen großen Einfluss auf unsere Stimmung.' },
  { german: 'der Fortschritt', translation: 'progress', part_of_speech: 'noun', example_sentence: 'Der medizinische Fortschritt rettet Leben.' },
  { german: 'der Mangel', translation: 'lack / shortage', part_of_speech: 'noun', example_sentence: 'Es gibt einen Mangel an Fachkräften.' },
  { german: 'der Vorteil', translation: 'advantage', part_of_speech: 'noun', example_sentence: 'Ein großer Vorteil ist die zentrale Lage.' },
  { german: 'der Nachteil', translation: 'disadvantage', part_of_speech: 'noun', example_sentence: 'Der einzige Nachteil ist der hohe Preis.' },
  { german: 'der Aufwand', translation: 'effort / expense', part_of_speech: 'noun', example_sentence: 'Der Aufwand hat sich gelohnt.' },
  { german: 'der Zweck', translation: 'purpose', part_of_speech: 'noun', example_sentence: 'Was ist der Zweck dieser Übung?' },
  { german: 'der Beitrag', translation: 'contribution', part_of_speech: 'noun', example_sentence: 'Jeder kann einen Beitrag zum Umweltschutz leisten.' },
  { german: 'das Ergebnis', translation: 'result', part_of_speech: 'noun', example_sentence: 'Das Ergebnis der Prüfung war gut.' },
  { german: 'das Verhalten', translation: 'behaviour', part_of_speech: 'noun', example_sentence: 'Sein Verhalten hat mich überrascht.' },
  { german: 'das Bewusstsein', translation: 'awareness / consciousness', part_of_speech: 'noun', example_sentence: 'Das Bewusstsein für Umweltfragen wächst.' },
  { german: 'das Verhältnis', translation: 'relationship / ratio', part_of_speech: 'noun', example_sentence: 'Das Verhältnis zwischen den Kollegen ist gut.' },
  { german: 'das Ziel', translation: 'goal / destination', part_of_speech: 'noun', example_sentence: 'Mein Ziel ist es, fließend Deutsch zu sprechen.' },
  { german: 'das Gespräch', translation: 'conversation', part_of_speech: 'noun', example_sentence: 'Wir hatten ein langes Gespräch über Politik.' },
  { german: 'das Vorurteil', translation: 'prejudice', part_of_speech: 'noun', example_sentence: 'Vorurteile sind oft unbegründet.' },
  { german: 'das Gleichgewicht', translation: 'balance / equilibrium', part_of_speech: 'noun', example_sentence: 'Ein gesundes Gleichgewicht zwischen Arbeit und Freizeit ist wichtig.' },
  { german: 'das Jahrzehnt', translation: 'decade', part_of_speech: 'noun', example_sentence: 'In den letzten Jahrzehnten hat sich viel verändert.' },
  { german: 'die Selbstständigkeit', translation: 'independence / self-employment', part_of_speech: 'noun', example_sentence: 'Sie schätzt ihre Selbstständigkeit sehr.' },

  // ── Verbs ──────────────────────────────────────────────────────────────
  { german: 'beeinflussen', translation: 'to influence', part_of_speech: 'verb', example_sentence: 'Werbung kann unser Kaufverhalten beeinflussen.' },
  { german: 'berücksichtigen', translation: 'to take into account', part_of_speech: 'verb', example_sentence: 'Wir müssen alle Faktoren berücksichtigen.' },
  { german: 'bewältigen', translation: 'to cope with / overcome', part_of_speech: 'verb', example_sentence: 'Sie hat die Krise gut bewältigt.' },
  { german: 'ermöglichen', translation: 'to enable / make possible', part_of_speech: 'verb', example_sentence: 'Technologie ermöglicht neue Formen der Kommunikation.' },
  { german: 'erkennen', translation: 'to recognise / realise', part_of_speech: 'verb', example_sentence: 'Ich habe das Problem sofort erkannt.' },
  { german: 'feststellen', translation: 'to determine / notice', part_of_speech: 'verb', example_sentence: 'Wir haben festgestellt, dass es ein Fehler war.' },
  { german: 'fördern', translation: 'to support / promote', part_of_speech: 'verb', example_sentence: 'Die Regierung fördert erneuerbare Energien.' },
  { german: 'sich handeln um', translation: 'to be about / to deal with', part_of_speech: 'verb', example_sentence: 'Bei diesem Problem handelt es sich um ein Missverständnis.' },
  { german: 'hervorheben', translation: 'to emphasise / highlight', part_of_speech: 'verb', example_sentence: 'Der Redner hob die wichtigsten Punkte hervor.' },
  { german: 'sich kümmern um', translation: 'to take care of', part_of_speech: 'verb', example_sentence: 'Er kümmert sich um seine kranke Mutter.' },
  { german: 'leisten', translation: 'to achieve / perform / afford', part_of_speech: 'verb', example_sentence: 'Sie hat gute Arbeit geleistet.' },
  { german: 'nachweisen', translation: 'to prove / demonstrate', part_of_speech: 'verb', example_sentence: 'Es wurde wissenschaftlich nachgewiesen.' },
  { german: 'überzeugen', translation: 'to convince', part_of_speech: 'verb', example_sentence: 'Er hat mich von seiner Idee überzeugt.' },
  { german: 'unterscheiden', translation: 'to distinguish / differentiate', part_of_speech: 'verb', example_sentence: 'Man muss zwischen diesen beiden Begriffen unterscheiden.' },
  { german: 'verbessern', translation: 'to improve', part_of_speech: 'verb', example_sentence: 'Ich möchte mein Deutsch verbessern.' },
  { german: 'vergleichen', translation: 'to compare', part_of_speech: 'verb', example_sentence: 'Man sollte nicht alles miteinander vergleichen.' },
  { german: 'vermeiden', translation: 'to avoid', part_of_speech: 'verb', example_sentence: 'Ich versuche, Zucker zu vermeiden.' },
  { german: 'vorschlagen', translation: 'to suggest / propose', part_of_speech: 'verb', example_sentence: 'Darf ich etwas vorschlagen?' },
  { german: 'wahrnehmen', translation: 'to perceive / notice', part_of_speech: 'verb', example_sentence: 'Wir nehmen Farben unterschiedlich wahr.' },
  { german: 'zusammenfassen', translation: 'to summarise', part_of_speech: 'verb', example_sentence: 'Können Sie das kurz zusammenfassen?' },
  { german: 'aufgreifen', translation: 'to take up / address (a topic)', part_of_speech: 'verb', example_sentence: 'Der Autor greift ein wichtiges Thema auf.' },
  { german: 'sich auseinandersetzen mit', translation: 'to deal with / examine critically', part_of_speech: 'verb', example_sentence: 'Wir müssen uns mit diesem Thema auseinandersetzen.' },
  { german: 'behaupten', translation: 'to claim / assert', part_of_speech: 'verb', example_sentence: 'Er behauptet, die Antwort zu kennen.' },
  { german: 'einschränken', translation: 'to restrict / limit', part_of_speech: 'verb', example_sentence: 'Der Lärm schränkt meine Konzentration ein.' },
  { german: 'erfordern', translation: 'to require / demand', part_of_speech: 'verb', example_sentence: 'Diese Aufgabe erfordert viel Geduld.' },
  { german: 'gestalten', translation: 'to shape / design', part_of_speech: 'verb', example_sentence: 'Wir können unsere Zukunft selbst gestalten.' },
  { german: 'hinweisen auf', translation: 'to point out', part_of_speech: 'verb', example_sentence: 'Ich möchte auf einen Fehler hinweisen.' },
  { german: 'scheitern', translation: 'to fail', part_of_speech: 'verb', example_sentence: 'Das Projekt ist leider gescheitert.' },
  { german: 'schildern', translation: 'to describe / portray', part_of_speech: 'verb', example_sentence: 'Er schilderte seine Erlebnisse sehr lebendig.' },
  { german: 'übernehmen', translation: 'to take over / adopt', part_of_speech: 'verb', example_sentence: 'Sie hat die Aufgabe übernommen.' },

  // ── Adjectives ─────────────────────────────────────────────────────────
  { german: 'ausgeprägt', translation: 'pronounced / strong / marked', part_of_speech: 'adjective', example_sentence: 'Sie hat ein ausgeprägtes Talent für Sprachen.' },
  { german: 'bedeutsam', translation: 'significant / meaningful', part_of_speech: 'adjective', example_sentence: 'Das war ein bedeutsamer Moment in der Geschichte.' },
  { german: 'erheblich', translation: 'considerable / significant', part_of_speech: 'adjective', example_sentence: 'Es gibt erhebliche Unterschiede zwischen den Varianten.' },
  { german: 'grundlegend', translation: 'fundamental / basic', part_of_speech: 'adjective', example_sentence: 'Das ist eine grundlegende Frage.' },
  { german: 'maßgeblich', translation: 'decisive / authoritative', part_of_speech: 'adjective', example_sentence: 'Er hat maßgeblich zum Erfolg beigetragen.' },
  { german: 'nachhaltig', translation: 'sustainable / lasting', part_of_speech: 'adjective', example_sentence: 'Wir brauchen nachhaltige Lösungen für die Umwelt.' },
  { german: 'überzeugend', translation: 'convincing / compelling', part_of_speech: 'adjective', example_sentence: 'Sein Argument war sehr überzeugend.' },
  { german: 'umfangreich', translation: 'extensive / comprehensive', part_of_speech: 'adjective', example_sentence: 'Es gibt umfangreiche Forschung zu diesem Thema.' },
  { german: 'vielfältig', translation: 'diverse / varied', part_of_speech: 'adjective', example_sentence: 'Das Angebot ist sehr vielfältig.' },
  { german: 'wesentlich', translation: 'essential / substantial', part_of_speech: 'adjective', example_sentence: 'Das ist ein wesentlicher Unterschied.' },
  { german: 'zutreffend', translation: 'accurate / applicable', part_of_speech: 'adjective', example_sentence: 'Diese Beschreibung ist nicht zutreffend.' },
  { german: 'angemessen', translation: 'appropriate / adequate', part_of_speech: 'adjective', example_sentence: 'Das ist eine angemessene Reaktion.' },
  { german: 'auffällig', translation: 'conspicuous / striking', part_of_speech: 'adjective', example_sentence: 'Sie trägt immer auffällige Kleidung.' },
  { german: 'bemerkenswert', translation: 'remarkable / noteworthy', part_of_speech: 'adjective', example_sentence: 'Ihr Fortschritt ist bemerkenswert.' },
  { german: 'entscheidend', translation: 'decisive / crucial', part_of_speech: 'adjective', example_sentence: 'Das war der entscheidende Moment.' },
  { german: 'gegenseitig', translation: 'mutual / reciprocal', part_of_speech: 'adjective', example_sentence: 'Es besteht gegenseitiges Vertrauen.' },
  { german: 'gründlich', translation: 'thorough', part_of_speech: 'adjective', example_sentence: 'Sie hat gründlich recherchiert.' },
  { german: 'sachlich', translation: 'objective / factual', part_of_speech: 'adjective', example_sentence: 'Bitte bleib sachlich in der Diskussion.' },
  { german: 'selbstverständlich', translation: 'obvious / taken for granted', part_of_speech: 'adjective', example_sentence: 'Das ist doch selbstverständlich.' },
  { german: 'treffend', translation: 'apt / fitting', part_of_speech: 'adjective', example_sentence: 'Das ist eine treffende Bemerkung.' },

  // ── Adverbs & connectors ───────────────────────────────────────────────
  { german: 'allerdings', translation: 'however / admittedly', part_of_speech: 'adverb', example_sentence: 'Das stimmt, allerdings gibt es Ausnahmen.' },
  { german: 'außerdem', translation: 'furthermore / in addition', part_of_speech: 'adverb', example_sentence: 'Außerdem möchte ich noch etwas hinzufügen.' },
  { german: 'dahingegen', translation: 'on the other hand', part_of_speech: 'adverb', example_sentence: 'Sie ist sehr ruhig; er dahingegen sehr lebhaft.' },
  { german: 'demzufolge', translation: 'consequently / therefore', part_of_speech: 'adverb', example_sentence: 'Es hat geregnet; demzufolge wurde das Spiel abgesagt.' },
  { german: 'dennoch', translation: 'nevertheless / still', part_of_speech: 'adverb', example_sentence: 'Es war schwierig, dennoch hat sie es geschafft.' },
  { german: 'deshalb', translation: 'therefore / that\'s why', part_of_speech: 'adverb', example_sentence: 'Er war krank, deshalb kam er nicht.' },
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
]

export async function seedWords(userId: string): Promise<void> {
  const existing = await db.select().from(words).where(eq(words.user_id, userId)).limit(1)
  if (existing.length) {
    console.log('[seed] Words already seeded for this user — skipping')
    return
  }

  const now = new Date()
  const wordRows = WORD_BANK.map(w => ({ ...w, user_id: userId }))
  const inserted = await db.insert(words).values(wordRows).returning({ id: words.id })

  // Create initial SRS review cards for every word — all due now so the
  // user can start reviewing immediately.
  const reviewRows = inserted.map(w => ({
    word_id: w.id,
    user_id: userId,
    due_date: now,
    interval: 0,
    repetition: 0,
    ease_factor: 2.5,
  }))
  await db.insert(reviews).values(reviewRows)

  console.log(`[seed] ${inserted.length} words + review cards created for user ${userId}`)
}

export async function seedDevWords(): Promise<void> {
  const devUsers = await db.select().from(users).where(eq(users.auth0_id, DEV_AUTH0_ID)).limit(1)
  if (!devUsers.length) {
    console.log('[seed] Dev user not found — run seedDevUser first')
    return
  }
  await seedWords(devUsers[0].id)
}
