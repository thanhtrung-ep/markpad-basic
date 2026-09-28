import { describe, expect, it } from "vitest"
import { buildAliasMap, detectTrigger, isTriggerKey, shouldSkipField } from "./snippet-expansion"

const aliases = buildAliasMap([
  { alias: "sig", content: "Best regards" },
  { alias: "bad alias", content: "ignored" },
  { alias: 3, content: "ignored" },
])

describe("snippet expansion", () => {
  it("keeps only valid aliases", () => {
    expect([...aliases.keys()]).toEqual(["sig"])
  })
  it("matches #alias right before the cursor", () => {
    expect(detectTrigger("Thanks! #sig", aliases)).toEqual({ content: "Best regards", triggerLength: 4 })
  })
  it("ignores unknown aliases and text after the alias", () => {
    expect(detectTrigger("#nope", aliases)).toBeNull()
    expect(detectTrigger("#sig ", aliases)).toBeNull()
  })
  it("fires only on exactly Ctrl+Shift+K", () => {
    const base = { code: "KeyK", ctrlKey: true, shiftKey: true, altKey: false, metaKey: false }
    expect(isTriggerKey(base)).toBe(true)
    expect(isTriggerKey({ ...base, shiftKey: false })).toBe(false)
    expect(isTriggerKey({ ...base, metaKey: true })).toBe(false)
  })
  it("skips password fields and opted-out regions", () => {
    const pw = document.createElement("input")
    pw.type = "password"
    expect(shouldSkipField(pw)).toBe(true)
    const wrap = document.createElement("div")
    wrap.setAttribute("data-no-markpad", "")
    const ta = document.createElement("textarea")
    wrap.append(ta)
    expect(shouldSkipField(ta)).toBe(true)
    expect(shouldSkipField(document.createElement("textarea"))).toBe(false)
  })
})
