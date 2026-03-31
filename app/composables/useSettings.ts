import type { Settings } from "~~/shared/types/settings";
import { defaultSettings } from "~~/shared/sample";
import { defu } from "defu";

export const useSettings = () => {
	const settings = useState<Settings>("settings", () => defaultSettings);

	const loading = useState<boolean>("settings-loading", () => false);
	const error = useState<Error | null>("settings-error", () => null);

	const { session } = useSession();

	// Cookie partage avec les sous-domaines (.mmi.codes)
	const getGroupsCookie = () => useCookie<any>("mmi_groups", { maxAge: 31536000, path: "/", sameSite: "lax" });

	const loadSettings = async () => {
		if (typeof window === "undefined") return;

		loading.value = true;
		try {
			// 1. Charger depuis le LocalStorage (UI en premier)
			const localDataRaw = localStorage.getItem("mmi-place-settings") || null;
			let localData: Partial<Settings> | null = null;
			if (localDataRaw) {
				localData = JSON.parse(localDataRaw);
				
				// Versioning : Si ancienne version, on merge avec les valeurs par defaut pour ne pas perdre les nouvelles cles
				if (!localData || localData.version !== "1.2") {
					console.log("[Settings] Migration depuis une ancienne version de config...");
					localData = defu(localData || {}, defaultSettings) as Settings;
					localData.version = "1.2";
				}
				settings.value = localData as Settings;
			} else {
				settings.value = JSON.parse(JSON.stringify(defaultSettings));
			}

			// 2. Mettre a jour depuis le Cookie si present (Priorite aux groupes PWA)
			const cookieVal = getGroupsCookie().value;
			if (cookieVal) {
				if (cookieVal.vencat) settings.value.widgets.vencat.group = cookieVal.vencat;
				if (cookieVal.planup) settings.value.widgets.planup.group = cookieVal.planup;
			}

			applySettings();

			// 3. Synchroniser depuis le Cloud si l'utilisateur est connecte (await pour appliquer immediatement)
			if (session.value?.id) {
				await syncFromCloud();
			} else {
				// S'il n'est pas encore connecté, le session.value peut se remplir quelques millisecondes plus tard 
				// (ex: retour d'auth OIDC invisible). On écoute ce changement pour recharger la config !
				const unwatch = watch(() => session.value?.id, (newId) => {
					if (newId) {
						syncFromCloud();
						unwatch(); // On ne l'exécute qu'une fois
					}
				});
			}

		} catch (e) {
			error.value = e as Error;
		} finally {
			loading.value = false;
		}
	};

	const syncFromCloud = async () => {
		try {
			const res = await $fetch<{ settings: Settings | null }>("/api/me/settings");
			if (res && res.settings && res.settings.version) {
				console.log("[Settings] Configuration Cloud recuperee avec succes.");
				
				// On ecrase le local par le cloud (Source de verite)
				// Migration si le cloud a une vieille version
				let cloudData = res.settings;
				if (cloudData.version !== "1.2") {
					cloudData = defu(cloudData, defaultSettings) as Settings;
					cloudData.version = "1.2";
				}
				
				settings.value = cloudData;
				
				applySettings();
				// On sauvegarde en local pour refleter le cloud
				saveToLocal();
			}
		} catch (e) {
			console.error("[Settings] Erreur synchro cloud:", e);
		}
	};

	const applySettings = () => {
		if (typeof window === "undefined") return;

		let theme = settings.value.appearence.theme;
		let contrast = settings.value.appearence.contrast;
		let text = settings.value.appearence.text;

		const root = document.documentElement;

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
		} else if (text.size === "medium") {
			root.classList.add("text-medium");
			root.classList.remove("text-small", "text-large");
		} else {
			root.classList.add("text-large");
			root.classList.remove("text-small", "text-medium");
		}

		if (text.dyslexia) {
			root.classList.add("apply-dyslexia");
		} else {
			root.classList.remove("apply-dyslexia");
		}
	};

	const resetSettings = () => {
		settings.value = JSON.parse(JSON.stringify(defaultSettings));
		saveSettings();
	};

	const saveToLocal = () => {
		if (typeof window === "undefined") return;
		
		try {
			settings.value.version = "1.2";

			// LocalStorage
			localStorage.setItem(
				"mmi-place-settings",
				JSON.stringify(settings.value),
			);

			// Cookie partagé (MMI Groups)
			const groupsCookie = getGroupsCookie();
			groupsCookie.value = {
				vencat: settings.value.widgets.vencat.group,
				planup: settings.value.widgets.planup.group,
			};
		} catch (e) {
			error.value = e as Error;
		}
	};

	const syncToCloud = () => {
		if (!session.value?.id) return;
		// Non bloquant en arriere plan
		$fetch("/api/me/settings", {
			method: "POST",
			body: { settings: settings.value }
		}).catch(console.error);
	};

	const saveSettings = () => {
		saveToLocal();
		syncToCloud();
	};

	return {
		settings,
		loading,
		error,
		loadSettings,
		saveSettings,
		applySettings,
		resetSettings,
	};
};
