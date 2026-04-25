<script setup lang="ts">
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/vue/24/outline";

definePageMeta({
  name: "Préférences",
  title: "MMI Place - Préférences",
  description: "Parametres d apparence, de personnalisation et de widgets pour MMI Place.",
});

import { updateProfile } from "@mmiplace/mmi-core";

const { channels, fetchChannels } = useChannels();
const { settings, applySettings, loadSettings, saveSettings, resetSettings } = useSettings();
const { session, refreshSession } = useSession();
const { fetchAcademicGroups, yearOptions, groupsByYear, getYearCodeForGroup, getStudyYearForYearCode, getDefaultGroupForYearCode } = useAcademicGroups();
const settingsReady = ref(false);
const profileSaving = ref(false);
const profileError = ref("");
const profileSuccess = ref("");

const route = useRoute();
const tab = ref<"appearence" | "customization" | "widgets">((route.query.tab as any) || "appearence");
const vencatYear = ref<string | null>(null);
const planupYear = ref<string | null>(null);

const syncGroupWithYear = (target: Ref<string | null>, yearCode: string | null) => {
  if (!yearCode) {
    target.value = null;
    return;
  }

  const options = groupsByYear.value[yearCode] || [];
  if (!target.value || !options.some((option) => option.value === target.value)) {
    target.value = getDefaultGroupForYearCode(yearCode);
  }
};

watch(vencatYear, (newYear) => {
  if (session.value?.id) return;
  syncGroupWithYear(toRef(settings.value.widgets.vencat, "group"), newYear);
});

watch(planupYear, (newYear) => {
  syncGroupWithYear(toRef(settings.value.widgets.planup, "group"), newYear);
});

const sectionLabels: Record<string, string> = {
  students: "Outils étudiants",
  official: "Outils officiels",
  resource: "Ressources",
};

const moveSection = (index: number, direction: number) => {
  const arr = settings.value.customization.sectionOrders;
  if (index + direction >= 0 && index + direction < arr.length) {
    const temp = arr[index];
    arr[index] = arr[index + direction]!;
    arr[index + direction] = temp!;
  }
};

const textSizes = ["small", "medium", "large"] as const;
const textSizesLabels = { small: "Petit", medium: "Moyen", large: "Grand" };

const decreaseTextSize = () => {
  const idx = textSizes.indexOf(settings.value.appearence.text.size);
  if (idx > 0) settings.value.appearence.text.size = textSizes[idx - 1] || "medium";
};

const increaseTextSize = () => {
  const idx = textSizes.indexOf(settings.value.appearence.text.size);
  if (idx < textSizes.length - 1) settings.value.appearence.text.size = textSizes[idx + 1] || "medium";
};

const messagesRateOptions = [
  { label: "5 secondes", value: 5000, style: "neutral" as const },
  { label: "10 secondes", value: 10000, style: "neutral" as const },
  { label: "15 secondes", value: 15000, style: "neutral" as const },
  { label: "30 secondes", value: 30000, style: "neutral" as const },
  { label: "60 secondes", value: 60000, style: "neutral" as const },
];

const newLink = ref({ name: "", url: "" });

const addLink = () => {
  const name = newLink.value.name.trim();
  const url = newLink.value.url.trim();
  if (!name || !url) return;
  settings.value.customization.links.push({ name, url });
  newLink.value = { name: "", url: "" };
};

const removeLink = (index: number) => {
  settings.value.customization.links.splice(index, 1);
};

const isChannelEnabled = (channelId: number) => settings.value.widgets.messages.channels.includes(channelId);

const toggleChannel = (channelId: number) => {
  const list = settings.value.widgets.messages.channels;
  const index = list.findIndex((id) => id === channelId);
  if (index >= 0) list.splice(index, 1);
  else list.push(channelId);
};

const persistVencatProfilePreferences = async () => {
  if (!session.value?.id || profileSaving.value) return;

  profileSaving.value = true;
  profileError.value = "";
  profileSuccess.value = "";

  const { error } = await updateProfile({
    groupe: settings.value.widgets.vencat.group || null,
    annee: getStudyYearForYearCode(vencatYear.value),
  });

  if (error) {
    profileError.value = error.message;
  } else {
    profileSuccess.value = "Groupe Vencat synchronisé avec le compte.";
    await refreshSession();
  }

  profileSaving.value = false;
};

const onVencatYearChange = async (value: unknown) => {
  const nextYearCode = typeof value === "string" ? value : null;
  vencatYear.value = nextYearCode;
  syncGroupWithYear(toRef(settings.value.widgets.vencat, "group"), nextYearCode);
  await persistVencatProfilePreferences();
};

const onVencatGroupChange = async (value: unknown) => {
  settings.value.widgets.vencat.group = typeof value === "string" ? value : null;
  await persistVencatProfilePreferences();
};

onMounted(async () => {
  await Promise.all([loadSettings(), fetchAcademicGroups()]);
  vencatYear.value = getYearCodeForGroup(settings.value.widgets.vencat.group || null);
  planupYear.value = getYearCodeForGroup(settings.value.widgets.planup.group || null);
  settingsReady.value = true;
  void fetchChannels();
});

watch(
  () => settings.value,
  () => {
    if (!settingsReady.value) return;
    applySettings();
    void saveSettings();
  },
  { deep: true },
);
</script>

<template>
  <main v-if="!settingsReady" class="container max-w-2xl py-10 text-center text-subtext">Chargement des paramètres...</main>
  <template v-else>
    <header class="container flex flex-col items-center gap-4">
      <h1 class="text-4xl font-bold">Paramètres</h1>
      <Button label="Réinitialiser" btnStyle="DANGER" :handler="resetSettings" />
    </header>
    <div class="container flex justify-center gap-4 my-4">
      <Button
        label="Apparence"
        :btnStyle="tab === 'appearence' ? 'TAB:ACTIVE' : 'TAB'"
        :handler="
          () => {
            tab = 'appearence';
          }
        "
      />
      <Button
        label="Personnalisation"
        :btnStyle="tab === 'customization' ? 'TAB:ACTIVE' : 'TAB'"
        :handler="
          () => {
            tab = 'customization';
          }
        "
      />
      <Button
        label="Widgets"
        :btnStyle="tab === 'widgets' ? 'TAB:ACTIVE' : 'TAB'"
        :handler="
          () => {
            tab = 'widgets';
          }
        "
      />
    </div>
    <main v-if="tab === 'appearence'" class="container flex flex-col gap-10 max-w-2xl mx-auto">
      <section class="flex flex-col gap-4">
        <h2 class="text-2xl font-bold border-b border-surface-border pb-2">Apparence Globale</h2>
        <div class="flex items-center justify-between p-4 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-2xl">
          <div class="flex items-center gap-3 font-medium">Mode sombre</div>
          <Switch :modelValue="settings.appearence.theme === 'dark'" @update:modelValue="(val) => (settings.appearence.theme = val ? 'dark' : 'light')" />
        </div>
        <div class="flex items-center justify-between p-4 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-2xl">
          <span class="font-medium">Contraste élevé</span>
          <Switch :modelValue="settings.appearence.contrast === 'high'" @update:modelValue="(val) => (settings.appearence.contrast = val ? 'high' : 'normal')" />
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-2xl font-bold border-b border-surface-border pb-2">Texte et Typographie</h2>
        <div class="flex items-center justify-between p-4 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-2xl">
          <span class="font-medium">Taille du texte</span>
          <div class="flex items-center gap-4">
            <button class="w-10 h-10 flex justify-center items-center bg-button text-on-button rounded-full hover:bg-button-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-xl" :disabled="settings.appearence.text.size === 'small'" @click="decreaseTextSize">-</button>
            <span class="w-16 text-center font-semibold text-primary">{{ textSizesLabels[settings.appearence.text.size] }}</span>
            <button class="w-10 h-10 flex justify-center items-center bg-button text-on-button rounded-full hover:bg-button-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-xl" :disabled="settings.appearence.text.size === 'large'" @click="increaseTextSize">+</button>
          </div>
        </div>
        <div class="flex items-center justify-between p-4 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-2xl">
          <div class="flex flex-col">
            <span class="font-medium">Police dyslexie</span>
            <span class="text-xs text-subtext">Ameliore la lisibilite</span>
          </div>
          <Switch v-model="settings.appearence.text.dyslexia" />
        </div>
      </section>
    </main>
    <main v-else-if="tab === 'customization'" class="container flex flex-col gap-10 max-w-2xl mx-auto">
      <section class="flex flex-col gap-4">
        <h2 class="text-2xl font-bold border-b border-surface-border pb-2">Liens rapides</h2>
        <p class="text-subtext text-sm">Ajoutez vos propres liens qui s afficheront dans l entete.</p>
        <div class="flex flex-col sm:flex-row gap-2 mt-2">
          <input v-model="newLink.name" type="text" placeholder="Nom (ex: Mon portfolio)" class="flex-1 h-12 rounded-xl border border-button-border bg-surface/95 backdrop-blur-xl px-4 focus:outline-none focus:border-primary transition-colors" />
          <input v-model="newLink.url" type="text" placeholder="https://..." class="flex-1 h-12 rounded-xl border border-button-border bg-surface/95 backdrop-blur-xl px-4 focus:outline-none focus:border-primary transition-colors" />
          <Button label="Ajouter" btnStyle="PRIMARY" :handler="addLink" />
        </div>
        <div class="flex flex-col gap-3 mt-4">
          <div v-for="(link, index) in settings.customization.links" :key="`${link.name}-${index}`" class="flex items-center justify-between rounded-2xl border border-surface-border bg-surface/95 backdrop-blur-xl px-5 py-4">
            <div class="flex flex-col">
              <span class="font-semibold text-primary">{{ link.name }}</span>
              <span class="text-subtext text-sm hover:underline"
                ><a :href="link.url" target="_blank" rel="noreferrer">{{ link.url }}</a></span
              >
            </div>
            <Button label="Retirer" btnStyle="DANGER" :handler="() => removeLink(index)" />
          </div>
          <div v-if="!settings.customization.links.length" class="text-center text-subtext py-4">Aucun lien personnalise.</div>
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="text-2xl font-bold border-b border-surface-border pb-2">Ordre des sections</h2>
        <p class="text-subtext text-sm">Reorganisez l affichage des groupes d outils sur votre accueil.</p>
        <div class="flex flex-col gap-3">
          <div v-for="(section, index) in settings.customization.sectionOrders" :key="section" class="flex items-center justify-between bg-surface/95 backdrop-blur-xl border border-surface-border rounded-2xl px-5 py-4">
            <div class="flex items-center gap-4">
              <span class="text-subtext font-bold text-lg bg-surface-border/60 w-8 h-8 rounded-full flex items-center justify-center">{{ index + 1 }}</span>
              <span class="font-medium text-lg">{{ sectionLabels[section] }}</span>
            </div>
            <div class="flex flex-col gap-2">
              <button class="text-subtext hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed p-1 transition-all" :disabled="index === 0" @click="moveSection(index, -1)">
                <ChevronUpIcon class="w-6 h-6" />
              </button>
              <button class="text-subtext hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed p-1 transition-all" :disabled="index === settings.customization.sectionOrders.length - 1" @click="moveSection(index, 1)">
                <ChevronDownIcon class="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
    <main v-else class="container flex flex-col gap-10 max-w-2xl mx-auto">
      <section class="flex flex-col gap-4">
        <div class="flex justify-between items-center border-b border-surface-border pb-2">
          <h2 class="text-2xl font-bold">Vencat (Emploi du temps)</h2>
          <Switch v-model="settings.widgets.vencat.enabled" />
        </div>
        <div v-if="settings.widgets.vencat.enabled" class="flex flex-col gap-4 p-5 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-2xl">
          <p class="text-subtext text-sm">
            <span v-if="session">Le groupe Vencat est le même que celui de ton compte. Le changer ici met aussi à jour ton profil.</span>
            <span v-else>Selectionnez votre groupe pour afficher votre prochain cours sur l accueil.</span>
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1 flex flex-col gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-subtext ml-1">Annee / Parcours</span>
              <Select :options="yearOptions" v-model="vencatYear" :handler="session ? onVencatYearChange : undefined" />
            </div>
            <div v-if="vencatYear && groupsByYear[vencatYear]" class="flex-1 flex flex-col gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-subtext ml-1">Groupe</span>
              <Select :options="groupsByYear[vencatYear] || []" v-model="settings.widgets.vencat.group" :handler="session ? onVencatGroupChange : undefined" />
            </div>
          </div>
          <p v-if="session && profileSaving" class="text-sm text-subtext">Synchronisation du compte...</p>
          <p v-else-if="session && profileError" class="text-sm text-danger">{{ profileError }}</p>
          <p v-else-if="session && profileSuccess" class="text-sm text-success">{{ profileSuccess }}</p>
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <div class="flex justify-between items-center border-b border-surface-border pb-2">
          <h2 class="text-2xl font-bold">PlanUP (Taches)</h2>
          <Switch v-model="settings.widgets.planup.enabled" />
        </div>
        <div v-if="settings.widgets.planup.enabled" class="flex flex-col gap-4 p-5 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-2xl">
          <p class="text-subtext text-sm">Configurez le groupe a utiliser pour le widget de taches.</p>
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1 flex flex-col gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-subtext ml-1">Annee / Parcours</span>
              <Select :options="yearOptions" v-model="planupYear" />
            </div>
            <div v-if="planupYear && groupsByYear[planupYear]" class="flex-1 flex flex-col gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-subtext ml-1">Groupe</span>
              <Select :options="groupsByYear[planupYear] || []" v-model="settings.widgets.planup.group" />
            </div>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <div class="flex justify-between items-center border-b border-surface-border pb-2">
          <h2 class="text-2xl font-bold">Messages Campus</h2>
          <Switch v-model="settings.widgets.messages.enabled" />
        </div>
        <div v-if="settings.widgets.messages.enabled" class="flex flex-col gap-5 p-5 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-2xl">
          <div class="flex flex-col gap-3">
            <span class="font-medium">Defilement automatique (Carrousel)</span>
            <div class="flex items-center gap-4">
              <Switch v-model="settings.widgets.carrousel" />
              <Select v-if="settings.widgets.carrousel" :options="messagesRateOptions" v-model="settings.widgets.carrouselRate" />
            </div>
          </div>

          <hr class="border-surface-border" />

          <div class="flex flex-col gap-3">
            <span class="font-medium">Canaux de communication suivis</span>
            <div class="flex flex-wrap gap-2">
              <Button v-for="channel in channels" :key="channel.id" :label="channel.title" :btnStyle="isChannelEnabled(channel.id) ? 'PRIMARY' : 'NEUTRAL'" :handler="() => toggleChannel(channel.id)" />
            </div>
          </div>

          <hr class="border-surface-border" />

          <Button
            label="Reinitialiser les messages lus"
            :btnStyle="settings.widgets.messages.readMessages.length ? 'NEUTRAL' : 'DANGER'"
            :handler="
              () => {
                settings.widgets.messages.readMessages = [];
              }
            "
          />
        </div>
      </section>
    </main>
  </template>
</template>
