import { describe, it, expect } from "vitest"
import {
  applyGrade,
  countDue,
  initialReviewState,
  isDue,
  pickDueCards,
  type ReviewState,
} from "./sm2"

const NOW = 1_700_000_000_000 // 2023-11-14
const DAY = 24 * 60 * 60 * 1000

describe("initialReviewState", () => {
  it("starts due (dueAt=0)", () => {
    const state = initialReviewState()
    expect(state.dueAt).toBe(0)
    expect(state.repetition).toBe(0)
    expect(state.interval).toBe(0)
    expect(state.ease).toBe(2.5)
    expect(state.lastReviewedAt).toBeUndefined()
  })
})

describe("applyGrade — failed reviews", () => {
  it("grade 0 resets repetition and schedules next day", () => {
    const prev: ReviewState = {
      repetition: 3,
      interval: 7,
      ease: 2.5,
      dueAt: NOW - DAY,
    }
    const next = applyGrade(prev, 0, NOW)
    expect(next.repetition).toBe(0)
    expect(next.interval).toBe(1)
    expect(next.dueAt).toBe(NOW + DAY)
    expect(next.lastReviewedAt).toBe(NOW)
  })

  it("grade 0 preserves ease (no double penalty)", () => {
    const prev: ReviewState = {
      repetition: 3,
      interval: 7,
      ease: 2.0,
      dueAt: NOW,
    }
    const next = applyGrade(prev, 0, NOW)
    expect(next.ease).toBe(2.0)
  })
})

describe("applyGrade — successful reviews", () => {
  it("first success (repetition 0→1): interval=1 day", () => {
    const prev = initialReviewState()
    const next = applyGrade(prev, 4, NOW)
    expect(next.repetition).toBe(1)
    expect(next.interval).toBe(1)
    expect(next.dueAt).toBe(NOW + DAY)
  })

  it("second success (repetition 1→2): interval=6 days", () => {
    const prev: ReviewState = {
      repetition: 1,
      interval: 1,
      ease: 2.5,
      dueAt: NOW - DAY,
    }
    const next = applyGrade(prev, 4, NOW)
    expect(next.repetition).toBe(2)
    expect(next.interval).toBe(6)
    expect(next.dueAt).toBe(NOW + 6 * DAY)
  })

  it("third+ success scales by ease factor", () => {
    const prev: ReviewState = {
      repetition: 2,
      interval: 6,
      ease: 2.5,
      dueAt: NOW - DAY,
    }
    const next = applyGrade(prev, 4, NOW)
    expect(next.repetition).toBe(3)
    expect(next.interval).toBe(Math.round(6 * 2.5)) // 15
  })

  it("grade=5 (easy) bumps ease factor", () => {
    const prev: ReviewState = {
      repetition: 2,
      interval: 6,
      ease: 2.5,
      dueAt: NOW,
    }
    const next = applyGrade(prev, 5, NOW)
    expect(next.ease).toBeGreaterThan(prev.ease)
  })

  it("grade=3 (hard) reduces ease factor", () => {
    const prev: ReviewState = {
      repetition: 2,
      interval: 6,
      ease: 2.5,
      dueAt: NOW,
    }
    const next = applyGrade(prev, 3, NOW)
    expect(next.ease).toBeLessThan(prev.ease)
  })

  it("ease never drops below 1.3", () => {
    const prev: ReviewState = {
      repetition: 2,
      interval: 6,
      ease: 1.3,
      dueAt: NOW,
    }
    const next = applyGrade(prev, 3, NOW)
    expect(next.ease).toBeGreaterThanOrEqual(1.3)
  })
})

describe("isDue", () => {
  it("undefined state is due (never reviewed)", () => {
    expect(isDue(undefined, NOW)).toBe(true)
  })

  it("past dueAt is due", () => {
    expect(
      isDue({ repetition: 0, interval: 0, ease: 2.5, dueAt: NOW - 1 }, NOW),
    ).toBe(true)
  })

  it("future dueAt is not due", () => {
    expect(
      isDue({ repetition: 1, interval: 7, ease: 2.5, dueAt: NOW + DAY }, NOW),
    ).toBe(false)
  })

  it("exactly at dueAt is due", () => {
    expect(
      isDue({ repetition: 1, interval: 1, ease: 2.5, dueAt: NOW }, NOW),
    ).toBe(true)
  })
})

describe("countDue", () => {
  it("counts items with past or no dueAt", () => {
    const items = [
      { _review: undefined },
      { _review: { repetition: 0, interval: 0, ease: 2.5, dueAt: NOW - 1 } },
      { _review: { repetition: 1, interval: 7, ease: 2.5, dueAt: NOW + DAY } },
    ]
    expect(countDue(items, NOW)).toBe(2)
  })

  it("returns 0 for empty list", () => {
    expect(countDue([], NOW)).toBe(0)
  })
})

describe("pickDueCards", () => {
  it("returns due items sorted by oldest dueAt first", () => {
    const items = [
      {
        id: "a",
        _review: { repetition: 1, interval: 1, ease: 2.5, dueAt: NOW - DAY },
      },
      { id: "b", _review: undefined }, // never reviewed, dueAt defaults 0 = oldest
      {
        id: "c",
        _review: { repetition: 1, interval: 1, ease: 2.5, dueAt: NOW - 100 },
      },
    ]
    const result = pickDueCards(items, NOW)
    expect(result.map((r) => r.id)).toEqual(["b", "a", "c"])
  })

  it("respects limit parameter", () => {
    const items = Array.from({ length: 30 }, (_, i) => ({
      id: `${i}`,
      _review: undefined,
    }))
    expect(pickDueCards(items, NOW, 10)).toHaveLength(10)
  })

  it("skips not-yet-due items", () => {
    const items = [
      { id: "a", _review: undefined },
      {
        id: "b",
        _review: { repetition: 1, interval: 1, ease: 2.5, dueAt: NOW + DAY },
      },
    ]
    const result = pickDueCards(items, NOW)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("a")
  })
})
