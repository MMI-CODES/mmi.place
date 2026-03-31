import type { Settings } from "./types/settings";

export const defaultSettings: Settings = {
	version: "1.2",
	appearence: {
		theme: "light",
		contrast: "normal",
		text: {
			size: "medium",
			dyslexia: false,
		},
	},
	customization: {
		links: [
			{
				name: "Minecraft",
				url: "/minecraft",
			},
		],
		sectionOrders: ["students", "official", "resource"],
		pinnedTools: [],
	},
	widgets: {
		carrousel: true,
		carrouselRate: 5000,
		messages: {
			enabled: true,
			channels: [0, 1, 2],
			readMessages: [],
		},
		vencat: {
			enabled: true,
			group: null,
		},
		planup: {
			enabled: false,
			group: null,
			tasks: [],
			tags: [],
		},
	},
};
