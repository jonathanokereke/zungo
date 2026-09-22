import { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth, type Auth0JwtPayload } from '../lib/auth0'

async function getUser(auth0Id: string) {
  const result = await db.select().from(users).where(eq(users.auth0_id, auth0Id)).limit(1)
  return result[0] ?? null
}

type ReadingText = { title: string; level: string; topic: string; text: string }

const READING_TEXTS: ReadingText[] = [
  // A1
  {
    level: 'A1', topic: 'Familie',
    title: 'Meine Familie',
    text: 'Ich heiße Anna. Ich habe eine kleine Familie. Mein Vater heißt Thomas. Meine Mutter heißt Maria. Ich habe einen Bruder. Er heißt Max. Max ist acht Jahre alt. Wir wohnen in Berlin. Wir haben eine Katze. Die Katze heißt Mia.',
  },
  {
    level: 'A1', topic: 'Alltag',
    title: 'Ein normaler Tag',
    text: 'Ich stehe um sieben Uhr auf. Ich frühstücke Brot und Käse. Dann fahre ich mit dem Bus zur Schule. Die Schule beginnt um acht Uhr. Ich lerne Deutsch und Mathematik. Um drei Uhr komme ich nach Hause.',
  },
  // A2
  {
    level: 'A2', topic: 'Stadt',
    title: 'In der Stadt',
    text: 'Die Stadt ist sehr lebendig. Es gibt viele Geschäfte, Cafés und Parks. Die Menschen gehen einkaufen oder treffen sich mit Freunden. Im Sommer sitzen viele Leute draußen und genießen das schöne Wetter. Der Marktplatz ist das Zentrum der Stadt. Dort gibt es frisches Obst und Gemüse.',
  },
  {
    level: 'A2', topic: 'Reisen',
    title: 'Eine Reise nach München',
    text: 'Letztes Jahr bin ich nach München gefahren. Die Reise hat drei Stunden gedauert. München ist eine wunderschöne Stadt in Bayern. Ich habe das Englische Garten besucht und Weißwurst gegessen. Das Wetter war sonnig und warm. Ich möchte bald wieder dorthin fahren.',
  },
  // B1
  {
    level: 'B1', topic: 'Natur',
    title: 'Der Herbst',
    text: 'Der Herbst ist eine besondere Jahreszeit. Die Blätter färben sich in warmen Tönen von Rot, Orange und Gelb. Der Wind trägt einen frischen Duft, und die Tage werden kürzer. Viele Menschen genießen lange Spaziergänge durch den bunten Wald. Pilze und Kastanien findet man überall auf dem Boden.',
  },
  {
    level: 'B1', topic: 'Gesundheit',
    title: 'Gesund leben',
    text: 'Ein gesunder Lebensstil ist sehr wichtig. Regelmäßige Bewegung und ausgewogene Ernährung tragen zur Gesundheit bei. Experten empfehlen, mindestens dreimal pro Woche Sport zu treiben. Frisches Obst und Gemüse liefern wichtige Vitamine. Außerdem ist ausreichend Schlaf notwendig, damit der Körper sich erholen kann.',
  },
  {
    level: 'B1', topic: 'Technologie',
    title: 'Smartphones im Alltag',
    text: 'Smartphones sind aus unserem Alltag kaum noch wegzudenken. Mit ihnen können wir kommunizieren, navigieren und uns informieren. Allerdings warnen Experten vor zu viel Bildschirmzeit. Vor allem bei Kindern und Jugendlichen kann übermäßiger Handygebrauch negative Auswirkungen haben. Deshalb ist ein bewusster Umgang mit digitalen Medien wichtig.',
  },
  // B2
  {
    level: 'B2', topic: 'Arbeit',
    title: 'Die Arbeitswelt im Wandel',
    text: 'Die moderne Arbeitswelt hat sich stark verändert. Immer mehr Menschen arbeiten im Homeoffice und nutzen digitale Werkzeuge zur Kommunikation. Diese Flexibilität bietet viele Vorteile, birgt jedoch auch Herausforderungen für die Work-Life-Balance. Unternehmen müssen neue Führungsmodelle entwickeln, die sowohl Produktivität als auch Mitarbeiterzufriedenheit fördern.',
  },
  {
    level: 'B2', topic: 'Umwelt',
    title: 'Klimawandel und Verantwortung',
    text: 'Der Klimawandel ist eine der größten Herausforderungen unserer Zeit. Wissenschaftler sind sich einig, dass menschliche Aktivitäten maßgeblich zur Erderwärmung beitragen. Erneuerbare Energien wie Solar- und Windkraft bieten nachhaltige Alternativen zu fossilen Brennstoffen. Jedoch erfordert die Energiewende tiefgreifende Veränderungen in Wirtschaft und Gesellschaft.',
  },
  // C1
  {
    level: 'C1', topic: 'Philosophie',
    title: 'Freiheit und Verantwortung',
    text: 'Die Frage nach der menschlichen Freiheit beschäftigt Philosophen seit Jahrtausenden. Kant unterschied zwischen negativer Freiheit, also der Abwesenheit von Zwang, und positiver Freiheit als Selbstbestimmung. Im modernen demokratischen Rechtsstaat wird Freiheit durch den Schutz vor staatlicher Willkür gewährleistet, gleichzeitig aber durch die Rechte anderer begrenzt. Diese Spannung zwischen individueller Freiheit und gesellschaftlicher Verantwortung bleibt ein zentrales Thema politischer Philosophie.',
  },
  {
    level: 'C1', topic: 'Wirtschaft',
    title: 'Globalisierung und ihre Folgen',
    text: 'Die Globalisierung hat die Weltwirtschaft grundlegend transformiert. Internationale Lieferketten ermöglichen effiziente Produktion, schaffen jedoch auch Abhängigkeiten, die in Krisenzeiten sichtbar werden. Während Befürworter auf steigende Lebensstandards und wirtschaftliches Wachstum hinweisen, kritisieren Gegner zunehmende Ungleichheit und den Verlust regionaler Identitäten. Eine ausgewogene Bewertung erfordert die differenzierte Betrachtung sozialer, ökologischer und ökonomischer Dimensionen.',
  },
  // C2
  {
    level: 'C2', topic: 'Literatur',
    title: 'Kafkas Verwandlung',
    text: 'Franz Kafkas "Die Verwandlung" gilt als eines der bedeutendsten Werke der deutschsprachigen Moderne. Die absurde Prämisse – ein Mensch erwacht als Ungeziefer – entfaltet sich zu einer tiefgründigen Allegorie über Entfremdung, familiäre Abhängigkeiten und die Mechanismen sozialer Ausgrenzung. Kafkas Sprache, nüchtern und bürokratisch, kontrastiert mit der surrealen Handlung und erzeugt eine einzigartige literarische Spannung, die bis heute nichts von ihrer Wirkungskraft eingebüßt hat.',
  },
  {
    level: 'C2', topic: 'Wissenschaft',
    title: 'Künstliche Intelligenz und Ethik',
    text: 'Die rasante Entwicklung künstlicher Intelligenzsysteme wirft grundlegende ethische Fragen auf, die weit über technische Machbarkeit hinausgehen. Autonome Entscheidungssysteme in Bereichen wie Justiz, Medizin oder Militär erfordern eine präzise Auseinandersetzung mit Konzepten wie algorithmischer Fairness, Rechenschaftspflicht und epistemischer Transparenz. Die Herausforderung besteht darin, technologische Innovation mit normativen Ansprüchen einer gerechten Gesellschaft in Einklang zu bringen, ohne dabei pluralistische Wertvorstellungen zu homogenisieren.',
  },
]

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export async function readingRoutes(app: FastifyInstance) {
  app.get('/api/reading/texts', { preHandler: verifyAuth }, async (request, reply) => {
    const jwt = request.user as Auth0JwtPayload
    const user = await getUser(jwt.sub)
    if (!user) return reply.code(404).send({ error: { code: 'not_found', message: 'User not found' } })

    const idx = LEVEL_ORDER.indexOf(user.level)
    // Include one level below and the user's level (at most). At minimum show A1+A2.
    const minIdx = Math.max(0, idx - 1)
    const texts = READING_TEXTS.filter(t => {
      const tIdx = LEVEL_ORDER.indexOf(t.level)
      return tIdx >= minIdx && tIdx <= idx
    })

    return reply.send({ data: { texts, level: user.level } })
  })
}
