<script setup lang="ts">
import { 
	WrenchScrewdriverIcon, 
	AcademicCapIcon, 
	BookOpenIcon,
	BookmarkIcon
} from "@heroicons/vue/24/solid";

import SectionTitle from "~/components/layout/SectionTitle.vue";

const props = defineProps<{
	section: 'official' | 'students' | 'resource' | 'pinned';
}>();

const { tools, error, loading } = useTools();
const { settings } = useSettings();

const titles = {
	official: "Outils officiels",
	students: "Outils étudiants",
	resource: "Ressources utiles",
	pinned: "Épinglés",
};

const icons = {
	official: WrenchScrewdriverIcon,
	students: AcademicCapIcon,
	resource: BookOpenIcon,
	pinned: BookmarkIcon,
};

const filteredTools = computed(() => {
	if (!tools.value) return [];
	
	switch (props.section) {
		case "official":
			return tools.value.official;
		case "students":
			return tools.value.students;
		case "resource":
			return tools.value.resource;
		case "pinned": {
			const pinnedIds = settings.value.customization?.pinnedTools || [];
			if (!pinnedIds.length) return [];
			// Collect all tools
			const all = [
				...tools.value.official,
				...tools.value.students,
				...tools.value.resource
			];
			// Filter and return unique (in case a tool appears in multiple lists, though unlikely)
			return Array.from(new Set(all.filter(t => pinnedIds.includes(t.id))));
		}
		default:
			return [];
	}
});
</script>
<template>
	<section v-if="filteredTools.length > 0 || (props.section !== 'pinned' && !loading)" class="container space-y-4">
		<SectionTitle :icon="icons[props.section]">
			{{ titles[props.section] }}
		</SectionTitle>
		<div v-if="loading && !tools" class="text-center text-subtext">
			Chargement des outils...
		</div>
		<div v-else-if="error" class="text-center text-on-surface">
			Une erreur est survenue lors du chargement des outils.
		</div>
		<div v-else-if="filteredTools.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			<Tool
				v-for="tool in filteredTools"
				:key="tool.id"
				:tool="tool"
			/>
		</div>
		<div v-else-if="props.section !== 'pinned'" class="text-center text-subtext">
			Aucun outil à afficher.
		</div>
	</section>
</template>
