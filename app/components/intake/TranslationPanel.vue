<script setup lang="ts">
/**
 * Each party works in their own language. The RFQ language is chosen
 * independently of both, and nobody waits on a human translator.
 */
defineProps<{
  requester: { lang: string; text: string }
  rfq: { lang: string; text: string }
  supplier: { lang: string; text: string }
}>()
</script>

<template>
  <div class="card">
    <h2>Everyone works in their own language</h2>
    <p class="tiny faint" style="margin-top: 4px">
      Translation is transparent — the requester never picks a language for anyone else.
    </p>

    <div class="tri">
      <div class="pane">
        <p class="tag">REQUESTER · {{ requester.lang }}</p>
        <p class="small">“{{ requester.text }}”</p>
      </div>
      <div class="pane focus">
        <p class="tag" style="color: var(--accent)">RFQ · {{ rfq.lang }}</p>
        <p class="small">“{{ rfq.text }}”</p>
      </div>
      <div class="pane">
        <p class="tag">SUPPLIER · {{ supplier.lang }}</p>
        <p class="small">“{{ supplier.text }}”</p>
      </div>
    </div>

    <p class="row tiny muted" style="margin-top: 10px; gap: 6px">
      <AppIcon name="globe" :size="13" />
      Translated transparently — English is never required
    </p>
  </div>
</template>

<style scoped>
.tri {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.pane {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 12px;
  background: var(--canvas);
}

.pane.focus {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.tag {
  font-size: 10px;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: var(--faint);
  margin-bottom: 6px;
}
</style>
