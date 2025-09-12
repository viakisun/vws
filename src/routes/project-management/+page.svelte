<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { formatDate } from '$lib/utils/format';
	
	// 스토어 임포트
	import { 
		projects, 
		getActiveProjects
	} from '$lib/stores/project-management/core';
	
	import { 
		currentUser,
		canAccessExecutiveDashboard,
		canAccessLabHeadDashboard,
		canAccessPMDashboard,
		canAccessSupportDashboard,
		canAccessResearcherDashboard,
		getUserRoleNames
	} from '$lib/stores/project-management/rbac';
	
	import { 
		calculateHealthIndicator,
		getHealthDashboardData
	} from '$lib/stores/project-management/health-indicators';

	// 현재 사용자 정보
	let user: any = $state(null);
	let userRoles: string[] = $state([]);
	
	// 대시보드 데이터
	let healthData: any = $state(null);
	let activeProjects: any[] = $state([]);
	let projectHealthIndicators: any[] = $state([]);

	// 대시보드 타입 결정
	let dashboardType = $derived(() => {
		if (!user) return 'researcher';
		
		if (canAccessExecutiveDashboard(user)) return 'executive';
		if (canAccessLabHeadDashboard(user)) return 'labHead';
		if (canAccessPMDashboard(user)) return 'pm';
		if (canAccessSupportDashboard(user)) return 'support';
		return 'researcher';
	});

	// 권한 체크
	let canViewExecutive = $derived(() => canAccessExecutiveDashboard(user));
	let canViewLabHead = $derived(() => canAccessLabHeadDashboard(user));
	let canViewPM = $derived(() => canAccessPMDashboard(user));
	let canViewSupport = $derived(() => canAccessSupportDashboard(user));
	let canViewResearcher = $derived(() => canAccessResearcherDashboard(user));

	// 데이터 로드
	async function loadDashboardData() {
		// 사용자 정보 로드
		user = {
			id: 'current-user',
			name: '김관리자',
			email: 'admin@company.com',
			department: '경영지원팀',
			roleSet: ['R4', 'R5', 'R6'],
			active: true
		};
		
		userRoles = getUserRoleNames(user);
		
		// 대시보드 데이터 로드
		healthData = getHealthDashboardData();
		
		// 프로젝트 데이터 로드
		activeProjects = getActiveProjects($projects);
		
		// 프로젝트별 헬스 인디케이터 계산
		projectHealthIndicators = activeProjects.map(project => 
			calculateHealthIndicator(project.id)
		);
	}

	// 헬스 상태 텍스트
	function getHealthText(status: string) {
		switch (status) {
			case 'green': return '양호';
			case 'amber': return '주의';
			case 'red': return '위험';
			default: return '알 수 없음';
		}
	}

	onMount(() => {
		loadDashboardData();
	});
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- 헤더 -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">사업·R&D·HR 통합관리 시스템</h1>
			<p class="text-gray-600 mt-1">
				{user?.name}님 ({userRoles.join(', ')}) - {dashboardType()} 대시보드
			</p>
		</div>

		<!-- 경영진 대시보드 -->
		{#if canViewExecutive()}
			<div class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">경영진 대시보드</h2>
				
				<!-- 전체 현황 카드 -->
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<Card>
						<div class="p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
										<span class="text-white text-sm font-medium">P</span>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-500">활성 프로젝트</p>
									<p class="text-2xl font-semibold text-gray-900">{activeProjects.length}</p>
								</div>
							</div>
						</div>
					</Card>
					
					<Card>
						<div class="p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
										<span class="text-white text-sm font-medium">H</span>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-500">양호 상태</p>
									<p class="text-2xl font-semibold text-gray-900">{healthData?.greenCount || 0}</p>
								</div>
							</div>
						</div>
					</Card>
					
					<Card>
						<div class="p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
										<span class="text-white text-sm font-medium">A</span>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-500">주의 상태</p>
									<p class="text-2xl font-semibold text-gray-900">{healthData?.amberCount || 0}</p>
								</div>
							</div>
						</div>
					</Card>
					
					<Card>
						<div class="p-6">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
										<span class="text-white text-sm font-medium">R</span>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-500">위험 상태</p>
									<p class="text-2xl font-semibold text-gray-900">{healthData?.redCount || 0}</p>
								</div>
							</div>
						</div>
					</Card>
				</div>

				<!-- 프로젝트 헬스 상태 -->
				<Card class="mb-8">
					<div class="p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">프로젝트 헬스 상태</h3>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일정</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예산</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">인력</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리스크</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전체</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each projectHealthIndicators as indicator}
										<tr class="hover:bg-gray-50">
											<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{activeProjects.find(p => p.id === indicator.projectId)?.title || 'Unknown'}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{indicator.schedule}점</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{indicator.budget}점</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{indicator.people}점</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{indicator.risk}점</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<Badge variant={indicator.overall === 'green' ? 'success' : indicator.overall === 'amber' ? 'warning' : 'danger'}>
													{getHealthText(indicator.overall)}
												</Badge>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</Card>
			</div>
		{/if}

		<!-- 연구소장 대시보드 -->
		{#if canViewLabHead()}
			<div class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">연구소장 대시보드</h2>
				
				<!-- 주간 리포트 및 알림 -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					<Card>
						<div class="p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">주간 리포트 요약</h3>
							<div class="space-y-4">
								<div class="flex justify-between items-center">
									<span class="text-sm text-gray-600">완료된 마일스톤</span>
									<span class="text-sm font-medium text-gray-900">12/15</span>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-sm text-gray-600">예산 집행률</span>
									<span class="text-sm font-medium text-gray-900">68%</span>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-sm text-gray-600">연구노트 제출률</span>
									<span class="text-sm font-medium text-gray-900">85%</span>
								</div>
							</div>
						</div>
					</Card>
					
					<Card>
						<div class="p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">SLA 알림</h3>
							<div class="space-y-3">
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div>
										<p class="text-sm font-medium text-gray-900">PM 승인 마감 1일 전입니다.</p>
										<p class="text-xs text-gray-500">2시간 전</p>
									</div>
									<Badge variant="warning">medium</Badge>
								</div>
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div>
										<p class="text-sm font-medium text-gray-900">연구노트 제출 마감일입니다.</p>
										<p class="text-xs text-gray-500">4시간 전</p>
									</div>
									<Badge variant="danger">high</Badge>
								</div>
							</div>
						</div>
					</Card>
				</div>
			</div>
		{/if}

		<!-- PM 대시보드 -->
		{#if canViewPM()}
			<div class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">PM 대시보드</h2>
				
				<!-- 프로젝트 목록 -->
				<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
					{#each activeProjects as project}
						<Card>
							<div class="p-6">
								<div class="flex justify-between items-start mb-4">
									<div>
										<h3 class="text-lg font-semibold text-gray-900">{project.title}</h3>
										<p class="text-sm text-gray-500">{project.code}</p>
									</div>
									<Badge variant={project.status === 'active' ? 'success' : 'secondary'}>
										{project.status}
									</Badge>
								</div>
								
								<div class="space-y-3">
									<div class="flex justify-between items-center">
										<span class="text-sm text-gray-600">시작일</span>
										<span class="text-sm font-medium text-gray-900">{formatDate(project.startDate)}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-sm text-gray-600">종료일</span>
										<span class="text-sm font-medium text-gray-900">{formatDate(project.endDate)}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-sm text-gray-600">상태</span>
										{#each projectHealthIndicators as health}
											{#if health.projectId === project.id}
												<Badge variant={health.overall === 'green' ? 'success' : health.overall === 'amber' ? 'warning' : 'danger'}>
													{getHealthText(health.overall)}
												</Badge>
											{/if}
										{/each}
									</div>
								</div>
								
								<div class="mt-4">
									<button
										class="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
									>
										상세 보기
									</button>
								</div>
							</div>
						</Card>
		{/each}
	</div>
			</div>
		{/if}

		<!-- 경영지원 대시보드 -->
		{#if canViewSupport()}
			<div class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">경영지원 대시보드</h2>
				
				<!-- 결재 대기 및 번들 현황 -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					<Card>
						<div class="p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">결재 대기 현황</h3>
							<div class="space-y-3">
								<div class="flex justify-between items-center">
									<span class="text-sm text-gray-600">PM 승인 대기</span>
									<span class="text-sm font-medium text-gray-900">5건</span>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-sm text-gray-600">경영지원 검토 대기</span>
									<span class="text-sm font-medium text-gray-900">3건</span>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-sm text-gray-600">연구소장 승인 대기</span>
									<span class="text-sm font-medium text-gray-900">1건</span>
								</div>
							</div>
						</div>
					</Card>
					
					<Card>
						<div class="p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">업로드 번들 현황</h3>
							<div class="space-y-3">
								<div class="flex justify-between items-center">
									<span class="text-sm text-gray-600">생성 중</span>
									<span class="text-sm font-medium text-gray-900">2건</span>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-sm text-gray-600">준비 완료</span>
									<span class="text-sm font-medium text-gray-900">5건</span>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-sm text-gray-600">업로드 완료</span>
									<span class="text-sm font-medium text-gray-900">12건</span>
								</div>
							</div>
						</div>
					</Card>
				</div>
			</div>
		{/if}

		<!-- 연구원 대시보드 -->
		{#if canViewResearcher()}
			<div class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-6">연구원 대시보드</h2>
				
				<!-- 개인 업무 현황 -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					<Card>
						<div class="p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">이번 주 할 일</h3>
							<div class="space-y-3">
								<div class="flex items-center space-x-3">
									<input type="checkbox" class="rounded">
									<span class="text-sm text-gray-900">연구노트 작성</span>
								</div>
								<div class="flex items-center space-x-3">
									<input type="checkbox" class="rounded">
									<span class="text-sm text-gray-900">실험 결과 분석</span>
								</div>
								<div class="flex items-center space-x-3">
									<input type="checkbox" class="rounded">
									<span class="text-sm text-gray-900">산출물 업로드</span>
								</div>
							</div>
						</div>
					</Card>
					
					<Card>
						<div class="p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">참여 프로젝트</h3>
							<div class="space-y-3">
								{#each activeProjects.slice(0, 3) as project}
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div>
											<p class="text-sm font-medium text-gray-900">{project.title}</p>
											<p class="text-xs text-gray-500">{project.code}</p>
										</div>
										<Badge variant="secondary">참여중</Badge>
									</div>
								{/each}
							</div>
						</div>
					</Card>
				</div>
			</div>
		{/if}

		<!-- 공통 섹션: 최근 활동 -->
		<Card>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
				<div class="space-y-4">
					<div class="flex items-center space-x-3">
						<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
						<div>
							<p class="text-sm text-gray-900">새로운 지출 요청이 생성되었습니다.</p>
							<p class="text-xs text-gray-500">2시간 전</p>
						</div>
					</div>
					<div class="flex items-center space-x-3">
						<div class="w-2 h-2 bg-green-500 rounded-full"></div>
						<div>
							<p class="text-sm text-gray-900">마일스톤이 완료되었습니다.</p>
							<p class="text-xs text-gray-500">4시간 전</p>
						</div>
					</div>
					<div class="flex items-center space-x-3">
						<div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
						<div>
							<p class="text-sm text-gray-900">연구노트가 제출되었습니다.</p>
							<p class="text-xs text-gray-500">6시간 전</p>
						</div>
					</div>
				</div>
			</div>
		</Card>
	</div>
</div>