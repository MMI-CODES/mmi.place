<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { motion } from "motion-v";

const props = defineProps<{
	modelValue: boolean;
	label?: string;
	disabled?: boolean;
}>();

const emit = defineEmits<{
	"update:modelValue": [value: boolean];
}>();

const isMobile = ref(false);

onMounted(() => {
	const checkMobile = () => {
		isMobile.value = window.innerWidth < 640;
	};
	checkMobile();
	window.addEventListener("resize", checkMobile);
	onUnmounted(() => window.removeEventListener("resize", checkMobile));
});

const toggle = () => {
	if (props.disabled) return;
	emit("update:modelValue", !props.modelValue);
};
</script>

<template>
	<div 
		class="flex items-center gap-3 w-fit" 
		:class="disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'"
		@click="toggle"
	>
		<div 
			class="relative w-12 h-6 sm:w-14 sm:h-7 rounded-full transition-colors duration-300 ease-in-out border"
			:class="[
				modelValue 
					? 'bg-primary border-primary' 
					: 'bg-button border-button-border'
			]"
		>
			<!-- Le curseur blanc à l'intérieur -->
			<motion.div
				class="absolute top-1/2 -translate-y-1/2 left-0.5 sm:left-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-sm"
				:animate="{
					x: modelValue ? (isMobile ? 22 : 26) : 0
				}"
				:transition="{
					type: 'spring',
					stiffness: 500,
					damping: 30
				}"
			/>
		</div>
		<span v-if="label" class="font-medium text-foreground select-none">

			{{ label }}
		</span>
	</div>
</template>
