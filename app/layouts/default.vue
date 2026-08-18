<script setup lang="ts">
const { state, load } = useSession()
await load()

const initials = computed(() => {
  const name = state.value?.session.displayName ?? ''
  const [first, last] = name.split(' ')
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
})
</script>

<template>
  <div class="app">
    <nav class="rail">
      <NuxtLink to="/" class="rail-logo" style="color: var(--accent)">
        <AppLogo :size="24" />
      </NuxtLink>

      <NuxtLink to="/intake" class="rail-icon" title="Intake">
        <AppIcon name="inbox" :size="17" />
      </NuxtLink>
      <NuxtLink to="/rfq" class="rail-icon" title="Sourcing">
        <AppIcon name="briefcase" :size="17" />
      </NuxtLink>
      <NuxtLink to="/savings" class="rail-icon" title="Savings">
        <AppIcon name="activity" :size="17" />
      </NuxtLink>
      <NuxtLink to="/approvals" class="rail-icon" title="Approvals">
        <AppIcon name="clipboard" :size="17" />
      </NuxtLink>

      <span class="rail-sep" />

      <NuxtLink to="/fleet" class="rail-icon" title="Agent Registry">
        <AppIcon name="layers" :size="17" />
      </NuxtLink>
      <NuxtLink to="/fleet/memory" class="rail-icon" title="Memory Bank">
        <AppIcon name="database" :size="17" />
      </NuxtLink>
      <NuxtLink to="/security" class="rail-icon" title="Guardrails">
        <AppIcon name="shield" :size="17" />
      </NuxtLink>

      <span class="rail-avatar">{{ initials }}</span>
    </nav>

    <slot />
  </div>
</template>
