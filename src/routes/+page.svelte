<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';
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

<section class="max-w-7xl mx-auto px-4 py-10 space-y-8">
	<!-- 헤더/히어로 -->
	<div class="flex flex-col gap-1">
		<h1 class="text-3xl font-bold text-gray-900">VWS (Via WorkStream)</h1>
		<p class="text-caption">Move fast on what matters. See key metrics and your work at a glance.</p>
	</div>

	<!-- 핵심 영역: 대형 타일 3개 -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<a href="/finance" class="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-primary/5 to-white p-5 hover:shadow transition">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm text-caption">재무/회계</div>
					<div class="mt-1 text-xl font-semibold">오늘 지출 {formatKRW(finance.todaySpending)}</div>
					<div class="mt-1 text-sm text-gray-600">결재 대기 {finance.pendingApprovals}건</div>
				</div>
				{#if BanknoteIcon}<BanknoteIcon class="text-primary/70 group-hover:text-primary" />{/if}
			</div>
		</a>
		<a href="/hr" class="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-5 hover:shadow transition">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm text-caption">인사</div>
					<div class="mt-1 text-xl font-semibold">휴가 대기 {hr.pendingLeave}건</div>
					<div class="mt-1 text-sm text-gray-600">미체크 {hr.missingCheckins}명</div>
				</div>
				{#if UsersIcon}<UsersIcon class="text-blue-500/70 group-hover:text-blue-600" />{/if}
			</div>
		</a>
		<a href="/project-management" class="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-white p-5 hover:shadow transition">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm text-caption">연구개발</div>
					<div class="mt-1 text-xl font-semibold">예산 {formatKRW(rnd.budget)}</div>
					<div class="mt-1 text-sm text-gray-600">대기 문서 {rnd.pendingDocs}건</div>
				</div>
				{#if FlaskConicalIcon}<FlaskConicalIcon class="text-green-600/70 group-hover:text-green-700" />{/if}
			</div>
		</a>

		<a href="/sales" class="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-amber-50 to-white p-5 hover:shadow transition">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm text-caption">영업</div>
					<div class="mt-1 text-xl font-semibold">월 매출 {formatKRW(sales.monthRevenue)}</div>
					<div class="mt-1 text-sm text-gray-600">파이프라인 {formatKRW(sales.pipeline)}</div>
				</div>
				{#if BriefcaseIcon}<BriefcaseIcon class="text-amber-600/70 group-hover:text-amber-700" />{/if}
			</div>
		</a>
	</div>

	<!-- 하단 2열: 요약 KPI(대형) / 내 업무(대형) - 글로벌 표준 레이아웃 -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- KPI Panel (span 2) -->
		<div class="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold">Key Metrics</h2>
				<a href="/project-management/dashboard" class="text-primary text-sm hover:underline">View details</a>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<!-- Budget -->
				<div class="rounded-xl border border-gray-200 p-4 flex items-start justify-between">
					<div>
						<div class="text-caption">Quarter Budget</div>
						<div class="mt-1 text-2xl font-bold">{formatKRW(rnd.budget)}</div>
					</div>
					{#if CoinsIcon}<CoinsIcon class="text-primary" />{/if}
				</div>
				<!-- Spent -->
				<div class="rounded-xl border border-gray-200 p-4">
					<div class="text-caption">Spent</div>
					<div class="mt-1 text-2xl font-bold">{formatKRW(rnd.spent)}</div>
					<div class="mt-3"><Progress value={utilization} /></div>
				</div>
				<!-- Pending Docs -->
				<div class="rounded-xl border border-gray-200 p-4 flex items-start justify-between">
					<div>
						<div class="text-caption">Pending Docs</div>
						<div class="mt-1 text-2xl font-bold">{rnd.pendingDocs}</div>
					</div>
					{#if FileTextIcon}<FileTextIcon class="text-gray-600" />{/if}
				</div>
				<!-- Monthly Revenue -->
				<div class="rounded-xl border border-gray-200 p-4 flex items-start justify-between">
					<div>
						<div class="text-caption">Monthly Revenue</div>
						<div class="mt-1 text-2xl font-bold">{formatKRW(sales.monthRevenue)}</div>
					</div>
					{#if BriefcaseIcon}<BriefcaseIcon class="text-amber-600" />{/if}
				</div>
			</div>
		</div>

		<!-- My Work Panel -->
		<div class="rounded-2xl border border-gray-200 bg-white p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold">My Work</h2>
				<a href="/project-management" class="text-primary text-sm hover:underline">Go to workspace</a>
			</div>
			<ul class="divide-y">
				{#each myTasks as t}
					<li class="flex items-center justify-between py-3 text-sm">
						<span>{t.title}</span>
						<a class="px-2 py-1 rounded-md border border-primary text-primary hover:bg-primary/5" href={t.href}>Open</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>
