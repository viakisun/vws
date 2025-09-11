<script lang="ts">
	import { Bell, Menu, Search } from 'lucide-svelte';
	let { title = 'Workstream' } = $props<{ title?: string }>();
</script>

<header class="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
		<div class="flex items-center gap-2">
			<button class="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50" aria-label="Toggle sidebar">
				<Menu size={18} />
			</button>
			<div class="text-lg font-semibold text-gray-900">{title}</div>
		</div>
		<div class="hidden md:flex items-center gap-2">
			<div class="relative">
				<input class="w-64 rounded-md border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Search..." />
				<Search class="absolute left-2 top-1.5 text-gray-400" size={16} />
			</div>
			<button class="relative inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50" aria-label="Notifications">
				<Bell size={18} />
				<span class="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">3</span>
			</button>
			<div class="h-8 w-8 rounded-full bg-gray-200" aria-label="User avatar"></div>
		</div>
	</div>
</header>

