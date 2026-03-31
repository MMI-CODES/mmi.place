// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	css: ["./app/assets/css/main.css"],
	modules: ["motion-v/nuxt", "@vite-pwa/nuxt", "@nuxt/content"],
	runtimeConfig: {
		authSessionSecret: process.env.AUTHENTIK_SESSION_SECRET,
		authentik: {
			baseUrl: process.env.AUTHENTIK_ISSUER,
			clientId: process.env.AUTHENTIK_CLIENT_ID,
			clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
			redirectUri: process.env.AUTHENTIK_REDIRECT_URI,
		},
	},
	vite: {
		plugins: [tailwindcss()],
	},
	content: {
		experimental: { nativeSqlite: true },
	},
	app: {
		head: {
			link: [
				{
					rel: "apple-touch-icon",
					href: "/icons/apple-touch-icon-180x180.png",
					sizes: "180x180",
				},
			],
			meta: [
				{ name: "apple-mobile-web-app-capable", content: "yes" },
				{
					name: "apple-mobile-web-app-status-bar-style",
					content: "black-translucent",
				},
			],
		},
	},
	pwa: {
		registerType: "autoUpdate",
		includeAssets: [
			"favicon.ico",
			"robots.txt",
			"icons/apple-touch-icon-180x180.png",
		],
		workbox: {
			globPatterns: [],
			navigateFallback: null,
			// Clean old caches on activate
			cleanupOutdatedCaches: true,
			// Skip waiting so the new SW takes over immediately
			skipWaiting: true,
			clientsClaim: true,
			// Runtime caching for API calls
			runtimeCaching: [
				{
					urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
					handler: "CacheFirst",
					options: {
						cacheName: "google-fonts",
						expiration: {
							maxEntries: 30,
							maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
						},
					},
				},
				{
					urlPattern: /\/api\//,
					handler: "NetworkFirst",
					options: {
						cacheName: "api-cache",
						expiration: {
							maxEntries: 50,
							maxAgeSeconds: 60 * 5, // 5 minutes
						},
						networkTimeoutSeconds: 10,
					},
				},
			],
		},
		manifest: {
			id: "/",
			name: "MMI Place",
			short_name: "MMI Place",
			description:
				"Portail étudiant MMI — outils, planning, annonces et ressources",
			start_url: "/",
			scope: "/",
			display: "standalone",
			orientation: "portrait-primary",
			background_color: "#0f172a",
			theme_color: "#c2cce3",
			categories: ["education", "productivity"],
			icons: [
				{
					src: "/icons/icon-192x192.png",
					sizes: "192x192",
					type: "image/png",
				},
				{
					src: "/icons/icon-512x512.png",
					sizes: "512x512",
					type: "image/png",
				},
				{
					src: "/icons/icon-512x512.png",
					sizes: "512x512",
					type: "image/png",
					purpose: "maskable",
				},
			],
		},
		client: {
			installPrompt: true,
			periodicSyncForUpdates: 3600, // Check for updates every hour
		},
		devOptions: {
			enabled: true,
			type: "module",
			suppressWarnings: true,
		},
	},
});
