<script lang="ts">
	import { page } from '$app/stores';
	import { 
		HomeIcon, 
		BarChart3Icon, 
		UsersIcon, 
		BriefcaseIcon, 
		FileTextIcon, 
		SettingsIcon,
		BanknoteIcon,
		FlaskConicalIcon,
		BuildingIcon,
		CalendarIcon,
		MessageSquareIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		DollarSignIcon
	} from 'lucide-svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';

	let { isCollapsed = $bindable(true) } = $props<{ isCollapsed?: boolean }>();


	const navigationItems = [
		{ name: '대시보드', href: '/', icon: HomeIcon },
		{ name: '재무관리', href: '/finance', icon: BanknoteIcon },
		{ name: '급여관리', href: '/salary', icon: DollarSignIcon },
		{ name: '인사관리', href: '/hr', icon: UsersIcon },
		{ name: '연구개발', href: '/project-management', icon: FlaskConicalIcon },
		{ name: '영업관리', href: '/sales', icon: BriefcaseIcon },
		{ name: '고객관리', href: '/crm', icon: BuildingIcon },
		{ name: '일정관리', href: '/calendar', icon: CalendarIcon },
		{ name: '보고서', href: '/reports', icon: FileTextIcon },
		{ name: '분석', href: '/analytics', icon: BarChart3Icon },
		{ name: '메시지', href: '/messages', icon: MessageSquareIcon },
		{ name: '설정', href: '/settings', icon: SettingsIcon }
	];

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}

</script>

<aside class="transition-all duration-300 {isCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 h-screen sticky top-0" style="background: var(--color-surface); border-right: 1px solid var(--color-border);">
	<div class="flex h-full flex-col">
		<!-- Toggle Button -->
		<div class="flex h-12 items-center justify-center" style="border-bottom: 1px solid var(--color-border);">
			<ThemeButton 
				variant="ghost" 
				size="sm"
				onclick={toggleCollapse}
				class="p-2 transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
			>
				{#if isCollapsed}
					<ChevronRightIcon size={16} />
				{:else}
					<ChevronLeftIcon size={16} />
				{/if}
			</ThemeButton>
		</div>


		<!-- Navigation -->
		<nav class="flex-1 px-3 py-4 space-y-1">
			{#each navigationItems as item}
				{@const currentPath = $page.url.pathname}
				{@const isCurrent = (item.href === '/' && currentPath === '/') || (item.href !== '/' && currentPath.startsWith(item.href))}
				<a
					href={item.href}
					class="group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative
						{isCurrent 
							? 'text-white shadow-lg' 
							: 'hover:scale-[1.02] hover:shadow-md'
						}"
					style="
						{isCurrent 
							? 'background: var(--color-primary);' 
							: 'color: var(--color-text-secondary); background: transparent;'
						}
						{isCurrent ? '' : 'hover:background: var(--color-surface-elevated);'}
					"
					title={isCollapsed ? item.name : ''}
				>
					{#if isCurrent}
						<div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
					{/if}
					{#if item.icon}
						<item.icon size={20} class="flex-shrink-0 {isCurrent ? 'text-white' : ''}" />
					{/if}
					{#if !isCollapsed}
						<span class="ml-3 font-medium {isCurrent ? 'text-white' : ''}">{item.name}</span>
					{/if}
					{#if isCurrent && !isCollapsed}
						<div class="ml-auto">
							<div class="w-2 h-2 bg-white rounded-full"></div>
						</div>
					{/if}
				</a>
			{/each}
		</nav>

	</div>
</aside>
