// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ["~/assets/css/main.css"],

  modules: ["@nuxtjs/tailwindcss"],

  app: {
    head: {
      title: "Excel Invoice Pro — Nuxt",
      meta: [
        { name: "description", content: "Turn Excel (.xlsx) into a ZIP of professional PDF invoices — 100% client-side." },
        { name: "color-scheme", content: "light" }
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" }
      ]
    }
  }
})
