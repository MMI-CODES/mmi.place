<script setup lang="ts">
import { motion } from "motion-v";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
const { settings } = useSettings();
const group = computed(() => settings.value.widgets.planup.group);
</script>
<template>
  <motion.div
    class="flex flex-col items-center justify-center gap-4 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-3xl shadow-2xl shadow-black/5 h-full px-7 py-6 w-full text-center"
    :initial="{ opacity: 0, scale: 0.9 }"
    :animate="{ opacity: 1, scale: 1 }"
    :transition="{ duration: 0.3 }"
  >
    <div class="flex items-center justify-center bg-primary/10 text-primary w-16 h-16 rounded-2xl border border-primary/20 mb-2">
      <CheckCircleIcon class="w-10 h-10" />
    </div>
    <h3 class="text-2xl font-bold">PlanUP</h3>
    <p class="text-subtext">Le widget des tâches est en cours de développement.</p>
    <p class="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">{{ group || "Aucun groupe" }}</p>
  </motion.div>
</template>
