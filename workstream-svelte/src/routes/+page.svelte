<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';
	import { formatKRW } from '$lib/utils/format';
	import { Coins, FileText, Banknote, Users, FlaskConical } from 'lucide-svelte';

	const rnd = { budget: 1200000000, spent: 820000000, pendingDocs: 5 };
	const utilization = Math.round((rnd.spent / rnd.budget) * 100);
</script>

<section class="max-w-5xl mx-auto px-4 py-10 space-y-8">
	<h1 class="text-2xl font-bold text-gray-900">Workstream</h1>
	<p class="text-caption mt-1">중소기업 통합 업무관리 플랫폼 MVP</p>

	<!-- 회사 관리 섹션 -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<Card header="재무/회계 관리">
			<div class="flex items-start gap-3">
				{#if Banknote}<Banknote class="text-primary" />{/if}
				<div class="space-y-2 text-sm">
					<div><a class="text-primary hover:underline" href="/finance">회사 자금 일일 관리</a></div>
					<div><a class="text-primary hover:underline" href="/finance">영업 관리</a></div>
					<div><a class="text-primary hover:underline" href="/finance">계약 관리</a></div>
				</div>
			</div>
		</Card>

		<Card header="인사 관리">
			<div class="flex items-start gap-3">
				{#if Users}<Users class="text-primary" />{/if}
				<div class="space-y-2 text-sm">
					<div><a class="text-primary hover:underline" href="/hr">출퇴근 관리</a></div>
					<div><a class="text-primary hover:underline" href="/hr">연차 관리</a></div>
					<div><a class="text-primary hover:underline" href="/hr">입사/퇴사 관리</a></div>
				</div>
			</div>
		</Card>

		<Card header="연구개발 관리">
			<div class="flex items-start gap-3">
				{#if FlaskConical}<FlaskConical class="text-primary" />{/if}
				<div class="space-y-2 text-sm">
					<div><a class="text-primary hover:underline" href="/dashboard">프로젝트 개요 대시보드</a></div>
					<div><a class="text-primary hover:underline" href="/personnel">인건비/참여율 관리</a></div>
					<div><a class="text-primary hover:underline" href="/expenses">R&D 비용 증빙/결재</a></div>
				</div>
			</div>
		</Card>
	</div>

	<Card header="R&D 현황">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div class="kpi">
				<div>
					<p class="text-caption">분기 예산</p>
					<div class="text-lg font-semibold">{formatKRW(rnd.budget)}</div>
				</div>
				{#if Coins}<Coins class="text-primary" />{/if}
			</div>
			<div class="kpi">
				<div>
					<p class="text-caption">집행액</p>
					<div class="text-lg font-semibold">{formatKRW(rnd.spent)}</div>
					<div class="mt-2"><Progress value={utilization} /></div>
				</div>
			</div>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-caption">대기 문서</p>
					<div class="text-lg font-semibold">{rnd.pendingDocs}건</div>
				</div>
				<Badge color={rnd.pendingDocs > 0 ? 'yellow' : 'green'}>
					{#if FileText}<FileText />{/if} 대기
				</Badge>
			</div>
		</div>
	</Card>
</section>
