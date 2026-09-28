<template>
  <div class="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
    <button
      type="button"
      class="icon-btn"
      aria-label="Edit"
      title="Edit"
      @click.stop="$emit('edit')"
    >
      <Pencil class="h-3.5 w-3.5" />
    </button>
    <button
      type="button"
      class="icon-btn hover:!text-danger"
      aria-label="Delete"
      title="Delete"
      @click.stop="$emit('remove')"
    >
      <Trash2 class="h-3.5 w-3.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Pencil, Trash2 } from "lucide-vue-next"

defineEmits<{ edit: []; remove: [] }>()
</script>
