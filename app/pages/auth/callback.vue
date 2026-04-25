<script setup lang="ts">
import { handleAuthCallback } from "@mmiplace/mmi-core";

const route = useRoute();
const { refreshSession } = useSession();

onMounted(async () => {
  const result = await handleAuthCallback({
    tokenHash: typeof route.query.token_hash === "string" ? route.query.token_hash : null,
    type: typeof route.query.type === "string" ? route.query.type : null,
  });

  if (result.error) {
    await navigateTo(`/auth/login?error=${encodeURIComponent(result.error.message)}`);
    return;
  }

  await refreshSession();
  await navigateTo("/");
});
</script>

<template>
  <main class="container"><p>Redirection...</p></main>
</template>
