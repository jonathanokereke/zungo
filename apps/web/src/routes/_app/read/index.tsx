import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { apiFetch } from '../../../lib/api'
import type { WordLookupResult } from '@german-app/core'

export const Route = createFileRoute('/_app/read/')({
  component: ReadPage,
})

type TokenInfo = WordLookupResult & { word: string }

function tokenize(text: string): string[] {
  return text.split(/(\s+|[.,!?;:()\[\]"„"–—])/).filter(Boolean)
}

function ReadPage() {
  const { getAccessTokenSilently } = useAuth0()
  const [inputText, setInputText] = useState('')
  const [tokens, setTokens] = useState<string[]>([])
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [popover, setPopover] = useState<{ word: string; info: TokenInfo } | null>(null)
  const [loading, setLoading] = useState(false)

  function handleLoad() {
    setTokens(tokenize(inputText))
    setPopover(null)
  }

  async function handleWordClick(word: string) {
    if (/^\s+$/.test(word) || /^[.,!?;:()\[\]"„"–—]+$/.test(word)) return
    setLoading(true)
    try {
      const token = await getAccessTokenSilently()
      const info = await apiFetch<WordLookupResult>(`/api/words/lookup?word=${encodeURIComponent(word)}`, {}, token)
      setPopover({ word, info: { ...info, word } })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!popover) return
    const token = await getAccessTokenSilently()
    await apiFetch('/api/words', {
      method: 'POST',
      body: JSON.stringify({
        german: popover.word,
        translation: popover.info.translation,
        part_of_speech: popover.info.partOfSpeech,
        example_sentence: popover.info.exampleSentence,
        source_text: inputText.slice(0, 500),
      }),
    }, token)
    setSavedWords(prev => new Set([...prev, popover.word.toLowerCase()]))
    setPopover(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Reading Mode</h1>

      {tokens.length === 0 ? (
        <div className="space-y-4">
          <textarea
            className="w-full h-48 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Paste German text here…"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <button
            onClick={handleLoad}
            disabled={!inputText.trim()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Load text
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => { setTokens([]); setPopover(null) }}
            className="mb-4 text-sm text-indigo-600 hover:underline"
          >
            ← Back
          </button>
          <div className="leading-8 text-lg">
            {tokens.map((token, i) => {
              const isSaved = savedWords.has(token.toLowerCase())
              const isWord = !/^\s+$/.test(token) && !/^[.,!?;:()\[\]"„"–—]+$/.test(token)
              return (
                <span
                  key={i}
                  onClick={() => isWord && handleWordClick(token)}
                  className={[
                    isWord ? 'cursor-pointer hover:bg-indigo-100 rounded px-0.5' : '',
                    isSaved ? 'underline decoration-indigo-400' : '',
                  ].join(' ')}
                >
                  {token}
                </span>
              )
            })}
          </div>

          {popover && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-2xl p-5 w-80 z-50 border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{popover.word}</h3>
                <span className="text-xs bg-gray-100 rounded px-2 py-1">{popover.info.partOfSpeech}</span>
              </div>
              <p className="text-gray-700 mb-1">{popover.info.translation}</p>
              <p className="text-sm text-gray-400 italic mb-4">{popover.info.exampleSentence}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700"
                >
                  Save to deck
                </button>
                <button
                  onClick={() => setPopover(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
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
