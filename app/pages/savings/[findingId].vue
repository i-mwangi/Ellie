<script setup lang="ts">
const route = useRoute()
const findingId = route.params.findingId as string

const { data } = await useFetch<{
  detectors: Record<string, { label: string; explains: string }>
  redacted: boolean
  findings: Array<{
    id: string
    detector: string
    title: string
    summary: string
    annualValue: number
    noSupplierSwitch: boolean
    confidence: string
    suppliers: string[]
    evidence: Array<{ label: string; detail: string; value: string }>
    recommendation: string
  }>
}>('/api/savings/findings')

const finding = computed(() => data.value?.findings.find((f) => f.id === findingId))

const eur = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
</script>

<template>
  <PageShell
    :title="finding?.title ?? 'Finding'"
    subtitle="Evidence trail"
    timestamp="Detector finding"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="activity" :size="11" /> Value</div>
          <span class="chip blue">{{ eur(finding?.annualValue ?? 0) }}</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="check" :size="11" /> Switch</div>
          <span class="chip" :class="finding?.noSupplierSwitch ? 'green' : 'amber'">
            {{ finding?.noSupplierSwitch ? 'NOT NEEDED' : 'REQUIRED' }}
          </span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/savings" class="context-link">
          <AppIcon name="activity" :size="14" /> All findings
        </NuxtLink>
        <NuxtLink to="/rfq" class="context-link">
          <AppIcon name="briefcase" :size="14" /> Sourcing
        </NuxtLink>
      </nav>

      <div class="context-actions">
        <a
          :href="`/api/savings/${findingId}/export?format=csv`"
          class="context-action"
        >
          <AppIcon name="file" :size="14" /> Export CSV / Excel
        </a>
        <a
          :href="`/api/savings/${findingId}/export?format=html`"
          target="_blank"
          class="context-action"
        >
          <AppIcon name="file" :size="14" /> Print-ready summary
        </a>
      </div>
    </template>

    <template #aside>
      <IdentityPanel />

      <div v-if="finding" class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="layers" :size="13" /> Detector</span>
        </div>
        <div class="aside-body">
          <p class="small" style="font-weight: 500">
            {{ data?.detectors[finding.detector]?.label }}
          </p>
          <p class="tiny muted">{{ data?.detectors[finding.detector]?.explains }}</p>
          <div class="divider" />
          <div class="aside-row">
            <span class="k">Confidence</span>
            <span class="chip" :class="finding.confidence === 'high' ? 'green' : 'amber'">
              {{ finding.confidence }}
            </span>
          </div>
          <div v-if="finding.suppliers.length" class="aside-row">
            <span class="k">Suppliers</span>
            <span class="small">{{ finding.suppliers.join(', ') }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="!finding" class="banner">
      <div class="banner-head danger">
        <span class="row" style="gap: 6px"><AppIcon name="alert" :size="14" /> Not found</span>
      </div>
    </div>

    <template v-else>
      <p class="tiny faint" style="margin-bottom: 8px">Ellie</p>
      <p class="lede" style="margin-bottom: 16px">{{ finding.summary }}</p>

      <div class="card" style="padding: 0">
        <div class="card-section">
          <p class="tiny faint">Annual value at stake</p>
          <p class="headline">{{ eur(finding.annualValue) }}</p>
          <span v-if="finding.noSupplierSwitch" class="chip green">
            <AppIcon name="check" :size="11" /> no supplier change required
          </span>
        </div>

        <div v-if="finding.evidence.length" class="card-section">
          <h2>Evidence</h2>
          <div class="ev" v-for="row in finding.evidence" :key="row.label">
            <span class="small" style="font-weight: 500">{{ row.label }}</span>
            <span class="tiny faint">{{ row.detail }}</span>
            <span class="small num">{{ row.value }}</span>
          </div>
        </div>

        <div v-else class="card-section">
          <p class="small muted">Evidence rows are withheld for your role.</p>
        </div>

        <div class="card-section">
          <h2>Recommendation</h2>
          <p class="small muted" style="margin-top: 6px">{{ finding.recommendation }}</p>
        </div>
      </div>
    </template>
  </PageShell>
</template>

<style scoped>
.headline {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 2px 0 8px;
}

.ev {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr) 90px;
  gap: 10px;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.ev:last-child {
  border-bottom: none;
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
</style>
