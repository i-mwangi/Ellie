<script setup lang="ts">
/**
 * Node-based workflow builder. Bands come from the authority matrix, so editing
 * a threshold here is editing the routing rule, not drawing a picture of it.
 */
const { data } = await useFetch<{
  matrix: Array<{ id: string; category: string; upTo: number | null; approvers: string[][] }>
}>('/api/approvals')

const selected = ref(0)
const band = computed(() => data.value?.matrix[selected.value])

const eur = (n: number | null) =>
  n === null
    ? 'no ceiling'
    : new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(n)
</script>

<template>
  <PageShell
    title="Approval workflow"
    subtitle="Authority matrix builder"
    timestamp="Routing rules by amount and category"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="layers" :size="11" /> Bands</div>
          <span class="chip blue">{{ data?.matrix.length }}</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="activity" :size="11" /> Mode</div>
          <span class="chip amber">READ ONLY</span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/approvals" class="context-link">
          <AppIcon name="clipboard" :size="14" /> Queue
        </NuxtLink>
        <NuxtLink to="/approvals/workflow" class="context-link">
          <AppIcon name="layers" :size="14" /> Workflow
        </NuxtLink>
      </nav>

      <div class="context-actions">
        <button
          v-for="(b, i) in data?.matrix"
          :key="b.id"
          class="context-action"
          @click="selected = i"
        >
          <AppIcon name="flag" :size="14" /> {{ eur(b.upTo) }}
        </button>
      </div>
    </template>

    <template #aside>
      <IdentityPanel />

      <div class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="key" :size="13" /> How routing resolves</span>
        </div>
        <div class="aside-body">
          <p class="tiny muted">
            An award takes the first band whose ceiling it fits under. Approvers on the same node
            act in parallel; nodes run left to right. The purchase order drafts only when the last
            node clears.
          </p>
        </div>
      </div>
    </template>

    <p class="tiny faint" style="margin-bottom: 8px">Ellie</p>
    <p class="lede" style="margin-bottom: 16px">
      Policy lives in the workflow rather than beside it. Every award is routed by this graph, and
      every decision it produces lands in the audit log.
    </p>

    <div class="row" style="margin-bottom: 14px">
      <button
        v-for="(b, i) in data?.matrix"
        :key="b.id"
        class="btn"
        :class="{ primary: i === selected }"
        @click="selected = i"
      >
        {{ b.category }} · {{ eur(b.upTo) }}
      </button>
    </div>

    <div class="graph">
      <div class="node start">
        <p class="tiny faint">TRIGGER</p>
        <p class="small" style="font-weight: 500">Award proposed</p>
        <p class="tiny muted">{{ band?.category }} · up to {{ eur(band?.upTo ?? null) }}</p>
      </div>

      <template v-for="(step, i) in band?.approvers ?? []" :key="i">
        <div class="edge"><AppIcon name="chevronRight" :size="14" /></div>
        <div class="node">
          <p class="tiny faint">STEP {{ i + 1 }}{{ step.length > 1 ? ' · PARALLEL' : '' }}</p>
          <p v-for="who in step" :key="who" class="small" style="font-weight: 500">{{ who }}</p>
          <p v-if="step.length > 1" class="tiny muted">Both must approve</p>
        </div>
      </template>

      <div class="edge"><AppIcon name="chevronRight" :size="14" /></div>
      <div class="node end">
        <p class="tiny faint">OUTPUT</p>
        <p class="small" style="font-weight: 500">PO drafted</p>
        <p class="tiny muted">Synced to ERP on acceptance</p>
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
      <h2>Rules attached to this band</h2>
      <ul class="bullets small">
        <li>Any decision on a request carrying an exception requires a written justification.</li>
        <li>Rejections always require a reason.</li>
        <li>Out-of-office approvers delegate to their deputy; the delegation is recorded.</li>
        <li>
          Budget breach, unvetted supplier, and contract violation are evaluated as Gateway policy
          before the request reaches this graph.
        </li>
      </ul>
    </div>

    <div class="banner" style="margin-top: 12px">
      <div class="banner-head warn">
        <span class="row" style="gap: 6px">
          <AppIcon name="alert" :size="14" /> Editing is read-only in this build
        </span>
      </div>
      <div class="banner-body">
        <p class="small muted">
          Bands render live from the authority matrix. Drag-to-edit writes back to the matrix and
          is not wired yet.
        </p>
      </div>
    </div>
  </PageShell>
</template>

<style scoped>
.graph {
  display: flex;
  align-items: stretch;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 2px 10px;
}

.node {
  flex: 0 0 auto;
  min-width: 150px;
  background: var(--canvas);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
}

.node.start {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.node.end {
  border-color: var(--green);
  background: var(--green-soft);
}

.edge {
  display: grid;
  place-items: center;
  color: var(--faint);
  flex: 0 0 auto;
}
</style>
