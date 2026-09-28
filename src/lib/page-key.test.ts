import { describe, expect, it } from "vitest"
import { pageKey } from "./page-key"

describe("pageKey", () => {
  it("drops query string, hash and trailing slash", () => {
    expect(pageKey("https://example.com/a/b/?utm=x#top")).toBe("https://example.com/a/b")
  })
  it("keeps the root path", () => {
    expect(pageKey("https://example.com/")).toBe("https://example.com/")
  })
  it("rejects browser-internal and invalid URLs", () => {
    expect(pageKey("chrome://extensions")).toBeNull()
    expect(pageKey("not a url")).toBeNull()
    expect(pageKey(undefined)).toBeNull()
  })
})
