<script setup lang="ts">
interface Step {
  index: number
  approvers: string[]
  state: 'pending' | 'approved' | 'rejected'
  decidedBy?: string
  decidedAt?: string
  reason?: string
}

interface Request {
  id: string
  rfqId: string
  title: string
  category: string
  amount: number | null
  supplier: string
  exception: string | null
  state: 'pending' | 'approved' | 'rejected'
  steps: Step[]
  poNumber?: string
  routing: { band: string; upTo: number | null; approvers: string[][] }
  waitingOn: string[]
}

const { data, refresh } = await useFetch<{
  requests: Request[]
  matrix: Array<{ id: string; category: string; upTo: number | null; approvers: string[][] }>
  canApprove: boolean
}>('/api/approvals')

const reasons = ref<Record<string, string>>({})
const errors = ref<Record<string, string>>({})
const busy = ref<string | null>(null)

async function decide(request: Request, decision: 'approve' | 'reject') {
  busy.value = request.id
  errors.value[request.id] = ''
  try {
    await $fetch(`/api/approvals/${request.id}/decide`, {
      method: 'POST',
      body: { decision, reason: reasons.value[request.id] ?? '' },
    })
    reasons.value[request.id] = ''
    await refresh()
  } catch (e: any) {
    errors.value[request.id] = e?.statusMessage ?? 'Could not record that decision.'
  } finally {
    busy.value = null
  }
}

const eur = (value: number | null) =>
  value === null
    ? 'withheld'
    : new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(value)

const pending = computed(() => data.value?.requests.filter((r) => r.state === 'pending').length ?? 0)
</script>

<template>
  <PageShell
    title="Approvals"
    subtitle="Authority matrix and audit"
    timestamp="Routing derived from amount and category"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="clipboard" :size="11" /> Queue</div>
          <span class="chip blue">{{ pending }} PENDING</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="key" :size="11" /> You</div>
          <span class="chip" :class="data?.canApprove ? 'green' : 'amber'">
            {{ data?.canApprove ? 'CAN APPROVE' : 'READ ONLY' }}
          </span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/approvals" class="context-link">
          <AppIcon name="clipboard" :size="14" /> Queue
        </NuxtLink>
        <NuxtLink to="/rfq" class="context-link">
          <AppIcon name="briefcase" :size="14" /> Sourcing
        </NuxtLink>
        <NuxtLink to="/security" class="context-link">
          <AppIcon name="shield" :size="14" /> Guardrails
        </NuxtLink>
      </nav>

      <div class="context-actions">
        <NuxtLink to="/approvals/workflow" class="context-action">
          <AppIcon name="layers" :size="14" /> Authority matrix
        </NuxtLink>
      </div>
    </template>

    <template #aside>
      <IdentityPanel />

      <div class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="layers" :size="13" /> Authority matrix</span>
        </div>
        <div class="aside-body">
          <div v-for="band in data?.matrix" :key="band.id">
            <p class="tiny" style="font-weight: 500">
              {{ band.upTo ? `up to ${eur(band.upTo)}` : 'above all bands' }}
            </p>
            <p class="tiny faint">
              {{ band.approvers.map((a) => a.join(' + ')).join(' → ') }}
            </p>
          </div>
          <p class="tiny muted">Parallel approvers share a step; sequential steps run in order.</p>
        </div>
      </div>
    </template>

    <p class="tiny faint" style="margin-bottom: 8px">Ellie</p>
    <p class="lede" style="margin-bottom: 14px">
      Approvals route by amount and category against the matrix, not by hand. Rejections and any
      decision on an exception require a written justification, and the purchase order is drafted
      only once the final step clears.
    </p>

    <div class="stack">
      <article v-for="request in data?.requests" :key="request.id" class="card">
        <div class="between">
          <div style="min-width: 0">
            <h2>{{ request.title }}</h2>
            <p class="tiny faint" style="margin-top: 3px">
              <code>{{ request.rfqId }}</code> · {{ request.supplier }} ·
              {{ eur(request.amount) }}
            </p>
          </div>
          <span
            class="chip"
            :class="
              request.state === 'approved' ? 'green' : request.state === 'rejected' ? 'red' : 'amber'
            "
          >
            {{ request.state }}
          </span>
        </div>

        <div v-if="request.exception" class="inset" style="margin-top: 11px">
          <p class="tiny">
            <strong style="color: var(--amber)">Exception.</strong>
            <span class="muted"> {{ request.exception }}</span>
          </p>
        </div>

        <div class="steps">
          <div v-for="step in request.steps" :key="step.index" class="step-row">
            <span
              class="chip"
              :class="
                step.state === 'approved' ? 'green' : step.state === 'rejected' ? 'red' : ''
              "
            >
              {{ step.state }}
            </span>
            <div style="min-width: 0">
              <p class="small">{{ step.approvers.join(' + ') }}</p>
              <p v-if="step.decidedBy" class="tiny faint">
                {{ step.decidedBy }} ·
                {{ step.decidedAt ? new Date(step.decidedAt).toLocaleDateString() : '' }}
                <template v-if="step.reason"> — “{{ step.reason }}”</template>
              </p>
            </div>
          </div>
        </div>

        <p v-if="request.poNumber" class="row" style="margin-top: 11px; gap: 6px">
          <AppIcon name="checkCircle" :size="14" style="color: var(--green)" />
          <span class="small">
            Purchase order <code>{{ request.poNumber }}</code> drafted for ERP sync.
          </span>
        </p>

        <template v-if="request.state === 'pending' && data?.canApprove">
          <input
            v-model="reasons[request.id]"
            type="text"
            :placeholder="
              request.exception
                ? 'Justification required — this request carries an exception'
                : 'Reason (required to reject)'
            "
            style="margin-top: 12px"
          />

          <p v-if="errors[request.id]" class="tiny" style="color: var(--red); margin-top: 6px">
            {{ errors[request.id] }}
          </p>

          <div class="row" style="margin-top: 10px; justify-content: flex-end">
            <button class="btn" :disabled="busy === request.id" @click="decide(request, 'reject')">
              Reject
            </button>
            <button
              class="btn primary"
              :disabled="busy === request.id"
              @click="decide(request, 'approve')"
            >
              Approve <AppIcon name="check" :size="13" />
            </button>
          </div>
        </template>

        <p v-else-if="request.state === 'pending'" class="tiny faint" style="margin-top: 11px">
          Waiting on {{ request.waitingOn.join(' or ') }}. Switch to the approver role to decide.
        </p>
      </article>
    </div>
  </PageShell>
</template>

<style scoped>
.steps {
  margin-top: 12px;
  border-top: 1px solid var(--border);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-row {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 10px;
  align-items: baseline;
}
</style>
