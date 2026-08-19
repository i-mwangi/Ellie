<script setup lang="ts">
/** The seven stages between a sentence and a sourceable request. */
const STEPS = [
  'Start with a sentence',
  'Ellie asks the right questions',
  'The request builds itself',
  'It knows when to stop',
  'Right people, right boundaries',
  'Every language',
  'Straight into sourcing',
]

defineProps<{ active: number }>()
</script>

<template>
  <ol class="rail">
    <li v-for="(step, i) in STEPS" :key="step" class="step" :class="{ on: i === active, done: i < active }">
      <span class="label">{{ step }}</span>
      <span class="num">{{ String(i + 1).padStart(2, '0') }}</span>
    </li>
  </ol>
</template>

<style scoped>
.rail {
  list-style: none;
  display: flex;
  margin: 0 0 16px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow-x: auto;
  background: var(--canvas);
}

.step {
  flex: 1 0 auto;
  min-width: 104px;
  padding: 8px 10px;
  border-right: 1px solid var(--border);
}

.step:last-child {
  border-right: none;
}

.label {
  display: block;
  font-size: 10.5px;
  line-height: 1.35;
  color: var(--faint);
}

.num {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: var(--faint);
  margin-top: 5px;
}

.step.done .label,
.step.done .num {
  color: var(--muted);
}

.step.on {
  background: var(--accent-soft);
}

.step.on .label {
  color: var(--text);
  font-weight: 500;
}

.step.on .num {
  color: var(--accent);
}
</style>
