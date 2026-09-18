export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5

export type ReviewCard = {
  interval: number      // days until next review
  repetition: number    // number of successful reviews in a row
  easeFactor: number    // multiplier, min 1.3
}

export type ReviewResult = {
  interval: number
  repetition: number
  easeFactor: number
  nextDueDate: Date
}

export function calculateNextReview(card: ReviewCard, quality: ReviewQuality): ReviewResult {
  const MIN_EASE = 1.3
  let { interval, repetition, easeFactor } = card

  if (quality >= 3) {
    if (repetition === 0) {
      interval = 1
    } else if (repetition === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetition += 1
  } else {
    repetition = 0
    interval = 1
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easeFactor < MIN_EASE) easeFactor = MIN_EASE

  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + interval)

  return { interval, repetition, easeFactor, nextDueDate }
}
