import type { CollectionKey, Collections } from "@/types"

/**
 * One chrome.storage.local key per collection. Values are written as plain
 * JSON: Vue reactive proxies serialize arrays inside objects as `{"0": …}`,
 * so every write goes through `toPlain` first.
 */
export async function readCollection<K extends CollectionKey>(key: K): Promise<Collections[K]> {
  const raw = (await chrome.storage.local.get(key))[key]
  return (Array.isArray(raw) ? raw : []) as Collections[K]
}

export async function writeCollection<K extends CollectionKey>(key: K, items: Collections[K]): Promise<void> {
  await chrome.storage.local.set({ [key]: toPlain(items) })
}

export async function prependItem<K extends CollectionKey>(key: K, item: Collections[K][number]): Promise<void> {
  const items = await readCollection(key)
  await writeCollection(key, [item, ...items] as Collections[K])
}

export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
