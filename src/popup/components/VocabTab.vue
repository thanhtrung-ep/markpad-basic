<template>
  <ReviewPanel
    v-if="reviewing"
    :terms="items"
    @graded="(id, patch) => update(id, patch)"
    @close="reviewing = false"
  />
  <div
    v-else
    class="space-y-2"
  >
    <div class="flex gap-2">
      <button
        v-if="!adding"
        type="button"
        class="btn btn-ghost flex flex-1 items-center justify-center gap-1 border border-dashed border-line"
        @click="adding = true"
      >
        <Plus class="h-3.5 w-3.5" /> New word
      </button>
      <button
        v-if="!adding && items.length"
        type="button"
        class="btn btn-primary flex items-center gap-1"
        :disabled="!due"
        @click="reviewing = true"
      >
        <GraduationCap class="h-3.5 w-3.5" /> Review ({{ due }})
      </button>
    </div>
    <TermForm
      v-if="adding"
      @save="create"
      @cancel="adding = false"
    />

    <template
      v-for="t in visible"
      :key="t.id"
    >
      <TermForm
        v-if="editingId === t.id"
        :initial="t"
        @save="(v) => saveEdit(t.id, v)"
        @cancel="editingId = null"
      />
      <div
        v-else
        data-testid="term-row"
        class="card group flex items-start gap-2"
        @dblclick="editingId = t.id"
      >
        <div class="min-w-0 flex-1">
          <p class="font-medium">
            {{ t.term }}
          </p>
          <p
            v-if="t.definition"
            class="line-clamp-2 whitespace-pre-line text-ink-muted"
          >
            {{ t.definition }}
          </p>
        </div>
        <RowActions
          @edit="editingId = t.id"
          @remove="remove(t.id)"
        />
      </div>
    </template>

    <EmptyState v-if="!visible.length && !adding">
      {{ query ? "No words match." : "Collect words while you read, then review them with spaced repetition." }}
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import { GraduationCap, Plus } from "lucide-vue-next"
import { computed, ref } from "vue"
import { newId } from "@/lib/ids"
import { countDue } from "@/lib/sm2"
import type { Term } from "@/types"
import { matches, useCollection } from "../composables/useCollection"
import EmptyState from "./EmptyState.vue"
import ReviewPanel from "./ReviewPanel.vue"
import RowActions from "./RowActions.vue"
import TermForm from "./TermForm.vue"

const props = defineProps<{ query: string }>()
const { items, add, update, remove } = useCollection("terms")

const adding = ref(false)
const reviewing = ref(false)
const editingId = ref<string | null>(null)

const visible = computed(() => items.value.filter((t) => matches(props.query, t.term, t.definition, t.example)))
const due = computed(() => countDue(items.value, Date.now()))

async function create(v: Pick<Term, "term" | "definition" | "example">): Promise<void> {
  const now = Date.now()
  await add({ id: newId(), ...v, createdAt: now, updatedAt: now })
  adding.value = false
}

async function saveEdit(id: string, v: Pick<Term, "term" | "definition" | "example">): Promise<void> {
  await update(id, v)
  editingId.value = null
}
</script>
