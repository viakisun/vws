<script lang="ts">
	import '../app.css';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import { toasts } from '$lib/stores/toasts';

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<AppHeader title="Workstream" />

	<main class="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
		{@render children()}
	</main>

	<footer class="flex flex-col items-center justify-center py-3 text-caption">
		<p>
			visit <a class="text-primary font-semibold hover:underline" href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to learn about SvelteKit
		</p>
	</footer>
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
