<script setup lang="ts">
interface Field {
  id: string
  label: string
  value: string
  answered: boolean
  fromMemory: boolean
}

defineProps<{
  title: string
  status: string
  fields: Field[]
}>()

const chipFor = (status: string) =>
  status === 'READY TO SEND' ? 'green' : status.startsWith('FLAGGED') ? 'amber' : 'blue'
</script>

<template>
  <div class="draft">
    <div class="draft-head">
      <h3>RFQ · {{ title }}</h3>
      <span class="chip" :class="chipFor(status)">
        <AppIcon v-if="status === 'READY TO SEND'" name="check" :size="11" />
        {{ status }}
      </span>
    </div>

    <div v-for="field in fields" :key="field.id" class="draft-row">
      <span class="muted small">
        {{ field.label }}
        <span v-if="field.fromMemory" class="chip green" style="margin-left: 5px">
          <AppIcon name="database" :size="10" /> remembered
        </span>
      </span>
      <span class="small" :class="field.answered ? 'value' : 'faint'">{{ field.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.draft {
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.draft-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
}

.draft-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  padding: 9px 14px;
}

.draft-row + .draft-row {
  border-top: 1px solid var(--border);
}

.value {
  font-weight: 500;
  text-align: right;
}
</style>
