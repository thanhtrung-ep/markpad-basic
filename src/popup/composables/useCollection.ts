import { onScopeDispose, ref, type Ref } from "vue"
import { readCollection, writeCollection } from "@/lib/storage"
import type { CollectionKey, Collections } from "@/types"

/**
 * A collection mirrored from chrome.storage.local. Writes from the background
 * (context menu) or another popup land here through storage.onChanged.
 */
export function useCollection<K extends CollectionKey>(key: K) {
  type Item = Collections[K][number]
  const items = ref([]) as Ref<Item[]>

  void readCollection(key).then((v) => (items.value = v as Item[]))
  const onChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "local" && changes[key]) items.value = (changes[key].newValue ?? []) as Item[]
  }
  chrome.storage.onChanged.addListener(onChange)
  onScopeDispose(() => chrome.storage.onChanged.removeListener(onChange))

  async function save(next: Item[]): Promise<void> {
    items.value = next
    await writeCollection(key, next as Collections[K])
  }

  return {
    items,
    add: (item: Item) => save([item, ...items.value]),
    update: (id: string, patch: Partial<Item>) =>
      save(items.value.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i))),
    remove: (id: string) => save(items.value.filter((i) => i.id !== id)),
  }
}

export function matches(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase()
  return !q || fields.some((f) => f?.toLowerCase().includes(q))
}
