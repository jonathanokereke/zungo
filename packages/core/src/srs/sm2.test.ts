import { describe, it, expect } from 'vitest'
import { calculateNextReview, ReviewCard } from './sm2'

const baseCard: ReviewCard = { interval: 0, repetition: 0, easeFactor: 2.5 }

describe('SM-2 algorithm', () => {
  it('first review with quality 4 sets interval to 1', () => {
    const result = calculateNextReview(baseCard, 4)
    expect(result.interval).toBe(1)
    expect(result.repetition).toBe(1)
  })

  it('second review sets interval to 6', () => {
    const afterFirst = calculateNextReview(baseCard, 4)
    const result = calculateNextReview(afterFirst, 4)
    expect(result.interval).toBe(6)
    expect(result.repetition).toBe(2)
  })

  it('correct sequence produces expected intervals', () => {
    let card = baseCard
    card = calculateNextReview(card, 4)  // interval=1
    card = calculateNextReview(card, 4)  // interval=6
    card = calculateNextReview(card, 4)  // interval=6*2.5=15
    expect(card.interval).toBe(15)
    expect(card.repetition).toBe(3)
  })

  it('failed review resets interval and repetition to 0/1', () => {
    let card = calculateNextReview(baseCard, 4)
    card = calculateNextReview(card, 4)
    const failed = calculateNextReview(card, 1)
    expect(failed.interval).toBe(1)
    expect(failed.repetition).toBe(0)
  })

  it('ease factor floors at 1.3', () => {
    let card = { interval: 6, repetition: 2, easeFactor: 1.3 }
    const result = calculateNextReview(card, 0)
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('easy review (quality 5) increases ease factor', () => {
    const result = calculateNextReview(baseCard, 5)
    expect(result.easeFactor).toBeGreaterThan(2.5)
  })

  it('hard review (quality 3) decreases ease factor', () => {
    const result = calculateNextReview(baseCard, 3)
    expect(result.easeFactor).toBeLessThan(2.5)
  })

  it('nextDueDate is in the future', () => {
    const result = calculateNextReview(baseCard, 4)
    expect(result.nextDueDate.getTime()).toBeGreaterThan(Date.now())
  })
})
