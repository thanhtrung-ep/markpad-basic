<template>
  <form
    class="card space-y-2"
    @submit.prevent="submit"
    @keydown.esc.stop="$emit('cancel')"
  >
    <input
      ref="first"
      v-model="title"
      class="field"
      placeholder="Title"
      aria-label="Title"
    >
    <textarea
      v-model="content"
      class="field min-h-24 resize-y"
      placeholder="Snippet text"
      aria-label="Snippet text"
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    />
    <div>
      <div class="flex items-center gap-1">
        <span class="text-ink-muted">#</span>
        <input
          v-model="alias"
          class="field"
          placeholder="alias (optional)"
          aria-label="Alias"
        >
      </div>
      <p
        v-if="aliasError"
        class="mt-1 text-xs text-danger"
      >
        {{ aliasError }}
      </p>
      <p
        v-else
        class="mt-1 text-xs text-ink-muted"
      >
        Type <b>#{{ alias.trim() || "alias" }}</b> then press <b>Ctrl+Shift+K</b> in any text field to expand.
      </p>
    </div>
    <div class="flex justify-end gap-1">
      <button
        type="button"
        class="btn btn-ghost"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="!content.trim() || !!aliasError"
      >
        Save
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { ALIAS_RE } from "@/lib/snippet-expansion"
import type { Snippet } from "@/types"

const props = defineProps<{ initial?: Snippet; takenAliases: string[] }>()
const emit = defineEmits<{ save: [value: Pick<Snippet, "title" | "content" | "alias">]; cancel: [] }>()

const title = ref(props.initial?.title ?? "")
const content = ref(props.initial?.content ?? "")
const alias = ref(props.initial?.alias ?? "")
const first = ref<HTMLInputElement>()
onMounted(() => first.value?.focus())

const aliasError = computed(() => {
  const a = alias.value.trim()
  if (!a) return ""
  if (!ALIAS_RE.test(a)) return "Letters, digits, - and _ only (max 32)."
  if (a !== props.initial?.alias && props.takenAliases.includes(a)) return `#${a} is already used.`
  return ""
})

function submit(): void {
  if (!content.value.trim() || aliasError.value) return
  const text = content.value.trim()
  emit("save", {
    title: title.value.trim() || text.split("\n")[0].slice(0, 60),
    content: text,
    alias: alias.value.trim() || undefined,
  })
}
</script>
