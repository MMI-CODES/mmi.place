<script setup lang="ts">
import { ArrowRightStartOnRectangleIcon, CheckCircleIcon, CircleStackIcon, EnvelopeIcon, KeyIcon, ShieldCheckIcon, SparklesIcon, UserPlusIcon } from "@heroicons/vue/24/outline";
import { getProfile, getUser, login, logout, register, resendSignupVerificationEmail, resetPassword, updatePassword, updateEmail, updateProfile, verifyEmailChangeCode, verifyRecoveryCode, verifySignupCode } from "@mmiplace/mmi-core";

definePageMeta({
  name: "Connexion",
  title: "MMI Place - Connexion",
});

type AuthMode = "login" | "register";

const route = useRoute();
const { session, refreshSession } = useSession();
const { fetchAcademicGroups, yearOptions, groupsByYear, getYearCodeForGroup, getStudyYearForYearCode, getYearCodeForStudyYear, getDefaultGroupForYearCode } = useAcademicGroups();

const mode = ref<AuthMode>("login");
const loading = ref(false);
const authError = ref("");
const authSuccess = ref("");
const profileLoading = ref(false);
const profileDraft = ref({
  yearCode: null as string | null,
  group: null as string | null,
});
const accountEmailUvsq = ref("");
const accountEmailUsage = ref("");
const pendingEmailUsage = ref("");
const pendingEmailUsageCode = ref("");

const loginEmail = ref("");
const loginPassword = ref("");

const registerEmail = ref("");
const registerPassword = ref("");
const registerPasswordConfirm = ref("");
const registerVerificationCode = ref("");
const pendingVerificationEmail = ref("");
const registerVerificationRequested = ref(false);

const resetEmail = ref("");
const resetCode = ref("");
const resetNewPassword = ref("");
const resetNewPasswordConfirm = ref("");
const resetSent = ref(false);
const resetRequestSent = ref(false);
const resetPanelOpen = ref(false);

const emailChangePanelOpen = ref(false);
const emailChangeRequestSent = ref(false);
const requestedEmailUsage = ref("");

const RESEND_CONFIRMATION_COOLDOWN_SECONDS = 60;
const RESEND_CONFIRMATION_COOLDOWN_STORAGE_KEY = "mmi-place:signup-resend-cooldown";
const resendConfirmationCooldownLeft = ref(0);
let resendConfirmationTimer: ReturnType<typeof setInterval> | null = null;
let accountHydrationToken = 0;

const redirect = computed(() => {
  const value = route.query.redirect;
  return typeof value === "string" && value.startsWith("/") ? value : "/";
});

const normalizedRegisterEmail = computed(() => registerEmail.value.trim().toLowerCase());
const displayIdentity = computed(() => {
  if (!session.value) return "-";
  return session.value.firstName || session.value.email || "-";
});
const displayRoleLabel = computed(() => {
  if (!session.value) return "-";
  switch (session.value.role) {
    case "admin":
      return "Administrateur";
    case "editor":
      return "Éditeur";
    case "reader":
      return "Étudiant";
    default:
      return "Utilisateur";
  }
});

function applyProfileToSession(profile?: Awaited<ReturnType<typeof getProfile>> | null, fallbackEmail?: string | null) {
  if (!session.value || !profile) return;

  session.value = {
    ...session.value,
    email: profile.email_auth || fallbackEmail || session.value.email,
    name: profile.prenom || session.value.name,
    firstName: profile.prenom || session.value.firstName,
    lastName: profile.nom || session.value.lastName,
    role: profile.role || session.value.role,
  };
}

const passwordChecks = computed(() => {
  const value = registerPassword.value;
  return [
    { label: "Au moins 8 caractères", valid: value.length >= 8 },
    { label: "Une lettre minuscule", valid: /[a-z]/.test(value) },
    { label: "Une lettre majuscule", valid: /[A-Z]/.test(value) },
    { label: "Un chiffre", valid: /\d/.test(value) },
  ];
});

const passwordScore = computed(() => passwordChecks.value.filter((item) => item.valid).length);

const passwordStrengthLabel = computed(() => {
  if (passwordScore.value <= 1) return "Faible";
  if (passwordScore.value <= 3) return "Correct";
  return "Solide";
});

const passwordStrengthClass = computed(() => {
  if (passwordScore.value <= 1) return "bg-danger";
  if (passwordScore.value <= 3) return "bg-primary";
  return "bg-success";
});

const isRegisterFormValid = computed(() => {
  return /^[^@]+@([a-z0-9-]+\.)*uvsq\.fr$/i.test(normalizedRegisterEmail.value) && registerPassword.value.length >= 8 && registerPassword.value === registerPasswordConfirm.value;
});

const resendConfirmationBlocked = computed(() => resendConfirmationCooldownLeft.value > 0);
const resendConfirmationLabel = computed(() => {
  if (resendConfirmationBlocked.value) {
    return `Renvoyer l'email (${resendConfirmationCooldownLeft.value}s)`;
  }
  return "Renvoyer l'email de vérification";
});

function clearResendConfirmationTimer() {
  if (resendConfirmationTimer) {
    clearInterval(resendConfirmationTimer);
    resendConfirmationTimer = null;
  }
}

function persistResendConfirmationCooldown(targetEmail: string, expiresAt: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RESEND_CONFIRMATION_COOLDOWN_STORAGE_KEY, JSON.stringify({
    email: targetEmail,
    expiresAt,
  }));
}

function clearPersistedResendConfirmationCooldown() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RESEND_CONFIRMATION_COOLDOWN_STORAGE_KEY);
}

function restoreResendConfirmationCooldown() {
  if (typeof window === "undefined") return;
  const rawValue = window.localStorage.getItem(RESEND_CONFIRMATION_COOLDOWN_STORAGE_KEY);
  if (!rawValue) return;

  try {
    const parsedValue = JSON.parse(rawValue) as { email?: string; expiresAt?: number; };
    const targetEmail = parsedValue.email?.trim().toLowerCase();
    const expiresAt = Number(parsedValue.expiresAt);

    if (!targetEmail || !Number.isFinite(expiresAt)) {
      clearPersistedResendConfirmationCooldown();
      return;
    }

    pendingVerificationEmail.value = pendingVerificationEmail.value || targetEmail;
    registerVerificationRequested.value = true;

    const secondsLeft = Math.ceil((expiresAt - Date.now()) / 1000);
    if (secondsLeft > 0) {
      startResendConfirmationCooldown(secondsLeft, targetEmail);
      return;
    }
  } catch {
    // Ignore malformed local cooldown state and clear it.
  }

  clearPersistedResendConfirmationCooldown();
}

function startResendConfirmationCooldown(seconds = RESEND_CONFIRMATION_COOLDOWN_SECONDS, targetEmail = pendingVerificationEmail.value.trim().toLowerCase()) {
  clearResendConfirmationTimer();
  resendConfirmationCooldownLeft.value = Math.max(0, seconds);
  if (resendConfirmationCooldownLeft.value === 0) {
    clearPersistedResendConfirmationCooldown();
    return;
  }

  const normalizedTargetEmail = targetEmail.trim().toLowerCase();
  if (normalizedTargetEmail) {
    persistResendConfirmationCooldown(normalizedTargetEmail, Date.now() + (resendConfirmationCooldownLeft.value * 1000));
  }

  resendConfirmationTimer = setInterval(() => {
    resendConfirmationCooldownLeft.value = Math.max(0, resendConfirmationCooldownLeft.value - 1);
    if (resendConfirmationCooldownLeft.value === 0) {
      clearResendConfirmationTimer();
      clearPersistedResendConfirmationCooldown();
    }
  }, 1000);
}

onMounted(async () => {
  await fetchAcademicGroups();
  restoreResendConfirmationCooldown();
  if (session.value) {
    mode.value = "login";
    await hydrateAccountState();
  }
});

onBeforeUnmount(() => {
  clearResendConfirmationTimer();
});

function resetMessages() {
  authError.value = "";
  authSuccess.value = "";
}

function switchMode(nextMode: AuthMode) {
  mode.value = nextMode;
  resetMessages();
}

function toggleEmailChangePanel() {
  emailChangePanelOpen.value = !emailChangePanelOpen.value;
  if (!emailChangePanelOpen.value) {
    emailChangeRequestSent.value = false;
    requestedEmailUsage.value = "";
    pendingEmailUsageCode.value = "";
  }
  resetMessages();
}

function toggleResetPanel() {
  resetPanelOpen.value = !resetPanelOpen.value;
  if (!resetPanelOpen.value) {
    resetRequestSent.value = false;
    resetSent.value = false;
    resetCode.value = "";
    resetNewPassword.value = "";
    resetNewPasswordConfirm.value = "";
  }
  resetMessages();
}

async function resolveProfileWithRetry(attempts = 4, delayMs = 180) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const profile = await getProfile();
    if (profile) return profile;
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

async function waitForEmailUsageApplied(expectedEmail: string, attempts = 8, delayMs = 300) {
  const normalizedExpectedEmail = expectedEmail.trim().toLowerCase();

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const [user, profile] = await Promise.all([getUser(), getProfile()]);
    const authEmail = user?.email?.trim().toLowerCase() || "";
    const profileEmail = profile?.email_auth?.trim().toLowerCase() || "";

    if (authEmail === normalizedExpectedEmail && profileEmail === normalizedExpectedEmail) {
      return { user, profile };
    }

    await refreshSession();

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
}

async function loadAccountProfile(profileOverride?: Awaited<ReturnType<typeof getProfile>> | null, fallbackEmail?: string | null) {
  const profile = profileOverride ?? await resolveProfileWithRetry();
  const groupCode = profile?.groupe || null;
  const yearCode = getYearCodeForGroup(groupCode) || getYearCodeForStudyYear(profile?.annee || null);
  profileDraft.value = {
    yearCode,
    group: groupCode,
  };
  accountEmailUvsq.value = profile?.email_uvsq || "";
  accountEmailUsage.value = profile?.email_auth || fallbackEmail || session.value?.email || "";
  pendingEmailUsage.value = requestedEmailUsage.value || profile?.email_auth || fallbackEmail || session.value?.email || "";

  syncProfileGroupForYear(yearCode);
}

async function hydrateAccountState(profileOverride?: Awaited<ReturnType<typeof getProfile>> | null) {
  if (!session.value) return;

  const hydrationToken = ++accountHydrationToken;
  const user = await getUser();
  const profile = profileOverride ?? await resolveProfileWithRetry();

  if (hydrationToken !== accountHydrationToken) return;

  const fallbackEmail = user?.email || session.value.email || null;
  loginEmail.value = fallbackEmail || "";
  applyProfileToSession(profile, fallbackEmail);
  await loadAccountProfile(profile, fallbackEmail);
}

const profileGroupOptions = computed(() => {
  const yearCode = profileDraft.value.yearCode;
  return yearCode ? groupsByYear.value[yearCode] || [] : [];
});

function syncProfileGroupForYear(yearCode: string | null) {
  if (!yearCode) {
    profileDraft.value.group = null;
    return;
  }

  const options = groupsByYear.value[yearCode] || [];
  const currentGroup = profileDraft.value.group;
  if (!currentGroup || !options.some((option) => option.value === currentGroup)) {
    profileDraft.value.group = getDefaultGroupForYearCode(yearCode);
  }
}

function onProfileYearChange(value: unknown) {
  const nextYearCode = typeof value === "string" ? value : null;
  profileDraft.value.yearCode = nextYearCode;
  syncProfileGroupForYear(nextYearCode);
}

async function doLogin() {
  loading.value = true;
  resetMessages();

  const result = await login(loginEmail.value.trim(), loginPassword.value);

  if (result.error) {
    authError.value = result.error.message;
  } else {
    session.value = result.session;
    await hydrateAccountState(result.profile);
    await navigateTo(redirect.value);
  }

  loading.value = false;
}

watch(() => session.value?.id ?? null, async (nextSessionId) => {
  if (!nextSessionId) {
    accountHydrationToken += 1;
    accountEmailUvsq.value = "";
    accountEmailUsage.value = "";
    pendingEmailUsage.value = "";
    profileDraft.value = {
      yearCode: null,
      group: null,
    };
    return;
  }

  await hydrateAccountState();
});

async function doRegister() {
  resetMessages();

  if (!isRegisterFormValid.value) {
    authError.value = "Vérifie ton email UVSQ et la confirmation du mot de passe.";
    return;
  }

  loading.value = true;

  const result = await register({
    emailUvsq: normalizedRegisterEmail.value,
    password: registerPassword.value,
  });

  if (result.error) {
    authError.value = result.error.message;
  } else {
    authSuccess.value = "Compte créé. Entre le code reçu par email pour activer ton compte.";
    loginEmail.value = normalizedRegisterEmail.value;
    pendingVerificationEmail.value = normalizedRegisterEmail.value;
    registerVerificationRequested.value = true;
    startResendConfirmationCooldown(RESEND_CONFIRMATION_COOLDOWN_SECONDS, normalizedRegisterEmail.value);
    registerPassword.value = "";
    registerPasswordConfirm.value = "";
  }

  loading.value = false;
}

async function verifyRegisterCode() {
  resetMessages();

  const targetEmail = (pendingVerificationEmail.value || normalizedRegisterEmail.value || loginEmail.value.trim()).toLowerCase();
  if (!targetEmail) {
    authError.value = "Renseigne ton email UVSQ avant de valider le code.";
    return;
  }

  if (!registerVerificationCode.value.trim()) {
    authError.value = "Renseigne le code de verification recu par email.";
    return;
  }

  loading.value = true;

  const result = await verifySignupCode(targetEmail, registerVerificationCode.value);

  if (result.error || !result.verified) {
    authError.value = result.error?.message || "Verification impossible.";
  } else {
    authSuccess.value = "Email verifie. Tu peux maintenant te connecter.";
    registerVerificationCode.value = "";
    pendingVerificationEmail.value = "";
    registerVerificationRequested.value = false;
    clearResendConfirmationTimer();
    resendConfirmationCooldownLeft.value = 0;
    clearPersistedResendConfirmationCooldown();
    mode.value = "login";
  }

  loading.value = false;
}

async function resendMail() {
  resetMessages();

  if (resendConfirmationBlocked.value) {
    authError.value = `Attends ${resendConfirmationCooldownLeft.value} seconde(s) avant un nouvel envoi.`;
    return;
  }

  const targetEmail = pendingVerificationEmail.value.trim().toLowerCase();
  if (!targetEmail) {
    authError.value = "Renseigne ton email UVSQ avant de demander un nouvel envoi.";
    return;
  }

  loading.value = true;

  const result = await resendSignupVerificationEmail(targetEmail);

  if (result.error) {
    authError.value = result.error.message;
    if (result.error.code === "SIGNUP_EXPIRED" || result.error.code === "SIGNUP_NOT_FOUND") {
      registerVerificationRequested.value = false;
      pendingVerificationEmail.value = "";
      registerVerificationCode.value = "";
      clearResendConfirmationTimer();
      resendConfirmationCooldownLeft.value = 0;
      clearPersistedResendConfirmationCooldown();
      mode.value = "register";
    }
  }
  else {
    authSuccess.value = "Email de vérification renvoyé.";
    startResendConfirmationCooldown();
  }

  loading.value = false;
}

async function sendPasswordReset() {
  resetMessages();
  resetSent.value = false;

  if (!resetEmail.value.trim()) {
    authError.value = "Renseigne ton email pour recevoir le lien de réinitialisation.";
    return;
  }

  loading.value = true;

  const result = await resetPassword(resetEmail.value.trim());

  if (result.error) {
    authError.value = result.error.message;
  } else {
    resetPanelOpen.value = true;
    resetSent.value = true;
    resetRequestSent.value = true;
    authSuccess.value = "Si le compte existe, un code de reinitialisation vient d'etre envoye.";
  }

  loading.value = false;
}

async function completePasswordResetWithCode() {
  resetMessages();
  if (!resetEmail.value.trim()) {
    authError.value = "Renseigne ton email.";
    return;
  }

  if (!resetCode.value.trim()) {
    authError.value = "Renseigne le code de reinitialisation recu par email.";
    return;
  }

  if (!resetNewPassword.value || resetNewPassword.value.length < 8) {
    authError.value = "Le nouveau mot de passe doit contenir au moins 8 caracteres.";
    return;
  }

  if (resetNewPassword.value !== resetNewPasswordConfirm.value) {
    authError.value = "Les deux nouveaux mots de passe ne correspondent pas.";
    return;
  }

  loading.value = true;

  const verifyResult = await verifyRecoveryCode(resetEmail.value.trim(), resetCode.value.trim());
  if (verifyResult.error || !verifyResult.verified) {
    authError.value = verifyResult.error?.message || "Code invalide ou expire.";
    loading.value = false;
    return;
  }

  const updateResult = await updatePassword(resetNewPassword.value);
  if (updateResult.error) {
    authError.value = updateResult.error.message;
  } else {
    authSuccess.value = "Mot de passe mis a jour. Tu peux te connecter.";
    resetCode.value = "";
    resetNewPassword.value = "";
    resetNewPasswordConfirm.value = "";
  }

  loading.value = false;
}

async function doLogout() {
  loading.value = true;
  resetMessages();
  await logout();
  await refreshSession();
  loading.value = false;
}

async function requestEmailUsageChange() {
  resetMessages();

  const nextEmail = pendingEmailUsage.value.trim().toLowerCase();
  if (!nextEmail) {
    authError.value = "Renseigne le nouvel email d'utilisation.";
    return;
  }

  if (nextEmail === accountEmailUsage.value.toLowerCase()) {
    authError.value = "Cet email est deja l'email d'utilisation actuel.";
    return;
  }

  loading.value = true;

  const result = await updateEmail(nextEmail);
  if (result.error) {
    authError.value = result.error.message;
  } else {
    pendingEmailUsage.value = nextEmail;
    requestedEmailUsage.value = nextEmail;
    emailChangeRequestSent.value = true;
    pendingEmailUsageCode.value = "";
    authSuccess.value = "Code de verification envoye pour confirmer le nouvel email d'utilisation.";
  }

  loading.value = false;
}

async function confirmEmailUsageChange() {
  resetMessages();

  const nextEmail = requestedEmailUsage.value.trim().toLowerCase();
  if (!nextEmail) {
    authError.value = "Renseigne le nouvel email d'utilisation.";
    return;
  }

  if (!pendingEmailUsageCode.value.trim()) {
    authError.value = "Renseigne le code recu pour valider le nouvel email.";
    return;
  }

  loading.value = true;

  const verifyResult = await verifyEmailChangeCode(nextEmail, pendingEmailUsageCode.value);
  if (verifyResult.error || !verifyResult.verified) {
    authError.value = verifyResult.error?.message || "Code invalide ou expire.";
    loading.value = false;
    return;
  }

  const appliedState = await waitForEmailUsageApplied(nextEmail);
  if (!appliedState?.profile) {
    authError.value = "Le code est valide, mais le changement d'email n'a pas encore ete applique par Supabase. Reessaie dans quelques secondes.";
    loading.value = false;
    return;
  }

  if (session.value && appliedState.user) {
    session.value = {
      ...session.value,
      email: appliedState.user.email ?? appliedState.profile.email_auth,
    };
  }

  await loadAccountProfile(appliedState.profile, appliedState.user?.email ?? appliedState.profile.email_auth);
  pendingEmailUsageCode.value = "";
  emailChangeRequestSent.value = false;
  requestedEmailUsage.value = "";
  emailChangePanelOpen.value = false;
  authSuccess.value = "Email d'utilisation valide et applique.";

  loading.value = false;
}

async function saveProfile() {
  if (!session.value) return;

  resetMessages();
  profileLoading.value = true;

  const { profile, error } = await updateProfile({
    groupe: profileDraft.value.group || null,
    annee: getStudyYearForYearCode(profileDraft.value.yearCode),
  });

  if (error) {
    authError.value = error.message;
  } else {
    if (session.value && profile) {
      session.value = {
        ...session.value,
        name: profile.prenom,
        firstName: profile.prenom,
        lastName: profile.nom,
        role: profile.role,
        email: session.value.email || profile.email_auth,
      };
    }
    authSuccess.value = "Profil mis à jour.";
    await loadAccountProfile(profile, session.value?.email || profile?.email_auth || "");
    void refreshSession();
  }

  profileLoading.value = false;
}
</script>

<template>
  <main class="container grid w-full max-w-6xl gap-6 py-8 lg:grid-cols-[1fr_1fr] lg:py-12">
    <section class="relative overflow-hidden rounded-[2rem] border border-surface-border bg-surface text-on-surface shadow-2xl">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(84,19,122,0.24),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(55,188,224,0.18),transparent_26%),radial-gradient(circle_at_72%_82%,rgba(16,185,129,0.12),transparent_24%)]" />
      <div class="absolute inset-x-6 top-6 h-28 rounded-full bg-primary/10 blur-3xl md:inset-x-12 md:top-10" />

      <div class="relative flex h-full flex-col gap-8 p-6 md:p-8 lg:p-10">
        <div class="space-y-6">
          <div class="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary backdrop-blur-xl">
            <SparklesIcon class="h-4 w-4" />
            Accès étudiant MMI
          </div>

          <div class="space-y-4">
            <div class="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-subtext">
              <span class="rounded-full border border-surface-border bg-black/10 px-3 py-1">UVSQ</span>
              <span class="rounded-full border border-surface-border bg-black/10 px-3 py-1">Compte vérifié</span>
              <span class="rounded-full border border-surface-border bg-black/10 px-3 py-1">MMI Place</span>
            </div>

            <div class="max-w-2xl space-y-4">
              <h1 class="max-w-xl text-4xl font-bold leading-[1.05] md:text-5xl">Connexion UVSQ simple et claire.</h1>
              <p class="max-w-xl text-base leading-7 text-subtext md:text-lg">Tout est pensé pour aller vite: tu entres ton adresse UVSQ, tu sécurises ton compte, puis tu retrouves ton espace MMI Place avec tes outils, ton groupe et tes widgets.</p>
            </div>
          </div>
        </div>

        <article class="relative overflow-hidden rounded-[1.75rem] border border-surface-border bg-black/12 p-5 backdrop-blur-2xl">
          <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/12 blur-3xl" />
          <div class="relative flex flex-col gap-5">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-2">
                <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Parcours de connexion</p>
                <h2 class="text-2xl font-bold">Un seul accès pour tout ton espace étudiant</h2>
              </div>
              <div class="rounded-2xl border border-primary/20 bg-primary/10 p-3">
                <ShieldCheckIcon class="h-7 w-7 text-primary" />
              </div>
            </div>

            <div class="grid gap-3">
              <div class="rounded-2xl border border-surface-border bg-white/8 p-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-bold">1</div>
                  <div>
                    <p class="font-semibold">Adresse UVSQ</p>
                    <p class="text-sm text-subtext">Toutes les adresses `*.uvsq.fr` sont acceptées.</p>
                  </div>
                </div>
              </div>
              <div class="rounded-2xl border border-surface-border bg-white/8 p-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-bold">2</div>
                  <div>
                    <p class="font-semibold">Mot de passe robuste</p>
                    <p class="text-sm text-subtext">La création du compte vérifie tout de suite sa solidité.</p>
                  </div>
                </div>
              </div>
              <div class="rounded-2xl border border-surface-border bg-white/8 p-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-bold">3</div>
                  <div>
                    <p class="font-semibold">Validation immédiate</p>
                    <p class="text-sm text-subtext">Tu actives ton compte par email puis tu te reconnectes normalement.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-[2rem] border border-surface-border bg-surface text-on-surface shadow-2xl">
      <div class="flex h-full flex-col gap-6 p-6 md:p-8">
        <div v-if="!session" class="flex rounded-2xl border border-surface-border bg-black/10 p-1">
          <button class="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition" :class="mode === 'login' ? 'bg-primary text-on-primary' : 'text-subtext hover:text-on-surface'" @click="switchMode('login')">Se connecter</button>
          <button class="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition" :class="mode === 'register' ? 'bg-primary text-on-primary' : 'text-subtext hover:text-on-surface'" @click="switchMode('register')">Créer un compte</button>
        </div>

        <div v-if="session" class="rounded-3xl border border-success/30 bg-success/10 p-5">
          <div class="min-w-0 space-y-4">
            <div class="space-y-1">
              <p class="flex items-center gap-2 font-semibold">
                <CheckCircleIcon class="h-5 w-5 text-success" />
                <span>Connecté</span>
              </p>
              <p class="text-sm text-subtext">
                Tu es connecté en tant que <strong>{{ displayIdentity }}</strong
                >.
              </p>
            </div>

            <div class="grid gap-3 rounded-3xl border border-surface-border bg-black/10 p-4">
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-surface-border bg-surface-hover/40 p-3">
                  <p class="text-xs uppercase tracking-[0.16em] text-subtext">Prénom</p>
                  <p class="mt-1 font-semibold">{{ session.firstName || "-" }}</p>
                </div>
                <div class="rounded-2xl border border-surface-border bg-surface-hover/40 p-3">
                  <p class="text-xs uppercase tracking-[0.16em] text-subtext">Nom</p>
                  <p class="mt-1 font-semibold">{{ session.lastName || "-" }}</p>
                </div>
                <div class="rounded-2xl border border-surface-border bg-surface-hover/40 p-3 sm:col-span-2">
                  <p class="text-xs uppercase tracking-[0.16em] text-subtext">Email</p>
                  <p class="mt-1 font-semibold break-all">{{ accountEmailUsage || accountEmailUvsq || "-" }}</p>
                </div>
                <div class="rounded-2xl border border-surface-border bg-surface-hover/40 p-3">
                  <p class="text-xs uppercase tracking-[0.16em] text-subtext">Rôle</p>
                  <p class="mt-1 font-semibold">{{ displayRoleLabel }}</p>
                </div>
                <div class="rounded-2xl border border-surface-border bg-surface-hover/40 p-3">
                  <p class="text-xs uppercase tracking-[0.16em] text-subtext">Compte</p>
                  <p class="mt-1 font-semibold">Vérifié</p>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block space-y-2">
                  <div class="flex items-center gap-2">
                    <CircleStackIcon class="h-4 w-4 text-primary" />
                    <span class="text-sm font-medium">Année / parcours</span>
                  </div>
                  <Select v-model="profileDraft.yearCode" :options="yearOptions" :handler="onProfileYearChange" />
                </label>

                <label class="block space-y-2">
                  <div class="flex items-center gap-2">
                    <CircleStackIcon class="h-4 w-4 text-primary" />
                    <span class="text-sm font-medium">Groupe</span>
                  </div>
                  <Select v-model="profileDraft.group" :options="profileGroupOptions" />
                </label>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button :label="profileLoading ? 'Enregistrement...' : 'Mettre à jour'" btnStyle="PRIMARY" :handler="saveProfile" />
              <Button :label="emailChangePanelOpen ? `Fermer le changement d'email` : `Changer l'email`" btnStyle="NEUTRAL" :handler="toggleEmailChangePanel" />
              <Button label="Aller au tableau de bord" btnStyle="NEUTRAL" :handler="redirect" />
              <Button label="Se déconnecter" btnStyle="LINK" :handler="doLogout" />
            </div>

            <div v-if="emailChangePanelOpen" class="grid gap-3 rounded-2xl border border-surface-border bg-surface-hover/30 p-4">
              <div class="space-y-1">
                <p class="text-sm font-semibold">Changer l'email</p>
                <p class="text-xs text-subtext">L'email de connexion actuel est <strong>{{ accountEmailUsage || accountEmailUvsq || "-" }}</strong>.</p>
                <p v-if="accountEmailUvsq && accountEmailUvsq !== accountEmailUsage" class="text-xs text-subtext">L'email UVSQ lie au compte reste <strong>{{ accountEmailUvsq }}</strong>.</p>
              </div>

              <div v-if="!emailChangeRequestSent" class="grid gap-3">
                <input v-model="pendingEmailUsage" type="email" autocomplete="email" placeholder="nouvel.email@domaine.fr" class="w-full rounded-2xl border border-surface-border bg-surface px-4 py-3 outline-none transition focus:border-primary" />
                <div class="flex flex-wrap gap-3">
                  <Button :label="loading ? 'Envoi...' : 'Envoyer le code'" btnStyle="PRIMARY" :handler="requestEmailUsageChange" />
                </div>
              </div>

              <div v-if="emailChangeRequestSent" class="grid gap-4">
                <div class="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                  <p>Un code a été envoyé à <strong>{{ requestedEmailUsage }}</strong>.</p>
                  <button
                    class="mt-1 text-xs text-primary underline"
                    @click="
                      pendingEmailUsage = requestedEmailUsage;
                      emailChangeRequestSent = false;
                      pendingEmailUsageCode = '';
                    "
                  >
                    Modifier l'email cible
                  </button>
                </div>
                <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input v-model="pendingEmailUsageCode" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="Code de verification" class="w-full rounded-2xl border border-surface-border bg-surface px-4 py-3 outline-none transition focus:border-primary" />
                  <Button :label="loading ? 'Validation...' : 'Valider le code'" btnStyle="PRIMARY" :handler="confirmEmailUsageChange" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <template v-else-if="mode === 'register'">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <UserPlusIcon class="h-5 w-5 text-primary" />
              <h2 class="text-2xl font-bold">Créer ton compte UVSQ</h2>
            </div>
            <p class="text-sm text-subtext">Prépare ton accès MMI Place en quelques secondes. La vérification par email sera demandée juste après.</p>
          </div>

          <div v-if="!registerVerificationRequested" class="space-y-4">
            <label class="block space-y-2">
              <span class="text-sm font-medium">Email UVSQ</span>
              <input v-model="registerEmail" type="email" autocomplete="email" placeholder="prenom.nom@etu.uvsq.fr" class="w-full rounded-2xl border border-surface-border bg-black/10 px-4 py-3 outline-none transition focus:border-primary" />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium">Mot de passe</span>
              <input v-model="registerPassword" type="password" autocomplete="new-password" placeholder="Choisis un mot de passe" class="w-full rounded-2xl border border-surface-border bg-black/10 px-4 py-3 outline-none transition focus:border-primary" />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium">Confirmer le mot de passe</span>
              <input v-model="registerPasswordConfirm" type="password" autocomplete="new-password" placeholder="Retape le mot de passe" class="w-full rounded-2xl border border-surface-border bg-black/10 px-4 py-3 outline-none transition focus:border-primary" />
            </label>

            <div class="rounded-2xl border border-surface-border bg-black/10 p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-medium">Robustesse du mot de passe</p>
                <span class="text-sm font-semibold" :class="passwordScore <= 1 ? 'text-danger' : passwordScore <= 3 ? 'text-primary' : 'text-success'">
                  {{ passwordStrengthLabel }}
                </span>
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div class="h-full rounded-full transition-all" :class="passwordStrengthClass" :style="{ width: `${(passwordScore / 4) * 100}%` }" />
              </div>
              <div class="mt-4 grid gap-2">
                <div v-for="check in passwordChecks" :key="check.label" class="flex items-center gap-2 text-sm" :class="check.valid ? 'text-success' : 'text-subtext'">
                  <CheckCircleIcon class="h-4 w-4" />
                  <span>{{ check.label }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm" :class="registerPasswordConfirm && registerPassword === registerPasswordConfirm ? 'text-success' : 'text-subtext'">
                  <CheckCircleIcon class="h-4 w-4" />
                  <span>Les deux mots de passe correspondent</span>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <Button :label="loading ? 'Création...' : 'Créer mon compte'" btnStyle="PRIMARY" :handler="doRegister" />
            </div>
          </div>

            <div v-if="registerVerificationRequested" class="rounded-3xl border border-surface-border bg-black/10 p-5">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-base font-semibold">Vérification de l'email</h3>
                <button class="text-xs text-primary underline" @click="registerVerificationRequested = false">Retour</button>
              </div>
              <p class="mt-1 text-sm text-subtext">Un code a été envoyé à <strong>{{ pendingVerificationEmail }}</strong>. S'il n'arrive pas, vérifie tes spams.</p>
              <div class="mt-4 flex flex-wrap gap-3">
                <Button :label="resendConfirmationLabel" btnStyle="NEUTRAL" :handler="resendMail" :disabled="resendConfirmationBlocked" />
              </div>
              <div class="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input v-model="registerVerificationCode" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="Code a 6 chiffres" class="w-full rounded-2xl border border-surface-border bg-surface px-4 py-3 outline-none transition focus:border-primary" />
                <Button :label="loading ? 'Validation...' : 'Valider le code'" btnStyle="PRIMARY" :handler="verifyRegisterCode" />
              </div>
            </div>
        </template>

        <template v-else>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <ArrowRightStartOnRectangleIcon class="h-5 w-5 text-primary" />
              <h2 class="text-2xl font-bold">Connexion</h2>
            </div>
            <p class="text-sm text-subtext">Utilise tes identifiants pour reprendre ta session et retrouver ton espace étudiant.</p>
          </div>

          <div class="space-y-4">
            <label class="block space-y-2">
              <span class="text-sm font-medium">Email</span>
              <input v-model="loginEmail" type="email" autocomplete="email" placeholder="prenom.nom@etu.uvsq.fr" class="w-full rounded-2xl border border-surface-border bg-black/10 px-4 py-3 outline-none transition focus:border-primary" />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium">Mot de passe</span>
              <input v-model="loginPassword" type="password" autocomplete="current-password" placeholder="Ton mot de passe" class="w-full rounded-2xl border border-surface-border bg-black/10 px-4 py-3 outline-none transition focus:border-primary" />
            </label>

            <div class="flex flex-wrap gap-3">
              <Button :label="loading ? 'Connexion...' : 'Se connecter'" btnStyle="PRIMARY" :handler="doLogin" />
              <Button :label="resetPanelOpen ? 'Fermer' : 'Mot de passe oublié ?'" btnStyle="LINK" :handler="toggleResetPanel" />
            </div>
          </div>

          <div v-if="resetPanelOpen" class="rounded-3xl border border-surface-border bg-black/10 p-5">
            <h3 class="text-base font-semibold">Mot de passe oublié ?</h3>
            <p class="mt-1 text-sm text-subtext">Saisis ton email et on t'enverra un code de réinitialisation.</p>
            <div v-if="!resetRequestSent" class="mt-4 flex flex-col gap-3 sm:flex-row">
              <input v-model="resetEmail" type="email" autocomplete="email" placeholder="ton.email@uvsq.fr" class="min-w-0 flex-1 rounded-2xl border border-surface-border bg-surface px-4 py-3 outline-none transition focus:border-primary" />
              <Button label="Envoyer le code" btnStyle="NEUTRAL" :handler="sendPasswordReset" />
            </div>
            <div v-if="resetRequestSent" class="mt-4 grid gap-3">
              <div class="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                <p>Code de réinitialisation envoyé à <strong>{{ resetEmail }}</strong>.</p>
                <button class="mt-1 text-xs text-primary underline" @click="resetRequestSent = false">Changer l'email</button>
              </div>
              <input v-model="resetCode" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="Code recu par email" class="w-full rounded-2xl border border-surface-border bg-surface px-4 py-3 outline-none transition focus:border-primary" />
              <div class="grid gap-3 sm:grid-cols-2">
                <input v-model="resetNewPassword" type="password" autocomplete="new-password" placeholder="Nouveau mot de passe" class="w-full rounded-2xl border border-surface-border bg-surface px-4 py-3 outline-none transition focus:border-primary" />
                <input v-model="resetNewPasswordConfirm" type="password" autocomplete="new-password" placeholder="Confirmer le nouveau mot de passe" class="w-full rounded-2xl border border-surface-border bg-surface px-4 py-3 outline-none transition focus:border-primary" />
              </div>
              <div>
                <Button :label="loading ? 'Mise a jour...' : 'Valider le code et changer le mot de passe'" btnStyle="PRIMARY" :handler="completePasswordResetWithCode" />
              </div>
            </div>
            <p v-if="resetSent" class="mt-3 text-sm text-success">Demande envoyée. Pense à vérifier aussi tes spams.</p>
          </div>
        </template>

        <div v-if="authError" class="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {{ authError }}
        </div>
        <div v-if="authSuccess" class="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {{ authSuccess }}
        </div>
      </div>
    </section>
  </main>
</template>
