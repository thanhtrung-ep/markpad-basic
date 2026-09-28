/**
 * SM-2 spaced repetition algorithm (SuperMemo 2).
 * Implementation matches Anki's simplified 4-grade variant.
 *
 * Each card tracks:
 *  - `repetition`: count of consecutive successful reviews (reset on fail)
 *  - `interval`: days until next review
 *  - `ease`: ease factor (float, default 2.5, min 1.3)
 *  - `dueAt`: millis timestamp when due
 *  - `lastReviewedAt`: millis timestamp of last grade (undefined = never)
 *
 * 4 grades (user-facing):
 *  - Again (grade=0): failed — reset to learning phase
 *  - Hard (grade=3): correct but slow — interval grows slowly
 *  - Good (grade=4): normal — standard interval growth
 *  - Easy (grade=5): trivial — accelerated interval + ease bump
 */

export type ReviewGrade = 0 | 3 | 4 | 5

export interface ReviewState {
  repetition: number
  interval: number // days
  ease: number
  dueAt: number // millis
  lastReviewedAt?: number // millis
}

const DEFAULT_EASE = 2.5
const MIN_EASE = 1.3
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Initial state for a newly-added term — immediately due (dueAt = 0).
 */
export function initialReviewState(): ReviewState {
  return {
    repetition: 0,
    interval: 0,
    ease: DEFAULT_EASE,
    dueAt: 0,
  }
}

/**
 * Apply SM-2 update given a grade. Returns NEW state (pure fn).
 * `now` parameter allows deterministic tests.
 */
export function applyGrade(
  prev: ReviewState,
  grade: ReviewGrade,
  now: number,
): ReviewState {
  // Failed review — reset progress, re-queue for tomorrow (1 day learning step)
  if (grade < 3) {
    return {
      repetition: 0,
      interval: 1,
      ease: prev.ease,
      dueAt: now + DAY_MS,
      lastReviewedAt: now,
    }
  }

  // Successful review
  const newRep = prev.repetition + 1
  let newInterval: number
  if (newRep === 1) {
    newInterval = 1
  } else if (newRep === 2) {
    newInterval = 6
  } else {
    newInterval = Math.round(prev.interval * prev.ease)
  }

  // Adjust ease factor (SM-2 formula)
  const easeDelta = 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)
  const newEase = Math.max(MIN_EASE, prev.ease + easeDelta)

  return {
    repetition: newRep,
    interval: newInterval,
    ease: newEase,
    dueAt: now + newInterval * DAY_MS,
    lastReviewedAt: now,
  }
}

/**
 * Predicate: is the card due at `now`?
 */
export function isDue(state: ReviewState | undefined, now: number): boolean {
  if (!state) return true
  return state.dueAt <= now
}

/**
 * Count due cards in a list.
 */
export function countDue<T extends { _review?: ReviewState }>(
  items: readonly T[],
  now: number,
): number {
  let count = 0
  for (const item of items) {
    if (isDue(item._review, now)) count++
  }
  return count
}

/**
 * Select due cards, sorted by oldest dueAt first.
 */
export function pickDueCards<T extends { _review?: ReviewState }>(
  items: readonly T[],
  now: number,
  limit = 20,
): T[] {
  const due = items.filter((i) => isDue(i._review, now))
  due.sort((a, b) => {
    const aDue = a._review?.dueAt ?? 0
    const bDue = b._review?.dueAt ?? 0
    return aDue - bDue
  })
  return due.slice(0, limit)
}
