<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte';
	import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte';
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte';
	import ProjectDetailView from '$lib/components/project-management/ProjectDetailView.svelte';
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
		DownloadIcon,
		FileSpreadsheetIcon,
		AlertCircleIcon,
		ActivityIcon
	} from '@lucide/svelte';

	// 탭 정의
	const tabs = [
		{
			id: 'overview',
			label: '개요',
			icon: BarChart3Icon
		},
		{
			id: 'projects',
			label: '프로젝트',
			icon: FlaskConicalIcon
		},
		{
			id: 'participation',
			label: '참여율 관리',
			icon: PercentIcon
		}
	];

	// URL 파라미터에서 활성 탭 관리
	let activeTab = $state($page.url.searchParams.get('tab') || 'overview');
	
	// 상태 변수들
	let mounted = $state(false);
	let projects = $state([]);
	let projectSummary = $state(null);
	let employeeParticipationSummary = $state([]);
	let budgetSummaryByYear = $state([]);
	let alerts = $state([]);
	let loading = $state(false);
	let error = $state(null);
	
	// 프로젝트 관련 상태
	let selectedProject = $state(null);
	let selectedProjectId = $state('');
	let showCreateProjectModal = $state(false);
	let projectForm = $state({
		title: '',
		code: '',
		description: '',
		startDate: '',
		endDate: '',
		status: 'planning',
		sponsorType: 'internal',
		priority: 'medium',
		researchType: 'basic'
	});
	
	// 탭 변경 핸들러
	function handleTabChange(tabId: string) {
		activeTab = tabId;
		const url = new URL($page.url);
		url.searchParams.set('tab', tabId);
		goto(url.toString(), { replaceState: true });
	}
	
	// API 호출 함수들
	async function loadProjectData() {
		try {
			const response = await fetch('/api/project-management/projects');
			if (response.ok) {
				const data = await response.json();
				projects = data.data || [];
			}
		} catch (err) {
			console.error('프로젝트 데이터 로드 실패:', err);
		}
	}
	
	async function loadProjectSummary() {
		try {
			const response = await fetch('/api/project-management/summary');
			if (response.ok) {
				const data = await response.json();
				projectSummary = data.data;
			}
		} catch (err) {
			console.error('프로젝트 요약 로드 실패:', err);
		}
	}
	
	async function loadEmployeeParticipationSummary() {
		try {
			const response = await fetch('/api/project-management/participation-rates/summary');
			if (response.ok) {
				const data = await response.json();
				employeeParticipationSummary = data.data || [];
			}
		} catch (err) {
			console.error('직원 참여율 요약 로드 실패:', err);
		}
	}
	
	async function loadBudgetSummaryByYear() {
		try {
			const response = await fetch('/api/project-management/budgets/summary-by-year');
			if (response.ok) {
				const data = await response.json();
				budgetSummaryByYear = data.data || [];
			}
		} catch (err) {
			console.error('연도별 예산 요약 로드 실패:', err);
		}
	}
	
	async function loadAlerts() {
		try {
			const response = await fetch('/api/project-management/alerts');
			if (response.ok) {
				const data = await response.json();
				alerts = data.data || [];
			}
		} catch (err) {
			console.error('알림 로드 실패:', err);
		}
	}

	// 프로젝트 생성
	async function createProject() {
		if (!projectForm.title || !projectForm.startDate || !projectForm.endDate) {
			alert('제목, 시작일, 종료일은 필수 입력 항목입니다.');
			return;
		}

		try {
			const response = await fetch('/api/project-management/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(projectForm)
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					showCreateProjectModal = false;
					projectForm = {
						title: '',
						code: '',
						description: '',
						startDate: '',
						endDate: '',
						status: 'planning',
						sponsorType: 'internal',
						priority: 'medium',
						researchType: 'basic'
					};
					await loadProjectData();
					await loadProjectSummary();
				} else {
					alert('프로젝트 생성 실패: ' + data.message);
				}
			} else {
				alert('프로젝트 생성 실패');
			}
		} catch (err) {
			console.error('프로젝트 생성 오류:', err);
			alert('프로젝트 생성 중 오류가 발생했습니다.');
		}
	}

	// 프로젝트 선택
	function selectProject(project: any) {
		selectedProject = project;
		selectedProjectId = project.id;
	}

	// 프로젝트 삭제 이벤트 처리
	function handleProjectDeleted(event: any) {
		const { projectId } = event.detail;
		
		// 삭제된 프로젝트가 현재 선택된 프로젝트라면 선택 해제
		if (selectedProject && selectedProject.id === projectId) {
			selectedProject = null;
			selectedProjectId = '';
		}
		
		// 프로젝트 목록에서 삭제된 프로젝트 제거
		projects = projects.filter((p: any) => p.id !== projectId);
		
		// 프로젝트 데이터 새로고침
		loadProjectData();
	}

	// 상태 배지 색상
	function getStatusBadgeColor(status: string) {
		switch (status) {
			case 'active': return 'green';
			case 'planning': return 'blue';
			case 'completed': return 'gray';
			case 'cancelled': return 'red';
			case 'suspended': return 'yellow';
			default: return 'gray';
		}
	}

	// 상태 한글 변환
	function getStatusLabel(status: string) {
		switch (status) {
			case 'active': return '진행중';
			case 'planning': return '기획중';
			case 'completed': return '완료';
			case 'cancelled': return '취소';
			case 'suspended': return '중단';
			default: return status;
		}
	}

	// 연구 유형 한글 변환
	function getResearchTypeLabel(researchType: string) {
		switch (researchType) {
			case 'basic': return '기초연구';
			case 'applied': return '응용연구';
			case 'development': return '개발연구';
			default: return researchType;
		}
	}

	// 초기화
	$effect(() => {
		if (!mounted) {
			mounted = true;
			Promise.all([
				loadProjectData(),
				loadProjectSummary(),
				loadEmployeeParticipationSummary(),
				loadBudgetSummaryByYear(),
				loadAlerts()
			]);
		}
	});
</script>

<PageLayout
	title="프로젝트 관리"
	subtitle="연구개발 프로젝트 및 참여율 관리 시스템"
>
	<div class="space-y-6">
		<!-- 탭 네비게이션 -->
	<ThemeTabs
			tabs={tabs}
			activeTab={activeTab}
			onTabChange={handleTabChange}
		/>

				<!-- 개요 탭 -->
		{#if activeTab === 'overview'}
			<div class="space-y-6">
				<!-- 요약 통계 -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<ThemeCard>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<FlaskConicalIcon class="h-8 w-8 text-blue-600" />
		</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">총 프로젝트</p>
								<p class="text-2xl font-semibold text-gray-900">
									{projectSummary?.totalProjects || 0}개
								</p>
								<div class="flex items-center mt-2">
									<span class="text-sm text-green-600">
										진행중: {projectSummary?.activeProjects || 0}
										</span>
									</div>
								</div>
						</div>
					</ThemeCard>

					<ThemeCard>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<DollarSignIcon class="h-8 w-8 text-green-600" />
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">총 예산</p>
								<p class="text-2xl font-semibold text-gray-900">
									{formatCurrency(projectSummary?.totalBudget || 0)}
								</p>
								<div class="flex items-center mt-2">
									<span class="text-sm text-blue-600">
										올해: {formatCurrency(projectSummary?.currentYearBudget || 0)}
										</span>
									</div>
									</div>
								</div>
					</ThemeCard>

					<ThemeCard>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<UsersIcon class="h-8 w-8 text-purple-600" />
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">참여 연구원</p>
								<p class="text-2xl font-semibold text-gray-900">
									{projectSummary?.totalMembers || 0}명
								</p>
								<div class="flex items-center mt-2">
									<span class="text-sm text-gray-500">
										활성: {projectSummary?.activeMembers || 0}명
									</span>
								</div>
							</div>
						</div>
					</ThemeCard>

					<ThemeCard>
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<AlertTriangleIcon class="h-8 w-8 text-orange-600" />
								</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500">알림</p>
								<p class="text-2xl font-semibold text-gray-900">
									{alerts.length}개
								</p>
								<div class="flex items-center mt-2">
									<span class="text-sm text-red-600">
										초과 참여: {projectSummary?.overParticipationEmployees || 0}명
									</span>
								</div>
							</div>
						</div>
					</ThemeCard>
				</div>

				<!-- 최근 활동 -->
				<ThemeCard>
					<div class="px-6 py-4 border-b border-gray-200">
						<h3 class="text-lg font-medium text-gray-900">최근 프로젝트 활동</h3>
					</div>
					<div class="divide-y divide-gray-200">
						{#if projectSummary?.recentActivities && projectSummary.recentActivities.length > 0}
							{#each projectSummary.recentActivities as activity}
								<div class="px-6 py-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center">
											<ThemeBadge variant={getStatusBadgeColor(activity.status) as any}>
												{getStatusLabel(activity.status)}
											</ThemeBadge>
											<div class="ml-4">
												<p class="text-sm font-medium text-gray-900">{activity.title}</p>
												<p class="text-sm text-gray-500">{activity.code}</p>
						</div>
									</div>
										<div class="text-sm text-gray-500">
											{formatDate(activity.updatedAt)}
								</div>
									</div>
								</div>
							{/each}
						{:else}
							<div class="px-6 py-8 text-center text-gray-500">
								<ActivityIcon class="mx-auto h-12 w-12 text-gray-400" />
								<p class="mt-2">최근 활동이 없습니다.</p>
							</div>
						{/if}
					</div>
					</ThemeCard>
			</div>
			{/if}

		<!-- 프로젝트 탭 -->
		{#if activeTab === 'projects'}
			<div class="space-y-6">
				<!-- 프로젝트 선택 헤더 -->
				<ThemeCard>
					<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
						<div class="flex flex-col sm:flex-row gap-4 flex-1">
							<div class="relative flex-1 max-w-md">
								<select
									bind:value={selectedProjectId}
									onchange={(e) => {
										const target = e.target as HTMLSelectElement;
										const project = projects.find((p: any) => p.id === target.value);
										if (project) selectProject(project);
									}}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="">프로젝트 선택 ({projects.length}개)</option>
									{#each projects as project}
										<option value={project.id}>{project.title} ({getStatusLabel(project.status)})</option>
									{/each}
								</select>
							</div>
						</div>
						<div class="flex gap-2">
							<ThemeButton
								variant="primary"
								size="sm"
								onclick={() => showCreateProjectModal = true}
							>
								<PlusIcon size={16} class="mr-2" />
								새 프로젝트
							</ThemeButton>
						</div>
					</div>
				</ThemeCard>

				<!-- 프로젝트 상세 정보 -->
				{#if selectedProject}
					<ProjectDetailView 
						{selectedProject} 
						on:refresh={loadProjectData}
						on:project-deleted={handleProjectDeleted}
					/>
					{:else}
					<ThemeCard>
						<div class="text-center py-12">
							<FlaskConicalIcon class="mx-auto h-12 w-12 text-gray-400" />
							<h3 class="mt-2 text-sm font-medium text-gray-900">프로젝트를 선택하세요</h3>
							<p class="mt-1 text-sm text-gray-500">
								위에서 프로젝트를 선택하면 상세 정보를 볼 수 있습니다.
							</p>
						</div>
					</ThemeCard>
				{/if}
			</div>
		{/if}

		<!-- 참여율 관리 탭 -->
		{#if activeTab === 'participation'}
			<div class="space-y-6">
				<ThemeCard>
					<div class="px-6 py-4 border-b border-gray-200">
						<h3 class="text-lg font-medium text-gray-900">직원별 참여율 현황</h3>
					</div>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">직원</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부서</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">참여 프로젝트</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 참여율</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#if employeeParticipationSummary.length > 0}
									{#each employeeParticipationSummary as employee}
										<tr class="hover:bg-gray-50">
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm font-medium text-gray-900">{employee.name}</div>
												<div class="text-sm text-gray-500">{employee.email}</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm text-gray-500">{employee.department}</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm text-gray-900">{employee.activeProjects}개</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm text-gray-900">{employee.totalParticipationRate}%</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
											{#if employee.totalParticipationRate > 100}
												<ThemeBadge variant="error">초과 참여</ThemeBadge>
											{:else if employee.totalParticipationRate === 100}
												<ThemeBadge variant="success">정상</ThemeBadge>
											{:else}
												<ThemeBadge variant="info">여유</ThemeBadge>
											{/if}
											</td>
										</tr>
									{/each}
								{:else}
									<tr>
										<td colspan="5" class="px-6 py-12 text-center text-gray-500">
											<UsersIcon class="mx-auto h-12 w-12 text-gray-400" />
											<p class="mt-2">참여율 데이터가 없습니다.</p>
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</ThemeCard>
						</div>
					{/if}
	</div>
</PageLayout>

<!-- 프로젝트 생성 모달 -->
<ThemeModal
	open={showCreateProjectModal}
	onclose={() => showCreateProjectModal = false}
>
	<div class="mb-6">
		<h2 class="text-xl font-semibold text-gray-900">새 프로젝트 생성</h2>
		<p class="text-sm text-gray-500 mt-1">새로운 연구개발 프로젝트를 생성합니다.</p>
	</div>
	<div class="space-y-4">
		<div>
			<label for="pm-project-title" class="block text-sm font-medium text-gray-700">프로젝트 제목 *</label>
			<input
				id="pm-project-title"
				type="text"
				bind:value={projectForm.title}
				class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="프로젝트 제목을 입력하세요"
			/>
		</div>

		<div>
			<label for="pm-project-code" class="block text-sm font-medium text-gray-700">프로젝트 코드</label>
			<input
				id="pm-project-code"
				type="text"
				bind:value={projectForm.code}
				class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="프로젝트 코드를 입력하세요"
			/>
		</div>

		<div>
			<label for="pm-project-description" class="block text-sm font-medium text-gray-700">설명</label>
			<textarea
				id="pm-project-description"
				bind:value={projectForm.description}
				rows="3"
				class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="프로젝트 설명을 입력하세요"
			></textarea>
				</div>
				
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="pm-project-start-date" class="block text-sm font-medium text-gray-700">시작일 *</label>
				<input
					id="pm-project-start-date"
					type="date"
					bind:value={projectForm.startDate}
					class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
								
			<div>
				<label for="pm-project-end-date" class="block text-sm font-medium text-gray-700">종료일 *</label>
				<input
					id="pm-project-end-date"
					type="date"
					bind:value={projectForm.endDate}
					class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
								</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="pm-project-status" class="block text-sm font-medium text-gray-700">상태</label>
				<select
					id="pm-project-status"
					bind:value={projectForm.status}
					class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="planning">기획중</option>
					<option value="active">진행중</option>
					<option value="completed">완료</option>
					<option value="cancelled">취소</option>
					<option value="suspended">중단</option>
				</select>
				</div>

			<div>
				<label for="pm-project-priority" class="block text-sm font-medium text-gray-700">우선순위</label>
				<select
					id="pm-project-priority"
					bind:value={projectForm.priority}
					class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="low">낮음</option>
					<option value="medium">보통</option>
					<option value="high">높음</option>
					<option value="critical">긴급</option>
				</select>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="pm-project-sponsor" class="block text-sm font-medium text-gray-700">후원 유형</label>
				<select
					id="pm-project-sponsor"
					bind:value={projectForm.sponsorType}
					class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="internal">내부</option>
					<option value="government">정부</option>
					<option value="private">민간</option>
					<option value="international">국제</option>
				</select>
			</div>

			<div>
				<label for="pm-project-research-type" class="block text-sm font-medium text-gray-700">연구 유형</label>
				<select
					id="pm-project-research-type"
					bind:value={projectForm.researchType}
					class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="basic">기초연구</option>
					<option value="applied">응용연구</option>
					<option value="development">개발연구</option>
				</select>
			</div>
			</div>
	</div>

	<div class="mt-6 flex justify-end space-x-3">
		<ThemeButton
			variant="ghost"
			onclick={() => showCreateProjectModal = false}
		>
				취소
			</ThemeButton>
			<ThemeButton 
				variant="primary" 
			onclick={createProject}
			>
			생성
			</ThemeButton>
		</div>
	</ThemeModal>