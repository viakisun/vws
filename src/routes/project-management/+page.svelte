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
	import ThemeActivityItem from '$lib/components/ui/ThemeActivityItem.svelte';
	import ThemeProgressCard from '$lib/components/ui/ThemeProgressCard.svelte';
	import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte';
	import { formatDate } from '$lib/utils/format';
	import { 
		BriefcaseIcon, 
		UsersIcon, 
		CalendarIcon, 
		TrendingUpIcon,
		PlusIcon,
		EyeIcon,
		EditIcon,
		TrashIcon,
		ClockIcon,
		CheckCircleIcon,
		AlertCircleIcon,
		TargetIcon,
		DollarSignIcon,
		FileTextIcon,
		SettingsIcon,
		BarChart3Icon,
		FlaskConicalIcon,
		ClipboardListIcon,
		PieChartIcon
	} from 'lucide-svelte';
	
	// 스토어 임포트
	import { 
		projects, 
		getActiveProjects
	} from '$lib/stores/project-management/core';
	
	import { 
		currentUser,
		canAccessExecutiveDashboard,
		canAccessLabHeadDashboard,
		canAccessPMDashboard,
		canAccessSupportDashboard,
		canAccessResearcherDashboard,
		getUserRoleNames
	} from '$lib/stores/project-management/rbac';
	
	import { 
		calculateHealthIndicator,
		getHealthDashboardData
	} from '$lib/stores/project-management/health-indicators';

	// 현재 사용자 정보
	let user: any = $state(null);
	let userRoles: string[] = $state([]);
	
	// 대시보드 데이터
	let healthData: any = $state(null);
	let activeProjects: any[] = $state([]);
	let projectHealthIndicators: any[] = $state([]);

	// 대시보드 타입 결정
	let dashboardType = $derived(() => {
		if (!user) return 'researcher';
		
		if (canAccessExecutiveDashboard(user)) return 'executive';
		if (canAccessLabHeadDashboard(user)) return 'labHead';
		if (canAccessPMDashboard(user)) return 'pm';
		if (canAccessSupportDashboard(user)) return 'support';
		return 'researcher';
	});

	// 권한 체크
	let canViewExecutive = $derived(() => canAccessExecutiveDashboard(user));
	let canViewLabHead = $derived(() => canAccessLabHeadDashboard(user));
	let canViewPM = $derived(() => canAccessPMDashboard(user));
	let canViewSupport = $derived(() => canAccessSupportDashboard(user));

	// 통계 데이터
	const stats = [
		{
			title: '진행중인 프로젝트',
			value: activeProjects.length,
			change: '+2',
			changeType: 'positive' as const,
			icon: BriefcaseIcon
		},
		{
			title: '참여 인원',
			value: activeProjects.reduce((sum, project) => sum + (project.team?.length || 0), 0),
			change: '+5',
			changeType: 'positive' as const,
			icon: UsersIcon
		},
		{
			title: '완료율',
			value: `${Math.round(activeProjects.reduce((sum, project) => sum + (project.progress || 0), 0) / Math.max(activeProjects.length, 1))}%`,
			change: '+3%',
			changeType: 'positive' as const,
			icon: TrendingUpIcon
		},
		{
			title: '예산 사용률',
			value: '78%',
			change: '+2%',
			changeType: 'positive' as const,
			icon: DollarSignIcon
		}
	];

	// 탭 정의
	const tabs = [
		{ id: 'overview', label: '개요', icon: BarChart3Icon },
		{ id: 'projects', label: '프로젝트', icon: BriefcaseIcon },
		{ id: 'research', label: '연구개발', icon: FlaskConicalIcon },
		{ id: 'milestones', label: '마일스톤', icon: TargetIcon },
		{ id: 'reports', label: '보고서', icon: FileTextIcon }
	];

	let activeTab = $state('overview');

	// 액션 버튼들
	const actions = [
		{
			label: '프로젝트 생성',
			icon: PlusIcon,
			onclick: () => console.log('Create project'),
			variant: 'primary' as const
		},
		{
			label: '보고서 생성',
			icon: FileTextIcon,
			onclick: () => console.log('Generate report'),
			variant: 'success' as const
		}
	];

	// 프로젝트 상태별 색상
	const getStatusColor = (status: string) => {
		const colors = {
			'planning': 'info',
			'in-progress': 'primary',
			'on-hold': 'warning',
			'completed': 'success',
			'cancelled': 'error'
		};
		return colors[status] || 'default';
	};

	// 프로젝트 상태별 한글 라벨
	const getStatusLabel = (status: string) => {
		const labels = {
			'planning': '계획중',
			'in-progress': '진행중',
			'on-hold': '보류',
			'completed': '완료',
			'cancelled': '취소'
		};
		return labels[status] || status;
	};

	// 프로젝트 건강도 색상
	const getHealthColor = (health: number) => {
		if (health >= 80) return 'success';
		if (health >= 60) return 'warning';
		return 'error';
	};

	// 최근 활동 데이터
	let recentActivities = $derived(() => {
		const activities: Array<{
			type: string;
			title: string;
			description: string;
			time: string;
			icon: any;
			color: string;
		}> = [];

		// 최근 프로젝트 업데이트
		activeProjects
			.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
			.slice(0, 3)
			.forEach(project => {
				activities.push({
					type: 'project',
					title: '프로젝트 업데이트',
					description: `${project.name} 프로젝트가 업데이트되었습니다.`,
					time: project.updatedAt || project.createdAt,
					icon: BriefcaseIcon,
					color: 'text-blue-600'
				});
			});

		// 최근 마일스톤 완료
		activeProjects
			.flatMap(project => project.milestones || [])
			.filter(milestone => milestone.status === 'completed')
			.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
			.slice(0, 2)
			.forEach(milestone => {
				activities.push({
					type: 'milestone',
					title: '마일스톤 완료',
					description: `${milestone.title} 마일스톤이 완료되었습니다.`,
					time: milestone.completedAt,
					icon: CheckCircleIcon,
					color: 'text-green-600'
				});
			});

		return activities.slice(0, 5);
	});

	// 프로젝트별 진행률 데이터
	let projectProgressData = $derived(() => {
		return activeProjects.map(project => ({
			name: project.name,
			progress: project.progress || 0,
			status: project.status,
			health: calculateHealthIndicator(project)
		}));
	});

	// 위험 프로젝트
	let riskProjects = $derived(() => {
		return activeProjects.filter(project => {
			const health = calculateHealthIndicator(project);
			return health < 60 || project.status === 'on-hold';
		});
	});

	onMount(async () => {
		try {
			// 사용자 정보 로드
			user = currentUser;
		userRoles = getUserRoleNames(user);
		
		// 프로젝트 데이터 로드
		activeProjects = getActiveProjects($projects);
		
			// 건강도 데이터 로드
			healthData = getHealthDashboardData(activeProjects);
			
			// 프로젝트 건강도 지표 계산
			projectHealthIndicators = activeProjects.map(project => ({
				...project,
				health: calculateHealthIndicator(project)
			}));
			
			console.log('Project Management 페이지 로드됨', {
				user,
				userRoles,
				dashboardType: dashboardType,
				activeProjects: activeProjects.length
			});
		} catch (error) {
			console.error('데이터 로드 중 오류:', error);
		}
	});
</script>

<PageLayout
	title="연구개발 관리"
	subtitle="프로젝트 현황, 연구개발, 마일스톤 관리"
	{stats}
	{actions}
	searchPlaceholder="프로젝트명, 담당자, 상태로 검색..."
>
	<!-- 탭 시스템 -->
	<ThemeTabs
		{tabs}
		bind:activeTab
		variant="underline"
		size="md"
		class="mb-6"
	>
		{#snippet children(tab: any)}
			{#if tab.id === 'overview'}
				<!-- 개요 탭 -->
				<ThemeSpacer size={6}>
					<!-- 메인 대시보드 -->
					<ThemeGrid cols={1} lgCols={2} gap={6}>
						<!-- 프로젝트 진행률 -->
						<ThemeCard class="p-6">
							<ThemeSectionHeader title="프로젝트 진행률" />
							<ThemeSpacer size={4}>
								{#each projectProgressData as project}
									<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--color-surface-elevated);">
										<div class="flex-1">
											<h4 class="font-medium" style="color: var(--color-text);">{project.name}</h4>
											<div class="flex items-center gap-2 mt-1">
												<ThemeBadge variant={getStatusColor(project.status)}>
													{getStatusLabel(project.status)}
												</ThemeBadge>
												<ThemeBadge variant={getHealthColor(project.health)}>
													건강도: {project.health}%
												</ThemeBadge>
									</div>
								</div>
										<div class="text-right">
											<span class="text-lg font-bold" style="color: var(--color-primary);">
												{project.progress}%
											</span>
						</div>
									</div>
								{/each}
							</ThemeSpacer>
						</ThemeCard>

						<!-- 최근 활동 -->
						<ThemeCard class="p-6">
							<ThemeSectionHeader title="최근 활동" />
							<ThemeSpacer size={4}>
								{#each recentActivities as activity}
									<ThemeActivityItem
										title={activity.title}
										time={activity.time}
										icon={activity.icon}
										color={activity.color}
									/>
								{/each}
							</ThemeSpacer>
						</ThemeCard>
					</ThemeGrid>

					<!-- 차트 섹션 -->
					<ThemeGrid cols={1} lgCols={2} gap={6}>
						<!-- 프로젝트 상태 분포 -->
						<ThemeCard class="p-6">
							<ThemeSectionHeader title="프로젝트 상태 분포" />
							<ThemeChartPlaceholder
								title="상태별 분포"
								icon={PieChartIcon}
							/>
						</ThemeCard>

						<!-- 월별 진행률 추이 -->
						<ThemeCard class="p-6">
							<ThemeSectionHeader title="월별 진행률 추이" />
							<ThemeChartPlaceholder
								title="진행률 분석"
								icon={TrendingUpIcon}
							/>
						</ThemeCard>
					</ThemeGrid>

					<!-- 권한별 대시보드 정보 -->
					{#if canViewExecutive}
						<ThemeCard class="p-6">
							<ThemeSectionHeader title="경영진 대시보드" />
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div class="p-4 rounded-lg" style="background: var(--color-surface-elevated);">
									<h4 class="font-medium mb-2" style="color: var(--color-text);">전체 예산</h4>
									<p class="text-2xl font-bold" style="color: var(--color-primary);">
										₩{activeProjects.reduce((sum, project) => sum + (project.budget || 0), 0).toLocaleString()}
									</p>
								</div>
								<div class="p-4 rounded-lg" style="background: var(--color-surface-elevated);">
									<h4 class="font-medium mb-2" style="color: var(--color-text);">평균 건강도</h4>
									<p class="text-2xl font-bold" style="color: var(--color-success);">
										{Math.round(activeProjects.reduce((sum, project) => sum + calculateHealthIndicator(project), 0) / Math.max(activeProjects.length, 1))}%
									</p>
								</div>
								<div class="p-4 rounded-lg" style="background: var(--color-surface-elevated);">
									<h4 class="font-medium mb-2" style="color: var(--color-text);">완료 예정</h4>
									<p class="text-2xl font-bold" style="color: var(--color-info);">
										{activeProjects.filter(project => project.status === 'in-progress' && project.progress >= 80).length}개
									</p>
								</div>
							</div>
						</ThemeCard>
					{/if}
				</ThemeSpacer>

			{:else if tab.id === 'projects'}
				<!-- 프로젝트 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-lg font-semibold" style="color: var(--color-text);">프로젝트 목록</h3>
							<div class="flex items-center gap-2">
								<ThemeButton variant="primary" size="sm" class="flex items-center gap-2">
									<PlusIcon size={16} />
									새 프로젝트
								</ThemeButton>
							</div>
				</div>

						<div class="space-y-4">
							{#each activeProjects as project}
								<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
									<div class="flex-1">
										<div class="flex items-center gap-3 mb-2">
											<BriefcaseIcon size={20} style="color: var(--color-primary);" />
											<h4 class="font-medium" style="color: var(--color-text);">{project.name}</h4>
											<ThemeBadge variant={getStatusColor(project.status)}>
												{getStatusLabel(project.status)}
											</ThemeBadge>
											<ThemeBadge variant={getHealthColor(calculateHealthIndicator(project))}>
												건강도: {calculateHealthIndicator(project)}%
											</ThemeBadge>
						</div>
										<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" style="color: var(--color-text-secondary);">
											<div class="flex items-center gap-2">
												<UsersIcon size={16} />
												팀: {project.team?.length || 0}명
					</div>
											<div class="flex items-center gap-2">
												<CalendarIcon size={16} />
												마감: {formatDate(project.endDate)}
			</div>
											<div class="flex items-center gap-2">
												<DollarSignIcon size={16} />
												예산: {project.budget ? `₩${project.budget.toLocaleString()}` : '미정'}
								</div>
							</div>
										<div class="mt-3">
											<ThemeProgressCard
												label="진행률"
												value={project.progress || 0}
												max={100}
												showValue={true}
												variant={project.progress >= 80 ? 'success' : project.progress >= 50 ? 'primary' : 'warning'}
											/>
						</div>
									</div>
									<div class="flex items-center gap-2">
										<ThemeButton variant="ghost" size="sm">
											<EyeIcon size={16} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm">
											<EditIcon size={16} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm">
											<SettingsIcon size={16} />
										</ThemeButton>
									</div>
								</div>
							{/each}
						</div>
					</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'research'}
				<!-- 연구개발 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="연구개발 현황" />
						<ThemeChartPlaceholder
							title="연구개발 진행률"
							icon={FlaskConicalIcon}
						/>
					</ThemeCard>

					<ThemeCard class="p-6">
						<ThemeSectionHeader title="위험 프로젝트" />
						<ThemeSpacer size={4}>
							{#each riskProjects as project}
								<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--color-surface-elevated);">
									<div class="flex-1">
										<h4 class="font-medium" style="color: var(--color-text);">{project.name}</h4>
										<p class="text-sm" style="color: var(--color-text-secondary);">
											건강도: {calculateHealthIndicator(project)}%
										</p>
										<div class="flex items-center gap-2 mt-1">
											<ThemeBadge variant="error">
												{project.status === 'on-hold' ? '보류' : '위험'}
											</ThemeBadge>
									</div>
									</div>
									<div class="text-right">
										<ThemeButton variant="warning" size="sm">
											<AlertCircleIcon size={16} />
										</ThemeButton>
									</div>
								</div>
		{/each}
						</ThemeSpacer>
					</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'milestones'}
				<!-- 마일스톤 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="마일스톤 관리" />
						<ThemeChartPlaceholder
							title="마일스톤 진행률"
							icon={TargetIcon}
						/>
					</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'reports'}
				<!-- 보고서 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="연구개발 보고서" />
						<ThemeGrid cols={1} mdCols={2} gap={4}>
							<ThemeButton variant="secondary" class="flex items-center gap-2 p-4 h-auto">
								<FileTextIcon size={20} />
								<div class="text-left">
									<div class="font-medium">월간 연구보고서</div>
									<div class="text-sm opacity-70">월별 연구 진행 상황</div>
								</div>
							</ThemeButton>
							<ThemeButton variant="secondary" class="flex items-center gap-2 p-4 h-auto">
								<BarChart3Icon size={20} />
								<div class="text-left">
									<div class="font-medium">프로젝트 분석</div>
									<div class="text-sm opacity-70">프로젝트 성과 분석</div>
								</div>
							</ThemeButton>
						</ThemeGrid>
					</ThemeCard>
				</ThemeSpacer>
		{/if}
		{/snippet}
	</ThemeTabs>
</PageLayout>