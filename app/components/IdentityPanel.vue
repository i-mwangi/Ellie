<script setup lang="ts">
import type { Role } from '~~/server/platform/types'
import { ROLES } from '~~/server/utils/roles'

const { state, setRole } = useSession()

const initials = computed(() => {
  const [first, last] = (state.value?.session.displayName ?? '').split(' ')
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
})

const name = computed(() => state.value?.session.displayName.split(' · ')[0])
const unit = computed(() => state.value?.session.displayName.split(' · ')[1])

async function onRole(event: Event) {
  await setRole((event.target as HTMLSelectElement).value as Role)
}
</script>

<template>
  <div class="aside-card">
    <div class="aside-head">
      <span class="label">
        <AppIcon name="users" :size="13" />
        Acting as
      </span>
      <span class="chip" :class="state?.can.marketData ? 'green' : 'amber'">
        {{ state?.session.role }}
      </span>
    </div>

    <div class="aside-body">
      <div class="row" style="gap: 8px">
        <span class="avatar">{{ initials }}</span>
        <div style="min-width: 0">
          <p class="small" style="font-weight: 500">{{ name }}</p>
          <p class="tiny faint">{{ unit }}</p>
        </div>
      </div>

      <select :value="state?.session.role" @change="onRole">
        <option v-for="role in ROLES" :key="role" :value="role">{{ role }}</option>
      </select>

      <div class="divider" />

      <div class="aside-row">
        <span class="k"><AppIcon name="eye" :size="13" /> Supplier &amp; pricing</span>
        <span class="chip" :class="state?.can.marketData ? 'green' : 'red'">
          {{ state?.can.marketData ? 'visible' : 'hidden' }}
        </span>
      </div>
      <div class="aside-row">
        <span class="k"><AppIcon name="shield" :size="13" /> Guardrail feed</span>
        <span class="chip" :class="state?.can.securityEvents ? 'green' : 'red'">
          {{ state?.can.securityEvents ? 'visible' : 'hidden' }}
        </span>
      </div>
      <div class="aside-row">
        <span class="k"><AppIcon name="key" :size="13" /> Fleet admin</span>
        <span class="chip" :class="state?.can.manageFleet ? 'green' : 'red'">
          {{ state?.can.manageFleet ? 'yes' : 'no' }}
        </span>
      </div>
    </div>
  </div>
</template>
