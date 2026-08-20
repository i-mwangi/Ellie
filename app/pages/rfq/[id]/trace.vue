<script setup lang="ts">
import type { AgentSession, Trace } from '~~/server/platform/types'

const route = useRoute()
const rfqId = route.params.id as string

const { data, error } = await useFetch<{
  session: AgentSession
  trace: Trace
  redacted: boolean
}>(`/api/rfq/${rfqId}/trace`)

const counts = computed(() => {
  const steps = data.value?.trace.steps ?? []
  return {
    guardrail: steps.filter((s) => s.kind === 'guardrail').length,
    tools: steps.filter((s) => s.kind === 'tool_call' || s.kind === 'sub_agent').length,
    memory: steps.filter((s) => s.kind === 'memory_read').length,
  }
})
</script>

<template>
  <PageShell
    title="Reasoning trace"
    subtitle="Runtime observability"
    :timestamp="`Every step taken on ${rfqId}, and why`"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="brain" :size="11" /> Steps</div>
          <span class="chip blue">{{ data?.trace.steps.length ?? 0 }} LOGGED</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="shield" :size="11" /> Guardrails</div>
          <span class="chip red"><span class="dot" /> {{ counts.guardrail }} HIT</span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/rfq" class="context-link">
          <AppIcon name="file" :size="14" /> Request
        </NuxtLink>
        <NuxtLink :to="`/rfq/${rfqId}/trace`" class="context-link">
          <AppIcon name="brain" :size="14" /> Reasoning trace
        </NuxtLink>
        <NuxtLink to="/security" class="context-link">
          <AppIcon name="shield" :size="14" /> Guardrails
        </NuxtLink>
      </nav>

      <div class="context-actions">
        <a :href="`/api/rfq/${rfqId}/trace?format=csv`" class="context-action">
          <AppIcon name="file" :size="14" /> Export trace
        </a>
      </div>
    </template>

    <template #aside>
      <IdentityPanel />

      <div v-if="data" class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="activity" :size="13" /> Session</span>
          <span class="chip green"><span class="dot" /> {{ data.session.state }}</span>
        </div>
        <div class="aside-body">
          <div class="aside-row">
            <span class="k">Agent</span>
            <span class="small">{{ data.trace.agentId }}</span>
          </div>
          <div class="aside-row">
            <span class="k">Session</span>
            <span class="chip mono">{{ data.session.id }}</span>
          </div>
          <div class="aside-row">
            <span class="k">Branches</span>
            <span class="small">{{ data.session.branches }}</span>
          </div>
          <div class="aside-row">
            <span class="k">Tool calls</span>
            <span class="small">{{ counts.tools }}</span>
          </div>
          <div class="aside-row">
            <span class="k">Memory reads</span>
            <span class="small">{{ counts.memory }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="error" class="banner">
      <div class="banner-head danger">
        <span class="row" style="gap: 6px">
          <AppIcon name="alert" :size="14" /> {{ error.statusCode }}
        </span>
      </div>
      <div class="banner-body">
        <p class="small muted">{{ error.statusMessage }}</p>
      </div>
    </div>

    <template v-else-if="data">
      <p class="tiny faint" style="margin-bottom: 8px">Ellie</p>
      <p class="lede" style="margin-bottom: 14px">
        Rationale is recorded at decision time, not reconstructed afterwards. Steps that touched a
        system of record name the identity they ran under.
      </p>

      <div v-if="data.redacted" class="banner" style="margin-bottom: 16px">
        <div class="banner-head warn">
          <span class="row" style="gap: 6px">
            <AppIcon name="eyeOff" :size="14" /> Redacted for your role
          </span>
        </div>
        <div class="banner-body">
          <p class="small muted">
            Steps touching supplier identity or pricing are withheld. The redaction happens in the
            observability adapter before the response is built, so the full text never reaches this
            browser.
          </p>
        </div>
      </div>

      <ol class="trace-list">
        <TraceStep v-for="step in data.trace.steps" :key="step.id" :step="step" />
      </ol>
    </template>
  </PageShell>
</template>

<style scoped>
.trace-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
