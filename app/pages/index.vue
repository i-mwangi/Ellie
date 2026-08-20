<script setup lang="ts">
const { state } = useSession()
const showReasoning = ref(true)
</script>

<template>
  <PageShell
    title="Fortified fleet"
    subtitle="Today"
    timestamp="Build status"
  >
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="layers" :size="11" /> Step</div>
          <span class="chip blue">1–5 DONE</span>
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
        <NuxtLink to="/savings" class="context-action">
          <AppIcon name="activity" :size="14" /> Run spend analysis
        </NuxtLink>
        <NuxtLink to="/rfq" class="context-action">
          <AppIcon name="flag" :size="14" /> Open sourcing cycle
        </NuxtLink>
      </div>
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
      runs end to end with no cloud access at all — intake, sourcing, savings, and governance
      included.
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
        <h2>What the product does</h2>
        <ul class="bullets small">
          <li>
            <strong>Intake.</strong> A sentence becomes a sourceable RFQ — category questions,
            quick replies, contradiction flags, attachments, and transparent translation.
          </li>
          <li>
            <strong>Savings.</strong> Five detectors over a normalised AP baseline, split into
            quick wins that need no supplier change and findings that need sourcing.
          </li>
          <li>
            <strong>Sourcing.</strong> Quotes re-based onto standard payment terms before
            comparison, with live session progress and a reasoning trace.
          </li>
          <li>
            <strong>Governance.</strong> Authority-matrix routing, mandatory justification on
            exceptions, and a PO drafted only when the final step clears.
          </li>
        </ul>
      </div>

      <div class="card-section">
        <h2>Critical gap</h2>
        <p class="small muted" style="margin-top: 5px">
          One thing stands between this and a live demo:
        </p>
        <div class="inset" style="margin-top: 10px">
          <ul class="bullets small" style="margin: 0">
            <li>
              <strong>No agents, no cloud.</strong> There is no ADK code and no model call
              anywhere — intake's questions are deterministic rules. Every
              <code>createLiveX()</code> throws until the GCP project is confirmed, and components
              flip independently once it is.
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
          <AppIcon name="checkCircle" :size="14" /> Every screen that does not need the cloud is built
        </span>
      </div>
      <div class="banner-body">
        <p class="small muted">
          Intake, savings, sourcing, approvals, registry, reasoning trace, guardrail feed, and
          the memory inspector all work on fixtures. What remains is the agent fleet itself.
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
