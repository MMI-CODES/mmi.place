import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  ssr: false,
  devtools: { enabled: true },
  modules: ["motion-v/nuxt", "@vite-pwa/nuxt"],
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.VITE_SUPABASE_URL || "",
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || "",
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      title: "MMI Place",
      link: [
        {
          rel: "apple-touch-icon",
          href: "/pwa-192x192.png",
        },
      ],
      meta: [
        {
          name: "description",
          content: "MMI Place frontend app using mmi-core SDK",
        },
        { name: "theme-color", content: "#0f172a" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      ],
    },
  },
  pwa: {
    registerType: "autoUpdate",
    includeAssets: ["favicon.ico", "icon.png", "icon.svg", "pwa-192x192.png", "pwa-512x512.png"],
    manifest: {
      id: "/",
      name: "MMI Place",
      short_name: "MMI Place",
      description: "La plateforme communautaire pour les étudiants MMI.",
      theme_color: "#0f172a",
      background_color: "#0f172a",
      display: "standalone",
      orientation: "portrait-primary",
      scope: "/",
      start_url: "/",
      categories: ["education", "productivity"],
      icons: [
        {
          src: "/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true,
      disableDevLogs: true,
      runtimeCaching: [
        {
          urlPattern: /\/rest\/v1\//,
          handler: "NetworkOnly",
          method: "GET",
        },
        {
          urlPattern: /\/auth\/v1\//,
          handler: "NetworkOnly",
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: true,
      type: "module",
      suppressWarnings: true,
    },
  },
});
