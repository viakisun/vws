<script lang="ts">
	import { BellIcon, MenuIcon, SearchIcon } from 'lucide-svelte';
	let { title = 'Workstream' } = $props<{ title?: string }>();

	let isMenuOpen = $state(false);
	let menuContainer: HTMLElement | null = null;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function handleWindowClick(event: MouseEvent) {
		if (!isMenuOpen || !menuContainer) return;
		const target = event.target as Node | null;
		if (target && !menuContainer.contains(target)) {
			isMenuOpen = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isMenuOpen = false;
		}
	}
</script>

<header class="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
		<div class="relative flex items-center gap-2" bind:this={menuContainer}>
			<button class="relative inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50" aria-label="Open menu" aria-haspopup="menu" aria-expanded={isMenuOpen} onclick={toggleMenu}>
				<MenuIcon size={18} />
			</button>
			{#if isMenuOpen}
				<div class="absolute left-4 top-12 z-40 w-56 rounded-md border border-gray-200 bg-white shadow">
					<nav aria-label="Main menu" class="py-1 text-sm">
						<a href="/" class="block px-3 py-2 hover:bg-gray-50 text-gray-800">Home</a>
						<a href="/dashboard" class="block px-3 py-2 hover:bg-gray-50 text-gray-800">Dashboard</a>
						<a href="/project-management" class="block px-3 py-2 hover:bg-gray-50 text-gray-800">Project Management</a>
						<a href="/project-management/projects" class="block px-3 py-2 hover:bg-gray-50 text-gray-800">Projects</a>
						<a href="/personnel" class="block px-3 py-2 hover:bg-gray-50 text-gray-800">Personnel</a>
						<a href="/expenses" class="block px-3 py-2 hover:bg-gray-50 text-gray-800">Expenses</a>
						<a href="/project-management/reports" class="block px-3 py-2 hover:bg-gray-50 text-gray-800">Reports</a>
						<a href="/about" class="block px-3 py-2 hover:bg-gray-50 text-gray-800">About</a>
						<a href="/sverdle" class="block px-3 py-2 hover:bg-gray-50 text-gray-800">Sverdle</a>
					</nav>
				</div>
			{/if}
			<a href="/" class="text-lg font-semibold text-gray-900 hover:underline">{title}</a>
		</div>
		<div class="hidden md:flex items-center gap-2">
			<div class="relative">
				<input class="w-64 rounded-md border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Search..." />
				<SearchIcon class="absolute left-2 top-1.5 text-gray-400" size={16} />
			</div>
			<button class="relative inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50" aria-label="Notifications">
				<BellIcon size={18} />
				<span class="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">3</span>
			</button>
			<div class="h-8 w-8 rounded-full bg-gray-200" aria-label="User avatar"></div>
		</div>
	</div>
</header>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

