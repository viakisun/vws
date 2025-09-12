<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { generateDummyProjects } from '$lib/stores/rnd/dummy-data';
	import type { Project } from '$lib/stores/rnd/types';

	// 상태 관리
	let projects = $state<Project[]>([]);
	let searchQuery = $state('');
	let statusFilter = $state('all');
	let sponsorFilter = $state('all');
	let showCreateModal = $state(false);
	let showDetailModal = $state(false);
	let selectedProject: Project | null = $state(null);

	// 폼 데이터
	let projectForm = $state({
		code: '',
		title: '',
		description: '',
		sponsor: 'national' as const,
		sponsorName: '',
		startDate: '',
		endDate: '',
		managerId: '',
		totalBudget: 0,
		currency: 'KRW' as const
	});

	// 통계 데이터
	let statistics = $state({
		total: 0,
		active: 0,
		completed: 0,
		planning: 0,
		totalBudget: 0
	});

	// 필터링된 프로젝트
	let filteredProjects = $derived(() => {
		let filtered = projects;

		// 검색어 필터
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(project => 
				project.title.toLowerCase().includes(query) ||
				project.code.toLowerCase().includes(query) ||
				project.description.toLowerCase().includes(query)
			);
		}

		// 상태 필터
		if (statusFilter !== 'all') {
			filtered = filtered.filter(project => project.status === statusFilter);
		}

		// 스폰서 필터
		if (sponsorFilter !== 'all') {
			filtered = filtered.filter(project => project.sponsor === sponsorFilter);
		}

		return filtered;
	});

	// 통계 업데이트
	function updateStatistics() {
		statistics = {
			total: projects.length,
			active: projects.filter(p => p.status === 'active').length,
			completed: projects.filter(p => p.status === 'completed').length,
			planning: projects.filter(p => p.status === 'planning').length,
			totalBudget: projects.reduce((sum, p) => sum + p.totalBudget, 0)
		};
	}

	// 프로젝트 생성
	function handleCreateProject() {
		if (!projectForm.code || !projectForm.title || !projectForm.startDate || !projectForm.endDate) {
			alert('필수 항목을 모두 입력해주세요.');
			return;
		}

		const newProject: Project = {
			id: `proj-${Date.now()}`,
			...projectForm,
			status: 'planning',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		projects = [...projects, newProject];
		updateStatistics();

		// 폼 초기화
		projectForm = {
			code: '',
			title: '',
			description: '',
			sponsor: 'national',
			sponsorName: '',
			startDate: '',
			endDate: '',
			managerId: '',
			totalBudget: 0,
			currency: 'KRW'
		};

		showCreateModal = false;
	}

	// 프로젝트 상세 보기
	function showProjectDetail(project: Project) {
		selectedProject = project;
		showDetailModal = true;
	}

	// 상태별 색상
	function getStatusColor(status: string) {
		switch (status) {
			case 'planning': return 'secondary';
			case 'active': return 'success';
			case 'completed': return 'primary';
			case 'cancelled': return 'danger';
			case 'on_hold': return 'warning';
			default: return 'secondary';
		}
	}

	// 상태별 텍스트
	function getStatusText(status: string) {
		switch (status) {
			case 'planning': return '기획중';
			case 'active': return '진행중';
			case 'completed': return '완료';
			case 'cancelled': return '취소됨';
			case 'on_hold': return '보류';
			default: return status;
		}
	}

	// 스폰서별 텍스트
	function getSponsorText(sponsor: string) {
		switch (sponsor) {
			case 'national': return '국가과제';
			case 'private': return '민간과제';
			case 'internal': return '내부과제';
			default: return sponsor;
		}
	}

	// 금액 포맷팅
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('ko-KR', {
			style: 'currency',
			currency: 'KRW',
			minimumFractionDigits: 0
		}).format(amount);
	}

	// 날짜 포맷팅
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('ko-KR');
	}

	// 진행률 계산
	function calculateProgress(project: Project) {
		const start = new Date(project.startDate).getTime();
		const end = new Date(project.endDate).getTime();
		const now = new Date().getTime();
		
		if (now < start) return 0;
		if (now > end) return 100;
		
		return Math.round(((now - start) / (end - start)) * 100);
	}

	onMount(() => {
		// 더미 프로젝트 데이터 로드
		projects = generateDummyProjects();
		updateStatistics();
	});
</script>

<div class="space-y-6">
	<!-- 페이지 헤더 -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">프로젝트 관리</h1>
			<p class="mt-2 text-gray-600">R&D 프로젝트 현황 및 관리</p>
		</div>
		<button
			onclick={() => showCreateModal = true}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
		>
			새 프로젝트 생성
		</button>
	</div>

	<!-- 통계 카드 -->
	<div class="grid grid-cols-1 md:grid-cols-5 gap-6">
		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">전체</p>
						<p class="text-2xl font-bold text-gray-900">{statistics.total}</p>
					</div>
					<div class="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
						<span class="text-gray-600 font-bold">📋</span>
					</div>
				</div>
			</div>
		</Card>

		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">진행중</p>
						<p class="text-2xl font-bold text-green-600">{statistics.active}</p>
					</div>
					<div class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
						<span class="text-green-600 font-bold">🚀</span>
					</div>
				</div>
			</div>
		</Card>

		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">완료</p>
						<p class="text-2xl font-bold text-blue-600">{statistics.completed}</p>
					</div>
					<div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
						<span class="text-blue-600 font-bold">✅</span>
					</div>
				</div>
			</div>
		</Card>

		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">기획중</p>
						<p class="text-2xl font-bold text-yellow-600">{statistics.planning}</p>
					</div>
					<div class="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
						<span class="text-yellow-600 font-bold">📝</span>
					</div>
				</div>
			</div>
		</Card>

		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">총 예산</p>
						<p class="text-2xl font-bold text-purple-600">{formatCurrency(statistics.totalBudget)}</p>
					</div>
					<div class="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
						<span class="text-purple-600 font-bold">💰</span>
					</div>
				</div>
			</div>
		</Card>
	</div>

	<!-- 필터 및 검색 -->
	<div class="bg-white p-6 rounded-lg shadow">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">검색</label>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="프로젝트명, 코드, 설명 검색..."
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">상태</label>
				<select
					bind:value={statusFilter}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">전체</option>
					<option value="planning">기획중</option>
					<option value="active">진행중</option>
					<option value="completed">완료</option>
					<option value="cancelled">취소됨</option>
					<option value="on_hold">보류</option>
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">스폰서</label>
				<select
					bind:value={sponsorFilter}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">전체</option>
					<option value="national">국가과제</option>
					<option value="private">민간과제</option>
					<option value="internal">내부과제</option>
				</select>
			</div>
		</div>
	</div>

	<!-- 프로젝트 목록 -->
	<div class="bg-white rounded-lg shadow">
		<div class="p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">프로젝트 목록 ({filteredProjects().length}개)</h3>
			
			{#if filteredProjects().length === 0}
				<div class="text-center py-12">
					<div class="text-gray-400 text-6xl mb-4">📋</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h3>
					<p class="text-gray-500">새 프로젝트를 생성해보세요.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
					{#each filteredProjects() as project}
						<Card>
							<div class="p-6">
								<div class="flex items-start justify-between mb-4">
									<div class="flex-1">
										<h4 class="text-lg font-semibold text-gray-900 mb-1">{project.title}</h4>
										<p class="text-sm text-gray-600 mb-2">{project.code}</p>
										<Badge variant={getStatusColor(project.status)}>
											{getStatusText(project.status)}
										</Badge>
									</div>
									<button
										onclick={() => showProjectDetail(project)}
										class="p-2 text-gray-400 hover:text-gray-600"
										aria-label="상세보기"
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</button>
								</div>

								<div class="space-y-3">
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">스폰서:</span>
										<span class="font-medium">{getSponsorText(project.sponsor)}</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">예산:</span>
										<span class="font-medium">{formatCurrency(project.totalBudget)}</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">기간:</span>
										<span class="font-medium">{formatDate(project.startDate)} ~ {formatDate(project.endDate)}</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">진행률:</span>
										<span class="font-medium">{calculateProgress(project)}%</span>
									</div>
								</div>

								<!-- 진행률 바 -->
								<div class="mt-4">
									<div class="w-full bg-gray-200 rounded-full h-2">
										<div 
											class="bg-blue-600 h-2 rounded-full transition-all duration-300"
											style="width: {calculateProgress(project)}%"
										></div>
									</div>
								</div>

								<div class="mt-4 flex justify-end">
									<button
										onclick={() => showProjectDetail(project)}
										class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
									>
										상세보기
									</button>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- 프로젝트 생성 모달 -->
<Modal bind:open={showCreateModal} title="새 프로젝트 생성">
	<div class="space-y-4">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">프로젝트 코드 *</label>
				<input
					type="text"
					bind:value={projectForm.code}
					placeholder="예: AI-2024-001"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">스폰서 *</label>
				<select
					bind:value={projectForm.sponsor}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="national">국가과제</option>
					<option value="private">민간과제</option>
					<option value="internal">내부과제</option>
				</select>
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">프로젝트명 *</label>
			<input
				type="text"
				bind:value={projectForm.title}
				placeholder="프로젝트명을 입력하세요"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">스폰서명 *</label>
			<input
				type="text"
				bind:value={projectForm.sponsorName}
				placeholder="스폰서 기관명을 입력하세요"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
			<textarea
				bind:value={projectForm.description}
				rows="3"
				placeholder="프로젝트 설명을 입력하세요"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			></textarea>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
				<input
					type="date"
					bind:value={projectForm.startDate}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">종료일 *</label>
				<input
					type="date"
					bind:value={projectForm.endDate}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">총 예산 *</label>
				<input
					type="number"
					bind:value={projectForm.totalBudget}
					placeholder="0"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">통화</label>
				<select
					bind:value={projectForm.currency}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="KRW">KRW (원)</option>
					<option value="USD">USD (달러)</option>
					<option value="EUR">EUR (유로)</option>
				</select>
			</div>
		</div>
	</div>

	<div class="flex justify-end space-x-3 mt-6">
		<button
			onclick={() => showCreateModal = false}
			class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
		>
			취소
		</button>
		<button
			onclick={handleCreateProject}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
		>
			생성
		</button>
	</div>
</Modal>

<!-- 프로젝트 상세 모달 -->
<Modal bind:open={showDetailModal} title="프로젝트 상세">
	{#if selectedProject}
		<div class="space-y-6">
			<!-- 기본 정보 -->
			<div>
				<h3 class="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-500">프로젝트명</label>
						<p class="text-sm text-gray-900">{selectedProject.title}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-500">코드</label>
						<p class="text-sm text-gray-900">{selectedProject.code}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-500">상태</label>
						<Badge variant={getStatusColor(selectedProject.status)}>
							{getStatusText(selectedProject.status)}
						</Badge>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-500">스폰서</label>
						<p class="text-sm text-gray-900">{getSponsorText(selectedProject.sponsor)}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-500">스폰서명</label>
						<p class="text-sm text-gray-900">{selectedProject.sponsorName}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-500">총 예산</label>
						<p class="text-sm text-gray-900">{formatCurrency(selectedProject.totalBudget)}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-500">시작일</label>
						<p class="text-sm text-gray-900">{formatDate(selectedProject.startDate)}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-500">종료일</label>
						<p class="text-sm text-gray-900">{formatDate(selectedProject.endDate)}</p>
					</div>
				</div>
				<div class="mt-4">
					<label class="block text-sm font-medium text-gray-500">설명</label>
					<p class="text-sm text-gray-900">{selectedProject.description}</p>
				</div>
			</div>

			<!-- 진행률 -->
			<div>
				<h3 class="text-lg font-medium text-gray-900 mb-4">진행률</h3>
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">전체 진행률</span>
						<span class="font-medium">{calculateProgress(selectedProject)}%</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-3">
						<div 
							class="bg-blue-600 h-3 rounded-full transition-all duration-300"
							style="width: {calculateProgress(selectedProject)}%"
						></div>
					</div>
				</div>
			</div>

			<!-- 예산 현황 -->
			<div>
				<h3 class="text-lg font-medium text-gray-900 mb-4">예산 현황</h3>
				<div class="grid grid-cols-3 gap-4">
					<div class="text-center p-4 bg-blue-50 rounded-lg">
						<p class="text-sm text-gray-600">총 예산</p>
						<p class="text-lg font-semibold text-blue-600">{formatCurrency(selectedProject.totalBudget)}</p>
					</div>
					<div class="text-center p-4 bg-green-50 rounded-lg">
						<p class="text-sm text-gray-600">사용 예산</p>
						<p class="text-lg font-semibold text-green-600">{formatCurrency(selectedProject.totalBudget * 0.65)}</p>
					</div>
					<div class="text-center p-4 bg-gray-50 rounded-lg">
						<p class="text-sm text-gray-600">잔여 예산</p>
						<p class="text-lg font-semibold text-gray-600">{formatCurrency(selectedProject.totalBudget * 0.35)}</p>
					</div>
				</div>
			</div>
		</div>

		<div class="flex justify-end space-x-3 mt-6">
			<button
				onclick={() => showDetailModal = false}
				class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
			>
				닫기
			</button>
			<button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
				편집
			</button>
		</div>
	{/if}
</Modal>
