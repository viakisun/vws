<script lang="ts">
	const links = [
		{ href: '/project-management/dashboard', label: 'Project Dashboard' },
		{ href: '/project-management/participation', label: 'Participation Management' },
		{ href: '/project-management/projects', label: 'Projects' },
		{ href: '/project-management/budget-overview', label: 'Budget Overview' },
		{ href: '/project-management/compliance', label: 'Compliance' },
		{ href: '/project-management/reports', label: 'Reports' }
	];
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">R&D Project Management</h1>
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		{#each links as l}
			<a class="card hover:bg-gray-50 transition-colors" href={l.href}>
				<div class="text-sm font-medium text-gray-800">{l.label}</div>
				<div class="text-caption mt-1">{l.href}</div>
			</a>
		{/each}
	</div>
</section>

