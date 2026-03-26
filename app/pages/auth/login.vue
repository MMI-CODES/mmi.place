<script setup>
definePageMeta({
	name: "Connexion",
	title: "MMI Place - Connexion",
	description:
		"Bienvenue sur MMI Place, votre tableau de bord personnalisé pour les étudiants en MMI. Accédez rapidement à vos outils, messages et planning, et personnalisez votre expérience selon vos préférences.",
});

const route = useRoute();

const redirect = computed(() => {
	const value = route.query.redirect;
	return typeof value === "string" && value.startsWith("/") ? value : "/";
});

const loading = ref(false);
const authError = ref("");
const session = ref({
	authenticated: false,
	user: null,
});

async function refreshSession() {
	try {
		session.value = await $fetch("/api/auth/session", {
			cache: "no-store",
			headers: {
				"cache-control": "no-cache",
			},
		});
	} catch {
		session.value = { authenticated: false, user: null };
	}
}

async function startLogin() {
	loading.value = true;
	authError.value = "";

	try {
		await navigateTo(
			`/api/auth/login?redirect=${encodeURIComponent(redirect.value)}`,
			{
				external: true,
			},
		);
	} catch (error) {
		authError.value =
			error instanceof Error ? error.message : "Login failed";
		loading.value = false;
	}
}

async function logout() {
	await $fetch("/api/auth/logout", { method: "POST" });
	session.value = { authenticated: false, user: null };
	await refreshSession();
}

onMounted(refreshSession);
</script>
<template>
	<main class="container py-16 max-w-xl space-y-4">
		<h1 class="text-3xl font-bold mb-4">Connexion</h1>
		<p class="text-subtext mb-8">
			Connectez-vous pour acceder à votre session.
		</p>

		<div class="space-y-4">
			<div
				v-if="session.authenticated"
				class="px-6 py-4 rounded-2xl border border-surface-border bg-surface"
			>
				<p class="font-semibold">Session active</p>
				<p class="text-subtext text-sm">
					{{
						session.user?.name ||
						session.user?.email ||
						"Utilisateur"
					}}
				</p>
			</div>

			<p v-if="authError" class="text-danger">{{ authError }}</p>

			<div class="flex gap-3">
				<Button
					:label="session.authenticated ? 'Changer de compte' : 'Se connecter'"
					btnStyle="NEUTRAL"
					:handler="startLogin"
				/>
				<Button
					v-if="session.authenticated"
					label="Se deconnecter"
					btnStyle="TAB"
					:handler="logout"
				/>
			</div>
		</div>

		<section
			class="bg-surface text-on-surface border border-surface-border rounded-3xl px-8 py-6 space-y-4"
		>
			<h2 class="text-xl font-semibold mb-2">Compte MMI Place</h2>
			<p>
				Vous devrez créer un compte MMI Place en utilisant votre adresse
				mail UVSQ (impérativement) et un mot de passe spécifique au
				site. Une fois votre compte créé, vous pourrez vous connecter
				avec votre compte Google, Github ou Discord.
			</p>
			<Button
				label="En savoir plus"
				btnStyle="LINK"
				handler="/blog/20260323_bienvenue_sur_mmi_place#compte-mmi-place"
			/>
		</section>
	</main>
</template>
