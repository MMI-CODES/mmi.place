<script setup lang="ts">
import { AdjustmentsHorizontalIcon } from "@heroicons/vue/24/outline";
import {
	ChevronUpIcon,
	ChevronDownIcon,
	WrenchScrewdriverIcon,
} from "@heroicons/vue/24/solid";

import HeaderMessage from "../cards/HeaderMessage.vue";
import HeaderCourse from "../cards/HeaderCourse.vue";
import HeaderPlanup from "../cards/HeaderPlanup.vue";

import { motion } from "motion-v";

const { settings } = useSettings();
const { session } = useSession();

const widget = ref<number>(0);

const widgets = computed(() => {
	const list = [];
	if (settings.value.widgets.vencat.enabled) list.push(HeaderCourse);
	if (settings.value.widgets.messages.enabled) list.push(HeaderMessage);
	if (settings.value.widgets.planup?.enabled) list.push(HeaderPlanup);
	return list;
});

let widgetInterval: ReturnType<typeof setInterval> | undefined;

const clearWidgetInterval = () => {
	if (!widgetInterval) return;
	clearInterval(widgetInterval);
	widgetInterval = undefined;
};

const startWidgetInterval = () => {
	clearWidgetInterval();
	if (!settings.value.widgets.carrousel || widgets.value.length <= 1) return;

	widgetInterval = setInterval(() => {
		if (widgets.value.length > 0) {
			widget.value = (widget.value + 1) % widgets.value.length;
		}
	}, settings.value.widgets.carrouselRate);
};

onMounted(() => {
	document.addEventListener("keypress", (event) => {
		if (!widgets.value.length) return;

		const target = event.target as HTMLElement;
		if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
			return;

		if (event.key === "+") {
			widget.value =
				(widget.value - 1 + widgets.value.length) %
				widgets.value.length;
		} else if (event.key === "-") {
			widget.value = (widget.value + 1) % widgets.value.length;
		}
	});

	startWidgetInterval();

	onUnmounted(() => {
		clearWidgetInterval();
	});

	watch(
		() => [
			settings.value.widgets.carrousel,
			settings.value.widgets.carrouselRate,
			widgets.value.length,
		],
		() => {
			if (widget.value >= widgets.value.length) {
				widget.value = Math.max(0, widgets.value.length - 1);
			}
			startWidgetInterval();
		},
	);
});
</script>
<template>
	<header class="container grid xl:grid-cols-12">
		<div
			class="flex flex-col gap-2 justify-center col-span-1 p-4 md:p-8 md:space-y-4 xl:col-span-6 xl:row-1"
		>
			<h1 v-if="session" class="text-4xl font-bold">
				Bonjour,
				<span class="text-primary underline decoration-4">{{
					session?.firstName || "esclave"
				}}</span>
				!
			</h1>
			<h1 v-else class="text-4xl font-bold">Tableau de bord</h1>
			<p class="text-xl text-subtext max-md:hidden">
				Espace réservé aux étudiants MMI de Vélizy. Retrouvez au même
				endroit tous les outils qui vous sont indispensables, ainsi que
				certaines ressources et outils mis à disposition par des
				étudiants pour faciliter vos études !
			</p>
			<div class="flex gap-2 overflow-x-auto">
				<Button
					:icon="AdjustmentsHorizontalIcon"
					handler="/settings"
				/>
				<div class="flex gap-6 ml-4 overflow-x-auto">
					<Button
						v-for="link in settings.customization.links"
						:label="link.name"
						btnStyle="LINK"
						:handler="link.url"
					/>
				</div>
			</div>
		</div>
		<div
			class="flex flex-row-reverse items-center gap-2 h-80 xl:col-start-8 xl:col-span-5"
			v-if="widgets.length > 0"
			@mouseenter="clearWidgetInterval"
			@mouseleave="startWidgetInterval"
		>
			<div
				class="group shrink-0 flex flex-col items-center gap-2 w-fit"
				v-if="widgets.length > 1"
			>
				<motion.div
					v-for="index in widgets.length"
					:key="index"
					class="cursor-pointer rounded-full w-2 h-4"
					:class="index - 1 === widget ? 'bg-primary' : 'bg-button'"
					:initial="{ opacity: 0, scale: 0.5 }"
					:animate="{
						opacity: 1,
						scale: 1,
						height: index - 1 === widget ? 24 : 16,
					}"
					:transition="{ duration: 0.3 }"
					@click="widget = index - 1"
				>
				</motion.div>
			</div>
			<component :is="widgets[widget]" />
		</div>
	</header>
</template>
