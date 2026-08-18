<script setup lang="ts">
defineProps<{
  from: 'requester' | 'ellie'
  text: string
  quickReplies?: string[]
}>()

const emit = defineEmits<{ pick: [value: string] }>()
</script>

<template>
  <div class="turn" :class="from">
    <div v-if="from === 'requester'" class="bubble me">{{ text }}</div>

    <div v-else class="bubble ellie">
      <div class="row" style="gap: 6px; margin-bottom: 6px">
        <span class="mark" />
        <span class="tiny" style="color: var(--accent); font-weight: 600">Ellie</span>
      </div>
      <p class="small">{{ text }}</p>

      <div v-if="quickReplies?.length" class="row" style="margin-top: 9px">
        <button
          v-for="reply in quickReplies"
          :key="reply"
          class="quick"
          @click="emit('pick', reply)"
        >
          {{ reply }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.turn {
  display: flex;
  margin-bottom: 10px;
}

.turn.requester {
  justify-content: flex-end;
}

.bubble {
  max-width: 82%;
  border-radius: var(--radius-lg);
  padding: 10px 13px;
}

.bubble.me {
  background: var(--accent);
  color: #fff;
  font-size: 12.5px;
}

.bubble.ellie {
  background: var(--canvas);
  border: 1px solid var(--border);
}

.mark {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent);
}

/* Quick replies are the answer, not a suggestion to type one. */
.quick {
  border: 1px solid var(--accent-border);
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 999px;
  padding: 3px 11px;
  font-size: 11.5px;
  font-weight: 500;
}

.quick:hover {
  background: #ddebfa;
}
</style>
