<template>
  <div class="card space-y-3 py-4 text-center">
    <template v-if="card">
      <p class="text-xs text-ink-muted">
        {{ index + 1 }} / {{ queue.length }}
      </p>
      <p
        data-testid="review-term"
        class="text-lg font-semibold"
      >
        {{ card.term }}
      </p>
      <template v-if="revealed">
        <p class="whitespace-pre-line">
          {{ card.definition || "—" }}
        </p>
        <p
          v-if="card.example"
          class="italic text-ink-muted"
        >
          {{ card.example }}
        </p>
        <div class="grid grid-cols-4 gap-1">
          <button
            v-for="g in grades"
            :key="g.grade"
            type="button"
            class="btn border border-line hover:border-primary"
            @click="grade(g.grade)"
          >
            {{ g.label }}
          </button>
        </div>
      </template>
      <button
        v-else
        type="button"
        class="btn btn-primary"
        @click="revealed = true"
      >
        Show answer
      </button>
    </template>
    <p v-else>
      All done for now 🎉
    </p>
    <button
      type="button"
      class="btn btn-ghost"
      @click="$emit('close')"
    >
      {{ card ? "Stop review" : "Back to list" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { applyGrade, initialReviewState, pickDueCards, type ReviewGrade } from "@/lib/sm2"
import type { Term } from "@/types"

const props = defineProps<{ terms: Term[] }>()
const emit = defineEmits<{ graded: [id: string, patch: Pick<Term, "_review">]; close: [] }>()

// Snapshot the due queue once: grading a card must not reshuffle the session.
const queue = pickDueCards(props.terms, Date.now())
const index = ref(0)
const revealed = ref(false)
const card = computed(() => queue[index.value])

const grades: { grade: ReviewGrade; label: string }[] = [
  { grade: 0, label: "Again" },
  { grade: 3, label: "Hard" },
  { grade: 4, label: "Good" },
  { grade: 5, label: "Easy" },
]

function grade(g: ReviewGrade): void {
  const c = card.value
  if (!c) return
  emit("graded", c.id, { _review: applyGrade(c._review ?? initialReviewState(), g, Date.now()) })
  revealed.value = false
  index.value++
}
</script>
