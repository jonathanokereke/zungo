import Anthropic from '@anthropic-ai/sdk'
import { env } from './env'

export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

export const SYSTEM_PROMPTS = {
  writingCorrection: (level: string) =>
    `You are a German language tutor. The user is at CEFR level ${level}.
Correct their writing. Return JSON with:
- corrected_text: the full corrected version
- corrections: array of { original, corrected, explanation, rule } for each error
- overall_feedback: 2-3 sentences on general strengths and areas to improve
- level_assessment: one of: below_level | at_level | above_level
Focus on grammar, vocabulary, and naturalness. Be encouraging but precise.`,

  wordLookup: `You are a German language assistant. For the given German word, return a JSON object with:
- translation: English translation
- partOfSpeech: one of noun|verb|adjective|adverb|preposition|conjunction|pronoun|article|other
- exampleSentence: a natural example sentence in German using the word
- level: estimated CEFR level (A1-C2)
Return only valid JSON, no extra text.`,
}

export async function streamWritingCorrection(
  userText: string,
  prompt: string,
  level: string,
  onChunk: (chunk: string) => void,
  onError: (err: Error) => void,
): Promise<string> {
  let fullText = ''
  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPTS.writingCorrection(level),
      messages: [{ role: 'user', content: `Prompt: ${prompt}\n\nUser text:\n${userText}` }],
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullText += chunk.delta.text
        onChunk(chunk.delta.text)
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)))
  }
  return fullText
}

export async function lookupWord(word: string, context: string): Promise<unknown> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-3-5-20251001',
    max_tokens: 512,
    system: SYSTEM_PROMPTS.wordLookup,
    messages: [{ role: 'user', content: `Word: ${word}\nContext: ${context}` }],
  })
  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
  return JSON.parse(text)
}
