<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte';
	import ThemeInput from '$lib/components/ui/ThemeInput.svelte';
	import ThemeSelect from '$lib/components/ui/ThemeSelect.svelte';
	import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte';
	import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte';
	import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte';
	import { 
		ParticipationManager,
		participationAssignments,
		participationConflicts,
		participationRecommendations,
		participationHealth,
		participationTrends,
		type ParticipationConflict,
		type ParticipationRecommendation
	} from '$lib/stores/rnd/participation-manager';
	import { employees, projects } from '$lib/stores/rd';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import {
		UsersIcon,
		AlertTriangleIcon,
		TrendingUpIcon,
		TrendingDownIcon,
		TargetIcon,
		BrainIcon,
		SettingsIcon,
		EyeIcon,
		EditIcon,
		CheckCircleIcon,
		XCircleIcon,
		ClockIcon,
		BarChart3Icon,
		PieChartIcon,
		RefreshCwIcon,
		FilterIcon,
		DownloadIcon
	} from 'lucide-svelte';

	// 상태 관리
	let selectedMonth = $state(new Date().toISOString().slice(0, 7));
	let selectedPerson = $state('');
	let selectedProject = $state('');
	let showConflictModal = $state(false);
	let showRecommendationModal = $state(false);
	let showSimulationModal = $state(false);
	let selectedConflict = $state<ParticipationConflict | null>(null);
	let selectedRecommendation = $state<ParticipationRecommendation | null>(null);
	let simulationChanges = $state<Array<{personId: string; projectId: string; newRate: number}>>([]);

	// 월별 참여율 분석 데이터
	let monthlyAnalysis = $state<any[]>([]);
	let participationHealthData = $state<any>(null);
	let trendsData = $state<any>(null);

	// 초기화
	onMount(() => {
		ParticipationManager.detectConflicts();
		ParticipationManager.generateOptimizationRecommendations();
		loadAnalysisData();
	});

	// 분석 데이터 로드
	function loadAnalysisData() {
		monthlyAnalysis = ParticipationManager.analyzeMonthlyParticipation();
		participationHealthData = $participationHealth;
		trendsData = $participationTrends;
	}

	// 참여율 자동 조정
	function autoAdjustParticipation(personId: string) {
		const targetRate = 85; // 목표 참여율 85%
		const success = ParticipationManager.autoAdjustParticipation(
			personId, 
			targetRate, 
			'자동 최적화'
		);
		
		if (success) {
			loadAnalysisData();
			// 토스트 알림
			console.log('참여율이 자동 조정되었습니다.');
		}
	}

	// 충돌 해결
	function resolveConflict(conflictId: string, action: string) {
		participationConflicts.update(conflicts => 
			conflicts.map(c => 
				c.id === conflictId 
					? { ...c, resolvedAt: new Date().toISOString() }
					: c
			)
		);
		loadAnalysisData();
	}

	// 추천 실행
	function executeRecommendation(recommendationId: string) {
		const recommendation = $participationRecommendations.find(r => r.id === recommendationId);
		if (!recommendation) return;

		switch (recommendation.type) {
			case 'rebalance':
				// 참여율 재조정 실행
				recommendation.affectedPersons.forEach(personId => {
					autoAdjustParticipation(personId);
				});
				break;
			case 'hire':
				// 채용 프로세스 시작 (실제로는 HR 시스템 연동)
				console.log('채용 프로세스를 시작합니다.');
				break;
		}

		// 추천 제거
		participationRecommendations.update(recommendations => 
			recommendations.filter(r => r.id !== recommendationId)
		);
	}

	// 시뮬레이션 실행
	function runSimulation() {
		const result = ParticipationManager.simulateParticipationChanges(simulationChanges);
		console.log('시뮬레이션 결과:', result);
		showSimulationModal = false;
	}

	// 헬스 상태 색상
	function getHealthColor(status: string): string {
		switch (status) {
			case 'excellent': return 'success';
			case 'good': return 'info';
			case 'fair': return 'warning';
			case 'poor': return 'error';
			default: return 'default';
		}
	}

	// 충돌 심각도 색상
	function getConflictColor(severity: string): string {
		switch (severity) {
			case 'critical': return 'error';
			case 'high': return 'warning';
			case 'medium': return 'info';
			case 'low': return 'default';
			default: return 'default';
		}
	}

	// 추천 우선순위 색상
	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'urgent': return 'error';
			case 'high': return 'warning';
			case 'medium': return 'info';
			case 'low': return 'default';
			default: return 'default';
		}
	}
</script>

<!-- 참여율 관리 대시보드 -->
<ThemeSpacer size={6}>
	<!-- 헬스 상태 요약 -->
	<ThemeGrid cols={1} lgCols={4} gap={4}>
		<ThemeCard class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium" style="color: var(--color-text-secondary);">참여율 헬스</p>
					<p class="text-2xl font-bold" style="color: var(--color-text);">
						{participationHealthData[0]?.score || 0}%
					</p>
					<ThemeBadge variant={getHealthColor(participationHealthData[0]?.status || 'fair') as any}>
						{participationHealthData[0]?.status || 'fair'}
					</ThemeBadge>
				</div>
				<BarChart3Icon size={32} style="color: var(--color-primary);" />
			</div>
		</ThemeCard>

		<ThemeCard class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium" style="color: var(--color-text-secondary);">활성 충돌</p>
					<p class="text-2xl font-bold" style="color: var(--color-text);">
						{$participationConflicts.filter(c => !c.resolvedAt).length}
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						중요: {$participationConflicts.filter(c => c.severity === 'critical' && !c.resolvedAt).length}개
					</p>
				</div>
				<AlertTriangleIcon size={32} style="color: var(--color-warning);" />
			</div>
		</ThemeCard>

		<ThemeCard class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium" style="color: var(--color-text-secondary);">활성 추천</p>
					<p class="text-2xl font-bold" style="color: var(--color-text);">
						{$participationRecommendations.length}
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						긴급: {$participationRecommendations.filter(r => r.priority === 'urgent').length}개
					</p>
				</div>
				<BrainIcon size={32} style="color: var(--color-info);" />
			</div>
		</ThemeCard>

		<ThemeCard class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium" style="color: var(--color-text-secondary);">총 할당</p>
					<p class="text-2xl font-bold" style="color: var(--color-text);">
						{$participationAssignments.length}
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						이번 달 변경: {trendsData[0]?.totalChanges || 0}회
					</p>
				</div>
				<TargetIcon size={32} style="color: var(--color-success);" />
			</div>
		</ThemeCard>
	</ThemeGrid>

	<!-- 액션 버튼 -->
	<ThemeCard class="p-4">
		<div class="flex items-center justify-between">
			<ThemeSectionHeader title="참여율 관리" />
			<div class="flex items-center gap-2">
				<ThemeButton variant="ghost" size="sm" onclick={loadAnalysisData}>
					<RefreshCwIcon size={16} class="mr-1" />
					새로고침
				</ThemeButton>
				<ThemeButton variant="ghost" size="sm" onclick={() => showSimulationModal = true}>
					<BarChart3Icon size={16} class="mr-1" />
					시뮬레이션
				</ThemeButton>
				<ThemeButton variant="ghost" size="sm">
					<DownloadIcon size={16} class="mr-1" />
					내보내기
				</ThemeButton>
			</div>
		</div>
	</ThemeCard>

	<!-- 월별 참여율 분석 -->
	<ThemeCard class="p-6">
		<ThemeSectionHeader title="월별 참여율 분석" />
		
		<!-- 필터 -->
		<div class="flex items-center gap-4 mb-6">
			<select
				bind:value={selectedMonth}
				class="px-3 py-2 border rounded-md text-sm"
				style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
			>
				{#each monthlyAnalysis as month}
					<option value={month.month}>{month.month}</option>
				{/each}
			</select>
			<select
				bind:value={selectedPerson}
				class="px-3 py-2 border rounded-md text-sm"
				style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
			>
				<option value="">전체</option>
				{#each $employees as employee}
					<option value={employee.id}>{employee.name}</option>
				{/each}
			</select>
			<select
				bind:value={selectedProject}
				class="px-3 py-2 border rounded-md text-sm"
				style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
			>
				<option value="">전체</option>
				{#each $projects as project}
					<option value={project.id}>{project.name}</option>
				{/each}
			</select>
		</div>

		<!-- 분석 테이블 -->
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b" style="border-color: var(--color-border);">
						<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">연구원</th>
						<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">총 참여율</th>
						<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">프로젝트</th>
						<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">상태</th>
						<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">액션</th>
					</tr>
				</thead>
				<tbody>
					{#each monthlyAnalysis.find(m => m.month === selectedMonth)?.personAnalysis || [] as personData}
						{#if !selectedPerson || personData.personId === selectedPerson}
							<tr class="border-b" style="border-color: var(--color-border);">
								<td class="py-3 px-4">
									<div class="flex items-center gap-2">
										<UsersIcon size={16} style="color: var(--color-primary);" />
										<span style="color: var(--color-text);">{personData.personName}</span>
									</div>
								</td>
								<td class="py-3 px-4">
									<div class="flex items-center gap-2">
										<span class="font-medium" style="color: var(--color-text);">
											{personData.totalRate}%
										</span>
										{#if personData.totalRate > 100}
											<TrendingUpIcon size={16} style="color: var(--color-error);" />
										{:else if personData.totalRate < 50}
											<TrendingDownIcon size={16} style="color: var(--color-warning);" />
										{/if}
									</div>
								</td>
								<td class="py-3 px-4">
									<div class="flex flex-wrap gap-1">
										{#each personData.projects as project}
											{#if !selectedProject || project.projectId === selectedProject}
												<ThemeBadge variant="info" size="sm">
													{project.projectName} ({project.rate}%)
												</ThemeBadge>
											{/if}
										{/each}
									</div>
								</td>
								<td class="py-3 px-4">
									{#if personData.totalRate > 100}
										<ThemeBadge variant="error">과부하</ThemeBadge>
									{:else if personData.totalRate < 50}
										<ThemeBadge variant="warning">미활용</ThemeBadge>
									{:else if personData.totalRate >= 80 && personData.totalRate <= 100}
										<ThemeBadge variant="success">최적</ThemeBadge>
									{:else}
										<ThemeBadge variant="info">보통</ThemeBadge>
									{/if}
								</td>
								<td class="py-3 px-4">
									<div class="flex items-center gap-1">
										<ThemeButton variant="ghost" size="sm" onclick={() => autoAdjustParticipation(personData.personId)}>
											<SettingsIcon size={14} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm">
											<EyeIcon size={14} />
										</ThemeButton>
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	</ThemeCard>

	<!-- 충돌 및 추천 -->
	<ThemeGrid cols={1} lgCols={2} gap={6}>
		<!-- 활성 충돌 -->
		<ThemeCard class="p-6">
			<div class="flex items-center justify-between mb-4">
				<ThemeSectionHeader title="활성 충돌" />
				<ThemeButton variant="ghost" size="sm" onclick={() => showConflictModal = true}>
					<EyeIcon size={16} />
				</ThemeButton>
			</div>
			
			<div class="space-y-3">
				{#each $participationConflicts.filter(c => !c.resolvedAt).slice(0, 5) as conflict}
					<div class="p-3 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-1">
									<ThemeBadge variant={getConflictColor(conflict.severity) as any}>
										{conflict.severity}
									</ThemeBadge>
									<span class="text-sm font-medium" style="color: var(--color-text);">
										{conflict.conflictType === 'overload' ? '과부하' : 
										 conflict.conflictType === 'underutilization' ? '미활용' :
										 conflict.conflictType === 'skill_mismatch' ? '스킬 불일치' : '일정 충돌'}
									</span>
								</div>
								<p class="text-sm" style="color: var(--color-text-secondary);">
									{conflict.description}
								</p>
							</div>
							<div class="flex items-center gap-1">
								<ThemeButton variant="success" size="sm" onclick={() => resolveConflict(conflict.id, 'resolve')}>
									<CheckCircleIcon size={14} />
								</ThemeButton>
								<ThemeButton variant="ghost" size="sm" onclick={() => { selectedConflict = conflict; showConflictModal = true; }}>
									<EyeIcon size={14} />
								</ThemeButton>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</ThemeCard>

		<!-- AI 추천 -->
		<ThemeCard class="p-6">
			<div class="flex items-center justify-between mb-4">
				<ThemeSectionHeader title="AI 추천" />
				<ThemeButton variant="ghost" size="sm" onclick={() => showRecommendationModal = true}>
					<EyeIcon size={16} />
				</ThemeButton>
			</div>
			
			<div class="space-y-3">
				{#each $participationRecommendations.slice(0, 5) as recommendation}
					<div class="p-3 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-1">
									<ThemeBadge variant={getPriorityColor(recommendation.priority) as any}>
										{recommendation.priority}
									</ThemeBadge>
									<span class="text-sm font-medium" style="color: var(--color-text);">
										{recommendation.title}
									</span>
								</div>
								<p class="text-sm mb-2" style="color: var(--color-text-secondary);">
									{recommendation.description}
								</p>
								<div class="flex items-center gap-4 text-xs" style="color: var(--color-text-secondary);">
									<span>비용: {formatCurrency(recommendation.estimatedImpact.cost)}</span>
									<span>효과: {formatCurrency(recommendation.estimatedImpact.benefit)}</span>
									<span>위험: {(recommendation.estimatedImpact.risk * 100).toFixed(0)}%</span>
								</div>
							</div>
							<div class="flex items-center gap-1">
								<ThemeButton variant="primary" size="sm" onclick={() => executeRecommendation(recommendation.id)}>
									실행
								</ThemeButton>
								<ThemeButton variant="ghost" size="sm" onclick={() => { selectedRecommendation = recommendation; showRecommendationModal = true; }}>
									<EyeIcon size={14} />
								</ThemeButton>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</ThemeCard>
	</ThemeGrid>
</ThemeSpacer>

<!-- 충돌 상세 모달 -->
{#if showConflictModal && selectedConflict}
	<ThemeModal open={showConflictModal}>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold" style="color: var(--color-text);">충돌 상세 정보</h3>
				<ThemeButton variant="ghost" size="sm" onclick={() => { showConflictModal = false; selectedConflict = null; }}>
					<XCircleIcon size={16} />
				</ThemeButton>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">충돌 유형</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedConflict?.conflictType}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">심각도</div>
					<ThemeBadge variant={getConflictColor(selectedConflict?.severity || 'low') as any}>
						{selectedConflict?.severity || 'low'}
					</ThemeBadge>
				</div>
			</div>
			
			<div>
				<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">설명</div>
				<p class="text-sm" style="color: var(--color-text-secondary);">{selectedConflict.description}</p>
			</div>
			
			<div>
				<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">권장 조치</div>
				<ul class="text-sm space-y-1" style="color: var(--color-text-secondary);">
					{#each selectedConflict.recommendedActions as action}
						<li>• {action}</li>
					{/each}
				</ul>
			</div>
			
			<div class="flex items-center justify-end gap-2 pt-4">
				<ThemeButton variant="secondary" onclick={() => { showConflictModal = false; selectedConflict = null; }}>
					닫기
				</ThemeButton>
				<ThemeButton variant="primary" onclick={() => selectedConflict && resolveConflict(selectedConflict.id, 'resolve')}>
					해결 완료
				</ThemeButton>
			</div>
		</div>
	</ThemeModal>
{/if}

<!-- 추천 상세 모달 -->
{#if showRecommendationModal && selectedRecommendation}
	<ThemeModal open={showRecommendationModal}>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold" style="color: var(--color-text);">추천 상세 정보</h3>
				<ThemeButton variant="ghost" size="sm" onclick={() => { showRecommendationModal = false; selectedRecommendation = null; }}>
					<XCircleIcon size={16} />
				</ThemeButton>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">추천 유형</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedRecommendation?.type}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">우선순위</div>
					<ThemeBadge variant={getPriorityColor(selectedRecommendation?.priority || 'low') as any}>
						{selectedRecommendation?.priority || 'low'}
					</ThemeBadge>
				</div>
			</div>
			
			<div>
				<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">설명</div>
				<p class="text-sm" style="color: var(--color-text-secondary);">{selectedRecommendation.description}</p>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">예상 비용</div>
					<p class="text-sm font-medium" style="color: var(--color-error);">
						{formatCurrency(selectedRecommendation.estimatedImpact.cost)}
					</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">예상 효과</div>
					<p class="text-sm font-medium" style="color: var(--color-success);">
						{formatCurrency(selectedRecommendation.estimatedImpact.benefit)}
					</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">위험도</div>
					<p class="text-sm font-medium" style="color: var(--color-warning);">
						{(selectedRecommendation.estimatedImpact.risk * 100).toFixed(0)}%
					</p>
				</div>
			</div>
			
			<div>
				<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">권장 조치</div>
				<ul class="text-sm space-y-1" style="color: var(--color-text-secondary);">
					{#each selectedRecommendation.recommendedActions as action}
						<li>• {action}</li>
					{/each}
				</ul>
			</div>
			
			<div class="flex items-center justify-end gap-2 pt-4">
				<ThemeButton variant="secondary" onclick={() => { showRecommendationModal = false; selectedRecommendation = null; }}>
					닫기
				</ThemeButton>
				<ThemeButton variant="primary" onclick={() => selectedRecommendation && executeRecommendation(selectedRecommendation.id)}>
					추천 실행
				</ThemeButton>
			</div>
		</div>
	</ThemeModal>
{/if}

<!-- 시뮬레이션 모달 -->
{#if showSimulationModal}
	<ThemeModal open={showSimulationModal}>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold" style="color: var(--color-text);">참여율 시뮬레이션</h3>
				<ThemeButton variant="ghost" size="sm" onclick={() => { showSimulationModal = false; simulationChanges = []; }}>
					<XCircleIcon size={16} />
				</ThemeButton>
			</div>
			
			<div class="text-sm" style="color: var(--color-text-secondary);">
				참여율 변경을 시뮬레이션하여 미래 영향을 예측할 수 있습니다.
			</div>
			
			<div class="space-y-3">
				{#each simulationChanges as change, index}
					<div class="p-3 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<div class="grid grid-cols-1 md:grid-cols-3 gap-2">
							<select
								bind:value={change.personId}
								class="px-3 py-2 border rounded-md text-sm"
								style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
							>
								{#each $employees as employee}
									<option value={employee.id}>{employee.name}</option>
								{/each}
							</select>
							<select
								bind:value={change.projectId}
								class="px-3 py-2 border rounded-md text-sm"
								style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
							>
								{#each $projects as project}
									<option value={project.id}>{project.name}</option>
								{/each}
							</select>
							<div class="flex items-end gap-2">
								<input
									type="number"
									bind:value={change.newRate}
									placeholder="참여율 (%)"
									min="0"
									max="100"
									class="px-3 py-2 border rounded-md text-sm"
									style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
								/>
								<ThemeButton variant="ghost" size="sm" onclick={() => simulationChanges = simulationChanges.filter((_, i) => i !== index)}>
									<XCircleIcon size={16} />
								</ThemeButton>
							</div>
						</div>
					</div>
				{/each}
			</div>
			
			<ThemeButton variant="ghost" onclick={() => simulationChanges = [...simulationChanges, {personId: '', projectId: '', newRate: 0}]}>
				변경 사항 추가
			</ThemeButton>
			
			<div class="flex items-center justify-end gap-2 pt-4">
				<ThemeButton variant="secondary" onclick={() => { showSimulationModal = false; simulationChanges = []; }}>
					취소
				</ThemeButton>
				<ThemeButton variant="primary" onclick={runSimulation}>
					시뮬레이션 실행
				</ThemeButton>
			</div>
		</div>
	</ThemeModal>
{/if}
