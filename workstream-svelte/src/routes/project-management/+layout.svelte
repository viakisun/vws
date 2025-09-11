<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<nav class="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
		<div class="mx-auto max-w-6xl px-4 h-12 flex items-center gap-4 text-sm">
			<a class="text-gray-700 hover:text-primary" href="/project-management">Home</a>
			<a class="text-gray-700 hover:text-primary" href="/project-management/dashboard">Dashboard</a>
			<a class="text-gray-700 hover:text-primary" href="/project-management/participation">Participation</a>
			<a class="text-gray-700 hover:text-primary" href="/project-management/budget-overview">Budget</a>
			<a class="text-gray-700 hover:text-primary" href="/project-management/compliance">Compliance</a>
			<a class="text-gray-700 hover:text-primary" href="/project-management/reports">Reports</a>
		</div>
	</nav>

	<main class="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
		{@render children()}
	</main>
</div>

<style>
	/* Uses Tailwind classes */
</style>

