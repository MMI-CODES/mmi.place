<script setup lang="ts">
import { onAuthStateChange } from "@mmiplace/mmi-core";

useHead({
  title: "MMI Place",
  meta: [
    { name: "theme-color", content: "#0f172a" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
  ],
  link: [
    { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    { rel: "apple-touch-icon", href: "/pwa-192x192.png" },
  ],
});

const { refreshSession } = useSession();
const { loadSettings, applySettings } = useSettings();

let removeAuthListener: (() => void) | null = null;

onMounted(async () => {
  await refreshSession();
  await loadSettings();
  applySettings();

  removeAuthListener = onAuthStateChange(async (event) => {
    if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;

    await refreshSession();

    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
      await loadSettings();
      applySettings();
    }
  });
});

onUnmounted(() => {
  removeAuthListener?.();
});
</script>

<template>
  <VitePwaManifest />
  <NuxtLayout>
    <LayoutNavbar />
    <NuxtPage />
  </NuxtLayout>
  <LayoutFooter />
  <PwaInstallPrompt />
  <PwaUpdatePrompt />
</template>
