<script setup lang="ts">
import type { AgentDescriptor } from '~~/server/platform/types'

const { data } = await useFetch<{ mode: string; agents: AgentDescriptor[] }>('/api/fleet/agents')

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
        <button class="context-action" disabled>
          <AppIcon name="plus" :size="14" /> Publish new version
        </button>
        <button class="context-action" disabled>
          <AppIcon name="refresh" :size="14" /> Sync from Agent Engine
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

        <p v-if="agent.hiredFor.length" class="tiny faint" style="margin-top: 9px">
          Hired for {{ agent.hiredFor.join(', ') }}
        </p>
      </article>
    </div>
  </PageShell>
</template>
