<script lang="ts">
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeInput from '$lib/components/ui/ThemeInput.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import { 
		UsersIcon, 
		PercentIcon, 
		CalendarIcon, 
		AlertTriangleIcon,
		CheckCircleIcon,
		PlusIcon,
		TrashIcon
	} from '@lucide/svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';

	interface ParticipationAdjustment {
		id: string;
		projectId: string;
		startDate: string;
		endDate: string;
		participationRate: number;
		monthlySalary: number;
		role: string;
	}

	let {
		employee,
		currentParticipations,
		availableProjects,
		onSave,
		onCancel
	} = $props<{
		employee: any;
		currentParticipations: any[];
		availableProjects: any[];
		onSave: (adjustments: ParticipationAdjustment[]) => void;
		onCancel: () => void;
	}>();

	let adjustments = $state<ParticipationAdjustment[]>([]);
	let newAdjustment = $state<Partial<ParticipationAdjustment>>({
		projectId: '',
		startDate: '',
		endDate: '',
		participationRate: 0,
		monthlySalary: employee?.salary || 0,
		role: ''
	});

	// 현재 참여 현황을 조정 목록으로 초기화
	$effect(() => {
		if (currentParticipations) {
			adjustments = currentParticipations.map((part: any) => ({
				id: part.id,
				projectId: part.projectId,
				startDate: part.startDate,
				endDate: part.endDate,
				participationRate: part.participationRate,
				monthlySalary: part.monthlySalary,
				role: part.role
			}));
		}
	});

	// 총 참여율 계산
	let totalParticipationRate = $derived(() => {
		return adjustments.reduce((sum, adj) => sum + adj.participationRate, 0);
	});

	// 참여율 초과 여부
	let isOverParticipation = $derived(() => {
		return totalParticipationRate() > 100;
	});

	// 월별 인건비 계산
	let monthlyPersonnelCost = $derived(() => {
		return adjustments.reduce((sum, adj) => {
			return sum + (adj.monthlySalary * adj.participationRate / 100);
		}, 0);
	});

	function addNewParticipation() {
		if (newAdjustment.projectId && newAdjustment.startDate && newAdjustment.endDate) {
			adjustments = [...adjustments, {
				id: `new-${Date.now()}`,
				projectId: newAdjustment.projectId,
				startDate: newAdjustment.startDate,
				endDate: newAdjustment.endDate,
				participationRate: newAdjustment.participationRate || 0,
				monthlySalary: newAdjustment.monthlySalary || 0,
				role: newAdjustment.role || ''
			}];
			
			// 새 참여 정보 초기화
			newAdjustment = {
				projectId: '',
				startDate: '',
				endDate: '',
				participationRate: 0,
				monthlySalary: employee?.salary || 0,
				role: ''
			};
		}
	}

	function removeParticipation(id: string) {
		adjustments = adjustments.filter(adj => adj.id !== id);
	}

	function updateParticipation(id: string, field: string, value: any) {
		adjustments = adjustments.map(adj => 
			adj.id === id ? { ...adj, [field]: value } : adj
		);
	}

	function getProjectName(projectId: string): string {
		const project = availableProjects.find((p: any) => p.id === projectId);
		return project?.name || '알 수 없는 프로젝트';
	}

	function handleSave() {
		if (isOverParticipation()) {
			alert('총 참여율이 100%를 초과합니다. 참여율을 조정해주세요.');
			return;
		}
		onSave(adjustments);
	}

	function autoAdjustParticipation() {
		// AI 추천 알고리즘 시뮬레이션
		if (totalParticipationRate() > 100) {
			const excess = totalParticipationRate() - 100;
			// 가장 낮은 우선순위 프로젝트의 참여율을 줄임
			adjustments = adjustments.map(adj => {
				const project = availableProjects.find((p: any) => p.id === adj.projectId);
				if (project?.priority === 'low' && adj.participationRate > 0) {
					const reduction = Math.min(excess, adj.participationRate);
					return { ...adj, participationRate: adj.participationRate - reduction };
				}
				return adj;
			});
		}
	}
</script>

<ThemeCard class="p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold" style="color: var(--color-text);">
				참여율 조정 - {employee?.name}
			</h3>
			<p class="text-sm" style="color: var(--color-text-secondary);">
				{employee?.department} • {employee?.position}
			</p>
		</div>
		<div class="flex items-center gap-2">
			<ThemeBadge variant={isOverParticipation() ? 'error' : totalParticipationRate() > 80 ? 'warning' : 'success'}>
				총 참여율: {totalParticipationRate()}%
			</ThemeBadge>
			{#if isOverParticipation()}
				<ThemeButton variant="warning" size="sm" onclick={autoAdjustParticipation}>
					자동 조정
				</ThemeButton>
			{/if}
		</div>
	</div>

	<!-- 참여율 경고 -->
	{#if isOverParticipation()}
		<div class="flex items-center gap-2 p-3 rounded-lg mb-4" style="background: var(--color-error-light); border: 1px solid var(--color-error);">
			<AlertTriangleIcon size={20} style="color: var(--color-error);" />
			<span class="text-sm" style="color: var(--color-error);">
				총 참여율이 100%를 초과합니다. 참여율을 조정해주세요.
			</span>
		</div>
	{/if}

	<!-- 현재 참여 현황 -->
	<div class="space-y-4 mb-6">
		<h4 class="font-medium" style="color: var(--color-text);">현재 참여 현황</h4>
		{#each adjustments as adjustment}
			<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-2">
						<UsersIcon size={16} style="color: var(--color-primary);" />
						<h5 class="font-medium" style="color: var(--color-text);">
							{getProjectName(adjustment.projectId)}
						</h5>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm" style="color: var(--color-text-secondary);">
						<div class="flex items-center gap-1">
							<CalendarIcon size={14} />
							{formatDate(adjustment.startDate)} ~ {formatDate(adjustment.endDate)}
						</div>
						<div class="flex items-center gap-1">
							<PercentIcon size={14} />
							참여율: {adjustment.participationRate}%
						</div>
						<div>
							월급여: {formatCurrency(adjustment.monthlySalary)}
						</div>
						<div>
							역할: {adjustment.role}
						</div>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<input
						type="number"
						value={adjustment.participationRate}
						oninput={(e) => updateParticipation(adjustment.id, 'participationRate', parseInt((e.target as HTMLInputElement).value) || 0)}
						class="w-20 px-2 py-1 border rounded"
						style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
						min="0"
						max="100"
					/>
					<span class="text-sm" style="color: var(--color-text-secondary);">%</span>
					<ThemeButton variant="ghost" size="sm" onclick={() => removeParticipation(adjustment.id)}>
						<TrashIcon size={16} />
					</ThemeButton>
				</div>
			</div>
		{/each}
	</div>

	<!-- 새 참여 추가 -->
	<div class="border-t pt-6" style="border-color: var(--color-border);">
		<h4 class="font-medium mb-4" style="color: var(--color-text);">새 참여 추가</h4>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<div>
				<label for="pa-project-select" class="block text-sm font-medium mb-1" style="color: var(--color-text);">프로젝트</label>
				<select
					id="pa-project-select"
					bind:value={newAdjustment.projectId}
					class="w-full px-3 py-2 border rounded-md"
					style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
				>
					<option value="">프로젝트 선택</option>
					{#each availableProjects as project}
						<option value={project.id}>{project.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="start-date" class="block text-sm font-medium mb-1" style="color: var(--color-text);">시작일</label>
				<input
					id="start-date"
					type="date"
					bind:value={newAdjustment.startDate}
					class="w-full px-3 py-2 border rounded-md"
					style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
				/>
			</div>
			<div>
				<label for="end-date" class="block text-sm font-medium mb-1" style="color: var(--color-text);">종료일</label>
				<input
					id="end-date"
					type="date"
					bind:value={newAdjustment.endDate}
					class="w-full px-3 py-2 border rounded-md"
					style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
				/>
			</div>
			<div>
				<label for="participation-rate" class="block text-sm font-medium mb-1" style="color: var(--color-text);">참여율 (%)</label>
				<input
					id="participation-rate"
					type="number"
					bind:value={newAdjustment.participationRate}
					min="0"
					max="100"
					class="w-full px-3 py-2 border rounded-md"
					style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
				/>
			</div>
			<div>
				<label for="monthly-salary" class="block text-sm font-medium mb-1" style="color: var(--color-text);">월급여</label>
				<input
					id="monthly-salary"
					type="number"
					bind:value={newAdjustment.monthlySalary}
					class="w-full px-3 py-2 border rounded-md"
					style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
				/>
			</div>
			<div>
				<label for="role" class="block text-sm font-medium mb-1" style="color: var(--color-text);">역할</label>
				<input
					id="role"
					type="text"
					bind:value={newAdjustment.role}
					placeholder="역할 입력"
					class="w-full px-3 py-2 border rounded-md"
					style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
				/>
			</div>
		</div>
		<ThemeButton variant="secondary" onclick={addNewParticipation} class="mt-4">
			<PlusIcon size={16} class="mr-2" />
			참여 추가
		</ThemeButton>
	</div>

	<!-- 요약 정보 -->
	<div class="flex items-center justify-between p-4 rounded-lg mt-6" style="background: var(--color-surface-elevated);">
		<div class="flex items-center gap-4">
			<div class="text-center">
				<p class="text-sm" style="color: var(--color-text-secondary);">총 참여율</p>
				<p class="text-lg font-semibold" style="color: {isOverParticipation() ? 'var(--color-error)' : 'var(--color-primary)'};">
					{totalParticipationRate()}%
				</p>
			</div>
			<div class="text-center">
				<p class="text-sm" style="color: var(--color-text-secondary);">월 인건비</p>
				<p class="text-lg font-semibold" style="color: var(--color-primary);">
					{formatCurrency(monthlyPersonnelCost())}
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<ThemeButton variant="secondary" onclick={onCancel}>
				취소
			</ThemeButton>
			<ThemeButton variant="primary" onclick={handleSave} disabled={isOverParticipation()}>
				<CheckCircleIcon size={16} class="mr-2" />
				저장
			</ThemeButton>
		</div>
	</div>
</ThemeCard>
