import type { Collections } from "@/types"

export const BACKUP_FORMAT = "markpad-basic/1"
const KEYS = ["snippets", "terms", "notes"] as const

export interface Backup extends Collections {
  format: typeof BACKUP_FORMAT
  exportedAt: number
}

export function buildBackup(data: Collections, now = Date.now()): Backup {
  return { format: BACKUP_FORMAT, exportedAt: now, ...data }
}

/** Accepts a parsed backup file; returns null when it isn't one of ours. */
export function parseBackup(raw: unknown): Collections | null {
  if (!raw || typeof raw !== "object" || (raw as { format?: unknown }).format !== BACKUP_FORMAT) return null
  const out = {} as Collections
  for (const k of KEYS) {
    const list = (raw as Record<string, unknown>)[k]
    out[k] = (Array.isArray(list) ? list.filter((i) => i && typeof i.id === "string") : []) as never
  }
  return out
}

/** Merge by id: imported items replace same-id items and come first. */
export function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const ids = new Set(incoming.map((i) => i.id))
  return [...incoming, ...current.filter((i) => !ids.has(i.id))]
}
