<script setup lang="ts">
definePageMeta({
	name: "Préférences",
	title: "MMI Place - Préférences",
	description:
		"Bienvenue sur MMI Place, votre tableau de bord personnalisé pour les étudiants en MMI. Accédez rapidement à vos outils, messages et planning, et personnalisez votre expérience selon vos préférences.",
});

import {
	MoonIcon,
	SunIcon,
	ChevronUpIcon,
	ChevronDownIcon
} from "@heroicons/vue/24/solid";

import type { Settings } from "~~/shared/types/settings";

const { channels, fetchChannels } = useChannels();
const { settings, applySettings, loadSettings, saveSettings, resetSettings } =
	useSettings();

const route = useRoute();
const tab = ref<"appearence" | "customization" | "widgets">((route.query.tab as any) || "appearence");

// --- Groups for Vencat & PlanUP Smart Select ---
const baseGroups: Record<string, { label: string; value: string; style: "neutral" }[]> = {
	MMI1: [
		{ label: "A1", value: "MMI1_A1", style: "neutral" },
		{ label: "A2", value: "MMI1_A2", style: "neutral" },
		{ label: "B1", value: "MMI1_B1", style: "neutral" },
		{ label: "B2", value: "MMI1_B2", style: "neutral" },
	],
	MMI2: [
		{ label: "A1", value: "MMI2_A1", style: "neutral" },
		{ label: "A2", value: "MMI2_A2", style: "neutral" },
		{ label: "B1", value: "MMI2_B1", style: "neutral" },
		{ label: "B2", value: "MMI2_B2", style: "neutral" },
	],
	MMI3DW_FA: [
		{ label: "A1", value: "MMI3DW_FA_A1", style: "neutral" },
		{ label: "A2", value: "MMI3DW_FA_A2", style: "neutral" },
	],
	MMI3CN_FI: [
		{ label: "A1", value: "MMI3CN_FI_A1", style: "neutral" },
		{ label: "A2", value: "MMI3CN_FI_A2", style: "neutral" },
	],
	MMI3CN_FA: [
		{ label: "A1", value: "MMI3CN_FA_A1", style: "neutral" },
		{ label: "A2", value: "MMI3CN_FA_A2", style: "neutral" },
	]
};

const yearOptions = [
	{ label: "Aucun", value: null, style: "neutral" as const },
	{ label: "MMI 1", value: "MMI1", style: "neutral" as const },
	{ label: "MMI 2", value: "MMI2", style: "neutral" as const },
	{ label: "MMI 3 DW (FA)", value: "MMI3DW_FA", style: "neutral" as const },
	{ label: "MMI 3 CN (FI)", value: "MMI3CN_FI", style: "neutral" as const },
	{ label: "MMI 3 CN (FA)", value: "MMI3CN_FA", style: "neutral" as const },
];

const getYearFromValue = (val: string | null) => {
	if (!val) return null;
	if (val.startsWith("MMI1")) return "MMI1";
	if (val.startsWith("MMI2")) return "MMI2";
	if (val.startsWith("MMI3DW_FA")) return "MMI3DW_FA";
	if (val.startsWith("MMI3CN_FI")) return "MMI3CN_FI";
	if (val.startsWith("MMI3CN_FA")) return "MMI3CN_FA";
	return null;
};

const vencatYear = ref(getYearFromValue(settings.value?.widgets?.vencat?.group || null));
const planupYear = ref(getYearFromValue(settings.value?.widgets?.planup?.group || null));

watch(vencatYear, (newYear) => {
	if (!newYear) {
		settings.value.widgets.vencat.group = null;
	} else if (!settings.value.widgets.vencat.group || getYearFromValue(settings.value.widgets.vencat.group) !== newYear) {
		settings.value.widgets.vencat.group = baseGroups[newYear][0].value;
	}
});

watch(planupYear, (newYear) => {
	if (!newYear) {
		settings.value.widgets.planup.group = null;
	} else if (!settings.value.widgets.planup.group || getYearFromValue(settings.value.widgets.planup.group) !== newYear) {
		settings.value.widgets.planup.group = baseGroups[newYear][0].value;
	}
});

// --- Settings Section Reordering ---
const sectionLabels: Record<string, string> = {
	students: "Outils étudiants",
	official: "Outils officiels",
	resource: "Ressources"
};

const moveSection = (index: number, direction: number) => {
	const arr = settings.value.customization.sectionOrders;
	if (index + direction >= 0 && index + direction < arr.length) {
		const temp = arr[index];
		arr[index] = arr[index + direction];
		arr[index + direction] = temp;
	}
};

// --- Text Size Logic ---
const textSizes = ["small", "medium", "large"] as const;
const textSizesLabels = { small: "Petit", medium: "Moyen", large: "Grand" };

const decreaseTextSize = () => {
	const idx = textSizes.indexOf(settings.value.appearence.text.size);
	if (idx > 0) settings.value.appearence.text.size = textSizes[idx - 1];
};
const increaseTextSize = () => {
	const idx = textSizes.indexOf(settings.value.appearence.text.size);
	if (idx < textSizes.length - 1) settings.value.appearence.text.size = textSizes[idx + 1];
};

const messagesRateOptions = [
	{ label: "5 secondes", value: 5000, style: "neutral" as const },
	{ label: "10 secondes", value: 10000, style: "neutral" as const },
	{ label: "15 secondes", value: 15000, style: "neutral" as const },
	{ label: "30 secondes", value: 30000, style: "neutral" as const },
	{ label: "60 secondes", value: 60000, style: "neutral" as const },
];

const newLink = ref({ name: "", url: "" });

const addLink = () => {
	const name = newLink.value.name.trim();
	const url = newLink.value.url.trim();
	if (!name || !url) return;

	settings.value.customization.links.push({ name, url });
	newLink.value = { name: "", url: "" };
};

const removeLink = (index: number) => {
	settings.value.customization.links.splice(index, 1);
};

const isChannelEnabled = (channelId: number) =>
	settings.value.widgets.messages.channels.includes(channelId);

const toggleChannel = (channelId: number) => {
	const list = settings.value.widgets.messages.channels;
	const index = list.findIndex((id) => id === channelId);

	if (index >= 0) {
		list.splice(index, 1);
	} else {
		list.push(channelId);
	}
};

onMounted(() => {
	loadSettings();
	applySettings();
	vencatYear.value = getYearFromValue(settings.value.widgets.vencat.group || null);
	planupYear.value = getYearFromValue(settings.value.widgets.planup.group || null);
	fetchChannels();
});

watch(
	settings,
	() => {
		applySettings();
		saveSettings();
	},
	{ deep: true },
);
</script>

<template>
	<header class="container flex flex-col items-center gap-4">
		<h1 class="text-4xl font-bold">Paramètres</h1>
		<Button
			label="Réinitialiser"
			btnStyle="DANGER"
			:handler="resetSettings"
		/>
	</header>

	<div class="container flex justify-center gap-4 my-4">
		<Button
			label="Apparence"
			:btnStyle="tab === 'appearence' ? 'TAB:ACTIVE' : 'TAB'"
			:handler="() => { tab = 'appearence'; }"
		/>
		<Button
			label="Personnalisation"
			:btnStyle="tab === 'customization' ? 'TAB:ACTIVE' : 'TAB'"
			:handler="() => { tab = 'customization'; }"
		/>
		<Button
			label="Widgets"
			:btnStyle="tab === 'widgets' ? 'TAB:ACTIVE' : 'TAB'"
			:handler="() => { tab = 'widgets'; }"
		/>
	</div>

	<main v-if="tab === 'appearence'" class="container flex flex-col gap-10 max-w-2xl mx-auto">
		<section class="flex flex-col gap-4">
			<h2 class="text-2xl font-bold border-b border-surface-border pb-2">Apparence Globale</h2>
			<div class="flex items-center justify-between p-4 bg-surface border border-surface-border rounded-2xl shadow-sm">
				<div class="flex items-center gap-3 font-medium">
					<MoonIcon class="w-6 h-6 text-primary/70" v-if="settings.appearence.theme === 'dark'" />
					<SunIcon class="w-6 h-6 text-primary/70" v-else />
					Mode sombre
				</div>
				<Switch 
					:modelValue="settings.appearence.theme === 'dark'"
					@update:modelValue="(val) => settings.appearence.theme = val ? 'dark' : 'light'" 
				/>
			</div>
			
			<div class="flex items-center justify-between p-4 bg-surface border border-surface-border rounded-2xl shadow-sm">
				<span class="font-medium">Contraste élevé</span>
				<Switch 
					:modelValue="settings.appearence.contrast === 'high'"
					@update:modelValue="(val) => settings.appearence.contrast = val ? 'high' : 'normal'" 
				/>
			</div>
		</section>

		<section class="flex flex-col gap-4">
			<h2 class="text-2xl font-bold border-b border-surface-border pb-2">Texte & Typographie</h2>
			
			<div class="flex items-center justify-between p-4 bg-surface border border-surface-border rounded-2xl shadow-sm">
				<span class="font-medium">Taille du texte</span>
				<div class="flex items-center gap-4">
					<button 
						@click="decreaseTextSize" 
						:disabled="settings.appearence.text.size === 'small'"
						class="w-10 h-10 flex justify-center items-center bg-button text-on-button rounded-full hover:bg-button-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-xl"
					>
						-
					</button>
					<span class="w-16 text-center font-semibold text-primary">
						{{ textSizesLabels[settings.appearence.text.size] }}
					</span>
					<button 
						@click="increaseTextSize" 
						:disabled="settings.appearence.text.size === 'large'"
						class="w-10 h-10 flex justify-center items-center bg-button text-on-button rounded-full hover:bg-button-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-xl"
					>
						+
					</button>
				</div>
			</div>

			<div class="flex items-center justify-between p-4 bg-surface border border-surface-border rounded-2xl shadow-sm">
				<div class="flex flex-col">
					<span class="font-medium">Police Open Dyslexic</span>
					<span class="text-xs text-subtext">Améliore la lisibilité</span>
				</div>
				<Switch v-model="settings.appearence.text.dyslexia" />
			</div>
		</section>
	</main>

	<main v-else-if="tab === 'customization'" class="container flex flex-col gap-10 max-w-2xl mx-auto">
		<section class="flex flex-col gap-4">
			<h2 class="text-2xl font-bold border-b border-surface-border pb-2">Liens rapides</h2>
			<p class="text-subtext text-sm">Ajoutez vos propres liens qui s'afficheront dans la barre de navigation.</p>
			
			<div class="flex flex-col sm:flex-row gap-2 mt-2">
				<input
					v-model="newLink.name"
					type="text"
					placeholder="Nom (ex: Mon portfolio)"
					class="flex-1 h-12 rounded-xl border border-button-border bg-surface px-4 focus:outline-none focus:border-primary transition-colors"
				/>
				<input
					v-model="newLink.url"
					type="text"
					placeholder="https://..."
					class="flex-1 h-12 rounded-xl border border-button-border bg-surface px-4 focus:outline-none focus:border-primary transition-colors"
				/>
				<Button label="Ajouter" btnStyle="PRIMARY" :handler="addLink" />
			</div>

			<div class="flex flex-col gap-3 mt-4">
				<div
					v-for="(link, index) in settings.customization.links"
					:key="`${link.name}-${index}`"
					class="flex items-center justify-between rounded-2xl border border-surface-border bg-surface px-5 py-4 shadow-sm"
				>
					<div class="flex flex-col">
						<span class="font-semibold text-primary">{{ link.name }}</span>
						<span class="text-subtext text-sm hover:underline"><a :href="link.url" target="_blank">{{ link.url }}</a></span>
					</div>
					<Button label="Retirer" btnStyle="DANGER" :handler="() => removeLink(index)" />
				</div>
				<div v-if="!settings.customization.links.length" class="text-center text-subtext py-4">
					Aucun lien personnalisé.
				</div>
			</div>
		</section>

		<section class="flex flex-col gap-4">
			<h2 class="text-2xl font-bold border-b border-surface-border pb-2">Ordre des sections</h2>
			<p class="text-subtext text-sm">Réorganisez l'affichage des groupes d'outils sur votre accueil.</p>
			
			<div class="flex flex-col gap-3">
				<div 
					v-for="(section, index) in settings.customization.sectionOrders" 
					:key="section"
					class="flex items-center justify-between bg-surface border border-surface-border rounded-2xl px-5 py-4 shadow-sm"
				>
					<div class="flex items-center gap-4">
						<span class="text-subtext font-bold text-lg bg-surface-border w-8 h-8 rounded-full flex items-center justify-center">{{ index + 1 }}</span>
						<span class="font-medium text-lg">{{ sectionLabels[section] }}</span>
					</div>
					
					<div class="flex flex-col gap-2">
						<button 
							@click="moveSection(index, -1)" 
							:disabled="index === 0"
							class="text-subtext hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed p-1 transition-all"
						>
							<ChevronUpIcon class="w-6 h-6"/>
						</button>
						<button 
							@click="moveSection(index, 1)" 
							:disabled="index === settings.customization.sectionOrders.length - 1"
							class="text-subtext hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed p-1 transition-all"
						>
							<ChevronDownIcon class="w-6 h-6"/>
						</button>
					</div>
				</div>
			</div>
		</section>
	</main>

	<main v-else class="container flex flex-col gap-10 max-w-2xl mx-auto">
		
		<section class="flex flex-col gap-4">
			<div class="flex justify-between items-center border-b border-surface-border pb-2">
				<h2 class="text-2xl font-bold">Vencat (Emploi du temps)</h2>
				<Switch v-model="settings.widgets.vencat.enabled" />
			</div>
			
			<div v-if="settings.widgets.vencat.enabled" class="flex flex-col gap-4 p-5 bg-surface border border-surface-border rounded-2xl shadow-sm">
				<p class="text-subtext text-sm">Sélectionnez votre groupe pour afficher votre prochain cours sur l'accueil.</p>
				<div class="flex flex-col sm:flex-row gap-4">
					<div class="flex-1 flex flex-col gap-2">
						<span class="text-xs font-bold uppercase tracking-wider text-subtext ml-1">Année / Parcours</span>
						<Select :options="yearOptions" v-model="vencatYear" />
					</div>
					<div class="flex-1 flex flex-col gap-2" v-if="vencatYear && baseGroups[vencatYear]">
						<span class="text-xs font-bold uppercase tracking-wider text-subtext ml-1">Groupe</span>
						<Select 
							:options="baseGroups[vencatYear]" 
							v-model="settings.widgets.vencat.group" 
						/>
					</div>
				</div>
			</div>
		</section>

		<section class="flex flex-col gap-4">
			<div class="flex justify-between items-center border-b border-surface-border pb-2">
				<h2 class="text-2xl font-bold">PlanUP (Tâches)</h2>
				<!-- Removed the 'disabled' attribute to unlock PlanUP -->
				<Switch v-model="settings.widgets.planup.enabled" />
			</div>
			
			<div v-if="settings.widgets.planup.enabled" class="flex flex-col gap-4 p-5 bg-surface border border-surface-border rounded-2xl shadow-sm">
				<p class="text-subtext text-sm">Configurez l'affichage de vos tâches. (Auparavant bloqué, maintenant déverrouillé)</p>
				<div class="flex flex-col sm:flex-row gap-4">
					<div class="flex-1 flex flex-col gap-2">
						<span class="text-xs font-bold uppercase tracking-wider text-subtext ml-1">Année / Parcours</span>
						<Select :options="yearOptions" v-model="planupYear" />
					</div>
					<div class="flex-1 flex flex-col gap-2" v-if="planupYear && baseGroups[planupYear]">
						<span class="text-xs font-bold uppercase tracking-wider text-subtext ml-1">Groupe</span>
						<Select 
							:options="baseGroups[planupYear]" 
							v-model="settings.widgets.planup.group" 
						/>
					</div>
				</div>
			</div>
		</section>

		<section class="flex flex-col gap-4">
			<div class="flex justify-between items-center border-b border-surface-border pb-2">
				<h2 class="text-2xl font-bold">Messages Campus</h2>
				<Switch v-model="settings.widgets.messages.enabled" />
			</div>
			
			<div v-if="settings.widgets.messages.enabled" class="flex flex-col gap-5 p-5 bg-surface border border-surface-border rounded-2xl shadow-sm">
				
				<div class="flex flex-col gap-3">
					<span class="font-medium">Défilement automatique (Carrousel)</span>
					<div class="flex items-center gap-4">
						<Switch v-model="settings.widgets.carrousel" />
						<Select
							v-if="settings.widgets.carrousel"
							:options="messagesRateOptions"
							v-model="settings.widgets.carrouselRate"
						/>
					</div>
				</div>

				<hr class="border-surface-border" />

				<div class="flex flex-col gap-3">
					<span class="font-medium">Canaux de communication suivis</span>
					<div class="flex flex-wrap gap-2">
						<Button
							v-for="channel in channels"
							:key="channel.id"
							:label="channel.title"
							:btnStyle="isChannelEnabled(channel.id) ? 'PRIMARY' : 'NEUTRAL'"
							:handler="() => toggleChannel(channel.id)"
						/>
					</div>
				</div>

				<hr class="border-surface-border" />

				<Button
					label="Ignorer tous les messages (marquer comme lus)"
					:btnStyle="settings.widgets.messages.readMessages.length ? 'NEUTRAL' : 'DANGER'"
					:handler="() => { settings.widgets.messages.readMessages = []; }"
				/>
			</div>
		</section>

	</main>
</template>
