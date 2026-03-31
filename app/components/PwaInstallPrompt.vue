<script setup lang="ts">
import { ref, onMounted } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/solid";

const deferredPrompt = ref<any>(null);
const showPrompt = ref(false);

onMounted(() => {
	window.addEventListener("beforeinstallprompt", (e) => {
		// Prevent Chrome from automatically showing the prompt
		e.preventDefault();
		// Stash the event so it can be triggered later
		deferredPrompt.value = e;
		// Show our custom UI
		showPrompt.value = true;
	});

	window.addEventListener("appinstalled", () => {
		// PWA has been installed, clear custom UI
		showPrompt.value = false;
		deferredPrompt.value = null;
	});
});

const installPwa = async () => {
	if (!deferredPrompt.value) return;
	
	deferredPrompt.value.prompt();
	
	const { outcome } = await deferredPrompt.value.userChoice;
	if (outcome === "accepted") {
		console.log("Installation PWA acceptée.");
	}
	
	deferredPrompt.value = null;
	showPrompt.value = false;
};

const dismiss = () => {
	showPrompt.value = false;
};
</script>

<template>
	<div
		v-if="showPrompt"
		class="fixed bottom-6 right-6 z-50 flex flex-col items-end sm:items-center sm:flex-row gap-4 bg-primary text-on-primary px-6 py-4 rounded-3xl shadow-2xl shadow-primary/30 border-2 border-primary-hover animate-bounce-in"
	>
		<div class="flex flex-col">
			<span class="font-bold text-lg leading-tight">Installer l'application</span>
			<span class="text-sm opacity-90">Profitez de MMI Place depuis votre accueil !</span>
		</div>
		<div class="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
			<button
				@click="installPwa"
				class="flex-1 sm:flex-none bg-on-primary text-primary px-5 py-2 rounded-xl font-bold border-2 border-on-primary hover:bg-transparent hover:text-on-primary transition-all"
			>
				Installer
			</button>
			<button @click="dismiss" class="opacity-70 hover:opacity-100 transition-opacity p-2">
				<XMarkIcon class="w-6 h-6" />
			</button>
		</div>
	</div>
</template>

<style scoped>
@keyframes bounceIn {
  0% { transform: translateY(100px); opacity: 0; }
  60% { transform: translateY(-10px); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
}
.animate-bounce-in {
  animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
</style>
