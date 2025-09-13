<script lang="ts">
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte';
	import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte';
	import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte';
	import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte';
	import ThemeChartPlaceholder from '$lib/components/ui/ThemeChartPlaceholder.svelte';
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte';
	import ThemeInput from '$lib/components/ui/ThemeInput.svelte';
	import ThemeDropdown from '$lib/components/ui/ThemeDropdown.svelte';
	import ParticipationDashboard from '$lib/components/rd/ParticipationDashboard.svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { 
		FlaskConicalIcon,
		UsersIcon,
		DollarSignIcon,
		TrendingUpIcon,
		PlusIcon,
		EyeIcon,
		EditIcon,
		TrashIcon,
		FileTextIcon,
		BarChart3Icon,
		PieChartIcon,
		AlertTriangleIcon,
		CheckCircleIcon,
		ClockIcon,
		TargetIcon,
		CalendarIcon,
		BuildingIcon,
		UserIcon,
		PercentIcon,
		UploadIcon,
		DownloadIcon,
		SearchIcon,
		FilterIcon,
		BrainIcon,
		SettingsIcon
	} from 'lucide-svelte';
	import {
		employees,
		projects,
		participations,
		rdBudgets,
		documentTemplates,
		documentSubmissions,
		recommendations,
		getEmployeeById,
		getProjectById,
		getParticipationsByEmployee,
		getParticipationsByProject,
		calculatePersonnelCost,
		getTotalParticipationRate,
		getProjectBudgetUtilization,
		getDocumentSubmissionStatus,
		addEmployee,
		updateEmployee,
		addProject,
		updateProject,
		addParticipation,
		updateParticipation,
		addDocumentSubmission,
		updateDocumentSubmission,
		addRecommendation,
		updateRecommendation
	} from '$lib/stores/rd';
	import { initializeParticipationManager } from '$lib/stores/rnd/participation-manager';
	import DocumentEditor from '$lib/components/rd/DocumentEditor.svelte';
	import ParticipationAdjuster from '$lib/components/rd/ParticipationAdjuster.svelte';
	import { toasts } from '$lib/stores/toasts';

	// 상태 관리
	let selectedProject = $state<any>(null);
	let selectedEmployee = $state<any>(null);
	let selectedTemplate = $state<any>(null);
	let showProjectModal = $state(false);
	let showEmployeeModal = $state(false);
	let showParticipationModal = $state(false);
	let showDocumentModal = $state(false);
	let showDocumentEditor = $state(false);
	let showRecommendationModal = $state(false);
	let searchTerm = $state('');
	let selectedStatus = $state('all');
	let selectedCategory = $state('all');

	// 탭 제거 - 모든 내용을 단일 뷰로 통합

	// 통계 데이터
	const stats = [
		{
			title: '진행중인 프로젝트',
			value: 3,
			change: '+1',
			changeType: 'positive' as const,
			icon: TargetIcon
		},
		{
			title: '총 연구인력',
			value: 5,
			change: '+2',
			changeType: 'positive' as const,
			icon: UsersIcon
		},
		{
			title: '총 연구개발비',
			value: formatCurrency(1800000000),
			change: '+15%',
			changeType: 'positive' as const,
			icon: DollarSignIcon
		},
		{
			title: '예산 사용률',
			value: '68%',
			change: '+5%',
			changeType: 'positive' as const,
			icon: TrendingUpIcon
		}
	];

	// 액션 버튼들
	const actions = [
		{
			label: '프로젝트 추가',
			icon: PlusIcon,
			onclick: () => { selectedProject = null; showProjectModal = true; },
			variant: 'primary' as const
		},
		{
			label: '인력 추가',
			icon: UserIcon,
			onclick: () => { selectedEmployee = null; showEmployeeModal = true; },
			variant: 'success' as const
		}
	];

	// 필터링된 프로젝트 데이터
	let filteredProjects = $derived(
		$projects.filter((project: any) => {
			const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				project.description.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
			const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
			return matchesSearch && matchesStatus && matchesCategory;
		})
	);

	// 상태별 색상
	const getStatusColor = (status: string) => {
		const colors: Record<string, string> = {
			'planning': 'info',
			'active': 'success',
			'completed': 'primary',
			'cancelled': 'error',
			'on-hold': 'warning'
		};
		return colors[status] || 'default';
	};

	// 상태별 라벨
	const getStatusLabel = (status: string) => {
		const labels: Record<string, string> = {
			'planning': '기획',
			'active': '진행중',
			'completed': '완료',
			'cancelled': '취소',
			'on-hold': '보류'
		};
		return labels[status] || status;
	};

	// 카테고리별 색상
	const getCategoryColor = (category: string) => {
		const colors: Record<string, string> = {
			'basic-research': 'primary',
			'applied-research': 'info',
			'development': 'success',
			'pilot': 'warning'
		};
		return colors[category] || 'default';
	};

	// 카테고리별 라벨
	const getCategoryLabel = (category: string) => {
		const labels: Record<string, string> = {
			'basic-research': '기초연구',
			'applied-research': '응용연구',
			'development': '개발',
			'pilot': '파일럿'
		};
		return labels[category] || category;
	};

	// 우선순위별 색상
	const getPriorityColor = (priority: string) => {
		const colors: Record<string, string> = {
			'high': 'error',
			'medium': 'warning',
			'low': 'info'
		};
		return colors[priority] || 'default';
	};

	// 우선순위별 라벨
	const getPriorityLabel = (priority: string) => {
		const labels: Record<string, string> = {
			'high': '높음',
			'medium': '보통',
			'low': '낮음'
		};
		return labels[priority] || priority;
	};

	// 추천 타입별 색상
	const getRecommendationTypeColor = (type: string) => {
		const colors: Record<string, string> = {
			'hiring': 'primary',
			'participation-adjustment': 'info',
			'budget-reallocation': 'warning',
			'timeline-adjustment': 'success'
		};
		return colors[type] || 'default';
	};

	// 추천 타입별 라벨
	const getRecommendationTypeLabel = (type: string) => {
		const labels: Record<string, string> = {
			'hiring': '채용',
			'participation-adjustment': '참여율 조정',
			'budget-reallocation': '예산 재배분',
			'timeline-adjustment': '일정 조정'
		};
		return labels[type] || type;
	};

	// 프로젝트 보기
	function viewProject(project: any) {
		selectedProject = project;
		showProjectModal = true;
	}

	// 인력 보기
	function viewEmployee(employee: any) {
		selectedEmployee = employee;
		showEmployeeModal = true;
	}

	// 참여율 조정
	function adjustParticipation(employee: any) {
		selectedEmployee = employee;
		showParticipationModal = true;
	}

	// 문서 제출
	function submitDocument(project: any) {
		selectedProject = project;
		showDocumentModal = true;
	}

	// AI 추천 생성
	function generateRecommendations() {
		// 실제로는 AI 알고리즘을 호출
		toasts.update(toasts => [...toasts, {
			type: 'info',
			message: 'AI 추천 분석을 시작합니다...',
			id: crypto.randomUUID()
		}]);
	}

	onMount(() => {
		console.log('연구개발 관리 페이지 로드됨');
		
		// 참여율 관리 시스템 초기화
		initializeParticipationManager();
	});
</script>

<PageLayout
	title="연구개발 관리"
	subtitle="프로젝트, 인력, 예산, 증빙자료 통합 관리"
	{stats}
	{actions}
	searchPlaceholder="프로젝트명, 설명으로 검색..."
>
	<!-- 통합된 연구개발 관리 대시보드 -->
	<ThemeSpacer size={6}>
		<!-- 메인 대시보드 -->
		<ThemeGrid cols={1} lgCols={2} gap={6}>
			<!-- 프로젝트 현황 -->
			<ThemeCard class="p-6">
				<ThemeSectionHeader title="프로젝트 현황" />
				<ThemeChartPlaceholder
					title="프로젝트 상태별 분포"
					icon={PieChartIcon}
				/>
			</ThemeCard>

			<!-- 예산 사용률 -->
			<ThemeCard class="p-6">
				<ThemeSectionHeader title="예산 사용률" />
				<ThemeChartPlaceholder
					title="월별 예산 사용 추이"
					icon={BarChart3Icon}
				/>
			</ThemeCard>
		</ThemeGrid>

		<!-- 프로젝트 목록 -->
		<ThemeCard class="p-6">
			<div class="flex items-center justify-between mb-6">
				<ThemeSectionHeader title="프로젝트 목록" />
				<div class="flex items-center gap-2">
					<select 
						bind:value={selectedStatus}
						class="px-3 py-2 border rounded-md text-sm"
						style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
					>
						<option value="all">전체</option>
						<option value="planning">기획</option>
						<option value="active">진행중</option>
						<option value="completed">완료</option>
						<option value="cancelled">취소</option>
						<option value="on-hold">보류</option>
					</select>
					<select 
						bind:value={selectedCategory}
						class="px-3 py-2 border rounded-md text-sm"
						style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
					>
						<option value="all">전체</option>
						<option value="basic-research">기초연구</option>
						<option value="applied-research">응용연구</option>
						<option value="development">개발</option>
						<option value="pilot">파일럿</option>
					</select>
				</div>
			</div>
			
			<div class="space-y-4">
				{#each filteredProjects as project}
					<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<TargetIcon size={20} style="color: var(--color-primary);" />
								<h4 class="font-medium" style="color: var(--color-text);">{project.name}</h4>
								<ThemeBadge variant={getStatusColor(project.status) as any}>
									{getStatusLabel(project.status)}
								</ThemeBadge>
							</div>
							<p class="text-sm mb-2" style="color: var(--color-text-secondary);">{project.description}</p>
							<div class="flex items-center gap-4 text-sm" style="color: var(--color-text-secondary);">
								<div class="flex items-center gap-1">
									<UserIcon size={16} />
									{project.manager}
								</div>
								<div class="flex items-center gap-1">
									<BuildingIcon size={16} />
									{project.department}
								</div>
								<div class="flex items-center gap-1">
									<CalendarIcon size={16} />
									{formatDate(project.startDate)} ~ {formatDate(project.endDate)}
								</div>
							</div>
							<div class="flex items-center gap-2 mt-2">
								<ThemeBadge variant={getCategoryColor(project.category) as any}>
									{getCategoryLabel(project.category)}
								</ThemeBadge>
								<ThemeBadge variant={getPriorityColor(project.priority) as any}>
									{getPriorityLabel(project.priority)}
								</ThemeBadge>
								{#if project.client}
									<ThemeBadge variant="info">{project.client}</ThemeBadge>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-2">
							<div class="text-right mr-4">
								<p class="text-sm font-medium" style="color: var(--color-primary);">
									{formatCurrency(project.budget)}
								</p>
								<p class="text-xs" style="color: var(--color-text-secondary);">
									사용률: {getProjectBudgetUtilization(project.id).toFixed(1)}%
								</p>
							</div>
							<ThemeButton variant="ghost" size="sm" onclick={() => viewProject(project)}>
								<EyeIcon size={16} />
							</ThemeButton>
							<ThemeButton variant="ghost" size="sm" onclick={() => submitDocument(project)}>
								<FileTextIcon size={16} />
							</ThemeButton>
							<ThemeButton variant="ghost" size="sm">
								<EditIcon size={16} />
							</ThemeButton>
						</div>
					</div>
				{/each}
			</div>
		</ThemeCard>

		<!-- 고도화된 참여율 관리 -->
		<ParticipationDashboard />

		<!-- 연구개발비 현황 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="연구개발비 현황" />
			<div class="space-y-4">
				{#each $projects as project}
					{@const projectBudgets = $rdBudgets.filter(budget => budget.projectId === project.id)}
					{@const totalPlanned = projectBudgets.reduce((sum, budget) => sum + budget.plannedAmount, 0)}
					{@const totalActual = projectBudgets.reduce((sum, budget) => sum + budget.actualAmount, 0)}
					{@const utilization = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0}
					<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<div class="flex-1">
							<h4 class="font-medium mb-2" style="color: var(--color-text);">{project.name}</h4>
							<div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
								<div>
									<p class="font-medium" style="color: var(--color-primary);">인건비</p>
									<p style="color: var(--color-text-secondary);">
										{formatCurrency(projectBudgets.filter(b => b.category === 'personnel').reduce((sum, b) => sum + b.actualAmount, 0))}
									</p>
								</div>
								<div>
									<p class="font-medium" style="color: var(--color-info);">재료비</p>
									<p style="color: var(--color-text-secondary);">
										{formatCurrency(projectBudgets.filter(b => b.category === 'materials').reduce((sum, b) => sum + b.actualAmount, 0))}
									</p>
								</div>
								<div>
									<p class="font-medium" style="color: var(--color-success);">장비비</p>
									<p style="color: var(--color-text-secondary);">
										{formatCurrency(projectBudgets.filter(b => b.category === 'equipment').reduce((sum, b) => sum + b.actualAmount, 0))}
									</p>
								</div>
								<div>
									<p class="font-medium" style="color: var(--color-warning);">기타</p>
									<p style="color: var(--color-text-secondary);">
										{formatCurrency(projectBudgets.filter(b => b.category === 'other').reduce((sum, b) => sum + b.actualAmount, 0))}
									</p>
								</div>
							</div>
						</div>
						<div class="text-right">
							<p class="text-sm font-medium" style="color: var(--color-primary);">
								{formatCurrency(totalActual)} / {formatCurrency(totalPlanned)}
							</p>
							<p class="text-xs" style="color: var(--color-text-secondary);">
								사용률: {utilization.toFixed(1)}%
							</p>
							<div class="w-20 h-2 bg-gray-200 rounded-full mt-1">
								<div 
									class="h-2 rounded-full" 
									style="width: {Math.min(utilization, 100)}%; background: {utilization > 90 ? 'var(--color-error)' : utilization > 70 ? 'var(--color-warning)' : 'var(--color-success)'};"
								></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</ThemeCard>

		<!-- 증빙자료 관리 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="증빙자료 관리" />
			<div class="space-y-4">
				{#each $projects as project}
					{@const projectSubmissions = $documentSubmissions.filter(sub => sub.projectId === project.id)}
					{@const submissionStatus = getDocumentSubmissionStatus(project.id)}
					<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<div class="flex-1">
							<h4 class="font-medium mb-2" style="color: var(--color-text);">{project.name}</h4>
							<div class="flex items-center gap-4 text-sm" style="color: var(--color-text-secondary);">
								<div class="flex items-center gap-1">
									<CheckCircleIcon size={16} style="color: var(--color-success);" />
									승인: {submissionStatus.submitted}개
								</div>
								<div class="flex items-center gap-1">
									<ClockIcon size={16} style="color: var(--color-warning);" />
									대기: {submissionStatus.pending}개
								</div>
								<div class="flex items-center gap-1">
									<FileTextIcon size={16} style="color: var(--color-info);" />
									전체: {submissionStatus.total}개
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<ThemeButton variant="ghost" size="sm" onclick={() => submitDocument(project)}>
								<PlusIcon size={16} />
								문서 제출
							</ThemeButton>
							<ThemeButton variant="ghost" size="sm">
								<EyeIcon size={16} />
							</ThemeButton>
						</div>
					</div>
				{/each}
			</div>
		</ThemeCard>

		<!-- AI 추천사항 -->
		<ThemeCard class="p-6">
			<div class="flex items-center justify-between mb-6">
				<ThemeSectionHeader title="AI 추천사항" />
				<ThemeButton variant="primary" onclick={generateRecommendations}>
					<BrainIcon size={16} class="mr-2" />
					새 추천 생성
				</ThemeButton>
			</div>
			<div class="space-y-4">
				{#each $recommendations as recommendation}
					<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<BrainIcon size={20} style="color: var(--color-primary);" />
								<h4 class="font-medium" style="color: var(--color-text);">{recommendation.title}</h4>
								<ThemeBadge variant={getRecommendationTypeColor(recommendation.type) as any}>
									{getRecommendationTypeLabel(recommendation.type)}
								</ThemeBadge>
								<ThemeBadge variant={recommendation.priority === 'high' ? 'error' : recommendation.priority === 'medium' ? 'warning' : 'info'}>
									{recommendation.priority === 'high' ? '높음' : recommendation.priority === 'medium' ? '보통' : '낮음'}
								</ThemeBadge>
								<ThemeBadge variant={recommendation.status === 'pending' ? 'warning' : recommendation.status === 'approved' ? 'success' : 'error'}>
									{recommendation.status === 'pending' ? '대기' : recommendation.status === 'approved' ? '승인' : '거부'}
								</ThemeBadge>
							</div>
							<p class="text-sm mb-2" style="color: var(--color-text-secondary);">{recommendation.description}</p>
							<p class="text-sm" style="color: var(--color-text-secondary);">
								<strong>예상 효과:</strong> {recommendation.impact}
							</p>
							{#if recommendation.estimatedCost || recommendation.estimatedBenefit}
								<div class="flex items-center gap-4 mt-2 text-sm">
									{#if recommendation.estimatedCost}
										<span style="color: var(--color-error);">
											예상 비용: {formatCurrency(recommendation.estimatedCost)}
										</span>
									{/if}
									{#if recommendation.estimatedBenefit}
										<span style="color: var(--color-success);">
											예상 효과: {formatCurrency(recommendation.estimatedBenefit)}
										</span>
									{/if}
								</div>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							{#if recommendation.status === 'pending'}
								<ThemeButton variant="success" size="sm">
									승인
								</ThemeButton>
								<ThemeButton variant="error" size="sm">
									거부
								</ThemeButton>
							{/if}
							<ThemeButton variant="ghost" size="sm">
								<EyeIcon size={16} />
							</ThemeButton>
						</div>
					</div>
				{/each}
			</div>
		</ThemeCard>
	</ThemeSpacer>
</PageLayout>

<!-- 프로젝트 상세 모달 -->
{#if showProjectModal && selectedProject}
	<ThemeModal
	>
		<div class="space-y-4">
			<h3 class="text-lg font-semibold mb-4" style="color: var(--color-text);">프로젝트 상세 정보</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">프로젝트명</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedProject.name}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">담당자</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedProject.manager}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">시작일</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{formatDate(selectedProject.startDate)}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">종료일</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{formatDate(selectedProject.endDate)}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">예산</div>
					<p class="text-sm font-medium" style="color: var(--color-primary);">{formatCurrency(selectedProject.budget)}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">상태</div>
					<ThemeBadge variant={getStatusColor(selectedProject.status) as any}>
						{getStatusLabel(selectedProject.status)}
					</ThemeBadge>
				</div>
			</div>
			<div>
				<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">설명</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedProject?.description}</p>
			</div>
		</div>
	</ThemeModal>
{/if}

<!-- 인력 상세 모달 -->
{#if showEmployeeModal && selectedEmployee}
	<ThemeModal
	>
		<div class="space-y-4">
			<h3 class="text-lg font-semibold mb-4" style="color: var(--color-text);">인력 상세 정보</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">이름</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedEmployee.name}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">부서</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedEmployee.department}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">직책</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{selectedEmployee.position}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">입사일</div>
					<p class="text-sm" style="color: var(--color-text-secondary);">{formatDate(selectedEmployee.hireDate)}</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">급여</div>
					<p class="text-sm font-medium" style="color: var(--color-primary);">{formatCurrency(selectedEmployee.salary)}/월</p>
				</div>
				<div>
					<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">상태</div>
					<ThemeBadge variant={selectedEmployee.status === 'active' ? 'success' : 'error'}>
						{selectedEmployee.status === 'active' ? '활성' : '비활성'}
					</ThemeBadge>
				</div>
			</div>
			<div>
				<div class="block text-sm font-medium mb-1" style="color: var(--color-text);">보유 기술</div>
				<div class="flex flex-wrap gap-1">
					{#each selectedEmployee.skills as skill}
						<ThemeBadge variant="info" size="sm">{skill}</ThemeBadge>
					{/each}
				</div>
			</div>
		</div>
	</ThemeModal>
{/if}

<!-- 참여율 조정 모달 -->
{#if showParticipationModal && selectedEmployee}
	<ThemeModal
		size="xl"
	>
		<ParticipationAdjuster
			employee={selectedEmployee}
			currentParticipations={getParticipationsByEmployee(selectedEmployee?.id || '')}
			availableProjects={$projects}
			onSave={(adjustments) => {
				// 참여율 조정 저장 로직
				adjustments.forEach(adj => {
					if (adj.id.startsWith('new-')) {
						addParticipation({
							employeeId: selectedEmployee.id,
							projectId: adj.projectId,
							startDate: adj.startDate,
							endDate: adj.endDate,
							participationRate: adj.participationRate,
							monthlySalary: adj.monthlySalary,
							role: adj.role,
							status: 'active'
						});
					} else {
						updateParticipation(adj.id, {
							participationRate: adj.participationRate,
							monthlySalary: adj.monthlySalary,
							role: adj.role
						});
					}
				});
				showParticipationModal = false;
				selectedEmployee = null;
				toasts.update(toasts => [...toasts, {
					type: 'success',
					message: '참여율이 성공적으로 조정되었습니다.',
					id: crypto.randomUUID()
				}]);
			}}
			onCancel={() => {
				showParticipationModal = false;
				selectedEmployee = null;
			}}
		/>
	</ThemeModal>
{/if}

<!-- 문서 제출 모달 -->
{#if showDocumentModal && selectedProject}
	<ThemeModal
		size="xl"
	>
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold" style="color: var(--color-text);">
						{selectedProject.name} - 문서 제출
					</h3>
					<p class="text-sm" style="color: var(--color-text-secondary);">
						필요한 문서를 선택하여 작성하거나 제출하세요.
					</p>
				</div>
			</div>

			<!-- 문서 템플릿 선택 -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each $documentTemplates as template}
					<button 
						class="w-full p-4 rounded-lg border hover:opacity-80 transition-opacity text-left" 
						style="border-color: var(--color-border); background: var(--color-surface-elevated);"
						onclick={() => {
							selectedTemplate = template;
							showDocumentEditor = true;
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								selectedTemplate = template;
								showDocumentEditor = true;
							}
						}}
					>
						<div class="flex items-center gap-3 mb-2">
							<FileTextIcon size={20} style="color: var(--color-primary);" />
							<h4 class="font-medium" style="color: var(--color-text);">{template.name}</h4>
						</div>
						<p class="text-sm" style="color: var(--color-text-secondary);">{template.description}</p>
						<div class="flex flex-wrap gap-1 mt-2">
							{#each template.requiredFields.slice(0, 3) as field}
								<ThemeBadge variant="info" size="sm">{field}</ThemeBadge>
							{/each}
							{#if template.requiredFields.length > 3}
								<ThemeBadge variant="info" size="sm">+{template.requiredFields.length - 3}</ThemeBadge>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</ThemeModal>
{/if}

<!-- 문서 편집기 모달 -->
{#if showDocumentEditor && selectedTemplate && selectedProject}
	<ThemeModal
		size="xl"
	>
		<DocumentEditor
			template={selectedTemplate!}
			projectId={selectedProject?.id || ''}
			onSave={(data) => {
				addDocumentSubmission({
					projectId: selectedProject?.id || '',
					templateId: selectedTemplate?.id || '',
					title: `${selectedTemplate?.name} - ${selectedProject?.name}`,
					status: data.status,
					submittedBy: '현재 사용자', // 실제로는 로그인한 사용자
					submittedAt: new Date().toISOString(),
					content: JSON.stringify(data)
				});
				showDocumentEditor = false;
				showDocumentModal = false;
				selectedTemplate = null;
				selectedProject = null;
				toasts.update(toasts => [...toasts, {
					type: 'success',
					message: '문서가 성공적으로 제출되었습니다.',
					id: crypto.randomUUID()
				}]);
			}}
			onCancel={() => {
				showDocumentEditor = false;
				selectedTemplate = null;
			}}
		/>
	</ThemeModal>
{/if}