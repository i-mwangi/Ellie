// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Flip to 'live' once GCP project access is confirmed. Components can be
    // bound independently — see docs/IMPLEMENTATION-PLAN.md sections 1 and 9.
    platformMode: process.env.ELLIE_PLATFORM_MODE ?? 'fixture',
    gcpProject: process.env.ELLIE_GCP_PROJECT ?? '',
    gcpLocation: process.env.ELLIE_GCP_LOCATION ?? 'us-central1',
  },

  typescript: {
    typeCheck: false,
  },
})
