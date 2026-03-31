<script setup lang="ts">
import { motion } from "motion-v";
import { BookmarkIcon } from "@heroicons/vue/24/outline";
import { BookmarkIcon as BookmarkIconSolid } from "@heroicons/vue/24/solid";

import type { Tool, User } from "~~/prisma/generated/client";

type ToolWithAuthors = Tool & { authors: User[] };

const props = defineProps<{
	tool: ToolWithAuthors;
}>();

const { settings, saveSettings } = useSettings();

const authorsLabel = computed(() =>
	props.tool.authors
		.map((a) => [a.firstName, a.lastName].filter(Boolean).join(" "))
		.join(", "),
);

const isPinned = computed(() => {
	// Guard against uninitialized array
	if (!settings.value.customization.pinnedTools) {
		settings.value.customization.pinnedTools = [];
	}
	return settings.value.customization.pinnedTools.includes(props.tool.id);
});

const togglePin = () => {
	if (!settings.value.customization.pinnedTools) {
		settings.value.customization.pinnedTools = [];
	}
	
	const idx = settings.value.customization.pinnedTools.indexOf(props.tool.id);
	if (idx > -1) {
		settings.value.customization.pinnedTools.splice(idx, 1);
	} else {
		settings.value.customization.pinnedTools.push(props.tool.id);
	}
	saveSettings();
};

const openTool = () => {
	window.open(props.tool.url, "_blank");
};
</script>

<template>
	<motion.div
		class="relative flex flex-col gap-2 bg-surface hover:bg-surface-hover/50 border border-surface-border rounded-3xl shadow-2xl shadow-black/5 px-7 py-6 cursor-pointer group"
		:initial="{ opacity: 0, scale: .9 }"
		:animate="{ opacity: 1, scale: 1 }"
		:whileHover="{ y: -5 }"
		:transition="{ duration: 0.3 }"
		@click="openTool"
	>
		<!-- Pin Button -->
		<button
			@click.stop="togglePin"
			class="absolute top-4 right-4 p-2 rounded-full transition-colors z-10"
			:class="isPinned ? 'text-emerald-500 bg-emerald-500/10' : 'text-subtext/50 hover:text-emerald-500 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100'"
			:title="isPinned ? 'Désépingler' : 'Épingler sur l\'accueil'"
		>
			<BookmarkIconSolid v-if="isPinned" class="w-6 h-6" />
			<BookmarkIcon v-else class="w-6 h-6" />
		</button>

		<div class="flex items-center gap-4 pr-8">
			<img
				v-if="props.tool.icon"
				:src="props.tool.icon"
				class="rounded-xl w-14 h-14 object-cover"
			/>
			<div
				v-else-if="props.tool.emoji"
				class="flex items-center justify-center bg-primary/10 text-2xl border border-primary/10 rounded-xl w-14 h-14 shrink-0"
			>
				{{ props.tool.emoji }}
			</div>
			<div
				v-else
				class="flex items-center justify-center bg-primary/10 text-2xl border border-primary/10 rounded-xl w-14 h-14 shrink-0"
			>
				🛠️
			</div>
			<div class="flex flex-col -space-y-1.5 overflow-hidden">
				<h3 class="text-primary text-xl font-bold truncate">{{ props.tool.name }}</h3>
				<p class="text-sm text-subtext truncate">
					Par {{ authorsLabel || "Aucun auteur" }}
				</p>
			</div>
		</div>
		<p class="text-base line-clamp-2 min-h-[3rem]">{{ props.tool.description }}</p>
		
		<div class="flex gap-2 mt-auto pt-2" @click.stop>
			<Button
				:key="'open-' + props.tool.id"
				label="Ouvrir"
				:handler="props.tool.url"
				btnStyle="PRIMARY"
			/>
			<Button
				v-if="props.tool.source"
				:key="'source-' + props.tool.id"
				label="Code source"
				:handler="props.tool.source"
				btnStyle="NEUTRAL"
			/>
		</div>
	</motion.div>
</template>
