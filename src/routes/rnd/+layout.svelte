<script lang="ts">
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	
	let { children } = $props();
	
	// 현재 사용자 역할 (실제로는 인증 시스템에서 가져옴)
	let currentUser = $state({
		id: 'user-001',
		name: '김경영',
		email: 'kim.kyung@company.com',
		department: '경영지원팀',
		role: 'MANAGEMENT_SUPPORT', // 경영지원팀 역할
		permissions: ['READ_ALL', 'WRITE_ALL', 'APPROVE_ALL', 'AUDIT_ALL']
	});

	// 네비게이션 메뉴 (역할별로 동적으로 표시)
	let navigationItems = $derived(() => {
		const baseItems = [
			{ name: '대시보드', href: '/rnd', icon: '📊' },
			{ name: '예산 관리', href: '/rnd/budget', icon: '💰' },
			{ name: '지출 관리', href: '/rnd/expenses', icon: '💳' },
			{ name: '인력 관리', href: '/rnd/personnel', icon: '👥' },
			{ name: '연구노트', href: '/rnd/research-notes', icon: '📝' },
			{ name: '리포트', href: '/rnd/reports', icon: '📈' },
			{ name: '결재 관리', href: '/rnd/approvals', icon: '✅' },
			{ name: '국가R&D 업로드', href: '/rnd/submissions', icon: '📤' },
			{ name: '감사 로그', href: '/rnd/audit', icon: '🔍' }
		];

		// 역할별 메뉴 필터링
		switch (currentUser.role) {
			case 'EXECUTIVE':
				return baseItems.filter(item => 
					['대시보드', '예산 관리', '리포트', '감사 로그'].includes(item.name)
				);
			case 'LAB_HEAD':
				return baseItems.filter(item => 
					['대시보드', '예산 관리', '연구노트', '리포트', '결재 관리'].includes(item.name)
				);
			case 'PM':
				return baseItems.filter(item => 
					['대시보드', '예산 관리', '지출 관리', '인력 관리', '연구노트', '리포트'].includes(item.name)
				);
			case 'MANAGEMENT_SUPPORT':
				return baseItems; // 경영지원팀은 모든 메뉴 접근 가능
			case 'RESEARCHER':
				return baseItems.filter(item => 
					['대시보드', '연구노트', '리포트'].includes(item.name)
				);
			default:
				return baseItems;
		}
	});

	// 현재 경로 확인
	let currentPath = $derived($page.url.pathname);

	onMount(() => {
		// 사용자 정보 로드 및 권한 확인
		console.log('R&D 시스템 초기화:', currentUser);
	});
</script>

<div class="min-h-screen bg-gray-50">
	<!-- 상단 헤더 -->
	<header class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<h1 class="text-2xl font-bold text-gray-900">R&D 통합관리 시스템</h1>
					</div>
					<nav class="hidden md:ml-10 md:flex md:space-x-8">
						{#each navigationItems() as item}
							<a
								href={item.href}
								class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200
									{currentPath === item.href 
										? 'border-blue-500 text-gray-900' 
										: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
							>
								<span class="mr-2">{item.icon}</span>
								{item.name}
							</a>
						{/each}
					</nav>
				</div>
				
				<div class="flex items-center space-x-4">
					<!-- 알림 -->
					<button class="p-2 text-gray-400 hover:text-gray-500 relative">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.5 5.5L9 10l-4.5 4.5L1 10l3.5-4.5z" />
						</svg>
						<span class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
					</button>
					
					<!-- 사용자 정보 -->
					<div class="flex items-center space-x-3">
						<div class="text-right">
							<p class="text-sm font-medium text-gray-900">{currentUser.name}</p>
							<p class="text-xs text-gray-500">{currentUser.department}</p>
						</div>
						<div class="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
							<span class="text-sm font-medium text-white">{currentUser.name.charAt(0)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- 모바일 메뉴 -->
	<div class="md:hidden">
		<div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b border-gray-200">
			{#each navigationItems() as item}
				<a
					href={item.href}
					class="flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors duration-200
						{currentPath === item.href 
							? 'bg-blue-50 text-blue-700' 
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
				>
					<span class="mr-3">{item.icon}</span>
					{item.name}
				</a>
			{/each}
		</div>
	</div>

	<!-- 메인 콘텐츠 -->
	<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		{@render children()}
	</main>
</div>

<style>
	/* 추가 스타일링 */
	nav a {
		transition: all 0.2s ease-in-out;
	}
	
	nav a:hover {
		transform: translateY(-1px);
	}
</style>
