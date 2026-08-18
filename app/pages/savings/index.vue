<template>
  <PageShell title="Savings" subtitle="True-cost baselines and detectors" timestamp="Not yet implemented">
    <template #context>
      <div class="context-meta">
        <div>
          <div class="meta-label"><AppIcon name="activity" :size="11" /> Step</div>
          <span class="chip blue">STEP 3</span>
        </div>
        <div>
          <div class="meta-label"><AppIcon name="activity" :size="11" /> Status</div>
          <span class="chip amber">PLANNED</span>
        </div>
      </div>

      <nav class="context-nav">
        <NuxtLink to="/" class="context-link">
          <AppIcon name="file" :size="14" /> Overview
        </NuxtLink>
        <NuxtLink to="/fleet" class="context-link">
          <AppIcon name="layers" :size="14" /> Registry
        </NuxtLink>
        <NuxtLink to="/security" class="context-link">
          <AppIcon name="shield" :size="14" /> Guardrails
        </NuxtLink>
      </nav>
    </template>

    <template #aside>
      <IdentityPanel />
    </template>

    <p class="tiny faint" style="margin-bottom: 8px">Ellie</p>
    <p class="lede" style="margin-bottom: 14px">Five detectors over the AP baseline: price harmonization, payment terms, incumbent drift, off-contract spend, consolidation.</p>

    <div class="banner">
      <div class="banner-head warn">
        <span class="row" style="gap: 6px">
          <AppIcon name="alert" :size="14" /> Build step 3 — not yet implemented
        </span>
      </div>
      <div class="banner-body">
        <p class="small muted">
          The platform adapters this screen will use are already in place under
          <code>server/platform/</code>, so this page is wiring rather than new infrastructure.
        </p>
      </div>
    </div>
  </PageShell>
</template>
