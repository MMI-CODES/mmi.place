<script setup lang="ts">
type SelectValue = unknown;
type SelectOption = { icon?: Component; label: string; value: SelectValue; style: "neutral" | "danger" };
type SelectHandler = (value: SelectValue) => void | Promise<void>;

const props = defineProps<{ name?: string; label?: string; icon?: Component; options: SelectOption[]; modelValue?: SelectValue; handler?: SelectHandler }>();
const emit = defineEmits<{ (event: "update:modelValue", value: SelectValue): void }>();

const isLoading = ref(false);
const isOpen = ref(false);
const rootElement = ref<HTMLElement | null>(null);
const triggerElement = ref<HTMLElement | null>(null);
const menuStyle = ref<Record<string, string>>({});

const findOptionByValue = (value: SelectValue) => props.options.find((option) => option.value === value);
const syncChoice = (value: SelectValue, fallbackToFirst = false) => {
  const matchingOption = findOptionByValue(value);
  if (matchingOption) {
    choice.value = matchingOption;
    return;
  }
  if (fallbackToFirst) choice.value = props.options[0] ?? null;
};

const choice = ref<SelectOption | null>(null);
syncChoice(props.modelValue, true);

watch(() => props.options, () => {
  if (!props.options.length) {
    choice.value = null;
    return;
  }
  syncChoice(props.modelValue ?? choice.value?.value, true);
}, { deep: true });

watch(() => props.modelValue, (newValue) => syncChoice(newValue));

const applyHandler = async (value: SelectValue) => {
  if (!props.handler) return;
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    await props.handler(value);
  } finally {
    isLoading.value = false;
  }
};

const propagateValue = async (value: SelectValue) => {
  emit("update:modelValue", value);
  await applyHandler(value);
};

const handleChange = async () => {
  if (isLoading.value) return;
  const nextValue = choice.value?.value;
  await propagateValue(nextValue);
};

const selectOption = async (option: SelectOption) => {
  choice.value = option;
  isOpen.value = false;
  await handleChange();
};

const selectedValue = computed({
  get: () => choice.value?.value,
  set: (value) => syncChoice(value),
});

const toggleOpen = () => {
  if (isLoading.value || !props.options.length) return;
  isOpen.value = !isOpen.value;
};

const selectClass = computed(() => {
  let base = "cursor-pointer select-none flex items-center justify-center gap-1.5 bg-button text-on-button font-medium border border-button-border rounded-xl h-11 transition-all duration-200 hover:bg-button-hover whitespace-nowrap";
  if (props.icon) base += props.label ? " w-fit pl-2 pr-4" : " w-11";
  else base += " w-fit px-4";
  return base;
});

const rootClass = computed(() => (isOpen.value ? "z-[200]" : "z-10"));

const updateMenuPosition = () => {
  if (!isOpen.value || !triggerElement.value) return;
  const rect = triggerElement.value.getBoundingClientRect();

  menuStyle.value = {
    position: "fixed",
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
    maxWidth: "min(24rem, calc(100vw - 1.5rem))",
    zIndex: "9999",
  };
};

const closeMenuOnOutsideClick = (event: MouseEvent) => {
  const target = event.target as Node | null;
  if (!rootElement.value || !target) return;
  if (rootElement.value.contains(target)) return;
  isOpen.value = false;
};

onMounted(() => document.addEventListener("click", closeMenuOnOutsideClick));
onMounted(() => {
  window.addEventListener("resize", updateMenuPosition);
  window.addEventListener("scroll", updateMenuPosition, true);
});

watch(isOpen, async (open) => {
  if (!open) return;
  await nextTick();
  updateMenuPosition();
});

onUnmounted(() => {
  document.removeEventListener("click", closeMenuOnOutsideClick);
  window.removeEventListener("resize", updateMenuPosition);
  window.removeEventListener("scroll", updateMenuPosition, true);
});
</script>

<template>
  <div ref="rootElement" class="relative inline-block" :class="rootClass">
    <select class="hidden" :name="name" v-model="selectedValue">
      <option v-for="option in options" :key="`native-${option.value}`" :value="option.value">{{ option.label }}</option>
    </select>
    <div ref="triggerElement" :class="selectClass" role="button" tabindex="0" @click="toggleOpen" @keydown.enter.prevent="toggleOpen" @keydown.space.prevent="toggleOpen">
      <component v-if="choice?.icon || icon" :is="choice?.icon || icon" class="text-current w-5 h-5" />
      <span class="truncate">{{ choice?.label || label || "Selectionner" }}</span>
    </div>
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="rounded-2xl border border-popup-border bg-popup text-on-popup backdrop-blur-xl shadow-2xl isolation-isolate flex flex-col gap-1 p-2 max-h-64 overflow-auto"
        :style="menuStyle"
      >
        <div
          v-for="option in options"
          :key="String(option.value)"
          class="cursor-pointer select-none flex items-center gap-2 rounded-xl px-4 py-2 w-full min-w-0 whitespace-nowrap"
          :class="choice?.value === option.value ? 'bg-primary-transparent text-on-primary-transparent' : ''"
          @click="selectOption(option)"
        >
          <component v-if="option.icon" :is="option.icon" class="text-current w-5 h-5" />
          <span class="truncate">{{ option.label }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
