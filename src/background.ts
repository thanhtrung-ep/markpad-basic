import { newId } from "./lib/ids"
import { pageKey } from "./lib/page-key"
import { prependItem, readCollection } from "./lib/storage"

const MENU = {
  snippet: "save-snippet",
  term: "save-term",
  note: "save-note",
} as const

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU.snippet, title: "Save as snippet", contexts: ["selection"] })
    chrome.contextMenus.create({ id: MENU.term, title: "Add to vocabulary", contexts: ["selection"] })
    chrome.contextMenus.create({ id: MENU.note, title: "Save as page note", contexts: ["selection"] })
  })
})

function firstLine(text: string, max = 60): string {
  const line = text.split("\n")[0].trim()
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const text = info.selectionText?.trim()
  if (!text) return
  const now = Date.now()
  if (info.menuItemId === MENU.snippet) {
    await prependItem("snippets", { id: newId(), title: firstLine(text), content: text, createdAt: now, updatedAt: now })
  } else if (info.menuItemId === MENU.term) {
    await prependItem("terms", { id: newId(), term: text, definition: "", createdAt: now, updatedAt: now })
  } else if (info.menuItemId === MENU.note) {
    const url = pageKey(tab?.url)
    if (!url) return
    await prependItem("notes", { id: newId(), url, title: tab?.title ?? "", content: text, createdAt: now, updatedAt: now })
  }
})

// ── Badge: how many notes belong to the page in each tab ──────────────────
async function updateBadge(tabId: number, url: string | undefined): Promise<void> {
  const key = pageKey(url)
  const count = key ? (await readCollection("notes")).filter((n) => n.url === key).length : 0
  await chrome.action.setBadgeText({ tabId, text: count ? String(count) : "" }).catch(() => {})
}

async function updateAllBadges(): Promise<void> {
  for (const tab of await chrome.tabs.query({})) if (tab.id !== undefined) void updateBadge(tab.id, tab.url)
}

chrome.action.setBadgeBackgroundColor({ color: "#3b5bdb" })
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.url || change.status === "complete") void updateBadge(tabId, tab.url)
})
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => void updateBadge(tabId, tab.url))
})
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.notes) void updateAllBadges()
})
void updateAllBadges()
