<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';
	import { projectsStore, overallBudget, budgetAlerts } from '$lib/stores/rnd';

	$: ob = $overallBudget;
	$: avgProgress = $projectsStore.length
		? Math.round($projectsStore.reduce((s, p) => s + p.progressPct, 0) / $projectsStore.length)
		: 0;
</script>

<h2 class="text-lg font-semibold mb-4">Project Overview Dashboard</h2>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
</div>

{#if $budgetAlerts.length}
	<Card header="예산 경보">
		<ul class="space-y-2 text-sm">
			{#each $budgetAlerts as a}
				<li class="flex items-center justify-between">
					<span>{a.name}</span>
					<Badge color={a.level === 'over' ? 'red' : a.level === 'critical' ? 'yellow' : 'yellow'}>{(a.utilization * 100).toFixed(1)}%</Badge>
				</li>
			{/each}
		</ul>
	</Card>
{/if}

