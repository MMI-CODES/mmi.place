<script setup lang="ts">
import { motion } from "motion-v";
import { BookmarkIcon } from "@heroicons/vue/24/outline";
import { BookmarkIcon as BookmarkIconSolid } from "@heroicons/vue/24/solid";

import type { Tool } from "~/composables/useTools";

const props = defineProps<{ tool: Tool }>();
const { settings, saveSettings } = useSettings();

const categoryLabel = computed(() => {
  switch (props.tool.category) {
    case "OFFICIAL":
      return "Officiel";
    case "STUDENTS":
      return "Etudiant";
    case "RESOURCE":
      return "Ressource";
    default:
      return "";
  }
});

const isPinned = computed(() => {
  if (!settings.value.customization.pinnedTools) settings.value.customization.pinnedTools = [];
  return settings.value.customization.pinnedTools.includes(props.tool.id);
});

const togglePinned = () => {
  if (!settings.value.customization.pinnedTools) settings.value.customization.pinnedTools = [];
  const idx = settings.value.customization.pinnedTools.indexOf(props.tool.id);
  if (idx >= 0) settings.value.customization.pinnedTools.splice(idx, 1);
  else settings.value.customization.pinnedTools.push(props.tool.id);
  void saveSettings();
};

const openTool = () => window.open(props.tool.url, "_blank");

const handleCardClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest("[data-no-open='true']")) return;
  openTool();
};
</script>

<template>
  <motion.article class="relative flex flex-col gap-3 bg-surface/95 backdrop-blur-xl hover:bg-surface-hover/90 text-on-surface border border-surface-border rounded-3xl shadow-2xl shadow-black/8 px-6 py-5 cursor-pointer group overflow-hidden" :initial="{ opacity: 0, scale: 0.94 }" :animate="{ opacity: 1, scale: 1 }" :whileHover="{ y: -5 }" :transition="{ duration: 0.25 }" @click="handleCardClick">
    <button
      type="button"
      data-no-open="true"
      class="absolute top-4 right-4 p-2 rounded-full transition-all z-30 pointer-events-auto"
      :class="isPinned ? 'text-primary bg-primary/12' : 'text-subtext/60 hover:text-primary hover:bg-primary/10 opacity-70 group-hover:opacity-100 focus:opacity-100'"
      :title="isPinned ? 'Desepingler' : 'Epingler sur l accueil'"
      @pointerdown.stop.prevent
      @mousedown.stop.prevent
      @touchstart.stop.prevent
      @click.stop.prevent="togglePinned"
    >
      <BookmarkIconSolid v-if="isPinned" class="w-5 h-5" />
      <BookmarkIcon v-else class="w-5 h-5" />
    </button>

    <div class="flex items-center gap-4 pr-8 relative z-10">
      <img v-if="props.tool.icon" :src="props.tool.icon" :alt="props.tool.name" class="rounded-2xl w-14 h-14 object-cover border border-primary/10" />
      <div v-else class="flex items-center justify-center bg-primary/10 text-2xl border border-primary/15 rounded-2xl w-14 h-14 shrink-0">
        {{ props.tool.emoji || "🛠️" }}
      </div>
      <div class="flex flex-col gap-1 overflow-hidden">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-primary text-xl font-bold truncate">{{ props.tool.name }}</h3>
        </div>
        <p class="text-sm text-subtext line-clamp-1">
          {{ props.tool.source ? "Outil avec code source disponible" : "Acces rapide depuis votre tableau de bord" }}
        </p>
      </div>
    </div>

    <p class="text-sm text-on-surface/90 line-clamp-3 min-h-18 relative z-10">
      {{ props.tool.description || "Aucune description disponible pour cet outil." }}
    </p>

    <div class="flex gap-2 mt-auto pt-1 relative z-10" data-no-open="true">
      <Button label="Ouvrir" btnStyle="PRIMARY" :handler="props.tool.url" />
      <Button v-if="props.tool.source" label="Code source" btnStyle="NEUTRAL" :handler="props.tool.source" />
    </div>
  </motion.article>
</template>
