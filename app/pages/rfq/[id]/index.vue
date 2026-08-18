<script setup lang="ts">
interface Scored {
  id: string
  supplier: string
  incumbent: boolean
  unitPrice: number
  paymentDays: number
  leadTimeWeeks: number
  certifications: string[]
  viaDiscovery: boolean
  trueUnitCost: number
  savingPct: number
  annualSaving: number
  disqualified: string | null
}

const route = useRoute()
const rfqId = route.params.id as string

const { data } = await useFetch<{
  redacted: boolean
  engagement: { approached: number; responded: number; window: string }
  baseline?: { unitPrice: number; annualUnits: number }
  standardPaymentDays?: number
  quotes: Scored[]
  summary: {
    supplier: string
    savingPct: number
    annualSaving: number
    viaDiscovery: boolean
  } | null
}>(`/api/rfq/${rfqId}/quotes`)

const events = ref<Array<{ kind: string; message: string }>>([])
const streaming = ref(false)
let source: EventSource | null = null

function watchProgress() {
  if (streaming.value) return
  events.value = []
  streaming.value = true
  source = new EventSource(`/api/rfq/${rfqId}/stream`)

  source.onmessage = (message) => {
    const parsed = JSON.parse(message.data)
    events.value.push(parsed)
    if (parsed.kind === 'done') stop()
  }
  source.onerror = stop
}

function stop() {
  source?.close()
  source = null
  streaming.value = false
}

onBeforeUnmount(stop)

const eur = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(value)

const iconFor = (kind: string) =>
  kind === 'guardrail' ? 'shield' : kind === 'memory' ? 'database' : kind === 'tool_call' ? 'key' : 'check'
</script>

<template>
  <PageShell
    title="Corrugated packaging — Round 1"
    subtitle="Sourcing session"
    :timestamp="`Comparison for ${rfqId}`"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="broadcast" :size="11" /> Approached</div>
          <span class="chip blue">{{ data?.engagement.approached }}</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="check" :size="11" /> Responded</div>
          <span class="chip green"><span class="dot" /> {{ data?.engagement.responded }}</span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink :to="`/rfq/${rfqId}`" class="context-link">
          <AppIcon name="briefcase" :size="14" /> Quotes
        </NuxtLink>
        <NuxtLink :to="`/rfq/${rfqId}/trace`" class="context-link">
          <AppIcon name="brain" :size="14" /> Reasoning trace
        </NuxtLink>
        <NuxtLink to="/approvals" class="context-link">
          <AppIcon name="clipboard" :size="14" /> Approvals
        </NuxtLink>
      </nav>

      <div class="context-actions">
        <button class="context-action" :disabled="streaming" @click="watchProgress">
          <AppIcon name="activity" :size="14" />
          {{ streaming ? 'Streaming…' : 'Watch live progress' }}
        </button>
        <button class="context-action" disabled>
          <AppIcon name="flag" :size="14" /> Request BAFO
        </button>
      </div>
    </template>

    <template #aside>
      <IdentityPanel />

      <div v-if="data?.summary" class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="activity" :size="13" /> Best offer</span>
          <span class="chip green">{{ data.summary.savingPct.toFixed(0) }}%</span>
        </div>
        <div class="aside-body">
          <div class="aside-row">
            <span class="k">Supplier</span>
            <span class="small">{{ data.summary.supplier }}</span>
          </div>
          <div class="aside-row">
            <span class="k">Annual saving</span>
            <span class="small">{{ eur(data.summary.annualSaving) }}</span>
          </div>
          <p v-if="data.summary.viaDiscovery" class="tiny muted">
            Reached through supplier discovery — a producer sitting behind a distributor, not on
            the incumbent list.
          </p>
        </div>
      </div>
    </template>

    <div v-if="data?.redacted" class="banner">
      <div class="banner-head warn">
        <span class="row" style="gap: 6px">
          <AppIcon name="eyeOff" :size="14" /> Supplier and pricing detail withheld
        </span>
      </div>
      <div class="banner-body">
        <p class="small muted">
          {{ data.engagement.responded }} of {{ data.engagement.approached }} suppliers responded
          within {{ data.engagement.window }}. Names and prices are procurement's to see — the
          server returns no quote rows for your role.
        </p>
      </div>
    </div>

    <template v-else>
      <p class="tiny faint" style="margin-bottom: 8px">Ellie</p>
      <p class="lede" style="margin-bottom: 14px">
        {{ data?.engagement.responded }} of {{ data?.engagement.approached }} suppliers quoted
        inside {{ data?.engagement.window }}. Offers are re-based onto
        {{ data?.standardPaymentDays }}-day terms before comparison, so a cheaper price that
        demands earlier payment does not win on paper alone.
      </p>

      <div v-if="events.length" class="card" style="margin-bottom: 12px">
        <div class="between">
          <h2>Live session</h2>
          <span v-if="streaming" class="chip green"><span class="dot" /> streaming</span>
        </div>
        <div class="stack" style="margin-top: 10px; gap: 5px">
          <p v-for="(e, i) in events" :key="i" class="small row" style="gap: 7px">
            <AppIcon :name="iconFor(e.kind)" :size="13" />
            <span :class="e.kind === 'guardrail' ? '' : 'muted'">{{ e.message }}</span>
          </p>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th class="num">Quoted</th>
              <th class="num">Terms</th>
              <th class="num">True cost</th>
              <th class="num">vs baseline</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="quote in data?.quotes" :key="quote.id" :class="{ out: quote.disqualified }">
              <td>
                <div class="row" style="gap: 5px">
                  <span>{{ quote.supplier }}</span>
                  <span v-if="quote.incumbent" class="chip">incumbent</span>
                  <span v-if="quote.viaDiscovery" class="chip blue">discovered</span>
                </div>
                <p v-if="quote.disqualified" class="tiny" style="color: var(--amber)">
                  {{ quote.disqualified }}
                </p>
              </td>
              <td class="num">€{{ quote.unitPrice.toFixed(3) }}</td>
              <td class="num">NET{{ quote.paymentDays }}</td>
              <td class="num strong">€{{ quote.trueUnitCost.toFixed(3) }}</td>
              <td class="num" :class="quote.savingPct > 0 ? 'good' : 'bad'">
                {{ quote.savingPct > 0 ? '−' : '+' }}{{ Math.abs(quote.savingPct).toFixed(1) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="tiny faint" style="margin-top: 10px">
        Baseline €{{ data?.baseline?.unitPrice.toFixed(2) }}/unit over
        {{ data?.baseline?.annualUnits.toLocaleString() }} units. Disqualified offers sort last.
      </p>

      <div v-if="data?.summary" class="banner" style="margin-top: 14px">
        <div class="banner-head">
          <span class="row" style="gap: 6px">
            <AppIcon name="checkCircle" :size="14" />
            {{ data.summary.savingPct.toFixed(0) }}% under baseline — ready for approval
          </span>
        </div>
        <div class="banner-body">
          <p class="small muted">
            {{ eur(data.summary.annualSaving) }} a year against the incumbent price, on compliant
            certification and standard terms.
          </p>
          <div class="row" style="margin-top: 11px; justify-content: flex-end">
            <NuxtLink to="/approvals" class="btn primary">
              Send to approval <AppIcon name="chevronRight" :size="13" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </PageShell>
</template>

<style scoped>
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

th {
  text-align: left;
  font-weight: 500;
  color: var(--muted);
  font-size: 11px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

tr:last-child td {
  border-bottom: none;
}

.num {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.strong {
  font-weight: 600;
}

.good {
  color: var(--green-dark);
}

.bad {
  color: var(--red);
}

.out {
  opacity: 0.55;
}
</style>
