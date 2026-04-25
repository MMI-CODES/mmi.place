export default defineNuxtRouteMiddleware(async (to) => {
  const { forceRefreshSession } = useSession();
  const result = await forceRefreshSession();
  if (!result.valid) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
