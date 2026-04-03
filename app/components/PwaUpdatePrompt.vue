<script setup lang="ts">
const needRefresh = ref(false);
const offlineReady = ref(false);

onMounted(() => {
	if (!("serviceWorker" in navigator)) return;

	// Detect when a new SW takes control → app was updated
	let refreshing = false;
	navigator.serviceWorker.addEventListener("controllerchange", () => {
		if (!refreshing) {
			refreshing = true;
			needRefresh.value = true;
		}
	});

	// Detect when SW is ready → offline capable
	navigator.serviceWorker.ready.then((reg) => {
		if (reg.active && !navigator.serviceWorker.controller) {
			offlineReady.value = true;
		}

		// Watch for new waiting SW
		reg.addEventListener("updatefound", () => {
			const newWorker = reg.installing;
			if (!newWorker) return;

			newWorker.addEventListener("statechange", () => {
				if (
					newWorker.state === "installed" &&
					navigator.serviceWorker.controller
				) {
					needRefresh.value = true;
				}
			});
		});
	});
});

function reload() {
	needRefresh.value = false;
	window.location.reload();
}

function dismiss() {
	needRefresh.value = false;
	offlineReady.value = false;
}
</script>

<template>
	<Transition name="pwa-toast">
		<div
			v-if="needRefresh || offlineReady"
			class="pwa-toast"
			role="alert"
			aria-live="assertive"
		>
			<div class="pwa-toast-content">
				<div class="pwa-toast-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							v-if="needRefresh"
							d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
						/>
						<path
							v-else
							d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3"
						/>
					</svg>
				</div>
				<p class="pwa-toast-text">
					<template v-if="needRefresh">
						Nouvelle version disponible !
					</template>
					<template v-else>
						L'application est prête hors-ligne.
					</template>
				</p>
			</div>
			<div class="pwa-toast-actions">
				<button
					v-if="needRefresh"
					class="pwa-toast-btn pwa-toast-btn-primary"
					@click="reload"
				>
					Actualiser
				</button>
				<button
					class="pwa-toast-btn pwa-toast-btn-dismiss"
					@click="dismiss"
				>
					Fermer
				</button>
			</div>
		</div>
	</Transition>
</template>

<style scoped>
.pwa-toast {
	position: fixed;
	bottom: 1.5rem;
	right: 1.5rem;
	z-index: 9999;
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem 1.25rem;
	border-radius: 1rem;
	background: rgba(15, 23, 42, 0.92);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(148, 163, 184, 0.15);
	box-shadow:
		0 8px 32px rgba(0, 0, 0, 0.3),
		0 0 0 1px rgba(255, 255, 255, 0.05) inset;
	color: #e2e8f0;
	font-family: inherit;
	max-width: min(420px, calc(100vw - 2rem));
}

.pwa-toast-content {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.pwa-toast-icon {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.25rem;
	height: 2.25rem;
	border-radius: 0.5rem;
	background: rgba(99, 102, 241, 0.15);
	color: #818cf8;
}

.pwa-toast-text {
	margin: 0;
	font-size: 0.875rem;
	font-weight: 500;
	line-height: 1.4;
}

.pwa-toast-actions {
	display: flex;
	gap: 0.5rem;
	flex-shrink: 0;
}

.pwa-toast-btn {
	padding: 0.4rem 0.9rem;
	border-radius: 0.5rem;
	border: none;
	font-size: 0.8125rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.15s ease;
	white-space: nowrap;
}

.pwa-toast-btn-primary {
	background: #6366f1;
	color: white;
}

.pwa-toast-btn-primary:hover {
	background: #4f46e5;
	transform: translateY(-1px);
}

.pwa-toast-btn-dismiss {
	background: rgba(148, 163, 184, 0.12);
	color: #94a3b8;
}

.pwa-toast-btn-dismiss:hover {
	background: rgba(148, 163, 184, 0.2);
	color: #cbd5e1;
}

.pwa-toast-enter-active {
	animation: pwa-slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.pwa-toast-leave-active {
	animation: pwa-slide-out 0.3s cubic-bezier(0.55, 0, 1, 0.45);
}

@keyframes pwa-slide-in {
	from {
		opacity: 0;
		transform: translateY(1rem) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes pwa-slide-out {
	from {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
	to {
		opacity: 0;
		transform: translateY(1rem) scale(0.95);
	}
}

@media (max-width: 480px) {
	.pwa-toast {
		left: 1rem;
		right: 1rem;
		bottom: 1rem;
		flex-direction: column;
		align-items: stretch;
	}

	.pwa-toast-actions {
		justify-content: flex-end;
	}
}
</style>
