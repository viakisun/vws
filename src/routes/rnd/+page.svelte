<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte'
	import Card from '$lib/components/ui/Card.svelte'
	import SimpleChart from '$lib/components/ui/SimpleChart.svelte'
	import { initializeDummyData } from '$lib/stores/rnd/init-dummy-data'
	import { ExternalLinkIcon } from '@lucide/svelte'
	import { onMount } from 'svelte'
	
	// 대시보드 데이터
	let dashboardData = $state({
		// 프로젝트 현황
		projects: {
			total: 0,
			active: 0,
			completed: 0,
			atRisk: 0
		},
		// 예산 현황
		budget: {
			totalAllocated: 0,
			spent: 0,
			remaining: 0,
			utilizationRate: 0
		},
		// 인력 현황
		personnel: {
			total: 0,
			active: 0,
			onLeave: 0,
			utilizationRate: 0
		},
		// 지출 현황
		expenses: {
			pending: 0,
			approved: 0,
			rejected: 0,
			totalAmount: 0
		},
		// 연구노트 현황
		researchNotes: {
			submitted: 0,
			pending: 0,
			overdue: 0
		},
		// 결재 현황
		approvals: {
			pending: 0,
			completed: 0,
			overdue: 0
		}
	});

	// 최근 활동
	let recentActivities = $state<any[]>([]);

	// 알림 및 경고
	let alerts = $state<any[]>([]);

	// 헬스 인디케이터
	let healthIndicators = $state({
		overall: 'green',
		schedule: 85,
		budget: 92,
		people: 78,
		risk: 15
	});

	// 차트 데이터
	let projectStatusData = $derived(() => [
		{ label: '진행중', value: dashboardData.projects.active, color: '#3B82F6' },
		{ label: '완료', value: dashboardData.projects.completed, color: '#10B981' },
		{ label: '위험', value: dashboardData.projects.atRisk, color: '#EF4444' }
	]);

	let budgetUtilizationData = $derived(() => [
		{ label: '사용', value: dashboardData.budget.spent, color: '#F59E0B' },
		{ label: '잔여', value: dashboardData.budget.remaining, color: '#6B7280' }
	]);

	// 대시보드 데이터 로드
	async function loadDashboardData() {
		// 실제로는 API에서 데이터를 가져옴
		// 여기서는 더미 데이터로 시뮬레이션
		dashboardData = {
			projects: {
				total: 15,
				active: 8,
				completed: 5,
				atRisk: 2
			},
			budget: {
				totalAllocated: 2500000000, // 25억원
				spent: 1800000000, // 18억원
				remaining: 700000000, // 7억원
				utilizationRate: 72
			},
			personnel: {
				total: 45,
				active: 42,
				onLeave: 3,
				utilizationRate: 93
			},
			expenses: {
				pending: 12,
				approved: 156,
				rejected: 3,
				totalAmount: 450000000 // 4.5억원
			},
			researchNotes: {
				submitted: 180,
				pending: 8,
				overdue: 2
			},
			approvals: {
				pending: 5,
				completed: 89,
				overdue: 1
			}
		};

		recentActivities = [
			{
				id: 1,
				type: 'expense',
				title: 'AI 프로젝트 재료비 지출 승인',
				user: '김연구',
				time: '2시간 전',
				status: 'approved'
			},
			{
				id: 2,
				type: 'milestone',
				title: 'Q4 마일스톤 달성',
				user: '박PM',
				time: '4시간 전',
				status: 'completed'
			},
			{
				id: 3,
				type: 'research_note',
				title: '주간 연구노트 제출',
				user: '이연구',
				time: '6시간 전',
				status: 'submitted'
			},
			{
				id: 4,
				type: 'approval',
				title: '특허출원비 결재 완료',
				user: '최경영',
				time: '1일 전',
				status: 'approved'
			},
			{
				id: 5,
				type: 'alert',
				title: '예산 소진률 80% 초과 경고',
				user: '시스템',
				time: '2일 전',
				status: 'warning'
			}
		];

		alerts = [
			{
				id: 1,
				type: 'warning',
				title: '예산 소진률 경고',
				message: 'AI 프로젝트의 예산 소진률이 85%에 도달했습니다.',
				priority: 'high',
				time: '1시간 전'
			},
			{
				id: 2,
				type: 'info',
				title: '연구노트 제출 마감',
				message: '3명의 연구원이 아직 주간 연구노트를 제출하지 않았습니다.',
				priority: 'medium',
				time: '3시간 전'
			},
			{
				id: 3,
				type: 'error',
				title: '결재 지연',
				message: '특허출원비 결재가 SLA를 초과했습니다.',
				priority: 'high',
				time: '5시간 전'
			}
		];
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

	// 헬스 상태 색상
	function getHealthColor(status: string) {
		switch (status) {
			case 'green': return 'text-green-600 bg-green-100';
			case 'amber': return 'text-yellow-600 bg-yellow-100';
			case 'red': return 'text-red-600 bg-red-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	}

	// 활동 타입 아이콘
	function getActivityIcon(type: string) {
		switch (type) {
			case 'expense': return '💳';
			case 'milestone': return '🎯';
			case 'research_note': return '📝';
			case 'approval': return '✅';
			case 'alert': return '⚠️';
			default: return '📋';
		}
	}

	// 알림 타입 색상
	function getAlertColor(type: string) {
		switch (type) {
			case 'warning': return 'border-yellow-200 bg-yellow-50';
			case 'info': return 'border-blue-200 bg-blue-50';
			case 'error': return 'border-red-200 bg-red-50';
			default: return 'border-gray-200 bg-gray-50';
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

	onMount(() => {
		// 더미데이터 초기화
		initializeDummyData();
		loadDashboardData();
	});
</script>

<div class="space-y-6">
	<!-- 페이지 헤더 -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">R&D 통합관리 대시보드</h1>
			<p class="mt-2 text-gray-600">경영지원팀 - 전체 프로젝트 현황 및 모니터링</p>
		</div>
		<div class="flex items-center space-x-4">
			<a href="/rnd/rnd-asw" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
				<ExternalLinkIcon size={16} class="mr-2" />
				RND-ASW 프로젝트
			</a>
			<button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
				새 프로젝트 생성
			</button>
			<button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
				리포트 생성
			</button>
		</div>
	</div>

	<!-- 헬스 인디케이터 -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">일정 관리</p>
						<p class="text-2xl font-bold text-gray-900">{healthIndicators.schedule}점</p>
					</div>
					<div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
						<span class="text-blue-600 font-bold">📅</span>
					</div>
				</div>
			</div>
		</Card>

		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">예산 관리</p>
						<p class="text-2xl font-bold text-gray-900">{healthIndicators.budget}점</p>
					</div>
					<div class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
						<span class="text-green-600 font-bold">💰</span>
					</div>
				</div>
			</div>
		</Card>

		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">인력 관리</p>
						<p class="text-2xl font-bold text-gray-900">{healthIndicators.people}점</p>
					</div>
					<div class="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
						<span class="text-yellow-600 font-bold">👥</span>
					</div>
				</div>
			</div>
		</Card>

		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">리스크 관리</p>
						<p class="text-2xl font-bold text-gray-900">{healthIndicators.risk}점</p>
					</div>
					<div class="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
						<span class="text-red-600 font-bold">⚠️</span>
					</div>
				</div>
			</div>
		</Card>
	</div>

	<!-- 주요 지표 -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- 프로젝트 현황 -->
		<Card>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">프로젝트 현황</h3>
				<div class="space-y-4">
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">전체 프로젝트</span>
						<span class="text-lg font-semibold text-gray-900">{dashboardData.projects.total}개</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">진행중</span>
						<span class="text-lg font-semibold text-blue-600">{dashboardData.projects.active}개</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">완료</span>
						<span class="text-lg font-semibold text-green-600">{dashboardData.projects.completed}개</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">위험</span>
						<span class="text-lg font-semibold text-red-600">{dashboardData.projects.atRisk}개</span>
					</div>
				</div>
				<div class="mt-4">
					<SimpleChart data={projectStatusData()} type="pie" />
				</div>
			</div>
		</Card>

		<!-- 예산 현황 -->
		<Card>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">예산 현황</h3>
				<div class="space-y-4">
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">총 배정 예산</span>
						<span class="text-lg font-semibold text-gray-900">{formatCurrency(dashboardData.budget.totalAllocated)}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">사용 금액</span>
						<span class="text-lg font-semibold text-blue-600">{formatCurrency(dashboardData.budget.spent)}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">잔여 금액</span>
						<span class="text-lg font-semibold text-green-600">{formatCurrency(dashboardData.budget.remaining)}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">사용률</span>
						<span class="text-lg font-semibold text-orange-600">{dashboardData.budget.utilizationRate}%</span>
					</div>
				</div>
				<div class="mt-4">
					<SimpleChart data={budgetUtilizationData()} type="pie" />
				</div>
			</div>
		</Card>
	</div>

	<!-- 인력 및 지출 현황 -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- 인력 현황 -->
		<Card>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">인력 현황</h3>
				<div class="space-y-4">
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">전체 인력</span>
						<span class="text-lg font-semibold text-gray-900">{dashboardData.personnel.total}명</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">활성 인력</span>
						<span class="text-lg font-semibold text-green-600">{dashboardData.personnel.active}명</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">휴가/부재</span>
						<span class="text-lg font-semibold text-yellow-600">{dashboardData.personnel.onLeave}명</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">활용률</span>
						<span class="text-lg font-semibold text-blue-600">{dashboardData.personnel.utilizationRate}%</span>
					</div>
				</div>
			</div>
		</Card>

		<!-- 지출 현황 -->
		<Card>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">지출 현황</h3>
				<div class="space-y-4">
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">대기중</span>
						<span class="text-lg font-semibold text-yellow-600">{dashboardData.expenses.pending}건</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">승인</span>
						<span class="text-lg font-semibold text-green-600">{dashboardData.expenses.approved}건</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">거부</span>
						<span class="text-lg font-semibold text-red-600">{dashboardData.expenses.rejected}건</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">총 지출액</span>
						<span class="text-lg font-semibold text-gray-900">{formatCurrency(dashboardData.expenses.totalAmount)}</span>
					</div>
				</div>
			</div>
		</Card>
	</div>

	<!-- 알림 및 최근 활동 -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- 알림 -->
		<Card>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">알림 및 경고</h3>
				<div class="space-y-3">
					{#each alerts as alert}
						<div class="p-3 rounded-lg border {getAlertColor(alert.type)}">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">{alert.title}</p>
									<p class="text-xs text-gray-600 mt-1">{alert.message}</p>
									<p class="text-xs text-gray-500 mt-1">{alert.time}</p>
								</div>
								<Badge variant={alert.priority === 'high' ? 'danger' : 'warning'}>
									{alert.priority === 'high' ? '높음' : '보통'}
								</Badge>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</Card>

		<!-- 최근 활동 -->
		<Card>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
				<div class="space-y-3">
					{#each recentActivities as activity}
						<div class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
							<div class="text-2xl">{getActivityIcon(activity.type)}</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">{activity.title}</p>
								<p class="text-xs text-gray-600">{activity.user} • {activity.time}</p>
							</div>
							<Badge variant={activity.status === 'approved' || activity.status === 'completed' ? 'success' : 'warning'}>
								{activity.status === 'approved' ? '승인' : 
								 activity.status === 'completed' ? '완료' : 
								 activity.status === 'submitted' ? '제출' : 
								 activity.status === 'warning' ? '경고' : '대기'}
							</Badge>
						</div>
					{/each}
				</div>
			</div>
		</Card>
	</div>
</div>
