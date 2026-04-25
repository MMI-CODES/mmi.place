<script setup lang="ts">
const pwa = computed(() => useNuxtApp().$pwa);

async function refreshApp() {
  if (!pwa.value) return;
  await pwa.value.updateServiceWorker();
}

function closePrompt() {
  if (!pwa.value) return;
  pwa.value.needRefresh = false;
}
</script>

<template>
  <div
    v-if="pwa?.needRefresh"
    class="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-3xl border border-surface-border bg-surface p-4 shadow-2xl"
  >
    <div class="space-y-1">
      <p class="text-sm font-semibold text-on-surface">Nouvelle version disponible</p>
      <p class="text-xs text-subtext">
        Une mise a jour est prete. Recharge l'application pour recuperer la derniere version.
      </p>
    </div>
    <div class="flex shrink-0 gap-2">
      <Button label="Mettre a jour" btnStyle="PRIMARY" :handler="refreshApp" />
      <Button label="Plus tard" btnStyle="NEUTRAL" :handler="closePrompt" />
    </div>
  </div>
</template>
