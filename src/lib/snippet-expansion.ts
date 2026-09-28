/**
 * Pure helpers for snippet expansion: type `#alias`, then press Ctrl+Shift+K.
 *
 * The trigger is a chord rather than Space/Tab so normal typing never expands
 * by accident, and it avoids Space entirely: Ctrl(+Shift)+Space is swallowed
 * by macOS's input-source switcher. Ctrl+Shift+K is free on macOS, Windows
 * and Linux (IBus/Fcitx).
 */

export const EXPANSION_PREFIX = "#"
export const ALIAS_RE = /^[a-zA-Z0-9_-]{1,32}$/

const TRIGGER_RE = new RegExp(`${EXPANSION_PREFIX}([a-zA-Z0-9_-]{1,32})$`)

export function buildAliasMap(raw: unknown): Map<string, string> {
  const out = new Map<string, string>()
  if (!Array.isArray(raw)) return out
  for (const entry of raw) {
    const alias = (entry as { alias?: unknown })?.alias
    const content = (entry as { content?: unknown })?.content
    if (typeof alias !== "string" || typeof content !== "string") continue
    const clean = alias.trim()
    if (ALIAS_RE.test(clean)) out.set(clean, content)
  }
  return out
}

export interface ExpansionMatch {
  content: string
  /** Length of `#alias` right before the cursor. */
  triggerLength: number
}

export function detectTrigger(textBefore: string, aliases: Map<string, string>): ExpansionMatch | null {
  const match = TRIGGER_RE.exec(textBefore)
  if (!match) return null
  const content = aliases.get(match[1])
  return content === undefined ? null : { content, triggerLength: match[0].length }
}

export function isTriggerKey(e: Pick<KeyboardEvent, "code" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey">): boolean {
  return e.code === "KeyK" && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey
}

/** Never touch password/hidden fields or fields that opted out. */
export function shouldSkipField(el: Element): boolean {
  if (el instanceof HTMLInputElement && (el.type === "password" || el.type === "hidden")) return true
  return el.closest("[data-no-markpad]") !== null
}
