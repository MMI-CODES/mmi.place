<script setup lang="ts">
const props = defineProps<{
  label?: string;
  icon?: Component;
  btnStyle?: "NEUTRAL" | "PRIMARY" | "LINK" | "SUCCESS" | "DANGER" | "SELECTED" | "TAB" | "TAB:ACTIVE";
  handler: string | (() => void | Promise<void>);
  disabled?: boolean;
}>();

const isLoading = ref(false);

const handleClick = async () => {
  if (isLoading.value || props.disabled) return;
  if (typeof props.handler === "string") {
    if (props.handler.startsWith("/")) {
      await navigateTo(props.handler);
    } else {
      window.open(props.handler, "_blank");
    }
    return;
  }
  isLoading.value = true;
  try {
    await props.handler();
  } finally {
    isLoading.value = false;
  }
};

const btnClass = computed(() => {
  let base = "cursor-pointer select-none flex items-center justify-center gap-1.5 rounded-xl transition-all duration-200";
  if (props.disabled || isLoading.value) {
    base += " opacity-60 cursor-not-allowed";
  }
  if (props.btnStyle !== "LINK") {
    base += " h-11";
    if (props.icon) {
      base += props.label ? " w-fit pl-4 pr-4" : " w-11";
    } else {
      base += " w-fit px-4";
    }
  }
  const styles: Record<string, string> = {
    NEUTRAL: "bg-button text-on-button border border-button-border font-medium hover:bg-button-hover",
    PRIMARY: "bg-primary text-on-primary font-semibold hover:bg-primary-hover",
    LINK: "text-primary hover:underline",
    SUCCESS: "bg-success text-on-success font-semibold hover:bg-success-hover",
    DANGER: "bg-danger text-on-danger font-semibold hover:bg-danger-hover",
    SELECTED: "bg-primary-transparent text-on-primary-transparent font-semibold border border-primary-transparent hover:bg-primary-transparent-hover",
    TAB: "font-bold hover:underline",
    "TAB:ACTIVE": "text-primary font-bold underline decoration-2",
  };
  return `${base} ${styles[props.btnStyle || "NEUTRAL"]}`;
});
</script>

<template>
  <button :class="btnClass" @click="handleClick" :disabled="isLoading || props.disabled">
    <span v-if="isLoading">Chargement...</span>
    <component v-else v-if="props.icon" :is="props.icon" :class="props.label ? 'w-4 h-4' : 'w-5 h-5'" />
    <span v-if="props.label && !isLoading">{{ props.label }}</span>
  </button>
</template>
