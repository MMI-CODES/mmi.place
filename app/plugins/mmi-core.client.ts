import { initMmiCore } from "@mmiplace/mmi-core";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const url = config.public.supabaseUrl;
  const anonKey = config.public.supabaseAnonKey;

  if (url && anonKey) {
    initMmiCore({ url, anonKey });
    console.log("MMI Core initialized successfully");
  } else {
    console.warn("MMI Core initialization skipped: Missing URL or Anon Key");
  }
});
