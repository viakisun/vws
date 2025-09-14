<script lang="ts">
  import { onMount } from 'svelte';
  import PageLayout from '$lib/components/layout/PageLayout.svelte';
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte';
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte';
  import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte';
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte';
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/format';
  import { 
    UsersIcon,
    DollarSignIcon,
    TrendingUpIcon,
    PlusIcon,
    EyeIcon,
    EditIcon,
    TrashIcon,
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
    SettingsIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowRightIcon,
    ActivityIcon,
    TrendingDownIcon,
    ZapIcon,
    StarIcon,
    AwardIcon,
    BookOpenIcon,
    LayersIcon,
    PieChartIcon as PieIcon,
    BarChartIcon,
    LineChartIcon,
    RefreshCwIcon,
    SaveIcon,
    XIcon,
    CheckIcon,
    InfoIcon,
    AlertTriangleIcon as WarningIcon,
    XCircleIcon
  } from 'lucide-svelte';
  import {
    employees,
    projects,
    participations,
    rdBudgets,
    documentTemplates,
    documentSubmissions,
    recommendations as aiRecommendations
  } from '$lib/stores/rd';
  import { initializeParticipationManager } from '$lib/stores/rnd/participation-manager';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  // URL 파라미터에서 정렬 옵션 가져오기
  let sortOrder = $derived($page.url.searchParams.get('sort') || 'desc');
  let sortBy = $derived($page.url.searchParams.get('sortBy') || 'participationRate');

  // 상태 관리
  let searchTerm = $state('');
  let selectedProject = $state('all');
  let selectedEmployee = $state('all');
  let selectedStatus = $state('all');
  let selectedTimeframe = $state('current');
  let showAdvancedFilters = $state(false);
  let showParticipationModal = $state(false);
  let showAnalyticsModal = $state(false);
  let showOptimizationModal = $state(false);
  let selectedParticipation = $state(null);
  let selectedEmployeeForModal = $state(null);
  let selectedProjectForModal = $state(null);

  // 고급 필터
  let minParticipationRate = $state(0);
  let maxParticipationRate = $state(100);
  let minSalary = $state(0);
  let maxSalary = $state(10000000);
  let selectedDepartment = $state('all');
  let selectedRole = $state('all');

  // 통계 데이터
  let totalEmployees = $derived($employees.length);
  let totalProjects = $derived($projects.length);
  let totalParticipations = $derived($participations.length);
  let averageParticipationRate = $derived(
    $participations.length > 0 
      ? $participations.reduce((sum: number, p: any) => sum + p.participationRate, 0) / $participations.length 
      : 0
  );

  // 필터링된 참여 데이터
  let filteredParticipations = $derived(
    $participations.filter((participation: any) => {
      const employee = $employees.find((e: any) => e.id === participation.employeeId);
      const project = $projects.find((p: any) => p.id === participation.projectId);
      
      if (!employee || !project) return false;

      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = selectedProject === 'all' || participation.projectId === selectedProject;
      const matchesEmployee = selectedEmployee === 'all' || participation.employeeId === selectedEmployee;
      const matchesStatus = selectedStatus === 'all' || participation.status === selectedStatus;
      const matchesParticipationRate = participation.participationRate >= minParticipationRate && 
        participation.participationRate <= maxParticipationRate;
      const matchesSalary = employee.salary >= minSalary && employee.salary <= maxSalary;
      const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
      const matchesRole = selectedRole === 'all' || participation.role === selectedRole;

      return matchesSearch && matchesProject && matchesEmployee && matchesStatus && 
        matchesParticipationRate && matchesSalary && matchesDepartment && matchesRole;
    })
  );

  // 정렬된 참여 데이터
  let sortedParticipations = $derived(
    [...filteredParticipations].sort((a: any, b: any) => {
      const employeeA = $employees.find((e: any) => e.id === a.employeeId);
      const employeeB = $employees.find((e: any) => e.id === b.employeeId);
      const projectA = $projects.find((p: any) => p.id === a.projectId);
      const projectB = $projects.find((p: any) => p.id === b.projectId);

      let valueA, valueB;

      switch (sortBy) {
        case 'participationRate':
          valueA = a.participationRate;
          valueB = b.participationRate;
          break;
        case 'salary':
          valueA = employeeA?.salary || 0;
          valueB = employeeB?.salary || 0;
          break;
        case 'employee':
          valueA = employeeA?.name || '';
          valueB = employeeB?.name || '';
          break;
        case 'project':
          valueA = projectA?.name || '';
          valueB = projectB?.name || '';
          break;
        case 'startDate':
          valueA = new Date(a.startDate).getTime();
          valueB = new Date(b.startDate).getTime();
          break;
        default:
          valueA = a.participationRate;
          valueB = b.participationRate;
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    })
  );

  // 참여율 분석 데이터
  let participationAnalytics = $derived({
    overloaded: filteredParticipations.filter((p: any) => p.participationRate > 100).length,
    optimal: filteredParticipations.filter((p: any) => p.participationRate >= 80 && p.participationRate <= 100).length,
    underutilized: filteredParticipations.filter((p: any) => p.participationRate < 50).length,
    totalCost: filteredParticipations.reduce((sum: number, p: any) => {
      const employee = $employees.find((e: any) => e.id === p.employeeId);
      return sum + ((employee?.salary || 0) * (p.participationRate / 100));
    }, 0)
  });

  // 프로젝트별 참여 현황
  let projectParticipation = $derived(
    $projects.map((project: any) => {
      const projectParticipations = filteredParticipations.filter((p: any) => p.projectId === project.id);
      const totalParticipation = projectParticipations.reduce((sum: number, p: any) => sum + p.participationRate, 0);
      const totalCost = projectParticipations.reduce((sum: number, p: any) => {
        const employee = $employees.find((e: any) => e.id === p.employeeId);
        return sum + ((employee?.salary || 0) * (p.participationRate / 100));
      }, 0);

      return {
        ...project,
        participantCount: projectParticipations.length,
        totalParticipation,
        totalCost,
        averageParticipation: projectParticipations.length > 0 ? totalParticipation / projectParticipations.length : 0
      };
    })
  );

  // 직원별 참여 현황
  let employeeParticipation = $derived(
    $employees.map((employee: any) => {
      const employeeParticipations = filteredParticipations.filter((p: any) => p.employeeId === employee.id);
      const totalParticipation = employeeParticipations.reduce((sum: number, p: any) => sum + p.participationRate, 0);
      const totalCost = employeeParticipations.reduce((sum: number, p: any) => {
        return sum + (employee.salary * (p.participationRate / 100));
      }, 0);

      return {
        ...employee,
        projectCount: employeeParticipations.length,
        totalParticipation,
        totalCost,
        averageParticipation: employeeParticipations.length > 0 ? totalParticipation / employeeParticipations.length : 0,
        isOverloaded: totalParticipation > 100
      };
    })
  );

  // AI 추천사항
  let filteredRecommendations = $derived(
    $aiRecommendations.filter((rec: any) => rec.type === 'participation_optimization')
  );

  // 함수들
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'success',
      'inactive': 'secondary',
      'pending': 'warning',
      'completed': 'info'
    };
    return colors[status] || 'secondary';
  };

  const getParticipationRateColor = (rate: number) => {
    if (rate > 100) return 'danger';
    if (rate >= 80) return 'success';
    if (rate >= 50) return 'warning';
    return 'secondary';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = $employees.find((e: any) => e.id === employeeId);
    return employee?.name || 'Unknown';
  };

  const getProjectName = (projectId: string) => {
    const project = $projects.find((p: any) => p.id === projectId);
    return project?.name || 'Unknown';
  };

  const updateSort = (newSortBy: string) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    goto(`/project-management/participation?sort=${newSortOrder}&sortBy=${newSortBy}`);
  };

  const exportData = () => {
    const data = sortedParticipations.map((p: any) => ({
      employee: getEmployeeName(p.employeeId),
      project: getProjectName(p.projectId),
      participationRate: p.participationRate,
      role: p.role,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status
    }));

    const csv = [
      ['직원', '프로젝트', '참여율(%)', '역할', '시작일', '종료일', '상태'],
      ...data.map(row => Object.values(row))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participation-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openParticipationModal = (participation: any = null) => {
    selectedParticipation = participation;
    selectedEmployeeForModal = participation ? participation.employeeId : null;
    selectedProjectForModal = participation ? participation.projectId : null;
    showParticipationModal = true;
  };

  const closeParticipationModal = () => {
    showParticipationModal = false;
    selectedParticipation = null;
    selectedEmployeeForModal = null;
    selectedProjectForModal = null;
  };

  const saveParticipation = () => {
    // 참여 데이터 저장 로직
    closeParticipationModal();
  };

  onMount(() => {
    initializeParticipationManager();
  });

</script>

<PageLayout title="참여율 관리" subtitle="연구개발 프로젝트 참여율 분석 및 최적화">
	<div class="space-y-6">
		<!-- 통계 카드 -->
		<ThemeGrid cols={4}>
			<ThemeStatCard
				title="총 직원 수"
				value={totalEmployees.toString()}
				icon={UsersIcon}
			/>
			<ThemeStatCard
				title="활성 프로젝트"
				value={totalProjects.toString()}
				icon={TargetIcon}
			/>
			<ThemeStatCard
				title="평균 참여율"
				value={`${averageParticipationRate.toFixed(1)}%`}
				icon={PercentIcon}
			/>
			<ThemeStatCard
				title="총 인건비"
				value={formatCurrency(participationAnalytics.totalCost)}
				icon={DollarSignIcon}
			/>
		</ThemeGrid>

		<!-- 필터 및 검색 -->
		<ThemeCard>
			<div class="p-6">
				<div class="flex flex-col lg:flex-row gap-4 mb-4">
					<div class="flex-1">
						<input
							type="text"
							placeholder="직원명 또는 프로젝트명으로 검색..."
							bind:value={searchTerm}
							class="w-full px-3 py-2 border rounded-md text-sm"
							style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
						/>
					</div>
					<div class="flex gap-2">
						<select
							bind:value={selectedProject}
							class="px-3 py-2 border rounded-md text-sm"
							style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
						>
							<option value="all">전체 프로젝트</option>
							{#each $projects as project}
								<option value={project.id}>{project.name}</option>
							{/each}
						</select>
						<select
							bind:value={selectedEmployee}
							class="px-3 py-2 border rounded-md text-sm"
							style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
						>
							<option value="all">전체 직원</option>
							{#each $employees as employee}
								<option value={employee.id}>{employee.name}</option>
							{/each}
						</select>
						<select
							bind:value={selectedStatus}
							class="px-3 py-2 border rounded-md text-sm"
							style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
						>
							<option value="all">전체 상태</option>
							<option value="active">활성</option>
							<option value="inactive">비활성</option>
							<option value="pending">대기</option>
							<option value="completed">완료</option>
						</select>
					</div>
				</div>

				<div class="flex justify-between items-center">
					<div class="flex gap-2">
						<ThemeButton
							variant="secondary"
							size="sm"
							onclick={() => showAdvancedFilters = !showAdvancedFilters}
						>
							<FilterIcon size={16} class="mr-2" />
							고급 필터
						</ThemeButton>
						<ThemeButton
							variant="secondary"
							size="sm"
							onclick={exportData}
						>
							<DownloadIcon size={16} class="mr-2" />
							데이터 내보내기
						</ThemeButton>
					</div>
					<ThemeButton
						variant="primary"
						onclick={() => openParticipationModal()}
					>
						<PlusIcon size={16} class="mr-2" />
						참여 추가
					</ThemeButton>
				</div>

				<!-- 고급 필터 -->
				{#if showAdvancedFilters}
					<div class="mt-4 p-4 border rounded-lg" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<div class="block text-sm font-medium mb-2" style="color: var(--color-text);">참여율 범위</div>
								<div class="flex gap-2">
									<input
										type="number"
										placeholder="최소"
										bind:value={minParticipationRate}
										min="0"
										max="100"
										class="px-3 py-2 border rounded-md text-sm"
										style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
									/>
									<input
										type="number"
										placeholder="최대"
										bind:value={maxParticipationRate}
										min="0"
										max="100"
										class="px-3 py-2 border rounded-md text-sm"
										style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
									/>
								</div>
							</div>
							<div>
								<div class="block text-sm font-medium mb-2" style="color: var(--color-text);">급여 범위</div>
								<div class="flex gap-2">
									<input
										type="number"
										placeholder="최소 급여"
										bind:value={minSalary}
										min="0"
										class="px-3 py-2 border rounded-md text-sm"
										style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
									/>
									<input
										type="number"
										placeholder="최대 급여"
										bind:value={maxSalary}
										min="0"
										class="px-3 py-2 border rounded-md text-sm"
										style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
									/>
								</div>
							</div>
							<div>
								<div class="block text-sm font-medium mb-2" style="color: var(--color-text);">부서</div>
								<select
									bind:value={selectedDepartment}
									class="w-full px-3 py-2 border rounded-md text-sm"
									style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
								>
									<option value="all">전체 부서</option>
									<option value="부서없음">부서없음</option>
									<option value="research">연구개발</option>
									<option value="engineering">엔지니어링</option>
									<option value="design">디자인</option>
									<option value="management">경영지원</option>
								</select>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</ThemeCard>

		<!-- 분석 대시보드 -->
		<ThemeGrid cols={2}>
			<ThemeCard>
				<div class="p-6">
					<ThemeSectionHeader title="참여율 분석" />
					<div class="mt-4 space-y-3">
						<div class="flex justify-between items-center">
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded-full bg-red-500"></div>
								<span class="text-sm" style="color: var(--color-text);">과부하 (100% 초과)</span>
							</div>
							<span class="font-medium" style="color: var(--color-text);">{participationAnalytics.overloaded}</span>
						</div>
						<div class="flex justify-between items-center">
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded-full bg-green-500"></div>
								<span class="text-sm" style="color: var(--color-text);">최적 (80-100%)</span>
							</div>
							<span class="font-medium" style="color: var(--color-text);">{participationAnalytics.optimal}</span>
						</div>
						<div class="flex justify-between items-center">
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded-full bg-yellow-500"></div>
								<span class="text-sm" style="color: var(--color-text);">미활용 (50% 미만)</span>
							</div>
							<span class="font-medium" style="color: var(--color-text);">{participationAnalytics.underutilized}</span>
						</div>
					</div>
				</div>
			</ThemeCard>

			<ThemeCard>
				<div class="p-6">
					<ThemeSectionHeader title="AI 추천사항" />
					<div class="mt-4 space-y-3">
						{#each filteredRecommendations.slice(0, 3) as recommendation}
							<div class="p-3 rounded-lg border" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
								<div class="flex items-start gap-2">
									<ZapIcon size={16} class="mt-0.5" style="color: var(--color-primary);" />
									<div class="flex-1">
										<p class="text-sm font-medium" style="color: var(--color-text);">{(recommendation as any).title}</p>
										<p class="text-xs mt-1" style="color: var(--color-text-secondary);">{(recommendation as any).description}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</ThemeCard>
		</ThemeGrid>

		<!-- 참여 데이터 테이블 -->
		<ThemeCard>
			<div class="p-6">
				<div class="flex justify-between items-center mb-4">
					<ThemeSectionHeader title="참여 현황" />
					<div class="flex gap-2">
						<ThemeButton
							variant="secondary"
							size="sm"
							onclick={() => showAnalyticsModal = true}
						>
							<BarChart3Icon size={16} class="mr-2" />
							상세 분석
						</ThemeButton>
						<ThemeButton
							variant="secondary"
							size="sm"
							onclick={() => showOptimizationModal = true}
						>
							<SettingsIcon size={16} class="mr-2" />
							최적화
						</ThemeButton>
					</div>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b" style="border-color: var(--color-border);">
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">
									<button
										onclick={() => updateSort('employee')}
										class="flex items-center gap-1 hover:opacity-70"
									>
										직원
										{#if sortBy === 'employee'}
											{#if sortOrder === 'asc'}
												<ArrowUpIcon size={14} />
											{:else}
												<ArrowDownIcon size={14} />
											{/if}
										{/if}
									</button>
								</th>
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">
									<button
										onclick={() => updateSort('project')}
										class="flex items-center gap-1 hover:opacity-70"
									>
										프로젝트
										{#if sortBy === 'project'}
											{#if sortOrder === 'asc'}
												<ArrowUpIcon size={14} />
											{:else}
												<ArrowDownIcon size={14} />
											{/if}
										{/if}
									</button>
								</th>
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">
									<button
										onclick={() => updateSort('participationRate')}
										class="flex items-center gap-1 hover:opacity-70"
									>
										참여율
										{#if sortBy === 'participationRate'}
											{#if sortOrder === 'asc'}
												<ArrowUpIcon size={14} />
											{:else}
												<ArrowDownIcon size={14} />
											{/if}
										{/if}
									</button>
								</th>
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">역할</th>
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">상태</th>
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">시작일</th>
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">종료일</th>
								<th class="text-left py-3 px-4 font-medium" style="color: var(--color-text);">액션</th>
							</tr>
						</thead>
						<tbody>
							{#each sortedParticipations as participation}
								<tr class="border-b hover:bg-opacity-50" style="border-color: var(--color-border);">
									<td class="py-3 px-4">
										<div class="flex items-center gap-2">
											<UserIcon size={16} style="color: var(--color-primary);" />
											<span style="color: var(--color-text);">{getEmployeeName(participation.employeeId)}</span>
										</div>
									</td>
									<td class="py-3 px-4">
										<div class="flex items-center gap-2">
											<TargetIcon size={16} style="color: var(--color-primary);" />
											<span style="color: var(--color-text);">{getProjectName(participation.projectId)}</span>
										</div>
									</td>
									<td class="py-3 px-4">
										<ThemeBadge variant={getParticipationRateColor(participation.participationRate) as any}>
											{participation.participationRate}%
										</ThemeBadge>
									</td>
									<td class="py-3 px-4" style="color: var(--color-text);">{participation.role}</td>
									<td class="py-3 px-4">
										<ThemeBadge variant={getStatusColor(participation.status) as any}>
											{participation.status}
										</ThemeBadge>
									</td>
									<td class="py-3 px-4" style="color: var(--color-text);">{formatDate(participation.startDate)}</td>
									<td class="py-3 px-4" style="color: var(--color-text);">{formatDate(participation.endDate)}</td>
									<td class="py-3 px-4">
										<div class="flex gap-1">
											<button
												onclick={() => openParticipationModal(participation)}
												class="p-1 rounded hover:bg-opacity-20"
												style="color: var(--color-primary);"
											>
												<EditIcon size={14} />
											</button>
											<button
												onclick={() => {/* 삭제 로직 */}}
												class="p-1 rounded hover:bg-opacity-20"
												style="color: var(--color-danger);"
											>
												<TrashIcon size={14} />
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</ThemeCard>

		<!-- 프로젝트별 참여 현황 -->
		<ThemeCard>
			<div class="p-6">
				<ThemeSectionHeader title="프로젝트별 참여 현황" />
				<div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each projectParticipation as project}
						<div class="p-4 border rounded-lg" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
							<div class="flex items-center gap-2 mb-2">
								<TargetIcon size={16} style="color: var(--color-primary);" />
								<h4 class="font-medium" style="color: var(--color-text);">{project.name}</h4>
							</div>
							<div class="space-y-1 text-sm">
								<div class="flex justify-between">
									<span style="color: var(--color-text-secondary);">참여자 수:</span>
									<span style="color: var(--color-text);">{project.participantCount}명</span>
								</div>
								<div class="flex justify-between">
									<span style="color: var(--color-text-secondary);">총 참여율:</span>
									<span style="color: var(--color-text);">{project.totalParticipation.toFixed(1)}%</span>
								</div>
								<div class="flex justify-between">
									<span style="color: var(--color-text-secondary);">평균 참여율:</span>
									<span style="color: var(--color-text);">{project.averageParticipation.toFixed(1)}%</span>
								</div>
								<div class="flex justify-between">
									<span style="color: var(--color-text-secondary);">총 비용:</span>
									<span style="color: var(--color-text);">{formatCurrency(project.totalCost)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</ThemeCard>

		<!-- 직원별 참여 현황 -->
		<ThemeCard>
			<div class="p-6">
				<ThemeSectionHeader title="직원별 참여 현황" />
				<div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each employeeParticipation as employee}
						<div class="p-4 border rounded-lg" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
							<div class="flex items-center gap-2 mb-2">
								<UserIcon size={16} style="color: var(--color-primary);" />
								<h4 class="font-medium" style="color: var(--color-text);">{employee.name}</h4>
								{#if employee.isOverloaded}
									<AlertTriangleIcon size={14} style="color: var(--color-danger);" />
								{/if}
							</div>
							<div class="space-y-1 text-sm">
								<div class="flex justify-between">
									<span style="color: var(--color-text-secondary);">프로젝트 수:</span>
									<span style="color: var(--color-text);">{employee.projectCount}개</span>
								</div>
								<div class="flex justify-between">
									<span style="color: var(--color-text-secondary);">총 참여율:</span>
									<span style="color: var(--color-text);">{employee.totalParticipation.toFixed(1)}%</span>
								</div>
								<div class="flex justify-between">
									<span style="color: var(--color-text-secondary);">평균 참여율:</span>
									<span style="color: var(--color-text);">{employee.averageParticipation.toFixed(1)}%</span>
								</div>
								<div class="flex justify-between">
									<span style="color: var(--color-text-secondary);">총 비용:</span>
									<span style="color: var(--color-text);">{formatCurrency(employee.totalCost)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</ThemeCard>
	</div>

	<!-- 참여 추가/편집 모달 -->
	{#if showParticipationModal}
		<ThemeModal>
			<div class="p-6">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-semibold" style="color: var(--color-text);">
						{selectedParticipation ? '참여 편집' : '참여 추가'}
					</h3>
					<button
						onclick={closeParticipationModal}
						class="p-1 rounded hover:bg-opacity-20"
						style="color: var(--color-text-secondary);"
					>
						<XCircleIcon size={20} />
					</button>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); saveParticipation(); }} class="space-y-4">
					<div>
						<div class="block text-sm font-medium mb-2" style="color: var(--color-text);">직원</div>
						<select
							bind:value={selectedEmployeeForModal}
							class="w-full px-3 py-2 border rounded-md"
							style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
							required
						>
							<option value="">직원을 선택하세요</option>
							{#each $employees as employee}
								<option value={employee.id}>{employee.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<div class="block text-sm font-medium mb-2" style="color: var(--color-text);">프로젝트</div>
						<select
							bind:value={selectedProjectForModal}
							class="w-full px-3 py-2 border rounded-md"
							style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
							required
						>
							<option value="">프로젝트를 선택하세요</option>
							{#each $projects as project}
								<option value={project.id}>{project.name}</option>
							{/each}
						</select>
					</div>

					<div class="flex gap-4">
						<ThemeButton variant="primary" class="flex-1" onclick={saveParticipation}>
							저장
						</ThemeButton>
						<ThemeButton variant="secondary" onclick={closeParticipationModal} class="flex-1">
							취소
						</ThemeButton>
					</div>
				</form>
			</div>
		</ThemeModal>
	{/if}

	<!-- 상세 분석 모달 -->
	{#if showAnalyticsModal}
		<ThemeModal>
			<div class="p-6">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-semibold" style="color: var(--color-text);">상세 분석</h3>
					<button
						onclick={() => showAnalyticsModal = false}
						class="p-1 rounded hover:bg-opacity-20"
						style="color: var(--color-text-secondary);"
					>
						<XCircleIcon size={20} />
					</button>
				</div>

				<div class="space-y-6">
					<div class="p-4 border rounded-lg" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<h4 class="font-medium mb-2" style="color: var(--color-text);">참여율 분포</h4>
						<div class="h-32 bg-gray-100 rounded flex items-center justify-center">
							<span class="text-gray-500">차트 영역</span>
						</div>
					</div>
					<div class="p-4 border rounded-lg" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<h4 class="font-medium mb-2" style="color: var(--color-text);">프로젝트별 비용 분석</h4>
						<div class="h-32 bg-gray-100 rounded flex items-center justify-center">
							<span class="text-gray-500">차트 영역</span>
						</div>
					</div>
					<div class="p-4 border rounded-lg" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<h4 class="font-medium mb-2" style="color: var(--color-text);">시간별 참여 추이</h4>
						<div class="h-32 bg-gray-100 rounded flex items-center justify-center">
							<span class="text-gray-500">차트 영역</span>
						</div>
					</div>
				</div>
			</div>
		</ThemeModal>
	{/if}

	<!-- 최적화 모달 -->
	{#if showOptimizationModal}
		<ThemeModal>
			<div class="p-6">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-semibold" style="color: var(--color-text);">참여율 최적화</h3>
					<button
						onclick={() => showOptimizationModal = false}
						class="p-1 rounded hover:bg-opacity-20"
						style="color: var(--color-text-secondary);"
					>
						<XCircleIcon size={20} />
					</button>
				</div>

				<div class="space-y-4">
					<div class="p-4 border rounded-lg" style="border-color: var(--color-border); background: var(--color-surface-elevated);">
						<h4 class="font-medium mb-2" style="color: var(--color-text);">AI 추천사항</h4>
						<div class="space-y-2">
							{#each filteredRecommendations as recommendation}
								<div class="flex items-start gap-2">
									<ZapIcon size={16} class="mt-0.5" style="color: var(--color-primary);" />
									<div>
										<p class="text-sm font-medium" style="color: var(--color-text);">{(recommendation as any).title}</p>
										<p class="text-xs" style="color: var(--color-text-secondary);">{(recommendation as any).description}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="flex gap-4">
						<ThemeButton variant="primary" class="flex-1">
							최적화 적용
						</ThemeButton>
						<ThemeButton variant="secondary" onclick={() => showOptimizationModal = false} class="flex-1">
							닫기
						</ThemeButton>
					</div>
				</div>
			</div>
		</ThemeModal>
	{/if}
</PageLayout>

