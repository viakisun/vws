<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';
	import { formatKRW } from '$lib/utils/format';
	import { Coins, FileText, Banknote, Users, FlaskConical } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const rnd = { budget: 1200000000, spent: 820000000, pendingDocs: 5 };
	const utilization = Math.round((rnd.spent / rnd.budget) * 100);

	let health: '확인중' | '정상' | '오프라인' = data.health ?? '확인중';
</script>

<section class="max-w-6xl mx-auto px-4 py-10 space-y-8">
	<header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Workstream</h1>
			<p class="text-caption mt-1">중소기업 통합 업무관리 플랫폼 · R&D 사업관리 포함</p>
		</div>
		<div class="flex items-center gap-2">
			<a href="/project-management/dashboard" class="px-3 py-1.5 rounded-md bg-primary text-white hover:brightness-95 text-sm">R&D 사업관리 바로가기</a>
			<a href="/dashboard" class="px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-sm">메인 대시보드</a>
		</div>
	</header>

	<!-- 주요 영역 -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<Card header="재무/회계 관리">
			<div class="flex items-start gap-3">
				{#if Banknote}<Banknote class="text-primary" />{/if}
				<div class="space-y-2 text-sm">
					<div class="flex items-center gap-2">
						<button type="button" class="text-primary hover:underline">회사 자금 일일 관리</button>
						<Badge color="yellow">개발중</Badge>
					</div>
					<div class="flex items-center gap-2">
						<button type="button" class="text-primary hover:underline">영업 관리</button>
						<Badge color="yellow">개발중</Badge>
					</div>
					<div class="flex items-center gap-2">
						<button type="button" class="text-primary hover:underline">계약 관리</button>
						<Badge color="yellow">개발중</Badge>
					</div>
				</div>
			</div>
		</Card>

		<Card header="인사 관리">
			<div class="flex items-start gap-3">
				{#if Users}<Users class="text-primary" />{/if}
				<div class="space-y-2 text-sm">
					<div class="flex items-center gap-2">
						<button type="button" class="text-primary hover:underline">출퇴근 관리</button>
						<Badge color="yellow">개발중</Badge>
					</div>
					<div class="flex items-center gap-2">
						<button type="button" class="text-primary hover:underline">연차 관리</button>
						<Badge color="yellow">개발중</Badge>
					</div>
					<div class="flex items-center gap-2">
						<button type="button" class="text-primary hover:underline">입사/퇴사 관리</button>
						<Badge color="yellow">개발중</Badge>
					</div>
				</div>
			</div>
		</Card>

		<Card header="연구개발 관리">
			<div class="flex items-start gap-3">
				{#if FlaskConical}<FlaskConical class="text-primary" />{/if}
				<div class="space-y-2 text-sm">
					<div><a class="text-primary hover:underline" href="/project-management/dashboard">프로젝트 개요 대시보드</a></div>
					<div><a class="text-primary hover:underline" href="/project-management/participation">인건비/참여율 관리</a></div>
					<div><a class="text-primary hover:underline" href="/project-management/budget-overview">예산 통합 뷰</a></div>
				</div>
			</div>
		</Card>
	</div>

	<!-- R&D 요약 -->
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

	<!-- 시스템 정보 & 공지 -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<Card header="시스템 정보">
			<div class="grid grid-cols-2 gap-2 text-sm">
				<div class="flex items-center justify-between"><span>서버 상태</span><Badge color={health === '정상' ? 'green' : 'red'}>{health}</Badge></div>
				<div class="flex items-center justify-between"><span>API Base</span><span class="tabular-nums text-gray-700">{data?.configApiBase ?? ''}</span></div>
			</div>
		</Card>
		<Card header="업데이트 노트">
			<ul class="text-sm list-disc pl-5 space-y-1">
				<li>R&D 사업관리 모듈 연결 및 요약 지표 제공</li>
				<li>미구현 영역은 <Badge color="yellow">개발중</Badge> 표시</li>
				<li>우측 상단 버튼으로 사업관리 대시보드 이동</li>
			</ul>
		</Card>
	</div>
</section>
