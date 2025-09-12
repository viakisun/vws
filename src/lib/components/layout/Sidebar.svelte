<script lang="ts">
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
		SearchIcon,
		BellIcon,
		LogOutIcon,
		UserIcon
	} from 'lucide-svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeAvatar from '$lib/components/ui/ThemeAvatar.svelte';
	import ThemeInput from '$lib/components/ui/ThemeInput.svelte';
	import ThemeDropdown from '$lib/components/ui/ThemeDropdown.svelte';

	let { isCollapsed = $bindable(false) } = $props<{ isCollapsed?: boolean }>();

	// Search and notification state
	let searchQuery = $state('');
	let showNotifications = $state(false);
	let showUserMenu = $state(false);
	let notificationsContainer: HTMLElement;
	let userMenuContainer: HTMLElement;
	let unreadCount = $state(3);

	// Toggle notifications
	function toggleNotifications() {
		showNotifications = !showNotifications;
		showUserMenu = false;
	}

	// Toggle user menu
	function toggleUserMenu() {
		showUserMenu = !showUserMenu;
		showNotifications = false;
	}

	// Close dropdowns when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (notificationsContainer && !notificationsContainer.contains(event.target as Node)) {
			showNotifications = false;
		}
		if (userMenuContainer && !userMenuContainer.contains(event.target as Node)) {
			showUserMenu = false;
		}
	}

	const navigationItems = [
		{ name: '대시보드', href: '/', icon: HomeIcon, current: true },
		{ name: '재무관리', href: '/finance', icon: BanknoteIcon, current: false },
		{ name: '인사관리', href: '/hr', icon: UsersIcon, current: false },
		{ name: '연구개발', href: '/project-management', icon: FlaskConicalIcon, current: false },
		{ name: '영업관리', href: '/sales', icon: BriefcaseIcon, current: false },
		{ name: '고객관리', href: '/crm', icon: BuildingIcon, current: false },
		{ name: '일정관리', href: '/calendar', icon: CalendarIcon, current: false },
		{ name: '보고서', href: '/reports', icon: FileTextIcon, current: false },
		{ name: '분석', href: '/analytics', icon: BarChart3Icon, current: false },
		{ name: '메시지', href: '/messages', icon: MessageSquareIcon, current: false },
		{ name: '설정', href: '/settings', icon: SettingsIcon, current: false }
	];

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}
</script>

<aside class="bg-slate-900 text-white transition-all duration-300 {isCollapsed ? 'w-16' : 'w-64'} flex-shrink-0">
	<div class="flex h-full flex-col">
		<!-- Logo Section -->
		<div class="flex h-16 items-center justify-between px-4 border-b border-slate-800">
			{#if !isCollapsed}
				<div class="flex items-center space-x-2">
					<div class="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
						<span class="text-sm font-bold text-white">VWS</span>
					</div>
					<span class="text-lg font-semibold">WorkStream</span>
				</div>
			{:else}
				<div class="h-8 w-8 rounded bg-blue-600 flex items-center justify-center mx-auto">
					<span class="text-sm font-bold text-white">VWS</span>
				</div>
			{/if}
			
			<ThemeButton 
				variant="ghost" 
				size="sm"
				onclick={toggleCollapse}
				class="p-1.5 hover:bg-slate-800 transition-colors"
			>
				{#if isCollapsed}
					<ChevronRightIcon size={16} />
				{:else}
					<ChevronLeftIcon size={16} />
				{/if}
			</ThemeButton>
		</div>

		<!-- Search Section -->
		<div class="p-4 border-b border-slate-800">
			{#if !isCollapsed}
				<ThemeInput 
					type="search" 
					placeholder="검색..." 
					class="w-full"
					value={searchQuery}
					oninput={(e) => searchQuery = e.target.value}
				>
					<SearchIcon size={16} slot="prefix" />
				</ThemeInput>
			{:else}
				<ThemeButton 
					variant="ghost" 
					size="sm"
					class="w-full text-slate-300 hover:text-white"
				>
					<SearchIcon size={20} />
				</ThemeButton>
			{/if}
		</div>

		<!-- Navigation -->
		<nav class="flex-1 px-2 py-4 space-y-1">
			{#each navigationItems as item}
				<a
					href={item.href}
					class="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
						{item.current 
							? 'bg-blue-600 text-white' 
							: 'text-slate-300 hover:bg-slate-800 hover:text-white'
						}"
					title={isCollapsed ? item.name : ''}
				>
					{#if item.icon}
						{@const IconComponent = item.icon}
						<IconComponent size={20} class="flex-shrink-0" />
					{/if}
					{#if !isCollapsed}
						<span class="ml-3">{item.name}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<!-- Bottom Section -->
		<div class="border-t border-slate-800 p-4 space-y-2">
			<!-- Notifications -->
			<div class="relative" bind:this={notificationsContainer}>
				<ThemeButton 
					variant="ghost" 
					size="sm"
					onclick={toggleNotifications}
					class="w-full {isCollapsed ? 'justify-center' : 'justify-start'} text-slate-300 hover:text-white relative"
				>
					<BellIcon size={20} class={isCollapsed ? '' : 'mr-3'} />
					{#if !isCollapsed}
						<span class="flex-1 text-left">알림</span>
					{/if}
					{#if unreadCount > 0}
						<span class="h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center {isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'}">
							{unreadCount}
						</span>
					{/if}
				</ThemeButton>

				{#if showNotifications}
					<ThemeDropdown 
						class="absolute bottom-full left-0 mb-2 w-80 z-50"
						position="top-left"
						open={showNotifications}
						onchange={(open) => showNotifications = open}
					>
						<div class="px-4 py-2 border-b border-gray-100">
							<h3 class="text-sm font-medium text-gray-900">알림</h3>
						</div>
						<div class="max-h-64 overflow-y-auto">
							<div class="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
								<p class="text-sm text-gray-900">새로운 프로젝트 승인 요청</p>
								<p class="text-xs text-gray-500">2분 전</p>
							</div>
							<div class="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
								<p class="text-sm text-gray-900">월간 보고서 제출 마감</p>
								<p class="text-xs text-gray-500">1시간 전</p>
							</div>
							<div class="px-4 py-3 hover:bg-gray-50">
								<p class="text-sm text-gray-900">팀 회의 일정 변경</p>
								<p class="text-xs text-gray-500">3시간 전</p>
							</div>
						</div>
					</ThemeDropdown>
				{/if}
			</div>

			<!-- User Profile -->
			<div class="relative" bind:this={userMenuContainer}>
				<ThemeButton 
					variant="ghost" 
					size="sm"
					onclick={toggleUserMenu}
					class="w-full {isCollapsed ? 'justify-center' : 'justify-start'} text-slate-300 hover:text-white"
				>
					<ThemeAvatar size="sm" fallback="김" class={isCollapsed ? '' : 'mr-3'} />
					{#if !isCollapsed}
						<div class="flex-1 min-w-0 text-left">
							<p class="text-sm font-medium text-white truncate">김개발</p>
							<p class="text-xs text-slate-400 truncate">개발팀</p>
						</div>
					{/if}
				</ThemeButton>

				{#if showUserMenu}
					<ThemeDropdown 
						class="absolute bottom-full left-0 mb-2 w-48 z-50"
						position="top-left"
						open={showUserMenu}
						onchange={(open) => showUserMenu = open}
					>
						<div class="px-4 py-2 border-b border-gray-100">
							<p class="text-sm font-medium text-gray-900">김개발</p>
							<p class="text-sm text-gray-500">개발팀</p>
						</div>
						<a href="/profile" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
							<UserIcon class="h-4 w-4 mr-3" />
							프로필
						</a>
						<a href="/settings" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
							<SettingsIcon class="h-4 w-4 mr-3" />
							설정
						</a>
						<div class="border-t border-gray-100"></div>
						<a href="/logout" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
							<LogOutIcon class="h-4 w-4 mr-3" />
							로그아웃
						</a>
					</ThemeDropdown>
				{/if}
			</div>
		</div>
	</div>
</aside>
