<script setup lang="ts">
interface Finding {
  id: string
  detector: string
  title: string
  summary: string
  annualValue: number
  noSupplierSwitch: boolean
  confidence: string
  suppliers: string[]
}

const { data } = await useFetch<{
  baseline: {
    rows: number
    suppliersRaw: number
    suppliersNormalised: number
    annualSpend: number
    categories: number
    period: string
  }
  detectors: Record<string, { label: string; explains: string }>
  totals: { total: number; quickWinValue: number; quickWinCount: number; count: number }
  redacted: boolean
  findings: Finding[]
}>('/api/savings/findings')

const eur = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

const quickWins = computed(() => data.value?.findings.filter((f) => f.noSupplierSwitch) ?? [])
const rest = computed(() => data.value?.findings.filter((f) => !f.noSupplierSwitch) ?? [])
</script>

<template>
  <PageShell
    title="Savings Engine"
    subtitle="True-cost baseline and detectors"
    :timestamp="`Spend analysed over ${data?.baseline.period}`"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="activity" :size="11" /> At stake</div>
          <span class="chip blue">{{ eur(data?.totals.total ?? 0) }}</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="check" :size="11" /> Quick wins</div>
          <span class="chip green"><span class="dot" /> {{ data?.totals.quickWinCount }}</span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/savings" class="context-link">
          <AppIcon name="activity" :size="14" /> Findings
        </NuxtLink>
        <NuxtLink to="/rfq" class="context-link">
          <AppIcon name="briefcase" :size="14" /> Sourcing
        </NuxtLink>
        <NuxtLink to="/approvals" class="context-link">
          <AppIcon name="clipboard" :size="14" /> Approvals
        </NuxtLink>
      </nav>

      <div class="context-actions">
        <button class="context-action" disabled title="Needs a live ERP or AP feed">
          <AppIcon name="refresh" :size="14" /> Re-import AP export
          <span class="why">ERP</span>
        </button>
      </div>
    </template>

    <template #aside>
      <IdentityPanel />

      <div class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="database" :size="13" /> Baseline</span>
        </div>
        <div class="aside-body">
          <div class="aside-row">
            <span class="k">AP rows</span>
            <span class="small">{{ data?.baseline.rows.toLocaleString() }}</span>
          </div>
          <div class="aside-row">
            <span class="k">Suppliers raw</span>
            <span class="small">{{ data?.baseline.suppliersRaw.toLocaleString() }}</span>
          </div>
          <div class="aside-row">
            <span class="k">After merge</span>
            <span class="small">{{ data?.baseline.suppliersNormalised.toLocaleString() }}</span>
          </div>
          <div class="aside-row">
            <span class="k">Annual spend</span>
            <span class="small">{{ eur(data?.baseline.annualSpend ?? 0) }}</span>
          </div>
          <p class="tiny muted">
            Duplicate supplier names merged before analysis — the same vendor spelled four ways is
            one vendor.
          </p>
        </div>
      </div>
    </template>

    <p class="tiny faint" style="margin-bottom: 8px">Ellie</p>
    <p class="lede" style="margin-bottom: 14px">
      {{ eur(data?.totals.total ?? 0) }} a year sits in five detector findings across this spend.
      <strong>{{ eur(data?.totals.quickWinValue ?? 0) }} of it needs no supplier change</strong> —
      it is price levelling, terms already agreed, and an unused framework.
    </p>

    <div v-if="data?.redacted" class="banner" style="margin-bottom: 14px">
      <div class="banner-head warn">
        <span class="row" style="gap: 6px">
          <AppIcon name="eyeOff" :size="14" /> Supplier detail withheld for your role
        </span>
      </div>
      <div class="banner-body">
        <p class="small muted">
          Totals are visible, evidence rows and supplier names are not.
        </p>
      </div>
    </div>

    <h2 style="margin-bottom: 4px">Quick wins — no supplier change</h2>
    <p class="tiny faint" style="margin-bottom: 10px">
      Recoverable without re-tendering or a new relationship.
    </p>

    <div class="stack">
      <NuxtLink
        v-for="finding in quickWins"
        :key="finding.id"
        :to="`/savings/${finding.id}`"
        class="card finding"
      >
        <div class="between">
          <div style="min-width: 0">
            <div class="row" style="gap: 6px">
              <span class="chip green">{{ data?.detectors[finding.detector]?.label }}</span>
              <span class="chip">{{ finding.confidence }}</span>
            </div>
            <h3 style="margin-top: 8px">{{ finding.title }}</h3>
            <p class="small muted" style="margin-top: 5px">{{ finding.summary }}</p>
          </div>
          <div style="text-align: right; white-space: nowrap">
            <p class="value">{{ eur(finding.annualValue) }}</p>
            <p class="tiny faint">per year</p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <h2 style="margin: 22px 0 4px">Requires sourcing</h2>
    <p class="tiny faint" style="margin-bottom: 10px">
      Needs a competitive process or a consolidation decision.
    </p>

    <div class="stack">
      <NuxtLink
        v-for="finding in rest"
        :key="finding.id"
        :to="`/savings/${finding.id}`"
        class="card finding"
      >
        <div class="between">
          <div style="min-width: 0">
            <div class="row" style="gap: 6px">
              <span class="chip amber">{{ data?.detectors[finding.detector]?.label }}</span>
              <span class="chip">{{ finding.confidence }}</span>
            </div>
            <h3 style="margin-top: 8px">{{ finding.title }}</h3>
            <p class="small muted" style="margin-top: 5px">{{ finding.summary }}</p>
          </div>
          <div style="text-align: right; white-space: nowrap">
            <p class="value">{{ eur(finding.annualValue) }}</p>
            <p class="tiny faint">per year</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </PageShell>
</template>

<style scoped>
.finding {
  display: block;
}

.finding:hover {
  border-color: var(--accent-border);
  background: var(--accent-soft);
}

.value {
  font-size: 16px;
  font-weight: 600;
}
</style>
