import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { apiFetch } from '../../../lib/api'
import { useToken } from '../../../lib/devAuth'
import type { WordLookupResult } from '@zungo/core'

export const Route = createFileRoute('/_app/read/')({
  component: ReadPage,
})

type TokenInfo = WordLookupResult & { word: string }

const SAMPLE_TEXT = `Der Herbst ist eine besondere Jahreszeit. Die Blätter färben sich in warmen Tönen von Rot, Orange und Gelb. Der Wind trägt einen frischen Duft, und die Tage werden kürzer. Viele Menschen genießen lange Spaziergänge durch den bunten Wald.`

function tokenize(text: string): string[] {
  return text.split(/(\s+|[.,!?;:()\[\]"„"–—])/).filter(Boolean)
}

function ReadPage() {
  const getToken = useToken()
  const [inputText, setInputText] = useState('')
  const [tokens, setTokens] = useState<string[]>([])
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [popover, setPopover] = useState<{ word: string; info: TokenInfo } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  function handleLoad(text?: string) {
    setTokens(tokenize(text ?? inputText))
    setPopover(null)
  }

  async function handleWordClick(word: string) {
    if (/^\s+$/.test(word) || /^[.,!?;:()\[\]"„"–—]+$/.test(word)) return
    if (loading) return
    setLoading(word)
    setLookupError(null)
    try {
      const token = await getToken()
      const info = await apiFetch<WordLookupResult>(
        `/api/words/lookup?word=${encodeURIComponent(word)}`,
        {},
        token,
      )
      setPopover({ word, info: { ...info, word } })
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setLoading(null)
    }
  }

  async function handleSave() {
    if (!popover) return
    const token = await getToken()
    await apiFetch('/api/words', {
      method: 'POST',
      body: JSON.stringify({
        german: popover.word,
        translation: popover.info.translation,
        part_of_speech: popover.info.partOfSpeech,
        example_sentence: popover.info.exampleSentence,
        source_text: tokens.join('').slice(0, 500),
      }),
    }, token)
    setSavedWords(prev => new Set([...prev, popover.word.toLowerCase()]))
    setPopover(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-bold text-text-1 mb-1">Reading Mode</h1>
        <p className="text-sm text-text-3">Tap any German word to look it up and save it to your deck</p>
      </div>

      {tokens.length === 0 ? (
        <div className="space-y-4">
          {/* Sample text hint */}
          <button
            onClick={() => { setInputText(SAMPLE_TEXT); handleLoad(SAMPLE_TEXT) }}
            className="w-full text-left bg-primary-light border border-primary/20 rounded-2xl p-4 hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Try a sample</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <p className="text-sm text-text-2 line-clamp-2">{SAMPLE_TEXT}</p>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-[var(--c-border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg px-3 text-xs text-text-3">or paste your own</span>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-[var(--c-border)] overflow-hidden">
            <textarea
              className="w-full p-4 text-sm text-text-1 placeholder-text-3 resize-none focus:outline-none"
              rows={6}
              placeholder="Paste German text here…"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />
          </div>
          <button
            onClick={() => handleLoad()}
            disabled={!inputText.trim()}
            className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            Load text
          </button>
        </div>
      ) : (
        <div className="relative">
          {lookupError && (
            <div className="mb-3 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">
              {lookupError}
            </div>
          )}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => { setTokens([]); setPopover(null); setLookupError(null) }}
              className="p-2 text-text-3 hover:text-text-1 hover:bg-surface rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-sm text-text-3">
              {savedWords.size > 0 ? `${savedWords.size} word${savedWords.size !== 1 ? 's' : ''} saved` : 'Tap words to look them up'}
            </span>
          </div>

          <div className="bg-surface rounded-2xl border border-[var(--c-border)] p-5 leading-9 font-fraunces text-lg">
            {tokens.map((token, i) => {
              const isSaved = savedWords.has(token.toLowerCase())
              const isWord = !/^\s+$/.test(token) && !/^[.,!?;:()\[\]"„"–—]+$/.test(token)
              const isLoading = loading === token
              return (
                <span
                  key={i}
                  onClick={() => isWord && handleWordClick(token)}
                  className={[
                    isWord ? 'cursor-pointer rounded px-0.5 transition-colors' : '',
                    isWord && !isSaved ? 'hover:bg-primary-light hover:text-primary' : '',
                    isSaved ? 'bg-accent-light text-accent rounded px-0.5' : '',
                    isLoading ? 'bg-primary-light text-primary animate-pulse' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {token}
                </span>
              )
            })}
          </div>

          {/* Word popover */}
          {popover && (
            <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 bg-surface shadow-xl rounded-2xl p-5 w-80 z-50 border border-[var(--c-border)]">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-fraunces text-2xl font-bold text-text-1">{popover.word}</h3>
                  <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full">{popover.info.partOfSpeech}</span>
                </div>
                <button
                  onClick={() => setPopover(null)}
                  className="p-1 text-text-3 hover:text-text-1"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className="text-text-2 mb-1 font-medium">{popover.info.translation}</p>
              {popover.info.exampleSentence && (
                <p className="text-sm text-text-3 italic mb-4">{popover.info.exampleSentence}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Save to deck
                </button>
                <button
                  onClick={() => setPopover(null)}
                  className="px-4 py-2.5 border border-[var(--c-border)] rounded-xl text-sm text-text-2 hover:bg-bg transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
