<script setup lang="ts">
import type { MemoryFact } from '~~/server/platform/types'

const { data, error, refresh } = await useFetch<{ namespace: string; facts: MemoryFact[] }>(
  '/api/fleet/memory'
)

const pending = ref<string | null>(null)
const failure = ref<string | null>(null)

async function forget(fact: MemoryFact) {
  pending.value = fact.id
  failure.value = null
  try {
    await $fetch(`/api/fleet/memory/${fact.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    failure.value = e?.statusMessage ?? 'Could not forget that fact.'
  } finally {
    pending.value = null
  }
}
</script>

<template>
  <PageShell
    title="Memory Bank"
    subtitle="Persistent cross-session context"
    timestamp="What the fleet remembers, and where it came from"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="database" :size="11" /> Facts</div>
          <span class="chip blue">{{ data?.facts.length ?? 0 }} STORED</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="shield" :size="11" /> Scope</div>
          <span class="chip green"><span class="dot" /> TENANT</span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/fleet/memory" class="context-link">
          <AppIcon name="database" :size="14" /> All facts
        </NuxtLink>
        <NuxtLink to="/fleet" class="context-link">
          <AppIcon name="layers" :size="14" /> Registry
        </NuxtLink>
        <NuxtLink to="/security" class="context-link">
          <AppIcon name="shield" :size="14" /> Guardrails
        </NuxtLink>
      </nav>

      <div class="context-actions">
        <button class="context-action" disabled>
          <AppIcon name="plus" :size="14" /> Add a fact manually
        </button>
        <button class="context-action" disabled>
          <AppIcon name="refresh" :size="14" /> Re-learn from intake
        </button>
      </div>
    </template>

    <template #aside>
      <IdentityPanel />

      <div class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="key" :size="13" /> Namespace</span>
        </div>
        <div class="aside-body">
          <div class="aside-row">
            <span class="k">Tenant</span>
            <span class="chip mono">{{ data?.namespace ?? '—' }}</span>
          </div>
          <p class="tiny muted">
            Recall is filtered on the caller's tenant inside the adapter, so crossing an
            organization boundary is impossible rather than merely discouraged.
          </p>
        </div>
      </div>
    </template>

    <div v-if="error" class="banner">
      <div class="banner-head danger">
        <span class="row" style="gap: 6px">
          <AppIcon name="eyeOff" :size="14" /> Blocked — 403
        </span>
      </div>
      <div class="banner-body">
        <p class="small muted">{{ error.statusMessage }}</p>
      </div>
    </div>

    <template v-else>
      <p class="tiny faint" style="margin-bottom: 8px">Ellie</p>
      <p class="lede" style="margin-bottom: 14px">
        Persistent memory is only trustworthy if an operator can read it and remove it. Every fact
        below carries its provenance, and forgetting one writes an audit entry naming the actor.
      </p>

      <div v-if="failure" class="banner" style="margin-bottom: 12px">
        <div class="banner-head danger">
          <span class="row" style="gap: 6px"><AppIcon name="alert" :size="14" /> {{ failure }}</span>
        </div>
      </div>

      <div class="stack">
        <article v-for="fact in data?.facts" :key="fact.id" class="card">
          <div class="between">
            <h3>{{ fact.subject }}</h3>
            <div class="row">
              <span class="chip">{{ fact.category }}</span>
              <span class="chip" :class="fact.confidence === 'high' ? 'green' : 'amber'">
                {{ fact.confidence }}
              </span>
            </div>
          </div>

          <p class="small lede" style="margin-top: 8px">{{ fact.fact }}</p>

          <div class="between" style="margin-top: 11px; align-items: center">
            <p class="tiny faint" style="max-width: 60ch">
              {{ fact.provenance }} · learned
              {{ new Date(fact.learnedAt).toLocaleDateString() }}
            </p>
            <button class="btn" :disabled="pending === fact.id" @click="forget(fact)">
              <AppIcon name="trash" :size="13" />
              {{ pending === fact.id ? 'Forgetting…' : 'Forget' }}
            </button>
          </div>
        </article>
      </div>

      <p v-if="data && !data.facts.length" class="card small muted">
        Nothing remembered in this namespace. Ellie relearns from the next intake conversation.
      </p>
    </template>
  </PageShell>
</template>
