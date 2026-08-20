<script setup lang="ts">
import type { AgentSession } from '~~/server/platform/types'

const { data, refresh } = await useFetch<{
  canSeeMarketData: boolean
  sessions: AgentSession[]
}>('/api/rfq')

const launching = ref(false)
const launchError = ref('')

async function launch() {
  launching.value = true
  launchError.value = ''
  try {
    await $fetch(`/api/rfq/${data.value?.sessions[0]?.rfqId ?? 'rfq-2411-corrugated'}/launch`, {
      method: 'POST',
    })
    await refresh()
  } catch (e: any) {
    // A requester is refused here by Gateway policy, not by a hidden button.
    launchError.value = e?.data?.statusMessage ?? e?.statusMessage ?? 'Launch refused.'
  } finally {
    launching.value = false
  }
}

const branches = computed(
  () => data.value?.sessions.reduce((sum, s) => sum + s.branches, 0) ?? 0
)
</script>

<template>
  <PageShell
    title="Corrugated packaging — Round 1"
    subtitle="Today"
    timestamp="Long-running Agent Runtime sessions"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="refresh" :size="11" /> Round</div>
          <span class="chip blue">ROUND 1</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="activity" :size="11" /> Status</div>
          <span class="chip green"><span class="dot" /> IN PROGRESS</span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/rfq" class="context-link">
          <AppIcon name="file" :size="14" /> Request
        </NuxtLink>
        <NuxtLink to="/rfq/rfq-2411-corrugated/trace" class="context-link">
          <AppIcon name="brain" :size="14" /> Reasoning trace
        </NuxtLink>
        <NuxtLink to="/fleet" class="context-link">
          <AppIcon name="layers" :size="14" /> Registry
        </NuxtLink>
      </nav>

      <div class="context-actions">
        <button class="context-action" :disabled="launching" @click="launch">
          <AppIcon name="broadcast" :size="14" />
          {{ launching ? 'Starting…' : 'Start another cycle' }}
        </button>
        <NuxtLink to="/savings" class="context-action">
          <AppIcon name="activity" :size="14" /> Savings findings
        </NuxtLink>
      </div>
    </template>

    <template #aside>
      <IdentityPanel />

      <div class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="eye" :size="13" /> Review</span>
        </div>
        <div class="aside-body">
          <div class="aside-row">
            <span class="k"><AppIcon name="globe" :size="13" /> Binding language</span>
            <span class="small">English</span>
          </div>
          <div class="aside-row">
            <span class="k"><AppIcon name="briefcase" :size="13" /> Supplier branches</span>
            <span class="small">{{ branches }}</span>
          </div>
          <div class="aside-row">
            <span class="k"><AppIcon name="users" :size="13" /> Sessions</span>
            <span class="small">{{ data?.sessions.length }}</span>
          </div>
          <NuxtLink
            :to="`/rfq/${data?.sessions[0]?.rfqId ?? ''}`"
            class="btn primary wide"
            style="margin-top: 4px"
          >
            Open comparison <AppIcon name="chevronRight" :size="13" />
          </NuxtLink>
        </div>
      </div>
    </template>

    <p class="tiny faint" style="margin-bottom: 8px">Ellie</p>
    <p class="lede" style="margin-bottom: 14px">
      A sourcing cycle is a session, not a request. One Runtime session fans out to dozens of
      concurrent supplier conversations and survives for weeks — which is why negotiation state
      lives in Memory Bank rather than in a request body.
    </p>

    <div v-if="launchError" class="banner" style="margin-bottom: 12px">
      <div class="banner-head danger">
        <span class="row" style="gap: 6px">
          <AppIcon name="shield" :size="14" /> Refused by Gateway policy
        </span>
      </div>
      <div class="banner-body"><p class="small muted">{{ launchError }}</p></div>
    </div>

    <div class="stack">
      <article v-for="session in data?.sessions" :key="session.id" class="card">
        <div class="between">
          <div>
            <h2>{{ session.rfqId }}</h2>
            <p class="tiny faint" style="margin-top: 3px">
              {{ session.agentId }} · <code>{{ session.id }}</code>
            </p>
          </div>
          <span class="chip" :class="session.state === 'running' ? 'green' : ''">
            <span v-if="session.state === 'running'" class="dot" />
            {{ session.state }}
          </span>
        </div>

        <div class="row" style="margin-top: 11px">
          <span class="chip blue">{{ session.branches }} supplier branches</span>
          <span class="chip">
            started {{ new Date(session.startedAt).toLocaleDateString() }}
          </span>
          <span class="chip">
            updated {{ new Date(session.updatedAt).toLocaleDateString() }}
          </span>
        </div>

        <div class="row" style="margin-top: 12px; justify-content: flex-end">
          <NuxtLink :to="`/rfq/${session.rfqId}/trace`" class="btn">
            <AppIcon name="brain" :size="13" /> Reasoning trace
          </NuxtLink>
          <NuxtLink :to="`/rfq/${session.rfqId}`" class="btn primary">
            Open quotes <AppIcon name="chevronRight" :size="13" />
          </NuxtLink>
        </div>
      </article>
    </div>

  </PageShell>
</template>
