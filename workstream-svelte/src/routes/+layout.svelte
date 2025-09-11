<script lang="ts">
	import '../app.css';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';

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

<style>
	/* Layout handled by Tailwind */
</style>
