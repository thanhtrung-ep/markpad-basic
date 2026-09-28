import { buildAliasMap, detectTrigger, isTriggerKey, shouldSkipField } from "./lib/snippet-expansion"

let aliases = new Map<string, string>()

void chrome.storage.local.get("snippets").then((r) => (aliases = buildAliasMap(r.snippets)))
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.snippets) aliases = buildAliasMap(changes.snippets.newValue)
})

/** Focused element, looking through open shadow roots. */
function deepActiveElement(): Element | null {
  let el = document.activeElement
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement
  return el
}

/**
 * `insertText` keeps the page's undo stack and fires the input events that
 * React/Vue-controlled fields listen for; setRangeText is the fallback.
 */
function insert(text: string, field?: HTMLInputElement | HTMLTextAreaElement): void {
  if (document.execCommand("insertText", false, text)) return
  if (field) {
    field.setRangeText(text, field.selectionStart ?? 0, field.selectionEnd ?? 0, "end")
    field.dispatchEvent(new Event("input", { bubbles: true }))
  }
}

function expandInField(field: HTMLInputElement | HTMLTextAreaElement): boolean {
  const end = field.selectionStart
  if (end === null || end !== field.selectionEnd) return false
  const match = detectTrigger(field.value.slice(0, end), aliases)
  if (!match) return false
  field.setSelectionRange(end - match.triggerLength, end)
  insert(match.content, field)
  return true
}

function expandInEditable(): boolean {
  const sel = window.getSelection()
  if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return false
  const node = sel.anchorNode
  if (!node || node.nodeType !== Node.TEXT_NODE) return false
  const offset = sel.anchorOffset
  const match = detectTrigger((node.textContent ?? "").slice(0, offset), aliases)
  if (!match) return false
  const range = document.createRange()
  range.setStart(node, offset - match.triggerLength)
  range.setEnd(node, offset)
  sel.removeAllRanges()
  sel.addRange(range)
  insert(match.content)
  return true
}

document.addEventListener(
  "keydown",
  (e) => {
    if (!isTriggerKey(e) || aliases.size === 0) return
    const el = deepActiveElement()
    if (!el || shouldSkipField(el)) return
    const isTextField =
      el instanceof HTMLTextAreaElement ||
      (el instanceof HTMLInputElement && ["text", "search", "email", "url", "tel", ""].includes(el.type))
    const done = isTextField
      ? expandInField(el as HTMLInputElement | HTMLTextAreaElement)
      : (el as HTMLElement).isContentEditable && expandInEditable()
    if (done) {
      e.preventDefault()
      e.stopPropagation()
    }
  },
  true,
)
