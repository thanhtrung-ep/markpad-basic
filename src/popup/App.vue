<template>
  <div class="flex h-full flex-col">
    <header class="flex items-center gap-1 border-b border-line px-3 pt-2">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        role="tab"
        :aria-selected="tab === t.id"
        class="-mb-px border-b-2 px-2.5 py-1.5 font-medium"
        :class="tab === t.id ? 'border-primary text-ink' : 'border-transparent text-ink-muted hover:text-ink'"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </header>

    <div class="px-3 pt-2">
      <input
        v-model="query"
        type="search"
        class="field"
        :placeholder="`Search ${tab}…`"
        aria-label="Search"
      >
    </div>

    <main class="min-h-0 flex-1 overflow-y-auto px-3 py-2">
      <SnippetsTab
        v-if="tab === 'snippets'"
        :query="query"
      />
      <VocabTab
        v-else-if="tab === 'vocabulary'"
        :query="query"
      />
      <NotesTab
        v-else
        :query="query"
      />
    </main>

    <BackupBar />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import BackupBar from "./components/BackupBar.vue"
import NotesTab from "./components/NotesTab.vue"
import SnippetsTab from "./components/SnippetsTab.vue"
import VocabTab from "./components/VocabTab.vue"

type TabId = "snippets" | "vocabulary" | "notes"
const tabs: { id: TabId; label: string }[] = [
  { id: "snippets", label: "Snippets" },
  { id: "vocabulary", label: "Vocabulary" },
  { id: "notes", label: "Notes" },
]

const TAB_KEY = "ui.lastTab"
const tab = ref<TabId>((localStorage.getItem(TAB_KEY) as TabId | null) ?? "snippets")
const query = ref("")
watch(tab, (t) => {
  localStorage.setItem(TAB_KEY, t)
  query.value = ""
})
</script>
