<script setup lang="ts">
import type { AgentDescriptor } from '~~/server/platform/types'

const { data, refresh } = await useFetch<{ mode: string; agents: AgentDescriptor[] }>(
  '/api/fleet/agents'
)

const CATEGORIES = ['packaging', 'facilities', 'mro', 'logistics']
const hiring = ref<string | null>(null)
const pick = ref<Record<string, string>>({})
const error = ref('')

async function hire(agent: AgentDescriptor) {
  hiring.value = agent.id
  error.value = ''
  try {
    await $fetch('/api/fleet/hire', {
      method: 'POST',
      body: { agentId: agent.id, category: pick.value[agent.id] ?? CATEGORIES[0] },
    })
    await refresh()
  } catch (e: any) {
    error.value = e?.statusMessage ?? 'Could not hire that agent.'
  } finally {
    hiring.value = null
  }
}

const hired = computed(() => data.value?.agents.filter((a) => a.status === 'hired').length ?? 0)
</script>

<template>
  <PageShell
    title="Agent Registry"
    subtitle="Discovery and versioning"
    timestamp="Published agents in this organization"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="layers" :size="11" /> Agents</div>
          <span class="chip blue">{{ data?.agents.length }} PUBLISHED</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="check" :size="11" /> Hired</div>
          <span class="chip green"><span class="dot" /> {{ hired }} ACTIVE</span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/fleet" class="context-link">
          <AppIcon name="layers" :size="14" /> Registry
        </NuxtLink>
        <NuxtLink to="/fleet/memory" class="context-link">
          <AppIcon name="database" :size="14" /> Memory Bank
        </NuxtLink>
        <NuxtLink to="/security" class="context-link">
          <AppIcon name="shield" :size="14" /> Guardrails
        </NuxtLink>
      </nav>

      <div class="context-actions">
        <button class="context-action" disabled title="Requires the GCP project">
          <AppIcon name="plus" :size="14" /> Publish new version
          <span class="why">CLOUD</span>
        </button>
        <button class="context-action" disabled title="Requires the GCP project">
          <AppIcon name="refresh" :size="14" /> Sync from Agent Engine
          <span class="why">CLOUD</span>
        </button>
      </div>
    </template>

    <template #aside>
      <IdentityPanel />

      <div class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="key" :size="13" /> Why this matters</span>
        </div>
        <div class="aside-body">
          <p class="tiny muted">
            An organization decides whether to trust an agent from what it declares here. Anything
            outside the declared tool set is refused by the Gateway at invocation time, so this
            page is a contract, not a description.
          </p>
        </div>
      </div>
    </template>

    <p v-if="error" class="card small" style="color: var(--red); margin-bottom: 10px">
      {{ error }}
    </p>

    <div class="stack">
      <article v-for="agent in data?.agents" :key="agent.id" class="card">
        <div class="between">
          <div style="min-width: 0">
            <h2>{{ agent.name }}</h2>
            <p class="tiny faint" style="margin-top: 3px">
              <code>{{ agent.id }}</code> · v{{ agent.version }} · {{ agent.owner }}
            </p>
          </div>
          <span class="chip" :class="agent.status === 'hired' ? 'green' : 'blue'">
            {{ agent.status }}
          </span>
        </div>

        <p class="small lede" style="margin-top: 9px">{{ agent.summary }}</p>

        <div class="row" style="margin-top: 11px">
          <span class="tiny faint" style="width: 46px">tools</span>
          <span v-for="tool in agent.tools" :key="tool" class="chip mono">{{ tool }}</span>
        </div>

        <div class="row" style="margin-top: 5px">
          <span class="tiny faint" style="width: 46px">scopes</span>
          <span v-for="scope in agent.scopes" :key="scope" class="chip blue mono">
            {{ scope }}
          </span>
        </div>

        <div class="inset" style="margin-top: 11px">
          <p class="tiny">
            <strong>Data handling.</strong>
            <span class="muted">{{ agent.dataHandling }}</span>
          </p>
        </div>

        <div class="between" style="margin-top: 11px; align-items: center">
          <p class="tiny faint">
            {{ agent.hiredFor.length ? `Hired for ${agent.hiredFor.join(', ')}` : 'Not hired yet' }}
          </p>
          <div class="row" style="gap: 6px; flex-wrap: nowrap">
            <select
              :value="pick[agent.id] ?? CATEGORIES[0]"
              style="width: auto"
              @change="pick[agent.id] = ($event.target as HTMLSelectElement).value"
            >
              <option v-for="category in CATEGORIES" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            <button class="btn primary" :disabled="hiring === agent.id" @click="hire(agent)">
              {{ hiring === agent.id ? 'Hiring…' : 'Hire' }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </PageShell>
</template>
