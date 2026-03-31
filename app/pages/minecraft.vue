<script setup lang="ts">
import {
	PlayIcon,
	GlobeAltIcon,
	MapIcon,
	ExclamationTriangleIcon,
	ComputerDesktopIcon,
} from "@heroicons/vue/24/outline";
import { motion } from "motion-v";

definePageMeta({
	name: "Minecraft",
	title: "MMI Place - Serveur Minecraft",
	description:
		"Rejoignez le serveur Minecraft 100% dédié aux étudiants MMI de France. Jouable en ligne gratuitement sur navigateur ou via le jeu classique.",
});
</script>

<template>
	<main class="container py-12 flex flex-col gap-16 text-foreground">
		<!-- Header -->
		<motion.div
			class="text-center space-y-6"
			:initial="{ opacity: 0, y: -20 }"
			:animate="{ opacity: 1, y: 0 }"
		>
			<h1
				class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 drop-shadow-sm"
			>
				Rejoignez le serveur Minecraft MMI
			</h1>
			<p class="text-lg text-subtext max-w-2xl mx-auto leading-relaxed">
				Découvrez le serveur <strong class="text-emerald-400">Vanilla 1.12.2</strong> 100% dédié aux étudiants MMI de toute la France. C'est un serveur type faction — tout est expliqué directement dans le spawn/lobby.
			</p>

			<div class="pt-4 flex justify-center">
				<a
					href="https://map.mc.mmi.codes"
					target="_blank"
					class="inline-flex items-center gap-3 bg-surface border border-surface-border hover:border-emerald-500/40 px-6 py-4 rounded-2xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] group"
				>
					<div class="bg-emerald-500/10 p-2 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
						<MapIcon class="w-6 h-6 text-emerald-400" />
					</div>
					<span class="font-medium text-lg">Voir la carte interactive en direct</span>
				</a>
			</div>
		</motion.div>

		<!-- Comment rejoindre -->
		<div class="space-y-10">
			<motion.div
				class="text-center"
				:initial="{ opacity: 0 }"
				:animate="{ opacity: 1 }"
				:transition="{ delay: 0.1 }"
			>
				<h2 class="text-3xl font-bold mb-3">Comment jouer ?</h2>
				<p class="text-subtext text-lg">
					Deux options pour rejoindre le serveur sans se prendre la tête.
				</p>
			</motion.div>

			<div class="grid md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
				<!-- Option 1: Navigateur -->
				<motion.div
					class="bg-surface border border-surface-border rounded-3xl p-8 shadow-2xl shadow-black/10 flex flex-col gap-6 relative overflow-hidden group"
					:initial="{ opacity: 0, x: -20 }"
					:animate="{ opacity: 1, x: 0 }"
					:transition="{ delay: 0.2 }"
				>
					<div class="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
					<div class="flex items-center gap-4 relative z-10">
						<div
							class="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"
						>
							<GlobeAltIcon class="w-8 h-8 text-emerald-400" />
						</div>
						<div>
							<h3 class="text-2xl font-bold">Via un Navigateur</h3>
							<div class="inline-block mt-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
								Gratuit & Sans installation
							</div>
						</div>
					</div>

					<div class="space-y-4 flex-grow relative z-10">
						<p class="text-subtext leading-relaxed">
							Vous pouvez jouer totalement gratuitement et sans latence directement depuis n'importe quel navigateur web !
						</p>
						<div
							class="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 flex gap-3 text-sm mt-4"
						>
							<ExclamationTriangleIcon
								class="w-6 h-6 text-amber-500 flex-shrink-0"
							/>
							<p class="text-amber-500/90 leading-relaxed">
								Pour <strong class="text-amber-500">Firefox</strong> et <strong class="text-amber-500">Safari</strong>, cela demande l'activation de <code>wasm_js_promise_integration</code>. Un lien sur le site vous donnera plus d'infos.
							</p>
						</div>
					</div>

					<a
						href="https://mc.mmi.codes"
						target="_blank"
						class="relative z-10 w-full flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_8px_20px_0_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] hover:-translate-y-1"
					>
						<PlayIcon class="w-6 h-6" />
						Lancer mc.mmi.codes
					</a>
				</motion.div>

				<!-- Option 2: Launcher -->
				<motion.div
					class="bg-surface border border-surface-border rounded-3xl p-8 shadow-2xl shadow-black/10 flex flex-col gap-6 relative overflow-hidden group"
					:initial="{ opacity: 0, x: 20 }"
					:animate="{ opacity: 1, x: 0 }"
					:transition="{ delay: 0.3 }"
				>
					<div class="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all"></div>
					<div class="flex items-center gap-4 relative z-10">
						<div
							class="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20"
						>
							<ComputerDesktopIcon class="w-8 h-8 text-teal-400" />
						</div>
						<div>
							<h3 class="text-2xl font-bold">Via le Jeu Minecraft</h3>
							<p class="text-sm text-subtext mt-1">Si vous possédez le launcher classique</p>
						</div>
					</div>

					<div class="space-y-5 flex-grow relative z-10">
						<p class="text-subtext leading-relaxed">
							Lancez votre jeu classique et ajoutez le serveur dans votre liste multijoueur :
						</p>
						<div class="flex flex-col gap-4">
							<div
								class="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-black/20 rounded-xl p-4 border border-white/5 gap-2"
							>
								<span class="text-subtext font-medium">Adresse du serveur</span>
								<div class="bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
									<span class="font-mono font-bold text-emerald-400 select-all text-lg">mcmi.mmi.codes</span>
								</div>
							</div>
							<div
								class="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-black/20 rounded-xl p-4 border border-white/5 gap-2"
							>
								<span class="text-subtext font-medium">Version requise</span>
								<div class="bg-black/40 px-3 py-1 rounded-lg border border-white/10">
									<span class="font-bold text-teal-400">Vanilla 1.12.2</span>
								</div>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</div>

		<!-- Alerte pseudo -->
		<motion.div
			class="max-w-3xl mx-auto w-full"
			:initial="{ opacity: 0, y: 20 }"
			:animate="{ opacity: 1, y: 0 }"
			:transition="{ delay: 0.4 }"
		>
			<div
				class="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left shadow-lg shadow-black/5"
			>
				<div class="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 flex-shrink-0 mt-1">
					<ExclamationTriangleIcon class="w-8 h-8 text-emerald-400" />
				</div>
				<div class="space-y-2">
					<h4 class="text-xl font-bold text-emerald-400">
						Choisissez bien votre pseudo !
					</h4>
					<p class="text-subtext leading-relaxed">
						C'est exactement ce pseudo qui vous permettra de vous reconnecter plus tard et de sauvegarder votre progression (inventaire, stuffs, factions). Retenez-le bien lors de votre première connexion !
					</p>
				</div>
			</div>
		</motion.div>
	</main>
</template>
