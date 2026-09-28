<template>
  <form
    class="card space-y-2"
    @submit.prevent="submit"
    @keydown.esc.stop="$emit('cancel')"
  >
    <input
      ref="first"
      v-model="term"
      class="field font-medium"
      placeholder="Word or phrase"
      aria-label="Term"
    >
    <textarea
      v-model="definition"
      class="field min-h-16 resize-y"
      placeholder="Meaning"
      aria-label="Meaning"
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    />
    <input
      v-model="example"
      class="field"
      placeholder="Example sentence (optional)"
      aria-label="Example"
    >
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
        :disabled="!term.trim()"
      >
        Save
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import type { Term } from "@/types"

const props = defineProps<{ initial?: Term }>()
const emit = defineEmits<{ save: [value: Pick<Term, "term" | "definition" | "example">]; cancel: [] }>()

const term = ref(props.initial?.term ?? "")
const definition = ref(props.initial?.definition ?? "")
const example = ref(props.initial?.example ?? "")
const first = ref<HTMLInputElement>()
onMounted(() => first.value?.focus())

function submit(): void {
  if (!term.value.trim()) return
  emit("save", {
    term: term.value.trim(),
    definition: definition.value.trim(),
    example: example.value.trim() || undefined,
  })
}
</script>
