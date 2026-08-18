<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 24 })

// Twelve-point starburst, thinning toward the diagonals.
const spokes = Array.from({ length: 12 }, (_, i) => i * 30)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-label="Ellie"
    role="img"
  >
    <g transform="translate(12 12)">
      <path
        v-for="(angle, i) in spokes"
        :key="angle"
        :transform="`rotate(${angle})`"
        :d="i % 3 === 0 ? 'M0 -10.5 L1.5 -2 L0 0 L-1.5 -2 Z' : 'M0 -7.6 L1 -1.8 L0 0 L-1 -1.8 Z'"
        fill="currentColor"
      />
      <circle r="1.9" fill="currentColor" />
    </g>
  </svg>
</template>
