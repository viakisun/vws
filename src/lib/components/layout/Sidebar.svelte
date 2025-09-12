<script lang="ts">
	import { page } from '$app/stores';
	import { themeManager, isDark } from '$lib/stores/theme';
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
		UserIcon,
		SunIcon,
		MoonIcon
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
		{ name: '대시보드', href: '/', icon: HomeIcon },
		{ name: '재무관리', href: '/finance', icon: BanknoteIcon },
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

	// Check if a navigation item is current based on the current page
	function isCurrentItem(href: string): boolean {
		const currentPath = $page.url.pathname;
		
		// Exact match for root
		if (href === '/' && currentPath === '/') {
			return true;
		}
		
		// For other paths, check if current path starts with the href
		if (href !== '/' && currentPath.startsWith(href)) {
			return true;
		}
		
		return false;
	}

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}
</script>

<aside class="transition-all duration-300 {isCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 h-screen sticky top-0" style="background: var(--color-surface); border-right: 1px solid var(--color-border);">
	<div class="flex h-full flex-col">
		<!-- Logo Section -->
		<div class="flex h-16 items-center justify-between px-4" style="border-bottom: 1px solid var(--color-border);">
			{#if !isCollapsed}
				<div class="flex items-center space-x-3">
					<!-- 화려한 그라데이션 W 로고 -->
					<div class="relative">
						<div class="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg">
							<svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
						</div>
						<!-- 반짝이는 효과 -->
						<div class="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-pulse"></div>
					</div>
					<div class="flex flex-col">
						<span class="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
							WorkStream
						</span>
						<span class="text-xs text-gray-500 dark:text-gray-400">Via WorkStream</span>
					</div>
				</div>
			{:else}
				<!-- 축소된 상태의 화려한 로고 -->
				<div class="relative mx-auto">
					<div class="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg">
						<svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
						</svg>
					</div>
					<div class="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-pulse"></div>
				</div>
			{/if}
			
			<ThemeButton 
				variant="ghost" 
				size="sm"
				onclick={toggleCollapse}
				class="p-1.5 transition-colors"
				style="color: var(--color-text-secondary);"
			>
				{#if isCollapsed}
					<ChevronRightIcon size={16} />
				{:else}
					<ChevronLeftIcon size={16} />
				{/if}
			</ThemeButton>
		</div>

		<!-- Search Section -->
		<div class="p-4" style="border-bottom: 1px solid var(--color-border);">
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
					class="w-full"
					style="color: var(--color-text-secondary);"
				>
					<SearchIcon size={20} />
				</ThemeButton>
			{/if}
		</div>

		<!-- Navigation -->
		<nav class="flex-1 px-2 py-4 space-y-1">
			{#each navigationItems as item}
				{@const isCurrent = isCurrentItem(item.href)}
				<a
					href={item.href}
					class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
						{isCurrent 
							? 'text-white' 
							: 'hover:scale-[1.02]'
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
					{#if item.icon}
						<item.icon size={20} class="flex-shrink-0" />
					{/if}
					{#if !isCollapsed}
						<span class="ml-3">{item.name}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<!-- Bottom Section -->
		<div class="p-4 space-y-2" style="border-top: 1px solid var(--color-border);">
			<!-- Theme Toggle -->
			<ThemeButton 
				variant="ghost" 
				size="sm"
				onclick={() => themeManager.toggleTheme()}
				class="w-full {isCollapsed ? 'justify-center' : 'justify-start'}"
				style="color: var(--color-text-secondary);"
				title={$isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
			>
				{#if $isDark}
					<SunIcon size={20} class={isCollapsed ? '' : 'mr-3'} />
				{:else}
					<MoonIcon size={20} class={isCollapsed ? '' : 'mr-3'} />
				{/if}
				{#if !isCollapsed}
					<span class="flex-1 text-left">테마 전환</span>
				{/if}
			</ThemeButton>

			<!-- Notifications -->
			<div class="relative" bind:this={notificationsContainer}>
				<ThemeButton 
					variant="ghost" 
					size="sm"
					onclick={toggleNotifications}
					class="w-full {isCollapsed ? 'justify-center' : 'justify-start'} relative"
					style="color: var(--color-text-secondary);"
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
					class="w-full {isCollapsed ? 'justify-center' : 'justify-start'}"
					style="color: var(--color-text-secondary);"
				>
					<ThemeAvatar size="sm" fallback="김" class={isCollapsed ? '' : 'mr-3'} />
					{#if !isCollapsed}
						<div class="flex-1 min-w-0 text-left">
							<p class="text-sm font-medium truncate" style="color: var(--color-text);">김개발</p>
							<p class="text-xs truncate" style="color: var(--color-text-secondary);">개발팀</p>
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
