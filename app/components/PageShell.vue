<script setup lang="ts">
/**
 * Three-pane page: context sidebar, canvas, and an optional right rail.
 * Pages fill the panes through named slots.
 */
defineProps<{
  title: string
  subtitle?: string
  timestamp?: string
}>()

const slots = useSlots()
</script>

<template>
  <div class="page" :class="{ 'no-aside': !slots.aside }">
    <aside class="context">
      <div class="context-head">
        <h1>{{ title }}</h1>
        <div v-if="subtitle" class="context-sub">
          <AppIcon name="refresh" :size="11" />
          <span>{{ subtitle }}</span>
        </div>
      </div>
      <slot name="context" />
    </aside>

    <section class="canvas">
      <div class="canvas-top">
        <span>{{ timestamp }}</span>
        <slot name="top" />
      </div>
      <div class="canvas-body">
        <slot />
      </div>
    </section>

    <aside v-if="slots.aside" class="aside">
      <slot name="aside" />
    </aside>
  </div>
</template>
