export default defineNuxtRouteMiddleware((to) => {
	// Exécuter uniquement côté client pour vérifier le state
	if (import.meta.server) return;

	// Si l'utilisateur est déjà sur une page liée à l'authentification (callback), ignorer
	if (to.path.startsWith('/api/') || to.path === '/callback' || to.path.includes('auth')) {
		return;
	}

	const { session } = useSession();
	
	// S'il est déjà connecté, on considère que la vérification est bonne
	if (session.value?.id) {
		return;
	}

	// Regarder si on a déjà fait le silent check dans cette session locale
	const hasChecked = localStorage.getItem("mmi_silent_checked");
	
	if (!hasChecked) {
		console.log("[Silent Auth] Première visite de session, vérification OIDC silencieuse...");
		localStorage.setItem("mmi_silent_checked", "1");
		// Rediriger vers l'authentification silencieuse
		
		const targetUrl = new URL(window.location.href);
		targetUrl.pathname = '/api/auth/login';
		targetUrl.searchParams.set('prompt', 'none');
		targetUrl.searchParams.set('redirect', to.fullPath);
		
		window.location.href = targetUrl.toString();
		
		// Empêcher le chargement de la route courante en attendant la redirection
		return abortNavigation();
	}
});
