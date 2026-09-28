<template>
  <div class="space-y-2">
    <div class="flex items-center gap-1 text-xs">
      <button
        v-for="s in scopes"
        :key="s.id"
        type="button"
        class="rounded-full px-2.5 py-1"
        :class="scope === s.id ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-line'"
        @click="scope = s.id"
      >
        {{ s.label }}
      </button>
    </div>

    <template v-if="scope === 'page'">
      <p
        v-if="!page"
        class="card text-ink-muted"
      >
        Notes can't be attached to this page. Open a website to add one.
      </p>
      <template v-else>
        <p
          class="truncate text-xs text-ink-muted"
          :title="page.url"
        >
          {{ page.title || page.url }}
        </p>
        <NoteForm
          v-if="adding"
          @save="create"
          @cancel="adding = false"
        />
        <button
          v-else
          type="button"
          class="btn btn-ghost flex w-full items-center justify-center gap-1 border border-dashed border-line"
          @click="adding = true"
        >
          <Plus class="h-3.5 w-3.5" /> New note
        </button>
      </template>
    </template>

    <template
      v-for="n in visible"
      :key="n.id"
    >
      <NoteForm
        v-if="editingId === n.id"
        :initial="n.content"
        @save="(c) => saveEdit(n.id, c)"
        @cancel="editingId = null"
      />
      <div
        v-else
        data-testid="note-row"
        class="card group flex items-start gap-2"
        @dblclick="editingId = n.id"
      >
        <div class="min-w-0 flex-1">
          <p class="whitespace-pre-line break-words">
            {{ n.content }}
          </p>
          <a
            v-if="scope === 'all'"
            :href="n.url"
            target="_blank"
            class="mt-0.5 block truncate text-xs text-primary hover:underline"
            @click.stop
          >{{ n.title || n.url }}</a>
          <p class="mt-0.5 text-[11px] text-ink-muted">
            {{ new Date(n.updatedAt).toLocaleString() }}
          </p>
        </div>
        <RowActions
          @edit="editingId = n.id"
          @remove="remove(n.id)"
        />
      </div>
    </template>

    <EmptyState v-if="!visible.length && !adding && (page || scope === 'all')">
      {{ query ? "No notes match." : scope === "page" ? "No notes on this page yet." : "No notes yet." }}
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import { Plus } from "lucide-vue-next"
import { computed, ref } from "vue"
import { newId } from "@/lib/ids"
import { pageKey } from "@/lib/page-key"
import { matches, useCollection } from "../composables/useCollection"
import EmptyState from "./EmptyState.vue"
import NoteForm from "./NoteForm.vue"
import RowActions from "./RowActions.vue"

const props = defineProps<{ query: string }>()
const { items, add, update, remove } = useCollection("notes")

const scopes = [
  { id: "page", label: "This page" },
  { id: "all", label: "All pages" },
] as const
const scope = ref<"page" | "all">("page")
const adding = ref(false)
const editingId = ref<string | null>(null)

const page = ref<{ url: string; title: string } | null>(null)
void chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => {
  const url = pageKey(tab?.url)
  page.value = url ? { url, title: tab?.title ?? "" } : null
})

const visible = computed(() =>
  items.value.filter(
    (n) => (scope.value === "all" || n.url === page.value?.url) && matches(props.query, n.content, n.title, n.url),
  ),
)

async function create(content: string): Promise<void> {
  if (!page.value) return
  const now = Date.now()
  await add({ id: newId(), ...page.value, content, createdAt: now, updatedAt: now })
  adding.value = false
}

async function saveEdit(id: string, content: string): Promise<void> {
  await update(id, { content })
  editingId.value = null
}
</script>
