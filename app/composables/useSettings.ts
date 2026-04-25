import type { Settings } from "~~/shared/types/settings";
import { defaultSettings } from "~~/shared/sample";
import { defu } from "defu";
import { createStateSyncEngine, getProfile, getRemoteAppPreferencesRecord, getLocalAppPreferences, saveRemoteAppPreferencesIfUnchanged, setLocalAppPreferences, setPreference, getPreference } from "@mmiplace/mmi-core";

const SETTINGS_VERSION = "1.2";
const APP_ID = "mmi-place";
let activeLoadPromise: Promise<void> | null = null;
let activeLoadSessionId: string | null = null;

const cloneDefaultSettings = (): Settings => JSON.parse(JSON.stringify(defaultSettings)) as Settings;

function canonicalizeForSerialization<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeForSerialization(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = canonicalizeForSerialization((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {}) as T;
  }

  return value;
}

const serializeSettings = (value: Settings): string => JSON.stringify(canonicalizeForSerialization(value));

const uniqueBy = <T>(items: T[], getKey: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeSettings = (input?: Partial<Settings> | null): Settings => {
  const merged = defu(input || {}, cloneDefaultSettings()) as Settings;

  if (Array.isArray(input?.customization?.links)) {
    merged.customization.links = [...input.customization.links];
  }
  if (Array.isArray(input?.customization?.sectionOrders)) {
    merged.customization.sectionOrders = [...input.customization.sectionOrders];
  }
  if (Array.isArray(input?.customization?.pinnedTools)) {
    merged.customization.pinnedTools = [...input.customization.pinnedTools];
  }
  if (Array.isArray(input?.widgets?.messages?.channels)) {
    merged.widgets.messages.channels = [...input.widgets.messages.channels];
  }
  if (Array.isArray(input?.widgets?.messages?.readMessages)) {
    merged.widgets.messages.readMessages = [...input.widgets.messages.readMessages];
  }
  if (Array.isArray(input?.widgets?.planup?.tasks)) {
    merged.widgets.planup.tasks = [...input.widgets.planup.tasks];
  }
  if (Array.isArray(input?.widgets?.planup?.tags)) {
    merged.widgets.planup.tags = [...input.widgets.planup.tags];
  }

  merged.customization.links = uniqueBy(
    merged.customization.links.filter((link) => link?.name?.trim() && link?.url?.trim()),
    (link) => `${link.name.trim().toLowerCase()}::${link.url.trim()}`,
  );
  merged.customization.sectionOrders = Array.from(new Set(merged.customization.sectionOrders.filter((section) => ["students", "official", "resource"].includes(section)))) as Settings["customization"]["sectionOrders"];
  merged.customization.pinnedTools = Array.from(new Set(merged.customization.pinnedTools));
  merged.widgets.messages.channels = Array.from(new Set(merged.widgets.messages.channels));
  merged.widgets.messages.readMessages = Array.from(new Set(merged.widgets.messages.readMessages));
  merged.widgets.planup.tags = uniqueBy(merged.widgets.planup.tags, (tag) => String(tag.id));

  merged.version = SETTINGS_VERSION;
  return merged;
};

export const useSettings = () => {
  const settings = useState<Settings>("settings", () => cloneDefaultSettings());
  const loading = useState<boolean>("settings-loading", () => false);
  const error = useState<Error | null>("settings-error", () => null);
  const saving = useState<boolean>("settings-saving", () => false);
  const syncEngine = useState<ReturnType<typeof createStateSyncEngine<Settings>> | null>("settings-sync-engine", () => null);

  const { session } = useSession();

  const readLocalSettings = (): Settings => {
    return normalizeSettings(getLocalAppPreferences<Partial<Settings>>(APP_ID));
  };

  const writeLocalSettings = (nextSettings: Settings) => {
    setLocalAppPreferences(APP_ID, normalizeSettings(nextSettings));
  };

  const commitLocalSettings = (nextSettings: Settings) => {
    const normalizedSettings = normalizeSettings(nextSettings);
    writeLocalSettings(normalizedSettings);
    persistThemePreference(normalizedSettings.appearence.theme);
    if (serializeSettings(settings.value) !== serializeSettings(normalizedSettings)) {
      settings.value = normalizedSettings;
    }
    applySettings();
    return normalizedSettings;
  };

  const persistThemePreference = (theme: Settings["appearence"]["theme"]) => {
    try {
      setPreference("theme", theme === "dark" ? "dark" : "light");
    } catch (preferenceError) {
      console.error("[mmi-place] persistThemePreference failed", preferenceError);
    }
  };

  const ensureSyncEngine = () => {
    if (syncEngine.value) return syncEngine.value;

    syncEngine.value = createStateSyncEngine<Settings>({
      debounceMs: 220,
      maxRetries: 4,
      normalize: normalizeSettings,
      serialize: serializeSettings,
      canSync: () => Boolean(session.value?.id),
      applyLocal: (state) => {
        commitLocalSettings(state);
      },
      loadRemote: async () => {
        const { record, error: remoteError } = await getRemoteAppPreferencesRecord<Partial<Settings>>(APP_ID);
        if (remoteError) {
          return {
            state: null,
            version: null,
            error: remoteError,
          };
        }

        return {
          state: record?.settings ? normalizeSettings(record.settings) : null,
          version: record?.updated_at ?? null,
          error: null,
        };
      },
      saveRemoteIfUnchanged: async (state, expectedVersion) => {
        const result = await saveRemoteAppPreferencesIfUnchanged(APP_ID, state, expectedVersion);
        return {
          status: result.status,
          state: result.record?.settings ? normalizeSettings(result.record.settings) : null,
          version: result.record?.updated_at ?? null,
          error: result.error,
        };
      },
      onSavingChange: (value) => {
        saving.value = value;
      },
      onError: (syncError) => {
        error.value = new Error(syncError.message);
      },
      onSynced: (state) => {
        commitLocalSettings(state);
      },
    });

    return syncEngine.value;
  };

  const loadSettings = async () => {
    if (typeof window === "undefined") return;
    const currentSessionId = session.value?.id ?? null;

    if (activeLoadPromise && activeLoadSessionId === currentSessionId) {
      await activeLoadPromise;
      return;
    }

    const runLoad = async () => {
      loading.value = true;
      error.value = null;

      try {
        // 1. Charger local
        const localSettings = readLocalSettings();

        let resolvedSettings = localSettings;
        let profile = null;

        // Charger thème partagé
        const theme = getPreference("theme") as "system" | "dark" | "light" | null;
        if (theme && theme !== "system") {
          resolvedSettings.appearence.theme = theme === "dark" ? "dark" : "light";
        }

        // 2. Si connecte : bootstrap du moteur (remote > local)
        if (session.value?.id) {
          [profile] = await Promise.all([getProfile()]);

          // Pour un compte neuf sans preferences distantes, on veut que le tout
          // premier enregistrement parte deja avec le groupe du profil afin
          // d'eviter un insert initial puis un update immediat juste apres.
          if (profile) {
            const profileGroup = profile.groupe ?? null;
            const currentGroup = resolvedSettings.widgets.vencat.group ?? null;

            if (profileGroup !== currentGroup) {
              resolvedSettings = normalizeSettings({
                ...resolvedSettings,
                widgets: {
                  ...resolvedSettings.widgets,
                  vencat: {
                    ...resolvedSettings.widgets.vencat,
                    group: profileGroup,
                  },
                },
              });
            }
          }

          resolvedSettings = await ensureSyncEngine().bootstrap(resolvedSettings);

          // Si un etat distant existait deja et differe encore du profil,
          // on pousse alors une seule mise a jour ciblee.
          if (profile) {
            const profileGroup = profile.groupe ?? null;
            const currentGroup = resolvedSettings.widgets.vencat.group ?? null;

            if (profileGroup !== currentGroup) {
              resolvedSettings = normalizeSettings({
                ...resolvedSettings,
                widgets: {
                  ...resolvedSettings.widgets,
                  vencat: {
                    ...resolvedSettings.widgets.vencat,
                    group: profileGroup,
                  },
                },
              });

              ensureSyncEngine().queueState(resolvedSettings, { immediate: true });
            }
          }
        } else {
          // Pas connecte: local only
          resolvedSettings = commitLocalSettings(resolvedSettings);
          if (syncEngine.value) {
            syncEngine.value.dispose();
            syncEngine.value = null;
          }
        }
      } catch (e) {
        error.value = e as Error;
        console.error("[mmi-place] loadSettings failed", e);
      } finally {
        loading.value = false;
      }
    };

    activeLoadSessionId = currentSessionId;
    const currentLoadPromise = runLoad();
    activeLoadPromise = currentLoadPromise;

    try {
      await currentLoadPromise;
    } finally {
      if (activeLoadPromise === currentLoadPromise) {
        activeLoadPromise = null;
        activeLoadSessionId = null;
      }
    }
  };

  const applySettings = () => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const { theme, contrast, text } = settings.value.appearence;

    if (theme === "dark") {
      root.classList.add("theme-dark");
      root.classList.remove("theme-light");
    } else {
      root.classList.add("theme-light");
      root.classList.remove("theme-dark");
    }

    if (contrast === "high") {
      root.classList.add("contrast-high");
      root.classList.remove("contrast-normal");
    } else {
      root.classList.add("contrast-normal");
      root.classList.remove("contrast-high");
    }

    if (text.size === "small") {
      root.classList.add("text-small");
      root.classList.remove("text-medium", "text-large");
    } else if (text.size === "large") {
      root.classList.add("text-large");
      root.classList.remove("text-small", "text-medium");
    } else {
      root.classList.add("text-medium");
      root.classList.remove("text-small", "text-large");
    }

    root.classList.toggle("apply-dyslexia", text.dyslexia);
  };

  const saveSettings = (immediate = false) => {
    if (typeof window === "undefined") return;

    const normalizedSettings = commitLocalSettings(settings.value);

    if (!session.value?.id) return;

    ensureSyncEngine().queueState(normalizedSettings, { immediate });
  };

  const resetSettings = () => {
    commitLocalSettings(cloneDefaultSettings());
    void saveSettings(true);
  };

  return {
    settings,
    loading,
    saving,
    error,
    loadSettings,
    saveSettings,
    applySettings,
    resetSettings,
  };
};
