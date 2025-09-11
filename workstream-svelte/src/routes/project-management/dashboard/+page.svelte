<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';
	import { projectsStore, overallBudget, budgetAlerts } from '$lib/stores/rnd';
	import { expenseDocsStore } from '$lib/stores/rnd';
	import { personnelStore } from '$lib/stores/personnel';
	import { quarterlyPersonnelBudgets, getQuarterSummary } from '$lib/stores/rnd';
	import { goto } from '$app/navigation';

	$: ob = $overallBudget;
	$: avgProgress = $projectsStore.length
		? Math.round($projectsStore.reduce((s, p) => s + p.progressPct, 0) / $projectsStore.length)
		: 0;
	$: riskCounts = {
		위험: $projectsStore.filter((p) => p.status === '위험').length,
		지연: $projectsStore.filter((p) => p.status === '지연').length,
		진행중: $projectsStore.filter((p) => p.status === '진행중').length,
		정상: $projectsStore.filter((p) => p.status === '정상' || p.status === '완료').length
	};
	$: overAllocated = $personnelStore.filter((pr) => pr.participations.reduce((s, pp) => s + pp.allocationPct, 0) > 100).length;
	$: avgAlloc = $personnelStore.length ? Math.round($personnelStore.reduce((sum, pr) => sum + pr.participations.reduce((s, pp) => s + pp.allocationPct, 0), 0) / $personnelStore.length) : 0;

	// Category breakdown (인건비/재료비/연구활동비/여비)
	$: categoryTotals = (function(){
		const res = { 인건비: 0, 재료비: 0, 연구활동비: 0, 여비: 0 } as Record<string, number>;
		for (const d of $expenseDocsStore) {
			const amt = d.amountKRW ?? 0;
			if (res[d.category] !== undefined) res[d.category] += amt;
		}
		return res;
	})();

	// Burn rate projection: project-level spent/elapsed → projected over total duration, aggregated
	function daysBetween(a: string, b: string): number {
		const ms = new Date(b).getTime() - new Date(a).getTime();
		return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
	}
	$: portfolioProjection = (function(){
		const todayIso = new Date().toISOString().slice(0,10);
		let totalBudget = 0;
		let totalProjected = 0;
		for (const p of $projectsStore) {
			const start = p.startDate;
			const due = p.dueDate;
			const totalDays = daysBetween(start, due);
			// 오늘이 시작 이전이면 0일 경과로 간주
			const cappedToday = todayIso < start ? start : (todayIso > due ? due : todayIso);
			const elapsedDays = Math.max(1, daysBetween(start, cappedToday));
			const burn = p.spentKRW / Math.max(1, elapsedDays);
			const projected = burn * totalDays;
			totalBudget += p.budgetKRW;
			totalProjected += Math.min(projected, p.budgetKRW * 2); // clamp to avoid runaway
		}
		const utilization = totalBudget > 0 ? totalProjected / totalBudget : 0;
		return { totalBudget, totalProjected, utilization };
	})();

	// 경보 상세 사유
	$: alertDetails = $budgetAlerts.map((a) => {
		const pct = (a.utilization * 100).toFixed(1);
		const reason = a.level === 'over' ? `집행률 ${pct}% ≥ 100%` : a.level === 'critical' ? `집행률 ${pct}% ≥ 95%` : `집행률 ${pct}% ≥ 80%`;
		return { ...a, reason };
	});

	// 소진 속도 편차: 진행률 대비 집행액 편차 상위
	$: burnVariance = (function(){
		return $projectsStore
			.map((p) => {
				const expected = (p.progressPct / 100) * p.budgetKRW;
				const delta = p.spentKRW - expected;
				return { id: p.id, name: p.name, spent: p.spentKRW, expected, delta };
			})
			.sort((a,b)=> Math.abs(b.delta) - Math.abs(a.delta))
			.slice(0, 5);
	})();

	// 분기 선택 및 URL 동기화
	function sortQuarterLabels(labels: string[]): string[] {
		return labels
			.map((q) => {
				const [y, qpart] = q.split('-Q');
				return { q, y: Number(y), qn: Number(qpart) };
			})
			.sort((a,b) => a.y === b.y ? a.qn - b.qn : a.y - b.y)
			.map((x) => x.q);
	}
	function currentQuarterLabel(): string {
		const d = new Date();
		const y = d.getFullYear();
		const qn = Math.floor(d.getMonth() / 3) + 1;
		return `${y}-Q${qn}`;
	}
	$: quarters = (function(){
		const set = new Set<string>();
		const qmap = $quarterlyPersonnelBudgets;
		for (const pid in qmap) {
			const entries = qmap[pid];
			for (const k in entries) set.add(k);
		}
		return sortQuarterLabels(Array.from(set));
	})();
	let selectedQuarter = currentQuarterLabel();
	let lastQuery = '';
	if (typeof window !== 'undefined') {
		const params = new URLSearchParams(window.location.search);
		const qParam = params.get('q');
		if (qParam) selectedQuarter = qParam;
		lastQuery = params.toString();
	}
	$: quarterSummary = getQuarterSummary(selectedQuarter);
	$: docsInQuarter = (function(){
		const qn = Number(selectedQuarter.split('-Q')[1] || '0');
		return $expenseDocsStore.filter((d) => Number(d.quarter) === qn).length;
	})();
	$: if (typeof window !== 'undefined') {
		const params = new URLSearchParams(window.location.search);
		if (selectedQuarter) params.set('q', selectedQuarter); else params.delete('q');
		const newQuery = params.toString();
		if (newQuery !== lastQuery) {
			lastQuery = newQuery;
			goto(`${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`,
				{ replaceState: true, keepFocus: true, noScroll: true });
		}
	}

	// simple skeleton
	let loading = true;
	if (typeof window !== 'undefined') {
		setTimeout(() => (loading = false), 300);
	}
</script>

<h2 class="text-lg font-semibold mb-4">Project Overview Dashboard</h2>

<div class="mb-3 flex items-center gap-2">
	<label for="qsel" class="text-sm text-gray-600">분기</label>
	<select id="qsel" class="rounded-md border border-gray-200 px-2 py-1 text-sm" bind:value={selectedQuarter}>
		{#each quarters as q}
			<option value={q}>{q}</option>
		{/each}
	</select>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
	{#if loading}
		{#each Array(4) as _}
			<div class="card animate-pulse h-24"></div>
		{/each}
	{:else}
	<Card>
		<div class="kpi">
			<div>
				<p class="text-caption">총 프로젝트</p>
				<div class="text-2xl font-bold">{$projectsStore.length}</div>
			</div>
		</div>
	</Card>
	<Card>
		<div class="kpi">
			<div>
				<p class="text-caption">예산 집행률</p>
				<div class="text-2xl font-bold">{(ob.utilization * 100).toFixed(1)}%</div>
				<div class="mt-3"><Progress value={ob.utilization * 100} /></div>
			</div>
		</div>
	</Card>
	<Card>
		<div class="kpi">
			<div>
				<p class="text-caption">평균 진행률</p>
				<div class="text-2xl font-bold">{avgProgress}%</div>
				<div class="mt-3"><Progress value={avgProgress} /></div>
			</div>
		</div>
	</Card>
	<Card>
		<div class="kpi">
			<div>
				<p class="text-caption">경보 프로젝트</p>
				<div class="text-2xl font-bold">{$budgetAlerts.length}</div>
			</div>
		</div>
	</Card>
	{/if}
</div>

{#if !loading && $budgetAlerts.length}
	<Card header="예산 경보">
		<ul class="space-y-2 text-sm">
			{#each alertDetails as a}
				<li class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="font-medium">{a.name}</span>
						<span class="text-caption">{a.reason}</span>
					</div>
					<Badge color={a.level === 'over' ? 'red' : a.level === 'critical' ? 'yellow' : 'yellow'}>{(a.utilization * 100).toFixed(1)}%</Badge>
				</li>
			{/each}
		</ul>
	</Card>
{/if}

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
	<Card>
		<div class="kpi">
			<div>
				<p class="text-caption">{selectedQuarter} 분기 인건비 예산</p>
				<div class="text-2xl font-bold">{quarterSummary.totalBudgetKRW.toLocaleString()}원</div>
			</div>
		</div>
	</Card>
	<Card>
		<div class="kpi">
			<div>
				<p class="text-caption">{selectedQuarter.split('-Q')[1]}분기 문서 수</p>
				<div class="text-2xl font-bold">{docsInQuarter}</div>
			</div>
		</div>
	</Card>
	<Card>
		<div class="kpi">
			<div>
				<p class="text-caption">분기 키 개수</p>
				<div class="text-2xl font-bold">{quarters.length}</div>
			</div>
		</div>
	</Card>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
	<Card header="리스크 매트릭스">
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
			<div><div class="text-caption mb-1">위험</div><Badge color="red">{riskCounts.위험}</Badge></div>
			<div><div class="text-caption mb-1">지연</div><Badge color="yellow">{riskCounts.지연}</Badge></div>
			<div><div class="text-caption mb-1">진행중</div><Badge color="blue">{riskCounts.진행중}</Badge></div>
			<div><div class="text-caption mb-1">정상/완료</div><Badge color="green">{riskCounts.정상}</Badge></div>
		</div>
	</Card>

	<Card header="리소스 분석">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<div class="text-caption">평균 참여율</div>
				<div class="text-2xl font-bold">{avgAlloc}%</div>
				<div class="mt-3"><Progress value={Math.min(avgAlloc, 100)} /></div>
			</div>
			<div>
				<div class="text-caption">과할당 인원</div>
				<div class="text-2xl font-bold">{overAllocated}</div>
			</div>
		</div>
	</Card>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
	<Card header="예산 카테고리 분해">
		<div class="grid grid-cols-2 gap-3 text-sm">
			<div class="flex items-center justify-between"><span>인건비</span><span class="tabular-nums">{categoryTotals['인건비'].toLocaleString()}원</span></div>
			<div class="flex items-center justify-between"><span>재료비</span><span class="tabular-nums">{categoryTotals['재료비'].toLocaleString()}원</span></div>
			<div class="flex items-center justify-between"><span>연구활동비</span><span class="tabular-nums">{categoryTotals['연구활동비'].toLocaleString()}원</span></div>
			<div class="flex items-center justify-between"><span>여비</span><span class="tabular-nums">{categoryTotals['여비'].toLocaleString()}원</span></div>
		</div>
	</Card>

	<Card header="번레이트 예측(포트폴리오)">
		<div class="grid grid-cols-1 gap-2 text-sm">
			<div class="flex items-center justify-between"><span>총 예산</span><span class="tabular-nums">{portfolioProjection.totalBudget.toLocaleString()}원</span></div>
			<div class="flex items-center justify-between"><span>예상 집행</span><span class="tabular-nums">{portfolioProjection.totalProjected.toLocaleString()}원</span></div>
			<div>
				<div class="text-caption mb-1">예상 집행률</div>
				<Progress value={Math.min(100, portfolioProjection.utilization * 100)} />
			</div>
		</div>
	</Card>
</div>

<Card header="소진 속도 편차 상위">
	<div class="overflow-auto">
		<table class="min-w-full text-sm">
			<thead class="bg-gray-50 text-left text-gray-600">
				<tr>
					<th class="px-3 py-2">프로젝트</th>
					<th class="px-3 py-2">예상</th>
					<th class="px-3 py-2">집행</th>
					<th class="px-3 py-2">편차</th>
				</tr>
			</thead>
			<tbody class="divide-y">
				{#each burnVariance as b}
					<tr>
						<td class="px-3 py-2">{b.name}</td>
						<td class="px-3 py-2 tabular-nums">{b.expected.toLocaleString()}원</td>
						<td class="px-3 py-2 tabular-nums">{b.spent.toLocaleString()}원</td>
						<td class="px-3 py-2 tabular-nums">{b.delta.toLocaleString()}원</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Card>

