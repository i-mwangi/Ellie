<script setup lang="ts">
import type { TraceStep } from '~~/server/platform/types'

defineProps<{ step: TraceStep }>()

const LABEL: Record<TraceStep['kind'], string> = {
  reasoning: 'reasoning',
  tool_call: 'tool call',
  sub_agent: 'sub-agent',
  memory_read: 'memory',
  guardrail: 'guardrail',
  decision: 'decision',
}

const CHIP: Record<TraceStep['kind'], string> = {
  reasoning: '',
  tool_call: 'blue',
  sub_agent: 'blue',
  memory_read: 'green',
  guardrail: 'red',
  decision: 'amber',
}

const ICON: Record<TraceStep['kind'], string> = {
  reasoning: 'brain',
  tool_call: 'key',
  sub_agent: 'users',
  memory_read: 'database',
  guardrail: 'shield',
  decision: 'checkCircle',
}
</script>

<template>
  <li class="step">
    <span class="marker" :class="step.kind">
      <AppIcon :name="ICON[step.kind]" :size="12" />
    </span>

    <div class="body">
      <div class="row">
        <span class="chip" :class="CHIP[step.kind]">{{ LABEL[step.kind] }}</span>
        <span class="tiny faint">{{ new Date(step.at).toLocaleString() }}</span>
        <span v-if="step.durationMs" class="tiny faint">· {{ step.durationMs }}ms</span>
      </div>

      <p class="small" style="margin-top: 6px; font-weight: 500">{{ step.label }}</p>

      <p v-if="step.rationale" class="tiny muted rationale">{{ step.rationale }}</p>

      <p v-if="step.identity" class="tiny" style="margin-top: 6px">
        <span class="faint">ran as</span> <code>{{ step.identity }}</code>
      </p>

      <div v-if="step.data" class="row" style="margin-top: 8px">
        <span v-for="(value, key) in step.data" :key="key" class="chip mono">
          {{ key }}: {{ value }}
        </span>
      </div>
    </div>
  </li>
</template>

<style scoped>
.step {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 12px;
  padding-bottom: 18px;
  position: relative;
}

.step::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 24px;
  bottom: -2px;
  width: 1px;
  background: var(--border);
}

.step:last-child::before {
  display: none;
}

.marker {
  width: 23px;
  height: 23px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--canvas);
  border: 1px solid var(--border-strong);
  color: var(--muted);
  z-index: 1;
}

.marker.guardrail {
  border-color: var(--red);
  color: var(--red);
  background: var(--red-soft);
}
.marker.memory_read {
  border-color: var(--green);
  color: var(--green-dark);
  background: var(--green-soft);
}
.marker.tool_call,
.marker.sub_agent {
  border-color: var(--blue);
  color: var(--blue);
  background: var(--blue-soft);
}
.marker.decision {
  border-color: var(--amber);
  color: var(--amber);
  background: var(--amber-soft);
}

.body {
  min-width: 0;
  padding-bottom: 2px;
}

/* The rationale is the point of the trace — give it weight. */
.rationale {
  margin-top: 5px;
  padding-left: 9px;
  border-left: 2px solid var(--border);
  line-height: 1.6;
}
</style>
