import { describe, expect, it } from "vitest"
import { buildBackup, mergeById, parseBackup } from "./backup"

describe("backup", () => {
  it("round-trips through JSON", () => {
    const data = { snippets: [{ id: "s1" }], terms: [], notes: [{ id: "n1" }] } as never
    expect(parseBackup(JSON.parse(JSON.stringify(buildBackup(data, 1))))).toEqual(data)
  })
  it("rejects files that are not a Markpad Basic backup", () => {
    expect(parseBackup({ snippets: [] })).toBeNull()
    expect(parseBackup(null)).toBeNull()
  })
  it("drops entries without an id", () => {
    const parsed = parseBackup({ format: "markpad-basic/1", snippets: [{ id: "a" }, {}, null], terms: "x" })
    expect(parsed).toEqual({ snippets: [{ id: "a" }], terms: [], notes: [] })
  })
  it("merges by id, imported first", () => {
    expect(mergeById([{ id: "a", v: 1 }, { id: "b", v: 1 }], [{ id: "b", v: 2 }])).toEqual([
      { id: "b", v: 2 },
      { id: "a", v: 1 },
    ])
  })
})
