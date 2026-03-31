<script setup lang="ts">
import { InformationCircleIcon, CheckCircleIcon } from "@heroicons/vue/24/solid";
import { CheckIcon } from "@heroicons/vue/24/outline";
import { motion } from "motion-v";
import type { Message } from "~~/prisma/generated/client";
import type { SerializeDates } from "~/utils/typing";

const { channels, fetchChannels } = useChannels();
const { settings, saveSettings } = useSettings();
const { messages, fetchMessages, activeMessageIndex } = useMessages();

type ButtonType = {
	label: string;
	link: string;
	style: "NEUTRAL" | "PRIMARY" | "LINK" | "SUCCESS" | "DANGER";
};

// Selection du message actif en fonction de l'index global pour faire une rotation a chaque apparition du module !
const message = ref<SerializeDates<Message> | undefined>(undefined);
const messagePosition = ref(0);

const hasMarkedRead = ref(false);

const channelName = computed(() => {
	const channel = channels.value.find(
		(c) => c.id === message.value?.channelId,
	);
	return channel ? `#${channel.title}` : "Inconnu";
});

onBeforeMount(() => {
	fetchChannels();
});

onMounted(() => {
	// A l'apparition du widget, on recupere le message et on avance l'index global pour la prochaine fois
	if (messages.value.length > 0) {
		// Securite index
		if (activeMessageIndex.value >= messages.value.length) {
			activeMessageIndex.value = 0;
		}
		
		message.value = messages.value[activeMessageIndex.value];
		messagePosition.value = activeMessageIndex.value + 1;
		
		// Avancer l'index pour le prochain cycle
		activeMessageIndex.value = (activeMessageIndex.value + 1) % messages.value.length;
	} else {
		message.value = undefined;
	}
});

onUnmounted(() => {
	// Si on a marque comme lu, on raffraichit en arriere plan a la sortie pour que ce soit mis a jour au prochain cycle.
	if (hasMarkedRead.value) {
		fetchMessages();
	}
});

const markAsRead = async () => {
	if (!message.value) return;
	
	settings.value.widgets.messages.readMessages.push(message.value.id);
	saveSettings();
	
	if (messages.value.length > 1) {
		await fetchMessages();
		// Ajustement de l'index car le tableau vient de retrecir
		if (activeMessageIndex.value >= messages.value.length) {
			activeMessageIndex.value = 0;
		}
		
		message.value = messages.value[activeMessageIndex.value];
		messagePosition.value = activeMessageIndex.value + 1;
		
		activeMessageIndex.value = (activeMessageIndex.value + 1) % messages.value.length;
		hasMarkedRead.value = false;
	} else {
		hasMarkedRead.value = true;
	}
};
</script>

<template>
	<motion.div
		v-if="message"
		class="flex flex-col gap-2 bg-surface border border-surface-border rounded-3xl shadow-2xl shadow-black/5 px-7 py-6 w-full relative overflow-hidden"
		:initial="{ opacity: 0, scale: 0.9 }"
		:animate="{ opacity: 1, scale: 1 }"
		:transition="{ duration: 0.3 }"
	>
		<!-- Indicateur N/Total Messages -->
		<div v-if="messages.length > 1" class="absolute top-4 right-6 text-xs font-bold text-subtext/60 bg-surface-border/50 px-2 py-1 rounded-md">
			{{ messagePosition }} / {{ messages.length }}
		</div>

		<div class="flex items-center gap-4">
			<div
				class="flex items-center justify-center text-2xl border rounded-xl w-14 h-14"
				:class="hasMarkedRead ? 'bg-success/10 border-success/20 text-success' : 'bg-primary/10 border-primary/20 text-primary'"
			>
				<CheckCircleIcon v-if="hasMarkedRead" class="w-7 h-7" />
				<InformationCircleIcon v-else class="w-7 h-7" />
			</div>
			<div class="flex flex-col -space-y-1">
				<h3 class="text-xl font-semibold">{{ message.title }}</h3>
				<p class="text-sm text-subtext">
					Depuis le canal {{ channelName }}
				</p>
			</div>
		</div>
		
		<p class="text-base text-subtext mt-1" :class="hasMarkedRead ? 'opacity-50' : ''">{{ message.content }}</p>
		
		<div class="flex flex-wrap gap-2 mt-2">
			<Button
				v-for="(button, index) in message.buttons as ButtonType[]"
				:key="'link-' + index"
				:label="button.label"
				:handler="button.link"
				:btnStyle="button.style"
			/>
			
			<div class="flex-1"></div> <!-- Pousse le bouton Marquer comme lu sur la droite -->

			<!-- Bouton Visuellement distinct -->
			<button
				v-if="!hasMarkedRead"
				@click="markAsRead"
				class="flex items-center gap-2 px-4 py-2 border-2 border-surface-border text-subtext hover:border-primary hover:text-primary font-bold rounded-xl transition-colors duration-200"
			>
				<CheckIcon class="w-5 h-5" />
				<span>Marquer comme lu</span>
			</button>
			<div v-else class="flex items-center gap-2 px-4 py-2 text-success font-bold rounded-xl">
				<CheckCircleIcon class="w-5 h-5" /> Lu
			</div>
		</div>
	</motion.div>

	<motion.div
		v-else
		class="flex flex-col justify-center items-center bg-surface border border-surface-border rounded-3xl shadow-2xl shadow-black/5 h-full px-7 py-6 w-full"
		:initial="{ opacity: 0, scale: 0.9 }"
		:animate="{ opacity: 1, scale: 1 }"
		:transition="{ duration: 0.3 }"
	>
		<CheckCircleIcon class="w-16 h-16 text-success/50 mb-4" />
		<h3 class="text-2xl font-semibold">Vous êtes à jour !</h3>
		<p class="text-subtext">Vous n'avez aucune nouvelle publication à consulter.</p>
	</motion.div>
</template>
