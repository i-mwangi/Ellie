<script setup lang="ts">
const { state } = useSession()
const showReasoning = ref(true)
</script>

<template>
  <PageShell
    title="Fortified fleet — foundations"
    subtitle="Today"
    timestamp="Build status as of step 4"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="layers" :size="11" /> Step</div>
          <span class="chip blue">1 &amp; 4 DONE</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="activity" :size="11" /> Platform</div>
          <span class="chip green"><span class="dot" /> {{ state?.platformMode }}</span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/" class="context-link">
          <AppIcon name="file" :size="14" /> Overview
        </NuxtLink>
        <NuxtLink to="/fleet" class="context-link">
          <AppIcon name="layers" :size="14" /> Agent Registry
        </NuxtLink>
        <NuxtLink to="/rfq" class="context-link">
          <AppIcon name="briefcase" :size="14" /> Sourcing
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
          <AppIcon name="broadcast" :size="14" /> Run spend analysis
        </button>
        <button class="context-action" disabled>
          <AppIcon name="flag" :size="14" /> Launch sourcing cycle
        </button>
      </div>
    </template>

    <template #top>
      <button class="btn ghost"><AppIcon name="globe" :size="13" /> Language</button>
    </template>

    <template #aside>
      <IdentityPanel />

      <div class="aside-card">
        <div class="aside-head">
          <span class="label"><AppIcon name="layers" :size="13" /> Platform binding</span>
        </div>
        <div class="aside-body">
          <div class="aside-row">
            <span class="k">Mode</span>
            <span class="chip mono">{{ state?.platformMode }}</span>
          </div>
          <div class="aside-row">
            <span class="k">Tenant</span>
            <span class="chip mono">{{ state?.session.tenantId }}</span>
          </div>
          <p class="tiny faint" style="margin-top: 2px">
            Set <code>ELLIE_PLATFORM_MODE=live</code> once the GCP project is confirmed. Components
            flip one at a time.
          </p>
        </div>
      </div>
    </template>

    <div class="row tiny muted" style="margin-bottom: 14px">
      <AppIcon name="file" :size="13" />
      <span>docs/IMPLEMENTATION-PLAN.md processed and used to structure this build</span>
    </div>

    <p class="tiny faint" style="margin-bottom: 10px">Ellie</p>

    <button
      class="btn ghost tiny"
      style="padding: 2px 6px; margin-bottom: 12px"
      @click="showReasoning = !showReasoning"
    >
      <AppIcon :name="showReasoning ? 'chevronDown' : 'chevronRight'" :size="12" />
      <AppIcon name="checkCircle" :size="12" /> Reasoning
    </button>

    <p v-if="showReasoning" class="lede" style="margin-bottom: 14px">
      The platform layer is structured around the seven Gemini Enterprise Agent Platform
      components. Every one sits behind an interface with a fixture implementation, so the product
      runs end to end with no cloud access at all.
    </p>

    <div class="card" style="padding: 0">
      <div class="card-section">
        <h2>What is wired</h2>
        <ul class="bullets small">
          <li>
            <strong>Agent Registry.</strong> Discovery with versions, owners, declared tools, and a
            data-handling policy on every card.
          </li>
          <li>
            <strong>Agent Gateway.</strong> Six policies on the invocation path — including the
            budget, vetting, and contract checks that would otherwise be application code.
          </li>
          <li>
            <strong>Agent Identity.</strong> Short-lived credentials, tenant-bound, refused for any
            scope an agent did not declare.
          </li>
          <li>
            <strong>Memory Bank, Model Armor, Observability, Runtime.</strong> Namespaced recall,
            injection and PII screening, reasoning traces, and long-running sessions.
          </li>
        </ul>
      </div>

      <div class="card-section">
        <h2>Critical gaps</h2>
        <p class="small muted" style="margin-top: 5px">
          Two things stand between this and a live demo:
        </p>
        <div class="inset" style="margin-top: 10px">
          <ul class="bullets small" style="margin: 0">
            <li>
              <strong>Agents.</strong> No ADK code yet. Intake and the sourcing spine are steps 2
              and 3.
            </li>
            <li>
              <strong>Cloud access.</strong> Every <code>createLiveX()</code> throws until the GCP
              project is confirmed. Components flip independently.
            </li>
          </ul>
        </div>
      </div>
    </div>

    <p class="small muted" style="margin: 14px 0 4px">
      Role separation is live — switch role in the right panel and watch supplier data and the
      guardrail feed disappear.
    </p>
    <p class="tiny faint" style="margin-bottom: 18px">Now</p>

    <div class="banner">
      <div class="banner-head">
        <span class="row" style="gap: 6px">
          <AppIcon name="checkCircle" :size="14" /> Foundations and fortification screens are ready
        </span>
      </div>
      <div class="banner-body">
        <p class="small muted">
          Registry, reasoning trace, guardrail feed, and memory inspector all work on fixtures.
          Steps 2, 3, and 5 add intake, live sourcing, and governance.
        </p>
        <div class="row" style="margin-top: 11px; justify-content: flex-end">
          <NuxtLink to="/fleet" class="btn">Open registry</NuxtLink>
          <NuxtLink to="/security" class="btn primary">
            Guardrails <AppIcon name="chevronRight" :size="13" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </PageShell>
</template>
