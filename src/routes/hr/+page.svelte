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
	import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { 
		UsersIcon, 
		BuildingIcon, 
		UserPlusIcon, 
		ClipboardListIcon,
		TrendingUpIcon,
		CalendarIcon,
		FileTextIcon,
		PlusIcon,
		EyeIcon,
		EditIcon,
		TrashIcon,
		UserCheckIcon,
		GraduationCapIcon,
		TargetIcon,
		BarChart3Icon
	} from 'lucide-svelte';
	
	// HR 스토어들
	import { 
		employees, 
		employmentContracts, 
		jobDescriptions,
		getActiveEmployees,
		getEmployeesByDepartment
	} from '$lib/stores/hr';
	
	import { 
		onboardingProcesses, 
		offboardingProcesses,
		getOnboardingProgress,
		getOffboardingProgress
	} from '$lib/stores/onboarding';
	
	import { 
		attendanceRecords, 
		leaveRequests, 
		leaveBalances,
		calculateMonthlyAttendance
	} from '$lib/stores/attendance';
	
	import { 
		jobPostings, 
		candidates, 
		interviewSchedules,
		getRecruitmentStats
	} from '$lib/stores/recruitment';
	
	import { 
		performanceReviews, 
		feedback360,
		getPerformanceReviewsByEmployee,
		calculateAverageFeedback360
	} from '$lib/stores/performance';
	
	import { 
		payrolls, 
		bonuses, 
		welfareApplications,
		calculateAnnualCompensation
	} from '$lib/stores/benefits';
	
	import { 
		hrPolicies, 
		faqs, 
		guidelines,
		getPopularFAQs
	} from '$lib/stores/policies';

	// 반응형 데이터
	let totalEmployees = $derived(getActiveEmployees($employees).length);
	let totalDepartments = $derived([...new Set($employees.map(emp => emp.department))].length);
	let activeRecruitments = $derived($jobPostings.filter(job => job.status === 'published').length);
	let pendingOnboardings = $derived($onboardingProcesses.filter(process => process.status === 'in-progress').length);

	// 탭 정의
	const tabs = [
		{
			id: 'overview',
			label: '개요',
			icon: BarChart3Icon
		},
		{
			id: 'employees',
			label: '직원관리',
			icon: UsersIcon
		},
		{
			id: 'recruitment',
			label: '채용관리',
			icon: UserPlusIcon
		},
		{
			id: 'onboarding',
			label: '온보딩',
			icon: GraduationCapIcon
		},
		{
			id: 'performance',
			label: '성과관리',
			icon: TargetIcon
		}
	];

	let activeTab = $state('overview');

	// 통계 데이터
	let stats = $derived([
		{
			title: '총 직원 수',
			value: totalEmployees,
			change: '+5%',
			changeType: 'positive' as const,
			icon: UsersIcon
		},
		{
			title: '부서 수',
			value: totalDepartments,
			change: '0%',
			changeType: 'neutral' as const,
			icon: BuildingIcon
		},
		{
			title: '진행중인 채용',
			value: activeRecruitments,
			change: '+2',
			changeType: 'positive' as const,
			icon: UserPlusIcon
		},
		{
			title: '온보딩 진행중',
			value: pendingOnboardings,
			change: '-1',
			changeType: 'negative' as const,
			icon: ClipboardListIcon
		}
	]);

	// 액션 버튼들
	const actions = [
		{
			label: '직원 추가',
			icon: PlusIcon,
			onclick: () => console.log('Add employee'),
			variant: 'primary' as const
		},
		{
			label: '채용 공고',
			icon: FileTextIcon,
			onclick: () => console.log('Create job posting'),
			variant: 'success' as const
		}
	];

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

		// 최근 입사자
		$employees
			.filter(emp => emp.status === 'active')
			.sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
			.slice(0, 3)
			.forEach(emp => {
				activities.push({
					type: 'hire',
					title: '신규 입사',
					description: `${emp.name}님이 ${emp.department}에 입사했습니다.`,
					time: emp.hireDate,
					icon: UserPlusIcon,
					color: 'text-green-600'
				});
			});

		// 최근 휴가 신청
		$leaveRequests
			.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
			.slice(0, 3)
			.forEach(request => {
				const employee = $employees.find(emp => emp.id === request.employeeId);
				if (employee) {
					activities.push({
						type: 'leave',
						title: '휴가 신청',
						description: `${employee.name}님이 ${request.days}일 휴가를 신청했습니다.`,
						time: request.requestedAt,
						icon: CalendarIcon,
						color: 'text-blue-600'
					});
				}
			});

		return activities.slice(0, 5);
	});

	// 부서별 직원 데이터
	let departmentData = $derived(() => {
		const deptCounts = $employees.reduce((acc, emp) => {
			acc[emp.department] = (acc[emp.department] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		
		return Object.entries(deptCounts).map(([department, count]) => ({
			department,
			count,
			percentage: Math.round((count / totalEmployees) * 100)
		}));
	});

	// 최근 채용 공고
	let recentJobPostings = $derived(() => {
		return $jobPostings
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 5);
	});

	// 성과 평가 데이터
	let performanceData = $derived(() => {
		return $performanceReviews
			.filter(review => review.status === 'completed')
			.slice(0, 5);
	});

	onMount(() => {
		// 초기 데이터 로드
		console.log('HR 페이지 로드됨');
	});
</script>

<PageLayout
	title="인사관리"
	subtitle="직원 정보, 채용, 성과 관리"
	{stats}
	{actions}
	searchPlaceholder="직원명, 부서, 직급으로 검색..."
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
		<!-- 부서별 직원 현황 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="부서별 직원 현황" />
			<ThemeSpacer size={4}>
				{#each departmentData() as dept}
					<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--color-surface-elevated);">
						<div class="flex items-center gap-3">
							<BuildingIcon size={20} style="color: var(--color-primary);" />
							<div>
								<h4 class="font-medium" style="color: var(--color-text);">{dept.department}</h4>
								<p class="text-sm" style="color: var(--color-text-secondary);">{dept.count}명</p>
							</div>
						</div>
						<ThemeBadge variant="info">{dept.percentage}%</ThemeBadge>
					</div>
				{/each}
			</ThemeSpacer>
		</ThemeCard>

		<!-- 최근 활동 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="최근 활동" />
			<ThemeSpacer size={4}>
				{#each recentActivities() as activity}
					<ThemeActivityItem
						title={activity.title}
						time={activity.time}
						icon={activity.icon}
					/>
				{/each}
			</ThemeSpacer>
		</ThemeCard>
	</ThemeGrid>

	<!-- 차트 섹션 -->
	<ThemeGrid cols={1} lgCols={2} gap={6}>
		<!-- 부서별 분포 차트 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="부서별 직원 분포" />
			<ThemeChartPlaceholder
				title="부서별 직원 수"
				icon={TrendingUpIcon}
			/>
		</ThemeCard>

		<!-- 채용 현황 차트 -->
		<ThemeCard class="p-6">
			<ThemeSectionHeader title="채용 현황" />
			<ThemeChartPlaceholder
				title="월별 채용 현황"
				icon={UserPlusIcon}
			/>
		</ThemeCard>
	</ThemeGrid>

	<!-- 최근 채용 공고 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold" style="color: var(--color-text);">최근 채용 공고</h3>
			<ThemeButton variant="primary" size="sm" class="flex items-center gap-2">
				<PlusIcon size={16} />
				새 공고
			</ThemeButton>
		</div>
		
		<div class="space-y-4">
			{#each recentJobPostings() as job}
				<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
					<div class="flex-1">
						<h4 class="font-medium" style="color: var(--color-text);">{job.title}</h4>
						<p class="text-sm" style="color: var(--color-text-secondary);">{job.department} • {job.employmentType}</p>
						<div class="flex items-center gap-2 mt-2">
							<ThemeBadge variant={job.status === 'published' ? 'success' : 'warning'}>
								{job.status === 'published' ? '모집중' : '마감'}
							</ThemeBadge>
							<span class="text-xs" style="color: var(--color-text-secondary);">
								{formatDate(job.createdAt)}
							</span>
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
							<TrashIcon size={16} />
						</ThemeButton>
					</div>
				</div>
			{/each}
		</div>
	</ThemeCard>

	<!-- 성과 평가 현황 -->
	<ThemeCard class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold" style="color: var(--color-text);">성과 평가 현황</h3>
			<ThemeButton variant="primary" size="sm" class="flex items-center gap-2">
				<PlusIcon size={16} />
				새 평가
			</ThemeButton>
		</div>
		
		<div class="space-y-4">
			{#each performanceData() as review}
				<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
					<div class="flex-1">
						<h4 class="font-medium" style="color: var(--color-text);">{(review as any).employeeName}</h4>
						<p class="text-sm" style="color: var(--color-text-secondary);">{(review as any).department} • {(review as any).position}</p>
						<div class="flex items-center gap-2 mt-2">
							<ThemeBadge variant={review.overallRating >= 4 ? 'success' : review.overallRating >= 3 ? 'warning' : 'error'}>
								{review.overallRating}/5
							</ThemeBadge>
							<span class="text-xs" style="color: var(--color-text-secondary);">
								{formatDate((review as any).reviewDate)}
							</span>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<ThemeButton variant="ghost" size="sm">
							<EyeIcon size={16} />
						</ThemeButton>
						<ThemeButton variant="ghost" size="sm">
							<EditIcon size={16} />
						</ThemeButton>
					</div>
				</div>
			{/each}
		</div>
	</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'employees'}
				<!-- 직원관리 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-lg font-semibold" style="color: var(--color-text);">직원 목록</h3>
							<ThemeButton variant="primary" size="sm" class="flex items-center gap-2">
								<PlusIcon size={16} />
								직원 추가
							</ThemeButton>
						</div>
						
						<div class="space-y-4">
							{#each $employees.slice(0, 5) as employee}
								<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
									<div class="flex items-center gap-3">
										<UsersIcon size={20} style="color: var(--color-primary);" />
										<div>
											<h4 class="font-medium" style="color: var(--color-text);">{employee.name}</h4>
											<p class="text-sm" style="color: var(--color-text-secondary);">{employee.department} • {employee.position}</p>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<ThemeBadge variant={employee.status === 'active' ? 'success' : 'warning'}>
											{employee.status === 'active' ? '활성' : '비활성'}
										</ThemeBadge>
										<ThemeButton variant="ghost" size="sm">
											<EditIcon size={16} />
										</ThemeButton>
									</div>
								</div>
							{/each}
						</div>
					</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'recruitment'}
				<!-- 채용관리 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<div class="flex items-center justify-between mb-6">
							<h3 class="text-lg font-semibold" style="color: var(--color-text);">채용 공고</h3>
							<ThemeButton variant="primary" size="sm" class="flex items-center gap-2">
								<PlusIcon size={16} />
								공고 등록
							</ThemeButton>
						</div>
						
						<div class="space-y-4">
							{#each recentJobPostings() as job}
								<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
									<div class="flex-1">
										<h4 class="font-medium" style="color: var(--color-text);">{job.title}</h4>
										<p class="text-sm" style="color: var(--color-text-secondary);">{job.department} • {job.employmentType}</p>
										<div class="flex items-center gap-2 mt-2">
											<ThemeBadge variant={job.status === 'published' ? 'success' : 'warning'}>
												{job.status === 'published' ? '모집중' : '마감'}
											</ThemeBadge>
											<span class="text-xs" style="color: var(--color-text-secondary);">
												{formatDate(job.createdAt)}
											</span>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<ThemeButton variant="ghost" size="sm">
											<EyeIcon size={16} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm">
											<EditIcon size={16} />
										</ThemeButton>
									</div>
								</div>
							{/each}
						</div>
					</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'onboarding'}
				<!-- 온보딩 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="온보딩 진행 현황" />
						<ThemeChartPlaceholder
							title="온보딩 진행률"
							icon={GraduationCapIcon}
						/>
					</ThemeCard>
				</ThemeSpacer>

			{:else if tab.id === 'performance'}
				<!-- 성과관리 탭 -->
				<ThemeSpacer size={6}>
					<ThemeCard class="p-6">
						<ThemeSectionHeader title="성과 평가 현황" />
						<div class="space-y-4">
							{#each performanceData() as review}
								<div class="flex items-center justify-between p-4 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
									<div class="flex-1">
										<h4 class="font-medium" style="color: var(--color-text);">{(review as any).employeeName}</h4>
										<p class="text-sm" style="color: var(--color-text-secondary);">{(review as any).department} • {(review as any).position}</p>
										<div class="flex items-center gap-2 mt-2">
											<ThemeBadge variant={review.overallRating >= 4 ? 'success' : review.overallRating >= 3 ? 'warning' : 'error'}>
												{review.overallRating}/5
											</ThemeBadge>
											<span class="text-xs" style="color: var(--color-text-secondary);">
												{formatDate((review as any).reviewDate)}
											</span>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<ThemeButton variant="ghost" size="sm">
											<EyeIcon size={16} />
										</ThemeButton>
										<ThemeButton variant="ghost" size="sm">
											<EditIcon size={16} />
										</ThemeButton>
									</div>
								</div>
							{/each}
						</div>
					</ThemeCard>
				</ThemeSpacer>
			{/if}
		{/snippet}
	</ThemeTabs>
</PageLayout>