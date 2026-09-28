<template>
  <form
    class="card space-y-2"
    @submit.prevent="submit"
    @keydown.esc.stop="$emit('cancel')"
  >
    <textarea
      ref="area"
      v-model="content"
      class="field min-h-24 resize-y"
      placeholder="Note for this page"
      aria-label="Note"
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    />
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
        :disabled="!content.trim()"
      >
        Save
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"

const props = defineProps<{ initial?: string }>()
const emit = defineEmits<{ save: [content: string]; cancel: [] }>()

const content = ref(props.initial ?? "")
const area = ref<HTMLTextAreaElement>()
onMounted(() => {
  const el = area.value
  el?.focus()
  el?.setSelectionRange(el.value.length, el.value.length)
})

function submit(): void {
  if (content.value.trim()) emit("save", content.value.trim())
}
</script>
