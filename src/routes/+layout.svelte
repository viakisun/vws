<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { toasts } from '$lib/stores/toasts';

	let { children } = $props();
	let sidebarCollapsed = $state(false);
</script>

<div class="min-h-screen bg-gray-50 flex">
	<!-- Sidebar -->
	<Sidebar bind:isCollapsed={sidebarCollapsed} />

	<!-- Main content area -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Main content -->
		<main class="flex-1 p-6">
			<div class="max-w-7xl mx-auto">
				{@render children()}
			</div>
		</main>
	</div>
</div>


{#if $toasts.length}
	<div class="fixed bottom-4 right-4 space-y-2 z-50" aria-live="polite" aria-atomic="true">
		{#each $toasts as t}
			<div class="px-3 py-2 rounded-md shadow border text-sm bg-white" class:text-green-700={t.type==='success'} class:text-red-700={t.type==='error'} class:text-gray-700={t.type==='info'}>
				{t.message}
			</div>
		{/each}
	</div>
{/if}

<style>
	/* Layout handled by Tailwind */
</style>
