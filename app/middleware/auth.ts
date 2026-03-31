export default defineNuxtRouteMiddleware(async (to) => {
	try {
		const { session, refreshSession } = useSession();
		const { valid } = await refreshSession();

		if (valid && session.value?.id) {
			return;
		}
	} catch {
		return navigateTo(
			`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`,
		);
	}

	return navigateTo(
		`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`,
	);
});
