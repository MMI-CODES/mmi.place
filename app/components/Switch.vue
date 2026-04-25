<script setup lang="ts">
import { motion } from "motion-v";
const props = defineProps<{ modelValue: boolean; label?: string; disabled?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
const toggle = () => {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
};
</script>

<template>
  <div class="flex items-center gap-3 w-fit" :class="disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'" @click="toggle">
    <div class="relative bg-button border-button-border w-14 h-8 rounded-full transition-colors duration-300 ease-in-out border p-0.75">
      <motion.div
        class="w-6 h-6 rounded-full will-change-transform"
        :class="modelValue ? 'bg-primary' : 'bg-on-button'"
        :animate="{ x: modelValue ? 24 : 0 }"
        :transition="{ type: 'spring', stiffness: 500, damping: 32 }"
      />
    </div>
    <span v-if="label" class="font-medium text-foreground select-none">{{ label }}</span>
  </div>
</template>
