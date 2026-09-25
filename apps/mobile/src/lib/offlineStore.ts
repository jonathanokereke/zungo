import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CachedDueEntry {
  review: {
    id: string
    word_id: string
    interval: number
    ease_factor: number
    repetition: number
  }
  word: {
    id: string
    german: string
    translation: string
    example_sentence?: string
  }
}

export interface QueuedReview {
  word_id: string
  quality: number
  queued_at: number
}

interface OfflineState {
  // Cached vocab review cards
  cachedDueCards: CachedDueEntry[]
  cardsUpdatedAt: number | null

  // Pending review submissions to sync when back online
  reviewQueue: QueuedReview[]

  // Actions
  setDueCards: (cards: CachedDueEntry[]) => void
  enqueueReview: (word_id: string, quality: number) => void
  removeFromQueue: (word_id: string) => void
  clearQueue: () => void
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      cachedDueCards: [],
      cardsUpdatedAt: null,
      reviewQueue: [],

      setDueCards: (cards) => set({ cachedDueCards: cards, cardsUpdatedAt: Date.now() }),

      enqueueReview: (word_id, quality) =>
        set(s => ({
          reviewQueue: [
            ...s.reviewQueue.filter(q => q.word_id !== word_id),
            { word_id, quality, queued_at: Date.now() },
          ],
        })),

      removeFromQueue: (word_id) =>
        set(s => ({ reviewQueue: s.reviewQueue.filter(q => q.word_id !== word_id) })),

      clearQueue: () => set({ reviewQueue: [] }),
    }),
    {
      name: 'zungo-offline',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
