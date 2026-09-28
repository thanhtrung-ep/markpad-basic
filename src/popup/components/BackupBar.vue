<template>
  <footer class="flex items-center gap-1 border-t border-line px-3 py-1.5 text-xs">
    <button
      type="button"
      class="btn btn-ghost flex items-center gap-1"
      @click="exportData"
    >
      <Download class="h-3.5 w-3.5" /> Export
    </button>
    <button
      type="button"
      class="btn btn-ghost flex items-center gap-1"
      @click="fileInput?.click()"
    >
      <Upload class="h-3.5 w-3.5" /> Import
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="application/json,.json"
      class="hidden"
      @change="importData"
    >
    <span
      class="ml-auto text-ink-muted"
      role="status"
    >{{ message }}</span>
  </footer>
</template>

<script setup lang="ts">
import { Download, Upload } from "lucide-vue-next"
import { ref } from "vue"
import { buildBackup, mergeById, parseBackup } from "@/lib/backup"
import { readCollection, writeCollection } from "@/lib/storage"

const fileInput = ref<HTMLInputElement>()
const message = ref("")

async function exportData(): Promise<void> {
  const backup = buildBackup({
    snippets: await readCollection("snippets"),
    terms: await readCollection("terms"),
    notes: await readCollection("notes"),
  })
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `markpad-basic-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function importData(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ""
  if (!file) return
  let data
  try {
    data = parseBackup(JSON.parse(await file.text()))
  } catch {
    data = null
  }
  if (!data) {
    message.value = "Not a Markpad Basic backup file."
    return
  }
  await writeCollection("snippets", mergeById(await readCollection("snippets"), data.snippets))
  await writeCollection("terms", mergeById(await readCollection("terms"), data.terms))
  await writeCollection("notes", mergeById(await readCollection("notes"), data.notes))
  const n = data.snippets.length + data.terms.length + data.notes.length
  message.value = `Imported ${n} ${n === 1 ? "item" : "items"}.`
}
</script>
