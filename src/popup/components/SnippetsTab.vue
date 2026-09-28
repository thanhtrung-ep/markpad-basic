<template>
  <div class="space-y-2">
    <SnippetForm
      v-if="adding"
      :taken-aliases="aliases"
      @save="create"
      @cancel="adding = false"
    />
    <button
      v-else
      type="button"
      class="btn btn-ghost flex w-full items-center justify-center gap-1 border border-dashed border-line"
      @click="adding = true"
    >
      <Plus class="h-3.5 w-3.5" /> New snippet
    </button>

    <template
      v-for="s in visible"
      :key="s.id"
    >
      <SnippetForm
        v-if="editingId === s.id"
        :initial="s"
        :taken-aliases="aliases"
        @save="(v) => saveEdit(s.id, v)"
        @cancel="editingId = null"
      />
      <div
        v-else
        data-testid="snippet-row"
        class="card group flex cursor-pointer items-start gap-2 hover:border-primary"
        title="Click to copy · double-click to edit"
        @click="copy(s)"
        @dblclick="editingId = s.id"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span class="truncate font-medium">{{ s.title }}</span>
            <code
              v-if="s.alias"
              class="shrink-0 rounded bg-line px-1 text-[11px] text-ink-muted"
            >#{{ s.alias }}</code>
            <span
              v-if="copiedId === s.id"
              class="shrink-0 text-xs text-primary"
            >Copied</span>
          </div>
          <p class="line-clamp-2 whitespace-pre-line text-ink-muted">
            {{ s.content }}
          </p>
        </div>
        <RowActions
          @edit="editingId = s.id"
          @remove="remove(s.id)"
        />
      </div>
    </template>

    <EmptyState v-if="!visible.length && !adding">
      {{ query ? "No snippets match." : "Save text you type often. Select text on a page and right-click → Save as snippet." }}
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import { Plus } from "lucide-vue-next"
import { computed, ref } from "vue"
import { newId } from "@/lib/ids"
import type { Snippet } from "@/types"
import { matches, useCollection } from "../composables/useCollection"
import EmptyState from "./EmptyState.vue"
import RowActions from "./RowActions.vue"
import SnippetForm from "./SnippetForm.vue"

const props = defineProps<{ query: string }>()
const { items, add, update, remove } = useCollection("snippets")

const adding = ref(false)
const editingId = ref<string | null>(null)
const copiedId = ref<string | null>(null)

const visible = computed(() => items.value.filter((s) => matches(props.query, s.title, s.content, s.alias)))
const aliases = computed(() => items.value.flatMap((s) => (s.alias ? [s.alias] : [])))

async function create(v: Pick<Snippet, "title" | "content" | "alias">): Promise<void> {
  const now = Date.now()
  await add({ id: newId(), ...v, createdAt: now, updatedAt: now })
  adding.value = false
}

async function saveEdit(id: string, v: Pick<Snippet, "title" | "content" | "alias">): Promise<void> {
  await update(id, v)
  editingId.value = null
}

let copiedTimer: ReturnType<typeof setTimeout> | undefined
async function copy(s: Snippet): Promise<void> {
  await navigator.clipboard.writeText(s.content)
  copiedId.value = s.id
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copiedId.value = null), 1200)
}
</script>
