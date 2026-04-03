<script setup lang="ts">
definePageMeta({
	middleware: "auth",
	name: "Panel Administrateur",
	title: "MMI Place - Panel Administrateur",
	description:
		"Bienvenue sur MMI Place, votre tableau de bord personnalisé pour les étudiants en MMI. Accédez rapidement à vos outils, messages et planning, et personnalisez votre expérience selon vos préférences.",
});

import type { Tool, User, Message } from "~~/prisma/generated/client";

type ToolCategory = "OFFICIAL" | "STUDENTS" | "RESOURCE";
type ToolWithAuthors = Tool & { authors: User[] };

const { tools, fetchTools } = useTools();
const {
	publishMessage,
	updateMessage,
	deleteMessage: apiDeleteMessage,
} = useMessages();
const { session } = useSession();
const { channels, fetchChannels } = useChannels();
const { settings, applySettings, loadSettings } = useSettings();

const managedMessages = ref<Message[]>([]);

const fetchManagedMessages = async () => {
	try {
		managedMessages.value = await $fetch<Message[]>("/api/messages/all");
	} catch (e) {
		console.error("Erreur chargement messages", e);
	}
};

onBeforeMount(() => {
	loadSettings();
	applySettings();
});

onMounted(() => {
	fetchTools();
	fetchChannels();
	fetchManagedMessages();

	setInterval(() => {
		fetchTools();
		fetchManagedMessages();
	}, 30000);
});

// Helper formater date html type=datetime-local
const toDateTimeLocal = (isoString?: string | Date | null) => {
	if (!isoString) return "";
	const date = new Date(isoString);
	if (isNaN(date.getTime())) return "";
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 16);
};

// --- GESTION MESSAGES ---
const defaultMessageForm = {
	id: null as number | null,
	title: "",
	content: "",
	channelId: 0,
	buttons: [] as { label: string; link: string; style: string }[],
	publishAt: "",
	expiresAt: "",
};

const messageForm = ref({ ...defaultMessageForm });
const messageActionLoading = ref(false);
const messageActionError = ref("");
const messageActionSuccess = ref("");

const isEditingMessage = computed(() => messageForm.value.id !== null);

function resetMessageForm() {
	messageForm.value = { ...defaultMessageForm };
	messageForm.value.channelId = channels.value[0]?.id || 0;
	messageActionError.value = "";
	messageActionSuccess.value = "";
}

function startMessageEdit(msg: Message) {
	messageActionError.value = "";
	messageActionSuccess.value = "";
	messageForm.value = {
		id: msg.id,
		title: msg.title,
		content: msg.content,
		channelId: msg.channelId,
		buttons: (msg.buttons || []) as {
			label: string;
			link: string;
			style: string;
		}[],
		publishAt: toDateTimeLocal(msg.publishAt),
		expiresAt: toDateTimeLocal(msg.expiresAt),
	};
	window.scrollTo({ top: 0, behavior: "smooth" });
}

async function submitMessage() {
	messageActionError.value = "";
	messageActionSuccess.value = "";

	if (!messageForm.value.title.trim() || !messageForm.value.content.trim()) {
		messageActionError.value = "Titre et contenu obligatoires.";
		return;
	}

	messageActionLoading.value = true;

	try {
		const payload = {
			title: messageForm.value.title,
			content: messageForm.value.content,
			channelId: messageForm.value.channelId,
			buttons: messageForm.value.buttons,
			// Conversion des dates
			publishAt: messageForm.value.publishAt
				? new Date(messageForm.value.publishAt).toISOString()
				: undefined,
			expiresAt: messageForm.value.expiresAt
				? new Date(messageForm.value.expiresAt).toISOString()
				: undefined,
		};

		if (isEditingMessage.value && messageForm.value.id) {
			await updateMessage(messageForm.value.id, payload);
			messageActionSuccess.value = "Publication mise à jour !";
		} else {
			await publishMessage({ ...payload });
			messageActionSuccess.value = "Publication publiée !";
		}

		resetMessageForm();
		await fetchManagedMessages();
	} catch (e) {
		messageActionError.value = "Erreur lors de la sauvegarde du message.";
	} finally {
		messageActionLoading.value = false;
	}
}

async function deleteAdminMessage(id: number) {
	if (!window.confirm("Supprimer cette publication définitivement ?")) return;

	try {
		await apiDeleteMessage(id);
		await fetchManagedMessages();
		if (messageForm.value.id === id) resetMessageForm();
	} catch (e) {
		console.error("Erreur supression", e);
	}
}

// --- GESTION OUTILS ---
const toolForm = ref<{
	id: number | null;
	name: string;
	category: ToolCategory;
	url: string;
	source: string;
	description: string;
	emoji: string;
	icon: string;
}>({
	id: null,
	name: "",
	category: "OFFICIAL",
	url: "",
	source: "",
	description: "",
	emoji: "",
	icon: "",
});

const toolActionLoading = ref(false);
const toolActionError = ref("");
const toolActionSuccess = ref("");

const isEditingTool = computed(() => toolForm.value.id !== null);

const managedTools = computed<ToolWithAuthors[]>(() => {
	return [
		...tools.value.official,
		...tools.value.students,
		...tools.value.resource,
	].sort((a, b) => a.name.localeCompare(b.name));
});

function resetToolForm() {
	toolForm.value = {
		id: null,
		name: "",
		category: "OFFICIAL",
		url: "",
		source: "",
		description: "",
		emoji: "",
		icon: "",
	};
}

function startToolEdit(tool: ToolWithAuthors) {
	toolActionError.value = "";
	toolActionSuccess.value = "";
	toolForm.value = {
		id: tool.id,
		name: tool.name,
		category: tool.category as ToolCategory,
		url: tool.url,
		source: tool.source || "",
		description: tool.description || "",
		emoji: tool.emoji || "",
		icon: tool.icon || "",
	};
}

async function submitTool() {
	toolActionError.value = "";
	toolActionSuccess.value = "";

	if (!toolForm.value.name.trim() || !toolForm.value.url.trim()) {
		toolActionError.value = "Le nom et l'URL sont obligatoires.";
		return;
	}

	toolActionLoading.value = true;

	try {
		const payload = {
			name: toolForm.value.name.trim(),
			category: toolForm.value.category,
			url: toolForm.value.url.trim(),
			source: toolForm.value.source.trim(),
			description: toolForm.value.description.trim(),
			emoji: toolForm.value.emoji.trim(),
			icon: toolForm.value.icon.trim(),
		};

		if (isEditingTool.value && toolForm.value.id !== null) {
			await $fetch(`/api/tools/${toolForm.value.id}`, {
				method: "PUT",
				body: payload,
			});
			toolActionSuccess.value = "Outil mis a jour avec succes.";
		} else {
			await $fetch("/api/tools", {
				method: "POST",
				body: payload,
			});
			toolActionSuccess.value = "Outil cree avec succes.";
		}

		resetToolForm();
		await fetchTools();
	} catch (error) {
		toolActionError.value =
			error instanceof Error ? error.message : "Erreur.";
	} finally {
		toolActionLoading.value = false;
	}
}

async function deleteTool(id: number, name: string) {
	if (!window.confirm(`Supprimer l'outil \"${name}\" ?`)) return;

	toolActionLoading.value = true;
	try {
		await $fetch(`/api/tools/${id}`, { method: "DELETE" });
		if (toolForm.value.id === id) resetToolForm();
		toolActionSuccess.value = "Outil supprime avec succes.";
		await fetchTools();
	} catch (error) {
		toolActionError.value = "Impossible de supprimer l'outil.";
	} finally {
		toolActionLoading.value = false;
	}
}

const categoryOptions: {
	value: ToolCategory;
	label: string;
	style: "neutral";
}[] = [
	{ value: "OFFICIAL", label: "Officiel", style: "neutral" },
	{ value: "STUDENTS", label: "Étudiants", style: "neutral" },
	{ value: "RESOURCE", label: "Ressource", style: "neutral" },
];

const channelOptions = computed(() =>
	channels.value.map((channel) => ({
		label: channel.title,
		value: channel.id,
		style: "neutral" as const,
	})),
);

const messageButtonStyleOptions = [
	{ label: "Neutre", value: "NEUTRAL", style: "neutral" as const },
	{ label: "Violet/Bleu", value: "PRIMARY", style: "neutral" as const },
	{ label: "Vert", value: "SUCCESS", style: "neutral" as const },
	{ label: "Rouge", value: "DANGER", style: "danger" as const },
	{ label: "Lien", value: "LINK", style: "neutral" as const },
];

watch(settings, applySettings, { deep: true });
</script>

<template>
	<header v-if="session?.id"></header>

	<div
		v-if="session && !['ADMIN', 'MANAGER'].includes(session.role)"
		class="container flex justify-center py-20"
	>
		<div
			class="bg-surface border border-surface-border text-center rounded-3xl p-10 max-w-md"
		>
			<h2 class="text-3xl font-bold text-danger mb-4">Accès refusé</h2>
			<p class="text-subtext">
				Vous n'avez pas les permissions nécessaires (Admin/Manager) pour
				afficher cette page d'administration.
			</p>
			<Button
				label="Retourner à l'accueil"
				btnStyle="PRIMARY"
				handler="/"
				class="mt-8"
			/>
		</div>
	</div>

	<main
		v-else-if="session && ['ADMIN', 'MANAGER'].includes(session.role)"
		class="container flex flex-col gap-6 lg:gap-8 max-w-5xl mx-auto my-6"
	>
		<h1 class="text-4xl font-bold">Panel Administrateur</h1>

		<!-- SECTION AJOUTER/MODIFIER PUBLICATION -->
		<section
			class="space-y-4 bg-surface text-on-surface border border-surface-border rounded-3xl p-6 lg:p-8 shadow-xl"
		>
			<div
				class="flex items-center justify-between gap-3 border-b border-surface-border pb-4"
			>
				<h2 class="text-2xl font-bold text-primary">
					{{
						isEditingMessage
							? "Modifier la publication"
							: "Créer une publication"
					}}
				</h2>
				<Button
					v-if="isEditingMessage"
					label="Nouvelle publication"
					btnStyle="NEUTRAL"
					:handler="resetMessageForm"
				/>
			</div>

			<form
				class="flex flex-col gap-5 pt-2"
				@submit.prevent="submitMessage"
			>
				<input
					v-model="messageForm.title"
					class="w-full px-4 py-3 border border-surface-border rounded-xl bg-surface focus:border-primary transition duration-200"
					placeholder="Titre de la publication (ex: Soirée K-FET !)"
					required
				/>
				<textarea
					v-model="messageForm.content"
					class="w-full h-32 px-4 py-3 border border-surface-border rounded-xl bg-surface focus:border-primary transition duration-200 resize-y"
					placeholder="Contenu du message..."
					required
				></textarea>

				<div class="grid md:grid-cols-2 gap-4">
					<div
						class="flex flex-col gap-2 p-3 border border-primary/20 bg-primary/5 rounded-xl"
					>
						<label
							class="text-sm font-bold text-primary flex items-center gap-1"
							>⏱ Date de publication différée
							<span class="text-xs font-normal opacity-70"
								>(Optionnel)</span
							></label
						>
						<p class="text-xs leading-none text-subtext/80 mb-1">
							Empêche de voir ce message avant cette date.
						</p>
						<input
							type="datetime-local"
							v-model="messageForm.publishAt"
							class="px-3 py-2 border border-surface-border rounded-lg bg-surface text-sm"
						/>
					</div>
					<div
						class="flex flex-col gap-2 p-3 border border-danger/20 bg-danger/5 rounded-xl"
					>
						<label
							class="text-sm font-bold text-danger flex items-center gap-1"
							>🗑 Date d'expiration
							<span class="text-xs font-normal opacity-70"
								>(Optionnel)</span
							></label
						>
						<p class="text-xs leading-none text-subtext/80 mb-1">
							Masque automatiquement ce message passée cette date.
						</p>
						<input
							type="datetime-local"
							v-model="messageForm.expiresAt"
							class="px-3 py-2 border border-surface-border rounded-lg bg-surface text-sm"
						/>
					</div>
				</div>

				<div
					class="flex flex-col gap-3 p-4 border border-surface-border rounded-xl bg-black/5"
				>
					<label class="text-sm font-bold"
						>Boutons d'action liés à la publication</label
					>
					<div
						v-for="(button, index) in messageForm.buttons"
						:key="'button-' + index"
						class="flex flex-wrap lg:flex-nowrap items-center gap-2"
					>
						<input
							v-model="button.label"
							class="flex-1 px-3 py-2 border border-surface-border rounded-lg bg-surface"
							placeholder="Texte du bouton (ex: Inscription)"
						/>
						<input
							v-model="button.link"
							class="flex-2 px-3 py-2 border border-surface-border rounded-lg bg-surface"
							placeholder="URL cible (https://...)"
						/>
						<Select
							:options="messageButtonStyleOptions"
							v-model="button.style"
						/>
						<Button
							label="X"
							btnStyle="DANGER"
							:handler="
								() => {
									messageForm.buttons.splice(index, 1);
								}
							"
						/>
					</div>
					<Button
						label="+ Ajouter un bouton d'action"
						btnStyle="NEUTRAL"
						:handler="
							() => {
								messageForm.buttons.push({
									label: 'Nouveau',
									link: 'https://',
									style: 'NEUTRAL',
								});
							}
						"
						class="w-fit cursor-pointer"
					/>
				</div>

				<div
					class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2"
				>
					<div class="flex flex-col gap-1 w-full sm:w-1/3">
						<label class="text-sm font-bold"
							>Diffuser sur le canal :</label
						>
						<Select
							:options="channelOptions"
							v-model="messageForm.channelId"
						/>
					</div>

					<div class="flex items-center gap-2">
						<p v-if="messageActionLoading" class="text-subtext">
							Sauvegarde...
						</p>
						<p v-if="messageActionError" class="text-danger">
							{{ messageActionError }}
						</p>
						<p
							v-if="messageActionSuccess"
							class="text-success font-bold"
						>
							{{ messageActionSuccess }}
						</p>

						<Button
							v-if="isEditingMessage"
							label="Annuler"
							btnStyle="NEUTRAL"
							:handler="resetMessageForm"
						/>
						<Button
							:label="
								isEditingMessage ? 'Mettre à jour' : 'Publier'
							"
							btnStyle="PRIMARY"
							:handler="submitMessage"
						/>
					</div>
				</div>
			</form>
		</section>

		<!-- SECTION LISTE DES PUBLICATIONS -->
		<section
			class="space-y-4 bg-surface text-on-surface border border-surface-border rounded-3xl p-6 lg:p-8 shadow-xl"
		>
			<h2 class="text-2xl font-bold mb-4">
				Mural des publications ({{ managedMessages.length }})
			</h2>
			<div v-if="managedMessages.length === 0" class="text-subtext">
				Aucune publication actuelle.
			</div>
			<div v-else class="space-y-4">
				<div
					v-for="msg in managedMessages"
					:key="'msg-' + msg.id"
					class="border border-surface-border bg-black/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4 transition-all"
					:class="{
						'border-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]':
							isEditingMessage && messageForm.id === msg.id,
					}"
				>
					<div class="flex flex-col gap-1 flex-1">
						<div class="flex items-center gap-2 mb-1">
							<span
								class="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md font-bold text-xs uppercase tracking-wider"
								>Cnl.
								{{
									channels.find((c) => c.id === msg.channelId)
										?.title || msg.channelId
								}}</span
							>
							<h3 class="text-xl font-bold leading-tight">
								{{ msg.title }}
							</h3>
						</div>

						<p class="text-subtext text-sm line-clamp-2">
							{{ msg.content }}
						</p>

						<div
							class="flex items-center gap-4 mt-2 text-xs font-semibold"
						>
							<span class="text-subtext flex items-center gap-1">
								📝 Créé le
								{{
									new Date(msg.createdAt).toLocaleDateString(
										"fr-FR",
										{ day: "2-digit", month: "short" },
									)
								}}
							</span>
							<span
								v-if="msg.publishAt"
								class="text-amber-500/80 flex items-center gap-1"
							>
								⏳ Planifié au
								{{
									new Date(msg.publishAt).toLocaleDateString(
										"fr-FR",
										{
											day: "2-digit",
											month: "short",
											hour: "2-digit",
											minute: "2-digit",
										},
									)
								}}
							</span>
							<span
								v-if="msg.expiresAt"
								class="text-danger/80 flex items-center gap-1"
							>
								☠ Expire le
								{{
									new Date(msg.expiresAt).toLocaleDateString(
										"fr-FR",
										{
											day: "2-digit",
											month: "short",
											hour: "2-digit",
											minute: "2-digit",
										},
									)
								}}
							</span>
						</div>
					</div>
					<div
						class="flex sm:flex-col justify-center sm:min-w-25 shrink-0 gap-2"
					>
						<Button
							label="Modifier"
							btnStyle="NEUTRAL"
							:handler="() => startMessageEdit(msg)"
						/>
						<Button
							label="Retirer"
							btnStyle="DANGER"
							:handler="() => deleteAdminMessage(msg.id)"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- SECTION GERER LES OUTILS -->
		<section
			class="space-y-4 bg-surface text-on-surface border border-surface-border rounded-3xl p-6 lg:p-8 mt-4 shadow-xl"
		>
			<div
				class="flex items-center justify-between gap-3 border-b border-surface-border pb-4 mb-4"
			>
				<h2 class="text-2xl font-bold">Gérer le catalogue d'Outils</h2>
				<Button
					v-if="isEditingTool"
					label="Nouvel outil"
					btnStyle="NEUTRAL"
					:handler="resetToolForm"
				/>
			</div>

			<form
				class="grid grid-cols-1 gap-4 md:grid-cols-2"
				@submit.prevent="submitTool"
			>
				<input
					v-model="toolForm.name"
					class="w-full px-4 py-3 border border-surface-border rounded-xl bg-surface md:col-span-2"
					placeholder="Nom de l'outil..."
				/>
				<Select
					:options="categoryOptions"
					v-model="toolForm.category"
				/>
				<input
					v-model="toolForm.emoji"
					class="w-full px-4 py-3 border border-surface-border rounded-xl bg-surface"
					placeholder="Emoji (ex: 🚀) optionnel"
				/>
				<input
					v-model="toolForm.url"
					class="w-full px-4 py-3 border border-surface-border rounded-xl bg-surface md:col-span-2"
					placeholder="URL du site de l'outil..."
				/>
				<input
					v-model="toolForm.source"
					class="w-full px-4 py-3 border border-surface-border rounded-xl bg-surface md:col-span-2"
					placeholder="URL du code source (ex: Github) optionnel"
				/>
				<input
					v-model="toolForm.icon"
					class="w-full px-4 py-3 border border-surface-border rounded-xl bg-surface md:col-span-2"
					placeholder="URL de l'icône de l'outil (optionnel)"
				/>
				<textarea
					v-model="toolForm.description"
					class="w-full h-24 px-4 py-3 border border-surface-border rounded-xl bg-surface md:col-span-2 resize-y"
					placeholder="Description de l'outil expliquant à quoi il sert..."
				></textarea>

				<div
					class="flex items-center justify-between md:col-span-2 mt-2"
				>
					<div class="flex gap-2 items-center">
						<p
							v-if="toolActionLoading"
							class="text-subtext text-sm"
						>
							Sauvegarde...
						</p>
						<p
							v-if="toolActionError"
							class="text-danger text-sm font-bold"
						>
							{{ toolActionError }}
						</p>
						<p
							v-if="toolActionSuccess"
							class="text-success text-sm font-bold"
						>
							{{ toolActionSuccess }}
						</p>
					</div>
					<div class="flex gap-2">
						<Button
							v-if="isEditingTool"
							label="Annuler"
							btnStyle="NEUTRAL"
							:handler="resetToolForm"
						/>
						<Button
							:label="
								isEditingTool
									? 'Mettre à jour'
									: 'Ajouter au catalogue'
							"
							btnStyle="PRIMARY"
							:handler="submitTool"
						/>
					</div>
				</div>
			</form>
		</section>

		<!-- SECTION LISTE DES OUTILS -->
		<section
			class="space-y-4 bg-surface text-on-surface border border-surface-border rounded-3xl p-6 lg:p-8 shadow-xl"
		>
			<h2 class="text-2xl font-bold mb-4">
				Catalogue ({{ managedTools.length }})
			</h2>
			<div v-if="managedTools.length === 0" class="text-subtext">
				Aucun outil n'est référencé.
			</div>
			<div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div
					v-for="tool in managedTools"
					:key="'tool-' + tool.id"
					class="border border-surface-border bg-black/5 rounded-2xl p-4 flex flex-col gap-2 transition-all"
					:class="{
						'border-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]':
							isEditingTool && toolForm.id === tool.id,
					}"
				>
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<span class="text-xl shrink-0">{{
								tool.emoji || "🛠️"
							}}</span>
							<h3
								class="text-lg font-bold leading-tight line-clamp-1"
							>
								{{ tool.name }}
							</h3>
						</div>
						<div class="flex sm:flex-nowrap flex-wrap gap-1">
							<Button
								label="✎"
								btnStyle="NEUTRAL"
								:handler="() => startToolEdit(tool)"
								class="px-3"
							/>
							<Button
								label="X"
								btnStyle="DANGER"
								:handler="() => deleteTool(tool.id, tool.name)"
								class="px-3"
							/>
						</div>
					</div>
					<span
						class="bg-surface-border text-subtext w-fit px-2 py-0.5 rounded-md text-xs font-bold"
						>{{ tool.category }}</span
					>
					<p
						v-if="tool.description"
						class="text-xs text-subtext line-clamp-2 mt-1"
					>
						{{ tool.description }}
					</p>
				</div>
			</div>
		</section>
	</main>
</template>
