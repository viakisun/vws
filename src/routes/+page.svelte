<script lang="ts">
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeProgress from '$lib/components/ui/ThemeProgress.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import { formatKRW } from '$lib/utils/format';
	import { BanknoteIcon, UsersIcon, FlaskConicalIcon, CoinsIcon, FileTextIcon, BriefcaseIcon } from 'lucide-svelte';

	// Mock summaries (replace with API later)
	const finance = { todaySpending: 1250000, pendingApprovals: 3 };
	const hr = { pendingLeave: 2, missingCheckins: 1 };
	const rnd = { budget: 1200000000, spent: 820000000, pendingDocs: 5 };
	const sales = { monthRevenue: 320000000, pipeline: 540000000 };
	const utilization = Math.round((rnd.spent / rnd.budget) * 100);

	// 내 업무 (mock)
	const myTasks = [
		{ id: 't1', title: '결재 대기: 비용 청구 2건', href: '/expenses' },
		{ id: 't2', title: '휴가 요청 승인 1건', href: '/hr' },
		{ id: 't3', title: 'R&D 보고서 검토', href: '/project-management/reports' }
	];
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900">대시보드</h1>
		<p class="text-sm text-gray-600 mt-1">전체 시스템 현황과 주요 지표를 한눈에 확인하세요</p>
	</div>

	<!-- Quick Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<ThemeCard class="hover:shadow-md transition-shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">오늘 지출</p>
					<p class="text-2xl font-bold text-gray-900">{formatKRW(finance.todaySpending)}</p>
					<div class="mt-1">
						<ThemeBadge variant="default" size="sm">결재 대기 {finance.pendingApprovals}건</ThemeBadge>
					</div>
				</div>
				<div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<BanknoteIcon class="h-6 w-6 text-blue-600" />
				</div>
			</div>
		</ThemeCard>

		<ThemeCard class="hover:shadow-md transition-shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">인사 현황</p>
					<p class="text-2xl font-bold text-gray-900">{hr.pendingLeave}건</p>
					<div class="mt-1">
						<ThemeBadge variant="default" size="sm">휴가 대기, 미체크 {hr.missingCheckins}명</ThemeBadge>
					</div>
				</div>
				<div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
					<UsersIcon class="h-6 w-6 text-green-600" />
				</div>
			</div>
		</ThemeCard>

		<ThemeCard class="hover:shadow-md transition-shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">R&D 예산</p>
					<p class="text-2xl font-bold text-gray-900">{formatKRW(rnd.budget)}</p>
					<div class="mt-1">
						<ThemeBadge variant="default" size="sm">대기 문서 {rnd.pendingDocs}건</ThemeBadge>
					</div>
				</div>
				<div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
					<FlaskConicalIcon class="h-6 w-6 text-purple-600" />
				</div>
			</div>
		</ThemeCard>

		<ThemeCard class="hover:shadow-md transition-shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">월 매출</p>
					<p class="text-2xl font-bold text-gray-900">{formatKRW(sales.monthRevenue)}</p>
					<div class="mt-1">
						<ThemeBadge variant="default" size="sm">파이프라인 {formatKRW(sales.pipeline)}</ThemeBadge>
					</div>
				</div>
				<div class="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
					<BriefcaseIcon class="h-6 w-6 text-orange-600" />
				</div>
			</div>
		</ThemeCard>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Key Metrics Panel -->
		<ThemeCard class="lg:col-span-2">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-semibold text-gray-900">주요 지표</h2>
				<a href="/analytics" class="text-sm text-blue-600 hover:text-blue-500 font-medium">상세 보기 →</a>
			</div>
			
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<!-- Budget Utilization -->
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-medium text-gray-600">예산 사용률</h3>
						<ThemeBadge variant="default">{utilization}%</ThemeBadge>
					</div>
					<ThemeProgress value={utilization} class="h-2" />
					<div class="flex justify-between text-xs text-gray-500">
						<span>사용: {formatKRW(rnd.spent)}</span>
						<span>예산: {formatKRW(rnd.budget)}</span>
					</div>
				</div>

				<!-- Revenue Chart Placeholder -->
				<div class="space-y-3">
					<h3 class="text-sm font-medium text-gray-600">월별 매출 추이</h3>
					<div class="h-20 bg-gray-50 rounded-lg flex items-center justify-center">
						<span class="text-sm text-gray-500">차트 영역</span>
					</div>
					<div class="text-xs text-gray-500">
						이번 달: {formatKRW(sales.monthRevenue)}
					</div>
				</div>
			</div>
		</ThemeCard>

		<!-- My Tasks Panel -->
		<ThemeCard>
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-semibold text-gray-900">내 업무</h2>
				<a href="/tasks" class="text-sm text-blue-600 hover:text-blue-500 font-medium">전체 보기 →</a>
			</div>
			
			<div class="space-y-4">
				{#each myTasks as task}
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 truncate">{task.title}</p>
						</div>
						<a href={task.href} class="ml-3 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200 transition-colors">
							처리
						</a>
					</div>
				{/each}
			</div>
		</ThemeCard>
	</div>

	<!-- Recent Activity -->
	<ThemeCard class="mt-6">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-lg font-semibold text-gray-900">최근 활동</h2>
			<a href="/activity" class="text-sm text-blue-600 hover:text-blue-500 font-medium">전체 보기 →</a>
		</div>
		
		<div class="space-y-4">
			<div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
				<ThemeBadge variant="success" size="sm" class="h-2 w-2 p-0 rounded-full"></ThemeBadge>
				<div class="flex-1 min-w-0">
					<p class="text-sm text-gray-900">새로운 프로젝트가 승인되었습니다</p>
					<p class="text-xs text-gray-500">2시간 전</p>
				</div>
			</div>
			<div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
				<ThemeBadge variant="primary" size="sm" class="h-2 w-2 p-0 rounded-full"></ThemeBadge>
				<div class="flex-1 min-w-0">
					<p class="text-sm text-gray-900">비용 청구서 3건이 결재를 기다리고 있습니다</p>
					<p class="text-xs text-gray-500">4시간 전</p>
				</div>
			</div>
			<div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
				<ThemeBadge variant="warning" size="sm" class="h-2 w-2 p-0 rounded-full"></ThemeBadge>
				<div class="flex-1 min-w-0">
					<p class="text-sm text-gray-900">R&D 보고서 검토가 필요합니다</p>
					<p class="text-xs text-gray-500">1일 전</p>
				</div>
			</div>
		</div>
	</ThemeCard>
</div>
