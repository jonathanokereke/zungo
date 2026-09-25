import { db } from './index'
import { articles } from './schema'

function wc(text: string) { return text.trim().split(/\s+/).length }
function mins(text: string) { return Math.max(1, Math.round(wc(text) / 150)) }

const ARTICLES = [
  // ── A1 ──────────────────────────────────────────────────────────────────────
  {
    title: 'Meine Familie',
    level: 'A1' as const, topic: 'Familie',
    text: 'Ich heiße Anna. Ich habe eine kleine Familie. Mein Vater heißt Thomas. Meine Mutter heißt Maria. Ich habe einen Bruder. Er heißt Max. Max ist acht Jahre alt. Wir wohnen in Berlin. Wir haben eine Katze. Die Katze heißt Mia.',
  },
  {
    title: 'Ein normaler Tag',
    level: 'A1' as const, topic: 'Alltag',
    text: 'Ich stehe um sieben Uhr auf. Ich frühstücke Brot und Käse. Dann fahre ich mit dem Bus zur Schule. Die Schule beginnt um acht Uhr. Ich lerne Deutsch und Mathematik. Um drei Uhr komme ich nach Hause. Ich esse zu Mittag und mache meine Hausaufgaben. Abends sehe ich fern.',
  },
  {
    title: 'Im Supermarkt',
    level: 'A1' as const, topic: 'Einkaufen',
    text: 'Heute gehe ich in den Supermarkt. Ich brauche Milch, Brot und Äpfel. An der Kasse bezahle ich fünf Euro. Die Frau an der Kasse ist sehr freundlich. Sie sagt: "Auf Wiedersehen!" Ich gehe nach Hause und stelle die Milch in den Kühlschrank.',
  },
  {
    title: 'Das Wetter',
    level: 'A1' as const, topic: 'Wetter',
    text: 'Heute ist es warm und sonnig. Die Sonne scheint. Es gibt keine Wolken. Die Temperatur ist zwanzig Grad. Morgen kommt Regen. Dann ist es kalt und grau. Ich mag den Sommer. Im Winter ist es zu kalt für mich.',
  },

  // ── A2 ──────────────────────────────────────────────────────────────────────
  {
    title: 'In der Stadt',
    level: 'A2' as const, topic: 'Stadt',
    text: 'Die Stadt ist sehr lebendig. Es gibt viele Geschäfte, Cafés und Parks. Die Menschen gehen einkaufen oder treffen sich mit Freunden. Im Sommer sitzen viele Leute draußen und genießen das schöne Wetter. Der Marktplatz ist das Zentrum der Stadt. Dort gibt es frisches Obst und Gemüse.',
  },
  {
    title: 'Eine Reise nach München',
    level: 'A2' as const, topic: 'Reisen',
    text: 'Letztes Jahr bin ich nach München gefahren. Die Reise hat drei Stunden gedauert. München ist eine wunderschöne Stadt in Bayern. Ich habe den Englischen Garten besucht und Weißwurst gegessen. Das Wetter war sonnig und warm. Die Menschen in Bayern sind sehr freundlich und hilfsbereit. Ich möchte bald wieder dorthin fahren.',
  },
  {
    title: 'Mein Hobby: Kochen',
    level: 'A2' as const, topic: 'Freizeit',
    text: 'Ich koche sehr gerne. Am Wochenende habe ich Zeit, neue Rezepte auszuprobieren. Mein Lieblingsessen ist Pasta mit Tomatensauce. Ich kaufe frische Zutaten auf dem Markt. Kochen macht mir viel Spaß, und meine Freunde essen gerne bei mir. Manchmal koche ich auch internationale Gerichte.',
  },
  {
    title: 'Der Arztbesuch',
    level: 'A2' as const, topic: 'Gesundheit',
    text: 'Heute muss ich zum Arzt gehen. Ich habe Halsschmerzen und Fieber. Im Wartezimmer sind noch fünf andere Patienten. Die Arzthelferin fragt nach meiner Krankenversicherungskarte. Der Arzt untersucht mich und verschreibt mir Tabletten. Er sagt, ich soll viel Tee trinken und im Bett bleiben.',
  },

  // ── B1 ──────────────────────────────────────────────────────────────────────
  {
    title: 'Der Herbst',
    level: 'B1' as const, topic: 'Natur',
    text: 'Der Herbst ist eine besondere Jahreszeit. Die Blätter färben sich in warmen Tönen von Rot, Orange und Gelb. Der Wind trägt einen frischen Duft, und die Tage werden kürzer. Viele Menschen genießen lange Spaziergänge durch den bunten Wald. Pilze und Kastanien findet man überall auf dem Boden. Auch die Tierwelt bereitet sich auf den Winter vor: Eichhörnchen sammeln Nüsse, und Zugvögel fliegen in wärmere Länder.',
  },
  {
    title: 'Gesund leben',
    level: 'B1' as const, topic: 'Gesundheit',
    text: 'Ein gesunder Lebensstil ist sehr wichtig. Regelmäßige Bewegung und ausgewogene Ernährung tragen zur Gesundheit bei. Experten empfehlen, mindestens dreimal pro Woche Sport zu treiben. Frisches Obst und Gemüse liefern wichtige Vitamine. Außerdem ist ausreichend Schlaf notwendig, damit der Körper sich erholen kann. Stress sollte man durch Entspannungstechniken wie Yoga oder Meditation reduzieren.',
  },
  {
    title: 'Smartphones im Alltag',
    level: 'B1' as const, topic: 'Technologie',
    text: 'Smartphones sind aus unserem Alltag kaum noch wegzudenken. Mit ihnen können wir kommunizieren, navigieren und uns informieren. Allerdings warnen Experten vor zu viel Bildschirmzeit. Vor allem bei Kindern und Jugendlichen kann übermäßiger Handygebrauch negative Auswirkungen haben. Deshalb ist ein bewusster Umgang mit digitalen Medien wichtig. Viele Menschen nutzen "digitale Detox"-Zeiten, um sich bewusst vom Smartphone zu trennen.',
  },
  {
    title: 'Das deutsche Schulsystem',
    level: 'B1' as const, topic: 'Bildung',
    text: 'Das deutsche Schulsystem unterscheidet sich von vielen anderen Ländern. Nach der Grundschule wechseln Kinder je nach Leistung auf verschiedene weiterführende Schulen: Hauptschule, Realschule oder Gymnasium. Das Abitur, das am Gymnasium erworben wird, ermöglicht den Zugang zur Universität. Das System wird oft diskutiert, weil frühe Schullaufbahnentscheidungen langfristige Auswirkungen auf die Berufschancen der Kinder haben können.',
  },
  {
    title: 'Wohnungssuche in Deutschland',
    level: 'B1' as const, topic: 'Wohnen',
    text: 'Eine Wohnung in einer deutschen Großstadt zu finden ist oft schwierig. In Städten wie München, Berlin oder Hamburg sind die Mieten in den letzten Jahren stark gestiegen. Viele Bewerber konkurrieren um eine einzige Wohnung. Vermieter verlangen häufig Einkommensnachweise, Schufa-Auskunft und Empfehlungsschreiben. Wohngemeinschaften sind besonders bei jungen Menschen beliebt, weil sie die Kosten senken und soziale Kontakte fördern.',
  },

  // ── B2 ──────────────────────────────────────────────────────────────────────
  {
    title: 'Die Arbeitswelt im Wandel',
    level: 'B2' as const, topic: 'Arbeit',
    text: 'Die moderne Arbeitswelt hat sich stark verändert. Immer mehr Menschen arbeiten im Homeoffice und nutzen digitale Werkzeuge zur Kommunikation. Diese Flexibilität bietet viele Vorteile, birgt jedoch auch Herausforderungen für die Work-Life-Balance. Unternehmen müssen neue Führungsmodelle entwickeln, die sowohl Produktivität als auch Mitarbeiterzufriedenheit fördern. Gleichzeitig verändert die Automatisierung durch künstliche Intelligenz ganze Berufsfelder grundlegend.',
  },
  {
    title: 'Klimawandel und Verantwortung',
    level: 'B2' as const, topic: 'Umwelt',
    text: 'Der Klimawandel ist eine der größten Herausforderungen unserer Zeit. Wissenschaftler sind sich einig, dass menschliche Aktivitäten maßgeblich zur Erderwärmung beitragen. Erneuerbare Energien wie Solar- und Windkraft bieten nachhaltige Alternativen zu fossilen Brennstoffen. Jedoch erfordert die Energiewende tiefgreifende Veränderungen in Wirtschaft und Gesellschaft. Individuelle Maßnahmen wie bewusster Konsum und Verzicht auf Flugreisen können einen Beitrag leisten, reichen allein jedoch nicht aus.',
  },
  {
    title: 'Migration und Integration',
    level: 'B2' as const, topic: 'Gesellschaft',
    text: 'Deutschland ist seit Jahrzehnten ein Einwanderungsland. Die Frage der Integration von Zuwanderern in Gesellschaft und Arbeitsmarkt steht im Mittelpunkt politischer und gesellschaftlicher Debatten. Sprache gilt dabei als Schlüssel zur Integration: Wer Deutsch spricht, findet leichter Arbeit, Freundschaften und gesellschaftliche Teilhabe. Gleichzeitig bereichert kulturelle Vielfalt das gesellschaftliche Leben und fördert Innovationsfähigkeit und Kreativität.',
  },
  {
    title: 'Soziale Medien und Demokratie',
    level: 'B2' as const, topic: 'Politik',
    text: 'Soziale Medien haben die politische Kommunikation fundamental verändert. Einerseits ermöglichen sie breite Bürgerbeteiligung und schnelle Informationsverbreitung. Andererseits begünstigen Algorithmen die Bildung von Echokammern, in denen Menschen vorwiegend Meinungen begegnen, die ihre eigenen bestätigen. Desinformation verbreitet sich rasant und kann das Vertrauen in demokratische Institutionen untergraben. Medienkompetenz wird deshalb zu einer Kernkompetenz moderner Gesellschaften.',
  },

  // ── C1 ──────────────────────────────────────────────────────────────────────
  {
    title: 'Freiheit und Verantwortung',
    level: 'C1' as const, topic: 'Philosophie',
    text: 'Die Frage nach der menschlichen Freiheit beschäftigt Philosophen seit Jahrtausenden. Kant unterschied zwischen negativer Freiheit, also der Abwesenheit von Zwang, und positiver Freiheit als Selbstbestimmung. Im modernen demokratischen Rechtsstaat wird Freiheit durch den Schutz vor staatlicher Willkür gewährleistet, gleichzeitig aber durch die Rechte anderer begrenzt. Diese Spannung zwischen individueller Freiheit und gesellschaftlicher Verantwortung bleibt ein zentrales Thema politischer Philosophie und aktueller Rechtsdiskurse.',
  },
  {
    title: 'Globalisierung und ihre Folgen',
    level: 'C1' as const, topic: 'Wirtschaft',
    text: 'Die Globalisierung hat die Weltwirtschaft grundlegend transformiert. Internationale Lieferketten ermöglichen effiziente Produktion, schaffen jedoch auch Abhängigkeiten, die in Krisenzeiten sichtbar werden. Während Befürworter auf steigende Lebensstandards und wirtschaftliches Wachstum hinweisen, kritisieren Gegner zunehmende Ungleichheit und den Verlust regionaler Identitäten. Eine ausgewogene Bewertung erfordert die differenzierte Betrachtung sozialer, ökologischer und ökonomischer Dimensionen und die Entwicklung fairer internationaler Regelwerke.',
  },
  {
    title: 'Bildung im digitalen Zeitalter',
    level: 'C1' as const, topic: 'Bildung',
    text: 'Die Digitalisierung stellt Bildungssysteme vor grundlegende Herausforderungen. Während Faktenwissen zunehmend per Mausklick abrufbar ist, verlagern sich pädagogische Prioritäten auf kritisches Denken, kollaborative Problemlösung und digitale Urteilskraft. Schulen müssen nicht nur technische Infrastruktur bereitstellen, sondern Lehrkräfte befähigen, digitale Werkzeuge didaktisch sinnvoll einzusetzen. Gleichzeitig droht eine digitale Spaltung, wenn sozial benachteiligte Kinder keinen gleichwertigen Zugang zu technologischen Ressourcen erhalten.',
  },

  // ── C2 ──────────────────────────────────────────────────────────────────────
  {
    title: 'Kafkas Verwandlung',
    level: 'C2' as const, topic: 'Literatur',
    text: 'Franz Kafkas "Die Verwandlung" gilt als eines der bedeutendsten Werke der deutschsprachigen Moderne. Die absurde Prämisse – ein Mensch erwacht als Ungeziefer – entfaltet sich zu einer tiefgründigen Allegorie über Entfremdung, familiäre Abhängigkeiten und die Mechanismen sozialer Ausgrenzung. Kafkas Sprache, nüchtern und bürokratisch, kontrastiert mit der surrealen Handlung und erzeugt eine einzigartige literarische Spannung, die bis heute nichts von ihrer Wirkungskraft eingebüßt hat.',
  },
  {
    title: 'Künstliche Intelligenz und Ethik',
    level: 'C2' as const, topic: 'Wissenschaft',
    text: 'Die rasante Entwicklung künstlicher Intelligenzsysteme wirft grundlegende ethische Fragen auf, die weit über technische Machbarkeit hinausgehen. Autonome Entscheidungssysteme in Bereichen wie Justiz, Medizin oder Militär erfordern eine präzise Auseinandersetzung mit Konzepten wie algorithmischer Fairness, Rechenschaftspflicht und epistemischer Transparenz. Die Herausforderung besteht darin, technologische Innovation mit normativen Ansprüchen einer gerechten Gesellschaft in Einklang zu bringen, ohne dabei pluralistische Wertvorstellungen zu homogenisieren.',
  },
  {
    title: 'Sprachphilosophie: Wittgensteins Sprachspiele',
    level: 'C2' as const, topic: 'Philosophie',
    text: 'Ludwig Wittgensteins Konzept der Sprachspiele, das er in den "Philosophischen Untersuchungen" entwickelt, markiert einen radikalen Bruch mit der idealen Bildtheorie seiner frühen Philosophie. Sprache funktioniert nicht als Abbildung einer vorgängigen Wirklichkeit, sondern gewinnt Bedeutung ausschließlich durch ihren Gebrauch in konkreten Lebenspraktiken. Diese pragmatische Wende hat weitreichende Implikationen für Erkenntnistheorie und Sprachphilosophie: Bedeutung ist keine mentale Entität, sondern eine soziale Praxis, eingebettet in Formen des Lebens.',
  },
]

async function seedArticles() {
  console.log('Seeding articles…')
  for (const a of ARTICLES) {
    const wordCount = wc(a.text)
    const estimatedMinutes = mins(a.text)
    await db.insert(articles).values({ ...a, word_count: wordCount, estimated_minutes: estimatedMinutes })
  }
  console.log(`Seeded ${ARTICLES.length} articles`)
}

seedArticles().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
