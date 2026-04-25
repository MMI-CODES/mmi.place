import { refreshAuthState, resolveAuthState, type AppSessionSnapshot } from "@mmiplace/mmi-core";

export const useSession = () => {
  const session = useState<AppSessionSnapshot | null>("session-data", () => null);

  const loading = useState<boolean>("session-loading", () => false);
  const error = useState<Error | null>("session-error", () => null);

  const refreshSession = async (): Promise<{ valid: boolean }> => {
    loading.value = true;
    error.value = null;
    try {
      const authState = await resolveAuthState();
      session.value = authState.session;
      if (authState.error) {
        error.value = new Error(authState.error.message);
      }
      return { valid: authState.valid };
    } catch (e) {
      error.value = e as Error;
      session.value = null;
      return { valid: false };
    } finally {
      loading.value = false;
    }
  };

  const forceRefreshSession = async (): Promise<{ valid: boolean }> => {
    loading.value = true;
    error.value = null;
    try {
      const authState = await refreshAuthState();
      session.value = authState.session;
      if (authState.error) {
        error.value = new Error(authState.error.message);
      }
      return { valid: authState.valid };
    } catch (e) {
      error.value = e as Error;
      session.value = null;
      return { valid: false };
    } finally {
      loading.value = false;
    }
  };

  return { session, loading, error, refreshSession, forceRefreshSession };
};
