<script lang="ts">
	let { children } = $props();
	import { page } from '$app/state';
	import { auth, canAccessForRole } from '$lib/stores/auth';
	const path = $derived(page.url.pathname.replace(/^\/project-management\/?/, ''));
	const segs = $derived(path ? path.split('/').filter(Boolean) : []);
	function crumbHref(idx: number) {
		return '/project-management/' + segs.slice(0, idx + 1).join('/');
	}
	const role = $derived($auth.user.role);
</script>

<div class="min-h-screen flex flex-col">
	<a href="#pm-main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white border rounded px-3 py-1 text-sm">본문으로 건너뛰기</a>
	<nav class="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200" aria-label="Project management">
		<div class="mx-auto max-w-6xl px-4 h-12 flex items-center gap-4 text-sm">
			<a class="hover:text-primary" class:text-primary={page.url.pathname==='/project-management'} aria-current={page.url.pathname==='/project-management' ? 'page' : undefined} href="/project-management">Home</a>
			{#if canAccessForRole(role, 'dashboard')}
				<a class="hover:text-primary" class:text-primary={page.url.pathname.startsWith('/project-management/dashboard')} aria-current={page.url.pathname.startsWith('/project-management/dashboard') ? 'page' : undefined} href="/project-management/dashboard">Dashboard</a>
			{/if}
			{#if canAccessForRole(role, 'participation')}
				<a class="hover:text-primary" class:text-primary={page.url.pathname.startsWith('/project-management/participation')} aria-current={page.url.pathname.startsWith('/project-management/participation') ? 'page' : undefined} href="/project-management/participation">Participation</a>
			{/if}
			{#if canAccessForRole(role, 'budget')}
				<a class="hover:text-primary" class:text-primary={page.url.pathname.startsWith('/project-management/budget-overview')} aria-current={page.url.pathname.startsWith('/project-management/budget-overview') ? 'page' : undefined} href="/project-management/budget-overview">Budget</a>
			{/if}
			{#if canAccessForRole(role, 'compliance')}
				<a class="hover:text-primary" class:text-primary={page.url.pathname.startsWith('/project-management/compliance')} aria-current={page.url.pathname.startsWith('/project-management/compliance') ? 'page' : undefined} href="/project-management/compliance">Compliance</a>
			{/if}
			{#if canAccessForRole(role, 'reports')}
				<a class="hover:text-primary" class:text-primary={page.url.pathname.startsWith('/project-management/reports')} aria-current={page.url.pathname.startsWith('/project-management/reports') ? 'page' : undefined} href="/project-management/reports">Reports</a>
			{/if}
		</div>
	</nav>

	{#if segs.length}
		<nav class="mx-auto max-w-6xl px-4 py-2 text-xs text-gray-600" aria-label="Breadcrumb">
			<a class="hover:underline" href="/project-management">project-management</a>
			{#each segs as s, i}
				<span> / </span>
				<a class="hover:underline" aria-current={i === segs.length - 1 ? 'page' : undefined} href={crumbHref(i)}>{s}</a>
			{/each}
		</nav>
	{/if}

	<main id="pm-main" class="flex-1 w-full max-w-6xl mx-auto px-4 py-6" tabindex="-1">
		{@render children()}
	</main>
</div>

<style>
	/* Uses Tailwind classes */
</style>

