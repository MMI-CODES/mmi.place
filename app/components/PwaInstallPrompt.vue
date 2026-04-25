<script setup lang="ts">
const pwa = computed(() => useNuxtApp().$pwa);
const installing = ref(false);
const dismissed = useState("pwa-install-dismissed", () => false);

const visible = computed(() => {
  return Boolean(pwa.value?.showInstallPrompt && !dismissed.value && !pwa.value?.isPWAInstalled);
});

async function installApp() {
  if (!pwa.value) return;

  installing.value = true;

  try {
    const choice = await pwa.value.install();
    if (choice?.outcome !== "accepted") {
      dismissed.value = true;
    }
  } finally {
    installing.value = false;
  }
}

function hidePrompt() {
  dismissed.value = true;
  pwa.value?.cancelInstall();
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-3xl border border-surface-border bg-surface p-4 shadow-2xl"
  >
    <div class="space-y-1">
      <p class="text-sm font-semibold text-on-surface">Installer MMI Place</p>
      <p class="text-xs text-subtext">
        Ajoute l'app sur ton ecran d'accueil pour un acces plus rapide et une experience plein ecran.
      </p>
    </div>
    <div class="flex shrink-0 gap-2">
      <Button
        :label="installing ? 'Installation...' : 'Installer'"
        btnStyle="PRIMARY"
        :handler="installApp"
      />
      <Button
        label="Plus tard"
        btnStyle="NEUTRAL"
        :handler="hidePrompt"
      />
    </div>
  </div>
</template>
